const mongoose = require('mongoose');

const resetTokenSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  token: {
    type: String,
    required: true,
    index: true,
  },
  expiresAt: {
    type: Date,
    required: true,
  },
  usedAt: {
    type: Date,
    default: null,
  },
}, { timestamps: true });

// TTL index: automatically expire documents after the expiresAt date
resetTokenSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

// Sparse unique index on token (only index non-null tokens)


const ResetToken = mongoose.model('ResetToken', resetTokenSchema);

module.exports = ResetToken;