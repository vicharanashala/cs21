const express = require('express');
const FAQ = require('../models/FAQ');
const User = require('../models/User');
const { auth } = require('../middleware/auth');

const router = express.Router();

// GET /leaderboard — top contributors
router.get('/', auth, async (req, res, next) => {
  try {
    const users = await User.find({ role: 'user' }).sort({ xp: -1 }).limit(20)
      .select('name avatar xp role faqsCreated upvotesReceived acceptedSolutions');

    const leaderboard = await Promise.all(users.map(async (user, index) => {
      const faqsCreated = await FAQ.countDocuments({ user: user._id });
      const upvotesReceived = await FAQ.aggregate([
        { $match: { user: user._id } },
        { $group: { _id: null, total: { $sum: '$votes' } } },
      ]);
      const acceptedSolutions = await FAQ.countDocuments({ user: user._id, votes: { $gte: 5 } });

      return {
        rank: index + 1,
        user: {
          _id: user._id,
          name: user.name,
          avatar: user.avatar,
        },
        xp: user.xp || (faqsCreated * 10 + (upvotesReceived[0]?.total || 0) * 2 + acceptedSolutions * 20),
        faqsCreated,
        upvotesReceived: upvotesReceived[0]?.total || 0,
        acceptedSolutions,
      };
    }));

    res.json({ leaderboard });
  } catch (err) {
    next(err);
  }
});

module.exports = router;