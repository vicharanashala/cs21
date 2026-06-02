const express    = require('express');
const { body }   = require('express-validator');
const Chat       = require('../models/Chat');
const Activity   = require('../models/Activity');
const validate   = require('../middleware/validate');
const { auth }   = require('../middleware/auth');
const { resolveFAQ } = require('../services/aiResolver');
const { transcribeAudio } = require('../services/ollama');

const router = express.Router();

// POST /api/chat — text or voice question → FAQ answer
router.post('/',
  auth,
  [
    body('message').optional().isString().trim(),
    body('voiceData').optional().isString(),
  ],
  validate,
  async (req, res, next) => {
    try {
      let { message } = req.body;

      // Voice transcription
      if (req.body.voiceData) {
        const buf = Buffer.from(req.body.voiceData, 'base64');
        message = await transcribeAudio(buf);
      }

      if (!message?.trim()) {
        return res.status(400).json({ error: 'Message or voiceData required' });
      }

      // Get or create open chat session
      let chat = await Chat.findOne({ user: req.user._id, resolved: false })
        .sort({ createdAt: -1 });
      if (!chat) chat = await Chat.create({ user: req.user._id, messages: [] });

      chat.messages.push({ role: 'user', content: message });
      const recentHistory = chat.messages.slice(-20, -1);

      const result = await resolveFAQ(message, recentHistory, req.user._id, req.app.broadcast);

      chat.messages.push({ role: 'assistant', content: result.answer });
      await chat.save();

      await Activity.create({
        type:        result.isNew ? 'ai_response' : 'ai_reuse',
        user:        req.user._id,
        description: result.isNew
          ? `AI created FAQ: "${message.slice(0, 50)}..."`
          : `AI reused FAQ (${Math.round(result.similarity * 100)}% match): "${message.slice(0, 50)}..."`,
      });

      res.json({
        reply:       result.answer,
        faqId:       result.faqId,
        source:      result.source,
        question:    result.question,
        category:    result.category,
        similarity:  result.similarity,
        isNew:       result.isNew,
        isDuplicate: result.isDuplicate,
        chatId:      chat._id,
      });
    } catch (err) {
      console.error('Chat error:', err);
      if (err.message?.includes('connect') || err.message?.includes('ECONNREFUSED')) {
        return res.status(503).json({ error: 'Ollama is not running. Start it with: ollama serve' });
      }
      next(err);
    }
  }
);

// POST /api/chat/voice — transcribe audio to text only
router.post('/voice',
  auth,
  async (req, res, next) => {
    try {
      const { voiceData } = req.body;
      if (!voiceData) return res.status(400).json({ error: 'voiceData required' });
      const buf  = Buffer.from(voiceData, 'base64');
      const text = await transcribeAudio(buf);
      res.json({ text });
    } catch (err) {
      next(err);
    }
  }
);

// GET /api/chat — chat history
router.get('/', auth, async (req, res, next) => {
  try {
    const chats = await Chat.find({ user: req.user._id })
      .sort({ createdAt: -1 }).limit(20);
    res.json({ chats });
  } catch (err) { next(err); }
});

// DELETE /api/chat/:id
router.delete('/:id', auth, async (req, res, next) => {
  try {
    const chat = await Chat.findOne({ _id: req.params.id, user: req.user._id });
    if (!chat) return res.status(404).json({ error: 'Chat not found' });
    await chat.deleteOne();
    res.json({ message: 'Chat deleted' });
  } catch (err) { next(err); }
});

module.exports = router;