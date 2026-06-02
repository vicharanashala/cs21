const express = require('express');
const { body } = require('express-validator');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const multer = require('multer');
const sharp = require('sharp');
const path = require('path');
const fs = require('fs');
const User = require('../models/User');
const ResetToken = require('../models/ResetToken');
const validate = require('../middleware/validate');
const { auth } = require('../middleware/auth');
const { sendPasswordResetEmail } = require('../services/email');

const router = express.Router();

// Generate JWT
const generateToken = (user) => {
  return jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  });
};

// POST /auth/register
router.post('/register',
  [
    body('name').trim().isLength({ min: 2, max: 50 }).withMessage('Name must be 2-50 chars'),
    body('email').isEmail().normalizeEmail().withMessage('Valid email required'),
    body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 chars'),
  ],
  validate,
  async (req, res, next) => {
    try {
      const { name, email, password } = req.body;

      const existing = await User.findOne({ email });
      if (existing) {
        return res.status(409).json({ error: 'Email already registered' });
      }

      const user = await User.create({ name, email, password });
      const token = generateToken(user);

      res.status(201).json({
        user: user.toSafeJSON(),
        token,
      });
    } catch (err) {
      next(err);
    }
  }
);

// POST /auth/login
router.post('/login',
  [
    body('email').isEmail().normalizeEmail(),
    body('password').notEmpty(),
  ],
  validate,
  async (req, res, next) => {
    try {
      const { email, password } = req.body;

      const user = await User.findOne({ email });
      if (!user || !(await user.comparePassword(password))) {
        return res.status(401).json({ error: 'Invalid credentials' });
      }

      if (!user.isActive) {
        return res.status(403).json({ error: 'Account is deactivated' });
      }

      const token = generateToken(user);

      res.json({ user: user.toSafeJSON(), token });
    } catch (err) {
      next(err);
    }
  }
);

// POST /auth/logout
router.post('/logout', auth, (req, res) => {
  // Stateless JWT — client discards token; server acknowledges
  res.json({ message: 'Logged out' });
});

// GET /auth/me
router.get('/me', auth, async (req, res) => {
  res.json({ user: req.user.toSafeJSON() });
});

// PUT /auth/me — update profile fields
router.put('/me', auth,
  [
    body('name').optional().trim().isLength({ min: 2, max: 50 }).withMessage('Name must be 2-50 characters'),
    body('phone').optional().trim().matches(/^\+?[\d\s\-()]{7,20}$/).withMessage('Invalid phone format'),
    body('bio').optional().trim().isLength({ max: 160 }).withMessage('Bio must be 160 characters or less'),
  ],
  validate,
  async (req, res, next) => {
    try {
      const { name, phone, bio } = req.body;
      if (name !== undefined) req.user.name = name;
      if (phone !== undefined) req.user.phone = phone;
      if (bio !== undefined) req.user.bio = bio;
      await req.user.save();
      res.json({ user: req.user.toSafeJSON() });
    } catch (err) {
      next(err);
    }
  }
);

// ─── Avatar Upload ────────────────────────────────────────────────────────────

const avatarsDir = path.join(__dirname, '..', 'public', 'avatars');
if (!fs.existsSync(avatarsDir)) fs.mkdirSync(avatarsDir, { recursive: true });

const storage = multer.memoryStorage();
const avatarUpload = multer({
  storage,
  limits: { fileSize: 2 * 1024 * 1024 }, // 2MB
  fileFilter: (req, file, cb) => {
    if (['image/jpeg', 'image/png', 'image/webp', 'image/gif'].includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Only JPEG, PNG, WebP, and GIF images are allowed'));
    }
  },
});

// POST /auth/avatar — upload and set avatar
router.post('/avatar', auth, avatarUpload.single('avatar'), async (req, res, next) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'No image file provided' });

    const userId = req.user._id.toString();
    const ext = req.file.mimetype === 'image/png' ? 'png' : 'jpg';
    const filename = `avatar_${userId}_${Date.now()}.${ext}`;
    const filepath = path.join(avatarsDir, filename);

    // Process with sharp: resize to 300×300, crop to square, optimize
    await sharp(req.file.buffer)
      .resize(300, 300, { fit: 'cover', position: 'center' })
      .jpeg({ quality: 80 })
      .png({ quality: 80 })
      .toFile(filepath);

    // Remove old avatar file if it's a local upload
    if (req.user.avatar && req.user.avatar.startsWith('/avatars/')) {
      const oldPath = path.join(__dirname, '..', 'public', req.user.avatar.replace('/avatars/', 'avatars/'));
      fs.unlink(oldPath, () => {}); // best-effort cleanup
    }

    const avatarUrl = `/avatars/${filename}`;
    req.user.avatar = avatarUrl;
    req.user.avatarUpdatedAt = new Date();
    await req.user.save();

    res.json({ user: req.user.toSafeJSON(), avatarUrl });
  } catch (err) {
    next(err);
  }
});

// DELETE /auth/avatar — remove avatar and revert to initials
router.delete('/avatar', auth, async (req, res, next) => {
  try {
    if (req.user.avatar && req.user.avatar.startsWith('/avatars/')) {
      const oldPath = path.join(__dirname, '..', 'public', req.user.avatar.replace('/avatars/', 'avatars/'));
      fs.unlink(oldPath, () => {});
    }
    req.user.avatar = '';
    req.user.avatarUpdatedAt = new Date();
    await req.user.save();
    res.json({ user: req.user.toSafeJSON() });
  } catch (err) {
    next(err);
  }
});

// ─── Password Reset ───────────────────────────────────────────────────────────

// POST /auth/forgot-password
// Rate-limited separately (uses express-rate-limit on /api/ so 100 reqs/15 min)
router.post('/forgot-password',
  [body('email').isEmail().normalizeEmail()],
  validate,
  async (req, res, next) => {
    try {
      const { email } = req.body;

      // Always return 200 to prevent email enumeration
      const user = await User.findOne({ email: email.toLowerCase() });
      if (!user || !user.isActive) {
        return res.json({ message: 'If that email exists, a reset link has been sent.' });
      }

      // Invalidate any existing tokens for this user
      await ResetToken.updateMany(
        { user: user._id, usedAt: null },
        { $set: { usedAt: new Date() } }
      );

      // Generate a secure random token
      const token = crypto.randomBytes(32).toString('hex');
      const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 60 minutes

      await ResetToken.create({ user: user._id, token, expiresAt });

      // Build reset URL — clientUrl is configured in env
      const clientUrl = process.env.CLIENT_URL || 'http://localhost:5173';
      const resetUrl = `${clientUrl}/reset-password/${token}`;

      await sendPasswordResetEmail({ to: user.email, resetUrl, name: user.name });

      res.json({ message: 'If that email exists, a reset link has been sent.' });
    } catch (err) {
      next(err);
    }
  }
);

// POST /auth/reset-password
router.post('/reset-password',
  [
    body('token').notEmpty().withMessage('Token is required'),
    body('password')
      .isLength({ min: 6 })
      .withMessage('Password must be at least 6 characters'),
  ],
  validate,
  async (req, res, next) => {
    try {
      const { token, password } = req.body;

      // Find a valid, unused token
      const resetToken = await ResetToken.findOne({
        token,
        expiresAt: { $gt: new Date() },
        usedAt: null,
      });

      if (!resetToken) {
        return res.status(400).json({
          error: 'Reset link is invalid or has expired. Please request a new one.',
        });
      }

      const user = await User.findById(resetToken.user);
      if (!user || !user.isActive) {
        return res.status(400).json({ error: 'Account not found or deactivated.' });
      }

      // Update password (pre-save hook will hash it)
      user.password = password;
      await user.save();

      // Mark token as used
      resetToken.usedAt = new Date();
      await resetToken.save();

      // Invalidate all other tokens for this user (rotation)
      await ResetToken.updateMany(
        { user: user._id, _id: { $ne: resetToken._id } },
        { $set: { usedAt: new Date() } }
      );

      res.json({ message: 'Password updated successfully. You can now log in.' });
    } catch (err) {
      next(err);
    }
  }
);

// GET /auth/verify-reset-token  (optional — lets the client check token validity before showing the form)
router.get('/verify-reset-token/:token',
  async (req, res, next) => {
    try {
      const resetToken = await ResetToken.findOne({
        token: req.params.token,
        expiresAt: { $gt: new Date() },
        usedAt: null,
      }).populate('user', 'name email');

      if (!resetToken) {
        return res.status(400).json({ error: 'Reset link is invalid or has expired.' });
      }

      res.json({ valid: true, email: resetToken.user.email });
    } catch (err) {
      next(err);
    }
  }
);

module.exports = router;