const mongoose = require('mongoose');

const searchFailureSchema = new mongoose.Schema({
  query: { type: String, required: true, trim: true },
  count: { type: Number, default: 1 },
  lastSearched: { type: Date, default: Date.now },
  convertedToFAQ: { type: Boolean, default: false },
}, { timestamps: true });

searchFailureSchema.index({ count: -1 });
searchFailureSchema.index({ query: 'text' });

module.exports = mongoose.model('SearchFailure', searchFailureSchema);