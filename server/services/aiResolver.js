const FAQ      = require('../models/FAQ');
const Category = require('../models/Category');
const Activity = require('../models/Activity');
const Chat     = require('../models/Chat');
const { generateAnswer, detectCategory, getEmbedding } = require('./ollama');

const SIMILARITY_THRESHOLD = 0.82;

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

async function resolveFAQ(userQuery, conversationHistory, userId, broadcast) {
  const queryEmbedding = await getEmbedding(userQuery);
  const similar        = await findSimilarFAQ(queryEmbedding);

  if (similar) {
    return {
      source:     'existing',
      answer:     similar.faq.answer,
      question:   similar.faq.question,
      category:   similar.faq.category,
      faqId:      similar.faq._id,
      similarity: Math.round(similar.score * 100) / 100,
      isNew:      false,
    };
  }

  const [answer, category] = await Promise.all([
    generateAnswer(userQuery, conversationHistory),
    detectCategory(userQuery),
  ]);

  const questionEmbedding = await getEmbedding(userQuery);

  const faq = await FAQ.create({
    question:    userQuery,
    answer,
    category,
    tags:        [],
    user:        userId,
    isAI:        true,
    isPublished: true,
    embedding:   questionEmbedding,
  });
  await faq.populate('user', 'name avatar');

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
    source:     'generated',
    answer,
    question:   userQuery,
    category,
    faqId:      faq._id,
    similarity: 1.0,
    isNew:      true,
  };
}

module.exports = { resolveFAQ, findSimilarFAQ };