const mongoose = require('mongoose');

// ── Supported languages ────────────────────────────────────────────────────────
const LANGUAGES = [
  { code: 'en', name: 'English',    native: 'English',    flag: '🇬🇧', dir: 'ltr' },
  { code: 'hi', name: 'Hindi',      native: 'हिन्दी',      flag: '🇮🇳', dir: 'ltr' },
  { code: 'es', name: 'Spanish',    native: 'Español',    flag: '🇪🇸', dir: 'ltr' },
  { code: 'fr', name: 'French',     native: 'Français',   flag: '🇫🇷', dir: 'ltr' },
  { code: 'ar', name: 'Arabic',     native: 'العربية',     flag: '🇸🇦', dir: 'rtl' },
  { code: 'zh', name: 'Chinese',    native: '中文',        flag: '🇨🇳', dir: 'ltr' },
  { code: 'de', name: 'German',     native: 'Deutsch',    flag: '🇩🇪', dir: 'ltr' },
  { code: 'pt', name: 'Portuguese', native: 'Português',  flag: '🇧🇷', dir: 'ltr' },
];

const faqSchema = new mongoose.Schema({
  question:   { type: String, required: true, trim: true },
  answer:     { type: String, required: true },
  category:   { type: String, required: true, trim: true },
  tags:       [{ type: String, trim: true }],
  votes:      { type: Number, default: 0 },
  views:      { type: Number, default: 0 },
  user:       { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  comments: [{
    user:     { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    text:     { type: String, required: true },
    createdAt: { type: Date, default: Date.now },
  }],
  isAI:        { type: Boolean, default: false },
  isPublished: { type: Boolean, default: true },
  embedding:   [{ type: Number }],     // all-MiniLM-L6-v2 384-dim vector
  sourceChat:  { type: mongoose.Schema.Types.ObjectId, ref: 'Chat' },

  // Multilingual — key: language code, value: { question, answer }
  translations: {
    type: Map,
    of: {
      question: { type: String, default: '' },
      answer:   { type: String, default: '' },
    },
    default: {},
  },
  translationStatus: {
    type: String,
    enum: ['pending', 'partial', 'complete', 'failed'],
    default: 'pending',
  },
}, { timestamps: true });

// ── MongoDB getter: always return translations as a plain object ─────────────
faqSchema.set('toJSON', {
  transform: (doc, ret) => {
    if (ret.translations instanceof Map) {
      ret.translations = Object.fromEntries(ret.translations);
    }
    // Remove internal fields
    delete ret.embedding;
    delete ret.__v;
    return ret;
  },
});

faqSchema.index({ question: 'text', answer: 'text', tags: 'text' });
faqSchema.index({ category: 1 });
faqSchema.index({ createdAt: -1 });
faqSchema.index({ views: -1 });
faqSchema.index({ votes: -1 });
faqSchema.index({ embedding: 1 });

module.exports = mongoose.model('FAQ', faqSchema);