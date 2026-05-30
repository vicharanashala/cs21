const express = require('express');
const { body, query } = require('express-validator');
const FAQ = require('../models/FAQ');
const Category = require('../models/Category');
const Activity = require('../models/Activity');
const validate = require('../middleware/validate');
const { auth, adminOnly } = require('../middleware/auth');
const { generateTranslationsAsync, LANGUAGES } = require('../services/translation');

const router = express.Router();

// ── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Return the FAQ document with question/answer replaced by the
 * requested language translation (falls back to English).
 */
function localizeFAQ(doc, lang = 'en') {
  const base = doc.toObject ? doc.toObject() : { ...doc };
  if (lang !== 'en' && base.translations) {
    const t = base.translations instanceof Map
      ? base.translations.get(lang)
      : base.translations[lang];
    if (t && t.question) {
      base.question = t.question;
      base.answer   = t.answer;
    }
  }
  // Attach available language list for the client
  const availableLangs = [];
  if (base.translations) {
    const map = base.translations instanceof Map ? base.translations : new Map(Object.entries(base.translations || {}));
    for (const [code] of map) availableLangs.push(code);
  }
  if (!availableLangs.includes('en')) availableLangs.unshift('en');
  base.availableLanguages = availableLangs;
  return base;
}

// ── GET /faqs/languages — supported language list ─────────────────────────────
router.get('/languages', (req, res) => {
  res.json({ languages: LANGUAGES });
});

// ── GET /faqs — public list ──────────────────────────────────────────────────
router.get('/',
  [
    query('page').optional().isInt({ min: 1 }),
    query('limit').optional().isInt({ min: 1, max: 50 }),
    query('category').optional().trim(),
    query('search').optional().trim(),
    query('sort').optional().isIn(['newest', 'oldest', 'popular', 'views']),
    query('lang').optional().isIn(LANGUAGES.map(l => l.code)),
  ],
  validate,
  async (req, res, next) => {
    try {
      const page  = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 10;
      const lang  = req.query.lang || 'en';
      const skip  = (page - 1) * limit;

      const filter = { isPublished: true };
      if (req.query.category) filter.category = req.query.category;

      let sort = { createdAt: -1 };
      if (req.query.sort === 'oldest')  sort = { createdAt: 1 };
      if (req.query.sort === 'popular') sort = { votes: -1 };
      if (req.query.sort === 'views')   sort = { views: -1 };

      // Build search filter
      let searchFilter = filter;
      if (req.query.search) {
        const re = new RegExp(req.query.search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
        if (lang === 'en') {
          searchFilter = { ...filter, $or: [{ question: re }, { answer: re }, { tags: re }] };
        } else {
          // Search inside the translations subdocument
          searchFilter = { ...filter, [`translations.${lang}.question`]: { $regex: re } };
        }
      }

      const [faqs, total] = await Promise.all([
        FAQ.find(searchFilter).sort(sort).skip(skip).limit(limit).populate('user', 'name avatar'),
        FAQ.countDocuments(searchFilter),
      ]);

      res.json({
        faqs:     faqs.map(f => localizeFAQ(f, lang)),
        lang,
        pagination: { total, page, pages: Math.ceil(total / limit) },
      });
    } catch (err) {
      next(err);
    }
  }
);

// ── GET /faqs/trending ───────────────────────────────────────────────────────
router.get('/trending', async (req, res, next) => {
  try {
    const lang = req.query.lang || 'en';
    const faqs = await FAQ.find({ isPublished: true })
      .sort({ views: -1, votes: -1 })
      .limit(5)
      .populate('user', 'name avatar');
    res.json({ faqs: faqs.map(f => localizeFAQ(f, lang)) });
  } catch (err) { next(err); }
});

// ── GET /faqs/recent ─────────────────────────────────────────────────────────
router.get('/recent', async (req, res, next) => {
  try {
    const lang = req.query.lang || 'en';
    const faqs = await FAQ.find({ isPublished: true })
      .sort({ createdAt: -1 })
      .limit(5)
      .populate('user', 'name avatar');
    res.json({ faqs: faqs.map(f => localizeFAQ(f, lang)) });
  } catch (err) { next(err); }
});

// ── GET /faqs/:id ────────────────────────────────────────────────────────────
router.get('/:id', async (req, res, next) => {
  try {
    const faq = await FAQ.findById(req.params.id)
      .populate('user', 'name avatar')
      .populate('comments.user', 'name avatar');
    if (!faq) return res.status(404).json({ error: 'FAQ not found' });

    const lang = req.query.lang || 'en';
    faq.views += 1;
    await faq.save();

    res.json({ faq: localizeFAQ(faq, lang) });
  } catch (err) { next(err); }
});

// ── POST /faqs — create FAQ ──────────────────────────────────────────────────
router.post('/',
  auth,
  [
    body('question').trim().notEmpty().withMessage('Question required'),
    body('answer').trim().notEmpty().withMessage('Answer required'),
    body('category').trim().notEmpty().withMessage('Category required'),
    body('tags').optional().isArray(),
  ],
  validate,
  async (req, res, next) => {
    try {
      const { question, answer, category, tags } = req.body;

      await Category.findOneAndUpdate(
        { name: category },
        { $inc: { faqCount: 1 } },
        { upsert: true }
      );

      const faq = await FAQ.create({
        question, answer, category,
        tags: tags || [],
        user: req.user._id,
        isAI: false,
        translations: new Map([['en', { question, answer }]]),
        translationStatus: 'pending',
      });
      await faq.populate('user', 'name avatar');

      // Activity log
      await Activity.create({
        type: 'faq_created', user: req.user._id,
        target: faq._id, description: `New FAQ: ${question}`,
      });
      if (req.app.broadcast) {
        req.app.broadcast('activity', {
          type: 'faq_created',
          user: req.user.toSafeJSON(),
          faq: { _id: faq._id, question },
          createdAt: new Date(),
        });
      }

      // Kick off async translation generation (non-blocking)
      generateTranslationsAsync(faq._id.toString());

      res.status(201).json({ faq: localizeFAQ(faq, 'en') });
    } catch (err) {
      next(err);
    }
  }
);

// ── PUT /faqs/:id ────────────────────────────────────────────────────────────
router.put('/:id',
  auth,
  [
    body('question').optional().trim().notEmpty(),
    body('answer').optional().trim().notEmpty(),
    body('category').optional().trim().notEmpty(),
    body('tags').optional().isArray(),
  ],
  validate,
  async (req, res, next) => {
    try {
      const faq = await FAQ.findById(req.params.id);
      if (!faq) return res.status(404).json({ error: 'FAQ not found' });

      if (faq.user.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
        return res.status(403).json({ error: 'Not authorized' });
      }

      const { question, answer, category, tags } = req.body;
      if (question) {
        faq.question = question;
        // Refresh English translation slot
        if (faq.translations instanceof Map) {
          const en = faq.translations.get('en') || {};
          faq.translations.set('en', { ...en, question });
        }
      }
      if (answer) {
        faq.answer = answer;
        if (faq.translations instanceof Map) {
          const en = faq.translations.get('en') || {};
          faq.translations.set('en', { ...en, answer });
        }
      }
      if (category) faq.category = category;
      if (tags) faq.tags = tags;

      // Mark translations as stale — regenerate all languages
      faq.translationStatus = 'pending';

      await faq.save();
      await faq.populate('user', 'name avatar');

      // Re-generate all translations in background
      generateTranslationsAsync(faq._id.toString());

      res.json({ faq: localizeFAQ(faq, 'en') });
    } catch (err) {
      next(err);
    }
  }
);

// ── DELETE /faqs/:id ─────────────────────────────────────────────────────────
router.delete('/:id', auth, async (req, res, next) => {
  try {
    const faq = await FAQ.findById(req.params.id);
    if (!faq) return res.status(404).json({ error: 'FAQ not found' });

    if (faq.user.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Not authorized' });
    }

    await faq.deleteOne();
    await Category.findOneAndUpdate({ name: faq.category }, { $inc: { faqCount: -1 } });

    res.json({ message: 'FAQ deleted' });
  } catch (err) {
    next(err);
  }
});

// ── POST /faqs/:id/vote ──────────────────────────────────────────────────────
router.post('/:id/vote', auth, async (req, res, next) => {
  try {
    const faq = await FAQ.findById(req.params.id);
    if (!faq) return res.status(404).json({ error: 'FAQ not found' });
    faq.votes += 1;
    await faq.save();
    res.json({ votes: faq.votes });
  } catch (err) { next(err); }
});

// ── POST /faqs/:id/comments ──────────────────────────────────────────────────
router.post('/:id/comments', auth,
  [body('text').trim().notEmpty().withMessage('Comment text required')],
  validate,
  async (req, res, next) => {
    try {
      const faq = await FAQ.findById(req.params.id);
      if (!faq) return res.status(404).json({ error: 'FAQ not found' });
      faq.comments.push({ user: req.user._id, text: req.body.text });
      await faq.save();
      await faq.populate('comments.user', 'name avatar');
      res.status(201).json({ comments: faq.comments });
    } catch (err) { next(err); }
  }
);

// ── POST /faqs/check-duplicate ───────────────────────────────────────────────
router.post('/check-duplicate', auth,
  [body('question').trim().notEmpty().withMessage('Question required')],
  validate,
  async (req, res, next) => {
    try {
      const { question } = req.body;

      const existingFAQs = await FAQ.find({ isPublished: true })
        .select('question answer category tags votes views')
        .limit(50);

      if (existingFAQs.length === 0) {
        return res.json({ duplicates: [], message: 'No existing FAQs to compare against.' });
      }

      const results = existingFAQs
        .map(faq => ({ faq, similarity: computeSimilarity(question, faq.question) }))
        .filter(r => r.similarity >= 0.3)
        .sort((a, b) => b.similarity - a.similarity)
        .slice(0, 5)
        .map(r => ({
          _id:         r.faq._id,
          question:    r.faq.question,
          answer:      r.faq.answer,
          category:    r.faq.category,
          similarity:  Math.round(r.similarity * 100),
          votes:       r.faq.votes,
          views:       r.faq.views,
        }));

      const hasHighMatch = results.some(r => r.similarity >= 80);

      res.json({
        duplicates:   results,
        hasHighMatch,
        message: hasHighMatch
          ? `${results[0].similarity}% similar FAQ found — consider linking or merging.`
          : results.length > 0
            ? `${results.length} partially similar FAQ(s) found.`
            : 'No similar questions found.',
      });
    } catch (err) { next(err); }
  }
);

// ── Text similarity (Jaccard + length ratio) ─────────────────────────────────
function computeSimilarity(a, b) {
  const wordsA = new Set(a.toLowerCase().split(/\s+/).filter(w => w.length > 2));
  const wordsB = new Set(b.toLowerCase().split(/\s+/).filter(w => w.length > 2));
  if (wordsA.size === 0 || wordsB.size === 0) return 0;
  const intersection = new Set([...wordsA].filter(w => wordsB.has(w)));
  const union = new Set([...wordsA, ...wordsB]);
  const jaccard = intersection.size / union.size;
  const lenRatio = Math.min(a.length, b.length) / Math.max(a.length, b.length);
  return jaccard * 0.7 + lenRatio * 0.3;
}

module.exports = router;