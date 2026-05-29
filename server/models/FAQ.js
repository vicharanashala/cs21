const mongoose = require('mongoose');

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
}, { timestamps: true });

faqSchema.index({ question: 'text', answer: 'text', tags: 'text' });
faqSchema.index({ category: 1 });
faqSchema.index({ createdAt: -1 });
faqSchema.index({ views: -1 });
faqSchema.index({ votes: -1 });
faqSchema.index({ embedding: 1 });

module.exports = mongoose.model('FAQ', faqSchema);