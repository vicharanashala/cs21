const FAQ      = require('../models/FAQ');
const Category = require('../models/Category');
const Activity = require('../models/Activity');
const Chat     = require('../models/Chat');
const { generateAnswer, detectCategory, getEmbedding } = require('./ollama');
const { generateTranslationsAsync } = require('./translation');

const SIMILARITY_THRESHOLD = 0.82;
const TRENDING_DURATION_MS = 90 * 60 * 1000; // 90 minutes

function cosine(a, b) {
  if (!a?.length || !b?.length || a.length !== b.length) return 0;
  let dot = 0, ma = 0, mb = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    ma  += a[i] * a[i];
    mb  += b[i] * b[i];
  }
  return dot / (Math.sqrt(ma) * Math.sqrt(mb) + 1e-8);
}

async function findSimilarFAQ(embedding) {
  const all = await FAQ.find({
    isPublished: true,
    embedding:   { $exists: true, $ne: [] },
  }).select('question answer category embedding user votes');

  let best = null, bestScore = 0;
  for (const faq of all) {
    const score = cosine(embedding, faq.embedding);
    if (score > bestScore) { bestScore = score; best = faq; }
  }

  if (best && bestScore >= SIMILARITY_THRESHOLD) return { faq: best, score: bestScore };
  return null;
}

/**
 * Always generates an answer first, then decides whether to create a new FAQ
 * or mark an existing one as trending.
 */
async function resolveFAQ(userQuery, conversationHistory, userId, broadcast) {
  // Step 1: Generate answer + detect category (parallel — both are independent)
  const [answer, category] = await Promise.all([
    generateAnswer(userQuery, conversationHistory),
    detectCategory(userQuery),
  ]);

  // Step 2: Embed query for similarity search
  const queryEmbedding = await getEmbedding(userQuery);
  const similar        = await findSimilarFAQ(queryEmbedding);

  if (similar) {
    // ── Duplicate detected ──────────────────────────────────────────────────
    // Mark as trending for 90 min so it pins to top of Browse FAQ
    const trendingUntil = new Date(Date.now() + TRENDING_DURATION_MS);
    await FAQ.findByIdAndUpdate(similar.faq._id, {
      isTrending:    true,
      trendingUntil,
    });

    // Clear trending flag automatically (TTL check on read; MongoDB TTL index
    // only works on _id timestamp field, so we check on-read in the route)

    return {
      source:      'existing',
      answer:      similar.faq.answer,
      question:    similar.faq.question,
      category:    similar.faq.category,
      faqId:       similar.faq._id,
      similarity:  Math.round(similar.score * 100) / 100,
      isNew:       false,
      isDuplicate: true,
    };
  }

  // ── New question — create FAQ ────────────────────────────────────────────
  const faq = await FAQ.create({
    question:    userQuery,
    answer,
    category,
    tags:        [],
    user:        userId,
    isAI:        true,
    isPublished: true,
    embedding:   queryEmbedding,
    translations: new Map([['en', { question: userQuery, answer }]]),
    translationStatus: 'pending',
    // New FAQs are NOT marked trending
  });
  await faq.populate('user', 'name avatar');

  // Kick off async multilingual translation (non-blocking)
  generateTranslationsAsync(faq._id.toString());

  await Category.findOneAndUpdate(
    { name: category },
    { $inc: { faqCount: 1 } },
    { upsert: true }
  );

  await Activity.create({
    type:        'faq_created',
    user:        userId,
    target:      faq._id,
    description: `AI auto-created FAQ: ${userQuery.slice(0, 60)}`,
  });

  if (broadcast) {
    broadcast('activity', {
      type: 'ai_faq_created',
      faq: {
        _id:      faq._id,
        question: faq.question,
        answer:   faq.answer,
        category: faq.category,
        user:     faq.user.toSafeJSON ? faq.user.toSafeJSON() : { name: faq.user.name },
      },
      createdAt: new Date(),
    });
  }

  return {
    source:      'generated',
    answer,
    question:    userQuery,
    category,
    faqId:       faq._id,
    similarity:  1.0,
    isNew:       true,
    isDuplicate: false,
  };
}

module.exports = { resolveFAQ, findSimilarFAQ };