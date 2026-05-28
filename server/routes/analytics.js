const express = require('express');
const FAQ = require('../models/FAQ');
const User = require('../models/User');
const Chat = require('../models/Chat');
const Activity = require('../models/Activity');
const SearchFailure = require('../models/SearchFailure');
const { auth, adminOnly } = require('../middleware/auth');

const router = express.Router();

// GET /analytics/dashboard — main dashboard analytics
router.get('/dashboard', auth, async (req, res, next) => {
  try {
    const now = new Date();
    const thirtyDaysAgo = new Date(now - 30 * 24 * 60 * 60 * 1000);

    const [
      totalFAQs, totalUsers, totalChats,
      recentFAQs, popularFAQs, solvedFAQs,
      topContributors,
      recentActivity,
    ] = await Promise.all([
      FAQ.countDocuments(),
      User.countDocuments(),
      Chat.countDocuments(),
      FAQ.find({ isPublished: true }).sort({ createdAt: -1 }).limit(5).populate('user', 'name avatar'),
      FAQ.find({ isPublished: true }).sort({ views: -1 }).limit(5).populate('user', 'name avatar'),
      FAQ.find({ isPublished: true, votes: { $gte: 5 } }).sort({ votes: -1 }).limit(5).populate('user', 'name avatar'),
      User.find().sort({ xp: -1 }).limit(10).select('name avatar xp role'),
      Activity.find().sort({ createdAt: -1 }).limit(20).populate('user', 'name avatar'),
    ]);

    // AI usage over last 30 days (by day)
    const chats = await Chat.find({ createdAt: { $gte: thirtyDaysAgo } });
    const chatByDay = {};
    chats.forEach(c => {
      const day = c.createdAt.toISOString().split('T')[0];
      chatByDay[day] = (chatByDay[day] || 0) + 1;
    });

    // FAQ creations by category
    const categoryBreakdown = await FAQ.aggregate([
      { $group: { _id: '$category', count: { $sum: 1 }, totalVotes: { $sum: '$votes' }, totalViews: { $sum: '$views' } } },
      { $sort: { count: -1 } },
    ]);

    // User growth (signups by day)
    const newUsers = await User.find({ createdAt: { $gte: thirtyDaysAgo } });
    const userByDay = {};
    newUsers.forEach(u => {
      const day = u.createdAt.toISOString().split('T')[0];
      userByDay[day] = (userByDay[day] || 0) + 1;
    });

    // Category engagement
    const faqsByCategory = await FAQ.aggregate([
      { $match: { isPublished: true } },
      { $group: { _id: '$category', faqCount: { $sum: 1 }, totalViews: { $sum: '$views' }, totalVotes: { $sum: '$votes' } } },
      { $sort: { totalViews: -1 } },
    ]);

    res.json({
      totalFAQs, totalUsers, totalChats,
      recentFAQs, popularFAQs, solvedFAQs,
      topContributors, recentActivity,
      chatByDay, userByDay, categoryBreakdown, faqsByCategory,
    });
  } catch (err) {
    next(err);
  }
});

// GET /analytics/search-failures
router.get('/search-failures', auth, adminOnly, async (req, res, next) => {
  try {
    const failures = await SearchFailure.find().sort({ count: -1 }).limit(20);
    res.json({ failures });
  } catch (err) {
    next(err);
  }
});

// POST /analytics/search-failures
router.post('/search-failures', async (req, res, next) => {
  try {
    const { query } = req.body;
    await SearchFailure.findOneAndUpdate({ query }, { $inc: { count: 1 } }, { upsert: true });
    res.json({ success: true });
  } catch (err) {
    next(err);
  }
});

// GET /analytics/rising-topics
router.get('/rising-topics', auth, async (req, res, next) => {
  try {
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const sixtyDaysAgo = new Date(Date.now() - 60 * 24 * 60 * 60 * 1000);

    // Categories with growth
    const current = await FAQ.aggregate([
      { $match: { createdAt: { $gte: thirtyDaysAgo } } },
      { $group: { _id: '$category', count: { $sum: 1 } } },
    ]);
    const previous = await FAQ.aggregate([
      { $match: { createdAt: { $gte: sixtyDaysAgo, $lt: thirtyDaysAgo } } },
      { $group: { _id: '$category', count: { $sum: 1 } } },
    ]);

    const prevMap = Object.fromEntries(previous.map(p => [p._id, p.count]));
    const rising = current.map(c => ({
      category: c._id,
      current: c.count,
      previous: prevMap[c._id] || 0,
      growth: prevMap[c._id] ? Math.round(((c.count - prevMap[c._id]) / prevMap[c._id]) * 100) : 100,
    })).filter(r => r.current >= 1).sort((a, b) => b.growth - a.growth);

    // Top keywords from tags
    const tagFAQs = await FAQ.find({ createdAt: { $gte: thirtyDaysAgo }, tags: { $exists: true, $ne: [] } })
      .select('tags category').limit(200);
    const tagFreq = {};
    tagFAQs.forEach(f => f.tags.forEach(t => { tagFreq[t] = (tagFreq[t] || 0) + 1; }));
    const topTags = Object.entries(tagFreq).sort((a, b) => b[1] - a[1]).slice(0, 10).map(([tag, count]) => ({ tag, count }));

    res.json({ rising, topTags });
  } catch (err) {
    next(err);
  }
});

module.exports = router;