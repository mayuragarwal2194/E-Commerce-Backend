const express = require('express');
const ChildCategory = require('../models/childCategory');
const ParentCategory = require('../models/parentCategory');
const router = express.Router();
const { uploadNone } = require('../config/multerConfig'); // Import the multer configuration

// Helper function to clean up category name
const cleanName = (name) => {
  return name.toLowerCase().trim().replace(/\s+/g, ' ');
};

// Add a new child category
router.post('/add', uploadNone, async (req, res) => {
  let { name, parents, isActive, showInNavbar } = req.body;

  // Validate name length
  if (!name || cleanName(name).length < 3) {
    return res.status(400).json({ message: 'Name is required and should be at least 3 characters long' });
  }

  // Clean up name
  name = cleanName(name);

  // Ensure parents is an array
  if (!Array.isArray(parents)) {
    parents = [parents];
  }

  // Convert parent names to lowercase and clean up
  parents = parents.map(parent => cleanName(parent));

  try {
    // Check if all parent categories exist and convert names to IDs
    const parentCategories = await ParentCategory.find({ name: { $in: parents } });
    if (parentCategories.length !== parents.length) {
      return res.status(400).json({ message: 'One or more parent categories do not exist' });
    }

    const parentIds = parentCategories.map(parent => parent._id);

    // Check if the child category already exists for the given parent(s)
    const existingChildCategory = await ChildCategory.findOne({ name, parents: { $all: parentIds } });
    if (existingChildCategory) {
      return res.status(400).json({ message: 'This child category name already exists under the selected parent category' });
    }

    // Create new child category
    const newChildCategory = new ChildCategory({
      name,
      parents: parentIds,
      isActive: typeof isActive === 'boolean' ? isActive : true,
      showInNavbar: typeof showInNavbar === 'boolean' ? showInNavbar : true,
    });

    const savedChildCategory = await newChildCategory.save();

    // Update parent categories to include new child
    await ParentCategory.updateMany({ _id: { $in: parentIds } }, { $push: { children: savedChildCategory._id } });

    res.status(201).json(savedChildCategory);
  } catch (error) {
    if (error.code === 11000 && error.keyPattern && error.keyPattern.name === 1 && error.keyPattern.parents === 1) {
      // MongoDB duplicate key error
      return res.status(400).json({ message: 'This child category name already exists under the selected parent category' });
    }
    res.status(400).json({ message: error.message });
  }
});

// Update a Child Category
router.put('/:id',uploadNone, async (req, res) => {
  const childCategoryId = req.params.id;

  // console.log('Request body before cleaning:', req.body);

  if (req.body.name && cleanName(req.body.name).length < 3) {
    return res.status(400).json({ message: 'Name should be at least 3 characters long' });
  }

  // Clean up name if it's included in the request body
  if (req.body.name) {
    req.body.name = cleanName(req.body.name);
  }

  // console.log('Request body after cleaning:', req.body);

  try {
    const updateChildCategory = await ChildCategory.findByIdAndUpdate(childCategoryId, req.body, { new: true });
    if (!updateChildCategory) {
      return res.status(404).json({ message: 'Child Category Not Found' });
    }
    res.json(updateChildCategory);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Get all child categories
router.get('/', async (req, res) => {
  try {
    const childCategories = await ChildCategory.find().populate('parents').populate('products');
    res.json(childCategories);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get a single child category by ID
router.get('/:id', async (req, res) => {
  const childCategoryId = req.params.id;

  try {
    // Find the child category by ID and populate its parent categories
    const childCategory = await ChildCategory.findById(childCategoryId).populate('parents').populate('products');

    // If the child category is not found, return a 404 status with a message
    if (!childCategory) {
      return res.status(404).json({ message: 'Child Category Not Found' });
    }

    // Return the found child category
    res.json(childCategory);
  } catch (error) {
    // If there is an error, return a 400 status with the error message
    res.status(400).json({ message: error.message });
  }
});

// Delete a child Category
router.delete('/:id', async (req, res) => {
  const childCategoryId = req.params.id;

  try {
    const deletedChildCategory = await ChildCategory.findByIdAndDelete(childCategoryId)
    if (!deletedChildCategory) {
      return res.status(404).json({ message: 'Child Category Not Found' });
    }

    // Remove child reference from parent categories
    await ParentCategory.updateMany({ children: childCategoryId }, { $pull: { children: childCategoryId } });
    res.json({ message: 'Child category deleted successfully' });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }

});

module.exports = router;