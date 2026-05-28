const express = require('express');
const FAQ = require('../models/FAQ');
const User = require('../models/User');
const Chat = require('../models/Chat');
const Category = require('../models/Category');
const { auth, adminOnly } = require('../middleware/auth');

const router = express.Router();

// GET /stats — admin only
router.get('/', auth, adminOnly, async (req, res, next) => {
  try {
    const [faqCount, userCount, chatCount, categoryCount, recentFAQs] = await Promise.all([
      FAQ.countDocuments(),
      User.countDocuments(),
      Chat.countDocuments(),
      Category.countDocuments(),
      FAQ.find().sort({ createdAt: -1 }).limit(5).populate('user', 'name'),
    ]);

    res.json({
      stats: {
        faqCount,
        userCount,
        chatCount,
        categoryCount,
        recentFAQs,
      },
    });
  } catch (err) {
    next(err);
  }
});

module.exports = router;