const express = require('express');
const { body, query } = require('express-validator');
const FAQ = require('../models/FAQ');
const Category = require('../models/Category');
const Activity = require('../models/Activity');
const validate = require('../middleware/validate');
const { auth, adminOnly } = require('../middleware/auth');

const router = express.Router();

// GET /faqs — public list with filters
router.get('/',
  [
    query('page').optional().isInt({ min: 1 }),
    query('limit').optional().isInt({ min: 1, max: 50 }),
    query('category').optional().trim(),
    query('search').optional().trim(),
    query('sort').optional().isIn(['newest', 'oldest', 'popular', 'views']),
  ],
  validate,
  async (req, res, next) => {
    try {
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 10;
      const skip = (page - 1) * limit;

      const filter = { isPublished: true };
      if (req.query.category) filter.category = req.query.category;

      let sort = { createdAt: -1 };
      if (req.query.sort === 'oldest') sort = { createdAt: 1 };
      if (req.query.sort === 'popular') sort = { votes: -1 };
      if (req.query.sort === 'views') sort = { views: -1 };

      let faqs, total;
      if (req.query.search) {
        const searchRe = new RegExp(req.query.search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
        const searchFilter = {
          ...filter,
          $or: [
            { question: searchRe },
            { answer: searchRe },
            { tags: searchRe },
          ],
        };
        faqs = await FAQ.find(searchFilter)
          .sort(sort)
          .skip(skip).limit(limit)
          .populate('user', 'name avatar');
        total = await FAQ.countDocuments(searchFilter);
      } else {
        faqs = await FAQ.find(filter)
          .sort(sort)
          .skip(skip).limit(limit)
          .populate('user', 'name avatar');
        total = await FAQ.countDocuments(filter);
      }

      res.json({
        faqs,
        pagination: { total, page, pages: Math.ceil(total / limit) },
      });
    } catch (err) {
      next(err);
    }
  }
);

// GET /faqs/trending
router.get('/trending', async (req, res, next) => {
  try {
    const faqs = await FAQ.find({ isPublished: true })
      .sort({ views: -1, votes: -1 })
      .limit(5)
      .populate('user', 'name avatar');
    res.json({ faqs });
  } catch (err) {
    next(err);
  }
});

// GET /faqs/recent
router.get('/recent', async (req, res, next) => {
  try {
    const faqs = await FAQ.find({ isPublished: true })
      .sort({ createdAt: -1 })
      .limit(5)
      .populate('user', 'name avatar');
    res.json({ faqs });
  } catch (err) {
    next(err);
  }
});

// GET /faqs/:id
router.get('/:id', async (req, res, next) => {
  try {
    const faq = await FAQ.findById(req.params.id)
      .populate('user', 'name avatar')
      .populate('comments.user', 'name avatar');
    if (!faq) return res.status(404).json({ error: 'FAQ not found' });

    faq.views += 1;
    await faq.save();

    res.json({ faq });
  } catch (err) {
    next(err);
  }
});

// POST /faqs — create FAQ (auth required)
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

      // Update category count
      await Category.findOneAndUpdate({ name: category }, { $inc: { faqCount: 1 } }, { upsert: true });

      const faq = await FAQ.create({ question, answer, category, tags: tags || [], user: req.user._id, isAI: false });
      await faq.populate('user', 'name avatar');

      // Activity log + broadcast
      await Activity.create({ type: 'faq_created', user: req.user._id, target: faq._id, description: `New FAQ: ${question}` });
      if (req.app.broadcast) req.app.broadcast('activity', { type: 'faq_created', user: req.user.toSafeJSON(), faq: { _id: faq._id, question }, createdAt: new Date() });

      res.status(201).json({ faq });
    } catch (err) {
      next(err);
    }
  }
);

// PUT /faqs/:id
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
      if (question) faq.question = question;
      if (answer) faq.answer = answer;
      if (category) faq.category = category;
      if (tags) faq.tags = tags;

      await faq.save();
      await faq.populate('user', 'name avatar');

      res.json({ faq });
    } catch (err) {
      next(err);
    }
  }
);

// DELETE /faqs/:id
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

// POST /faqs/:id/vote
router.post('/:id/vote', auth, async (req, res, next) => {
  try {
    const faq = await FAQ.findById(req.params.id);
    if (!faq) return res.status(404).json({ error: 'FAQ not found' });

    faq.votes += 1;
    await faq.save();
    res.json({ votes: faq.votes });
  } catch (err) {
    next(err);
  }
});

// POST /faqs/:id/comments
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
    } catch (err) {
      next(err);
    }
  }
);

module.exports = router;