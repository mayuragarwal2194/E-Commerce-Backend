// routes/category.js

const express = require('express');
const Category = require('../models/category');
const router = express.Router();

// Get all categories
router.get('/viewcategory', async (req, res) => {
  try {
    const categories = await Category.find();
    res.json(categories);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Add a new category
router.post('/', async (req, res) => {
  const newCategory = new Category({
    name: req.body.name,
    parent: req.body.parent,
    isActive: req.body.isActive || true,
    showInNavbar: req.body.showInNavbar || true,
  });

  try {
    const savedCategory = await newCategory.save();
    res.status(201).json(savedCategory);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Update a category
router.put('/:id', async (req, res) => {
  const categoryId = req.params.id;

  try {
    const updatedCategory = await Category.findByIdAndUpdate(categoryId, req.body, { new: true });
    if (!updatedCategory) {
      return res.status(404).json({ message: 'Category not found' });
    }
    res.json(updatedCategory);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Delete a category
router.delete('/:id', async (req, res) => {
  const categoryId = req.params.id;

  try {
    const deletedCategory = await Category.findByIdAndDelete(categoryId);
    if (!deletedCategory) {
      return res.status(404).json({ message: 'Category not found' });
    }
    res.json({ message: 'Category deleted successfully' });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

module.exports = router;