const express = require('express');
const FAQ = require('../models/FAQ');
const Chat = require('../models/Chat');
const Activity = require('../models/Activity');
const SearchFailure = require('../models/SearchFailure');
const User = require('../models/User');
const { auth } = require('../middleware/auth');

const router = express.Router();

// GET /api/notifications — aggregated real-time notification feed
router.get('/', auth, async (req, res, next) => {
  try {
    const user = req.user;
    const now = new Date();
    const oneHourAgo = new Date(now - 60 * 60 * 1000);
    const oneDayAgo = new Date(now - 24 * 60 * 60 * 1000);

    const [
      recentActivity,       // last 24h activity for real-time feed
      newFAQCount,          // FAQs added in last hour
      recentSearchFailures, // search failures in last day
      recentChats,          // AI interactions in last hour
      myPendingFAQs,        // user's own unpublished/draft FAQs
      recentSignups,        // new users in last 24h (admin only)
    ] = await Promise.all([
      Activity.find({ createdAt: { $gte: oneDayAgo } })
        .sort({ createdAt: -1 }).limit(30)
        .populate('user', 'name avatar'),

      FAQ.countDocuments({ createdAt: { $gte: oneHourAgo } }),

      SearchFailure.find({ lastSearched: { $gte: oneDayAgo } })
        .sort({ count: -1 }).limit(10),

      Chat.countDocuments({ updatedAt: { $gte: oneHourAgo } }),

      user.role === 'user'
        ? FAQ.find({ user: user._id, isPublished: false }).sort({ createdAt: -1 }).limit(5)
        : Promise.resolve([]),

      user.role === 'admin'
        ? User.countDocuments({ createdAt: { $gte: oneDayAgo } })
        : Promise.resolve(0),
    ]);

    // Build smart notification cards from live data
    const notifications = [];

    // 1. Real-time activity highlights
    recentActivity.slice(0, 3).forEach(activity => {
      notifications.push({
        id: `activity-${activity._id}`,
        type: activity.type === 'ai_response' ? 'ai'
          : activity.type === 'faq_created' ? 'faq'
          : activity.type === 'faq_voted' ? 'trending'
          : 'info',
        title: formatActivityTitle(activity),
        message: activity.description,
        time: formatTimeAgo(activity.createdAt),
        read: false,
        variant: activityVariant(activity.type),
      });
    });

    // 2. High-count search failures (admin)
    if (user.role === 'admin') {
      const highFailure = recentSearchFailures.filter(f => f.count >= 5);
      if (highFailure.length > 0) {
        notifications.push({
          id: 'search-failures',
          type: 'spam',
          title: 'Search Failure Alert',
          message: `${highFailure.length} queries have 5+ failed searches — consider adding FAQs for them.`,
          time: formatTimeAgo(Math.min(...highFailure.map(f => new Date(f.lastSearched).getTime()))),
          read: false,
          variant: 'danger',
        });
      }
    }

    // 3. Trending topic spike
    const recentFAQCount = await FAQ.countDocuments({
      createdAt: { $gte: oneHourAgo },
      isPublished: true,
    });
    if (recentFAQCount >= 3) {
      notifications.push({
        id: 'trending-faqs',
        type: 'trending',
        title: 'FAQ Surge',
        message: `${recentFAQCount} new FAQs added in the last hour — trending topic detected!`,
        time: 'Just now',
        read: false,
        variant: 'success',
      });
    }

    // 4. User's pending FAQ drafts
    if (myPendingFAQs.length > 0) {
      notifications.push({
        id: 'pending-faqs',
        type: 'ai',
        title: 'Draft FAQs Pending',
        message: `You have ${myPendingFAQs.length} unpublished FAQ${myPendingFAQs.length > 1 ? 's' : ''} — publish to make them visible.`,
        time: formatTimeAgo(new Date(myPendingFAQs[0].createdAt).getTime()),
        read: false,
        variant: 'purple',
      });
    }

    // 5. New signups (admin)
    if (user.role === 'admin' && recentSignups > 0) {
      notifications.push({
        id: 'new-signups',
        type: 'info',
        title: 'New Members',
        message: `${recentSignups} new user${recentSignups > 1 ? 's' : ''} joined in the last 24 hours.`,
        time: '24h',
        read: false,
        variant: 'warning',
      });
    }

    // 6. Duplicate alerts from search failures (similar questions)
    if (recentSearchFailures.length > 0 && user.role === 'admin') {
      const topFailure = recentSearchFailures[0];
      notifications.push({
        id: `duplicate-alert-${topFailure._id}`,
        type: 'duplicate',
        title: 'Unresolved Search',
        message: `"${truncate(topFailure.query, 50)}" has ${topFailure.count} failed searches. Create an FAQ?`,
        time: formatTimeAgo(new Date(topFailure.lastSearched).getTime()),
        read: false,
        variant: 'warning',
      });
    }

    // Sort by read status then time
    notifications.sort((a, b) => {
      if (!a.read && b.read) return -1;
      if (a.read && !b.read) return 1;
      return 0;
    });

    res.json({ notifications, summary: { newFAQCount, recentChats, recentSignups } });
  } catch (err) {
    next(err);
  }
});

// GET /api/notifications/activity — SSE stream for real-time updates
router.get('/stream', auth, async (req, res, next) => {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders();

  const sendEvent = async () => {
    try {
      const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
      const [recentActivity, newFAQCount] = await Promise.all([
        Activity.find({ createdAt: { $gte: oneHourAgo } })
          .sort({ createdAt: -1 }).limit(5)
          .populate('user', 'name avatar'),
        FAQ.countDocuments({ createdAt: { $gte: oneHourAgo } }),
      ]);

      const notifications = recentActivity.map(activity => ({
        id: `stream-${activity._id}`,
        type: activity.type === 'ai_response' ? 'ai'
          : activity.type === 'faq_created' ? 'faq'
          : activity.type === 'faq_voted' ? 'trending'
          : 'info',
        title: formatActivityTitle(activity),
        message: activity.description,
        time: formatTimeAgo(activity.createdAt),
        read: false,
        variant: activityVariant(activity.type),
      }));

      if (notifications.length > 0) {
        res.write(`data: ${JSON.stringify({ type: 'activity', notifications })}\n\n`);
      }
    } catch {
      // silently ignore
    }
  };

  // Send immediately, then every 10 seconds
  await sendEvent();
  const interval = setInterval(sendEvent, 10000);

  req.on('close', () => clearInterval(interval));
});

module.exports = router;

function formatActivityTitle(activity) {
  const titles = {
    faq_created: 'New FAQ Created',
    ai_response: 'AI Answered',
    ai_reuse: 'FAQ Reused',
    user_signup: 'New Member',
    admin_action: 'Admin Action',
    issue_resolved: 'Issue Resolved',
    faq_voted: 'FAQ Upvoted',
    comment_added: 'Comment Added',
  };
  return titles[activity.type] || 'Activity Update';
}

function activityVariant(type) {
  const variants = {
    ai_response: 'purple',
    faq_created: 'success',
    faq_voted: 'success',
    issue_resolved: 'success',
    admin_action: 'warning',
    user_signup: 'info',
    comment_added: 'info',
  };
  return variants[type] || 'default';
}

function formatTimeAgo(timestamp) {
  const diff = (Date.now() - new Date(timestamp)) / 1000;
  if (diff < 60) return `${Math.floor(diff)}s ago`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

function truncate(str, len) {
  return str.length > len ? str.slice(0, len) + '…' : str;
}