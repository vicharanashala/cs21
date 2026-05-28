const express = require('express');
const { body } = require('express-validator');
const Chat = require('../models/Chat');
const Activity = require('../models/Activity');
const validate = require('../middleware/validate');
const { auth } = require('../middleware/auth');
const { generateAIResponse } = require('../services/ai');

const router = express.Router();

// POST /chat — ask a question
router.post('/',
  auth,
  [
    body('message').trim().notEmpty().withMessage('Message required'),
  ],
  validate,
  async (req, res, next) => {
    try {
      const { message } = req.body;

      // Get or create open chat session for this user (keep last 20 messages for context)
      let chat = await Chat.findOne({ user: req.user._id, resolved: false })
        .sort({ createdAt: -1 });

      if (!chat) {
        chat = await Chat.create({ user: req.user._id, messages: [] });
      }

      // Add user message
      chat.messages.push({ role: 'user', content: message });

      // Keep only the last 20 messages for OpenAI context window
      const recentHistory = chat.messages.slice(-20);

      // Call real OpenAI API
      const reply = await generateAIResponse(message, recentHistory.slice(0, -1));

      // Add assistant message
      chat.messages.push({ role: 'assistant', content: reply });
      await chat.save();

      // Activity log + socket broadcast
      await Activity.create({
        type: 'ai_response',
        user: req.user._id,
        description: `AI responded to: "${message.slice(0, 50)}..."`,
      });
      if (req.app.broadcast) {
        req.app.broadcast('activity', {
          type: 'ai_response',
          user: req.user.toSafeJSON ? req.user.toSafeJSON() : { name: req.user.name },
          message: message.slice(0, 60),
          createdAt: new Date(),
        });
      }

      res.json({ reply, chatId: chat._id });
    } catch (err) {
      console.error('Chat error:', err.message);
      // Surface specific API errors clearly
      if (err.status === 401 || err.message?.includes('Incorrect API key')) {
        return res.status(502).json({ error: 'AI service authentication failed. Check your OPENAI_API_KEY in .env' });
      }
      if (err.message?.includes('rate limit')) {
        return res.status(429).json({ error: 'AI service rate limit reached. Please wait a moment.' });
      }
      next(err);
    }
  }
);

// GET /chat — get chat history
router.get('/', auth, async (req, res, next) => {
  try {
    const chats = await Chat.find({ user: req.user._id })
      .sort({ createdAt: -1 })
      .limit(20);
    res.json({ chats });
  } catch (err) {
    next(err);
  }
});

// DELETE /chat/:id
router.delete('/:id', auth, async (req, res, next) => {
  try {
    const chat = await Chat.findOne({ _id: req.params.id, user: req.user._id });
    if (!chat) return res.status(404).json({ error: 'Chat not found' });
    await chat.deleteOne();
    res.json({ message: 'Chat deleted' });
  } catch (err) {
    next(err);
  }
});

module.exports = router;