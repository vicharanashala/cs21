const express = require('express');
const FAQ = require('../models/FAQ');
const User = require('../models/User');
const Chat = require('../models/Chat');
const Activity = require('../models/Activity');
const { auth, adminOnly } = require('../middleware/auth');

const router = express.Router();

// GET /activity — live activity feed
router.get('/', auth, async (req, res, next) => {
  try {
    const limit = parseInt(req.query.limit) || 20;
    const activities = await Activity.find()
      .sort({ createdAt: -1 })
      .limit(limit)
      .populate('user', 'name avatar');
    res.json({ activities });
  } catch (err) {
    next(err);
  }
});

module.exports = router;