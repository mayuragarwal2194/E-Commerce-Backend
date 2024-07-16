const express = require('express');
const ParentCategory = require('../models/parentCategory');
const ChildCategory = require('../models/childCategory');
const router = express.Router();

// Get all parent categories
router.get('/', async (req, res) => {
  try {
    const parentCategories = await ParentCategory.find().populate('children');
    res.json(parentCategories);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get a single parent category by ID
router.get('/:id', async (req, res) => {
  const parentCategoryId = req.params.id;

  try {
    const parentCategory = await ParentCategory.findById(parentCategoryId).populate('children');
    if (!parentCategory) {
      return res.status(404).json({ message: 'Parent category not found' });
    }
    res.json(parentCategory);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Helper function to clean up category name
const cleanName = (name) => {
  return name.toLowerCase().trim().replace(/\s+/g, ' ');
};

// Add a new parent category
router.post('/add', async (req, res) => {
  let { name, isActive, showInNavbar } = req.body;

  if (!name || cleanName(name).length < 3) {
    return res.status(400).json({ message: 'Name is required and should be at least 3 characters long' });
  }

  // Clean up name
  name = cleanName(name);

  const newParentCategory = new ParentCategory({
    name,
    isActive: typeof isActive === 'boolean' ? isActive : true,
    showInNavbar: typeof showInNavbar === 'boolean' ? showInNavbar : true,
  });

  try {
    const savedParentCategory = await newParentCategory.save();
    res.status(201).json(savedParentCategory);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Update a parent category
router.put('/:id', async (req, res) => {
  const parentCategoryId = req.params.id;

  if (req.body.name && cleanName(req.body.name).length < 3) {
    return res.status(400).json({ message: 'Name should be at least 3 characters long' });
  }

  // Clean up name if it's included in the request body
  if (req.body.name) {
    req.body.name = cleanName(req.body.name);
  }

  try {
    const updatedParentCategory = await ParentCategory.findByIdAndUpdate(parentCategoryId, req.body, { new: true });
    if (!updatedParentCategory) {
      return res.status(404).json({ message: 'Parent category not found' });
    }
    res.json(updatedParentCategory);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Delete a parent category
router.delete('/:id', async (req, res) => {
  const parentCategoryId = req.params.id;

  try {
    const deletedParentCategory = await ParentCategory.findByIdAndDelete(parentCategoryId);
    if (!deletedParentCategory) {
      return res.status(404).json({ message: 'Parent Category Not Found' });
    }
    // Remove parent reference from child categories
    await ChildCategory.updateMany({ parents: parentCategoryId }, { $pull: { parents: parentCategoryId } });
    res.json({ message: 'Parent category deleted successfully' });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

module.exports = router;