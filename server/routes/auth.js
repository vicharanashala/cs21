const express = require('express');
const { body } = require('express-validator');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const validate = require('../middleware/validate');
const { auth } = require('../middleware/auth');

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

// PUT /auth/me
router.put('/me', auth,
  [body('name').optional().trim().isLength({ min: 2, max: 50 })],
  validate,
  async (req, res, next) => {
    try {
      const { name } = req.body;
      if (name) req.user.name = name;
      await req.user.save();
      res.json({ user: req.user.toSafeJSON() });
    } catch (err) {
      next(err);
    }
  }
);

module.exports = router;