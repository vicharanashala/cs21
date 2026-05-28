const express = require('express');
const Category = require('../models/Category');
const { auth, adminOnly } = require('../middleware/auth');

const router = express.Router();

// GET /categories — public
router.get('/', async (req, res, next) => {
  try {
    const categories = await Category.find().sort({ name: 1 });
    res.json({ categories });
  } catch (err) {
    next(err);
  }
});

// POST /categories — admin only
router.post('/', auth, adminOnly, async (req, res, next) => {
  try {
    const { name, description, icon } = req.body;
    if (!name) return res.status(400).json({ error: 'Name required' });

    const existing = await Category.findOne({ name });
    if (existing) return res.status(409).json({ error: 'Category already exists' });

    const category = await Category.create({ name, description, icon });
    res.status(201).json({ category });
  } catch (err) {
    next(err);
  }
});

// DELETE /categories/:id — admin only
router.delete('/:id', auth, adminOnly, async (req, res, next) => {
  try {
    const category = await Category.findByIdAndDelete(req.params.id);
    if (!category) return res.status(404).json({ error: 'Category not found' });
    res.json({ message: 'Category deleted' });
  } catch (err) {
    next(err);
  }
});

module.exports = router;