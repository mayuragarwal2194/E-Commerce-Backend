const parentCategory = require('../models/parentCategory');
const childCategory = require('../models/childCategory');


// Get all parent categories
exports.getAllParentCategories = async (req, res) => {
  try {
    const parentCategories = await parentCategory.find().populate('children');
    res.json(parentCategories);
  } catch (error) {
    res.status(500).json({ message: 'Failed to fatch Parent Categories' })
  }
}

// Get a single parent category by ID
exports.getParentById = async (req, res) => {
  try {
    const parentCategoryId = req.params.id;
    const parent = await parentCategory.findById(parentCategoryId).populate('children');

    if (!parentCategory) {
      return res.status(404).json({ message: 'Parent category not found' });
    }
    res.json(parent);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
}

// Helper function to clean up category name
const cleanName = (name) => {
  return name.toLowerCase().trim().replace(/\s+/g, ' ');
};

// Add a new parent category
exports.addParentcategory = async (req, res) => {
  let { name, isActive, showInNavbar } = req.body;

  if (!name || cleanName(name).length < 3) {
    return res.status(400).json({ message: 'Name is required and should be at least 3 characters long' });
  }

  // Clean up name
  name = cleanName(name);

  const newParentCategory = new parentCategory({
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
}

// Update a parent category
exports.updateParentcCategory = async (req, res) => {
  const parentCategoryId = req.params.id;

  if (req.body.name && cleanName(req.body.name).length < 3) {
    return res.status(400).json({ message: 'Name should be at least 3 characters long' });
  }

  // Clean up the name, if it's included in the request body
  if (req.body.name) {
    req.body.name = cleanName(req.body.name);
  }

  try {
    const updatedParentCategory = await parentCategory.findByIdAndUpdate(parentCategoryId, req.body, { new: true });
    if (!updatedParentCategory) {
      return res.status(404).json({ message: 'Parent category not found' });
    }
    res.json(updatedParentCategory);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
}

// Delete a parent category
exports.deleteParentCategory = async (req, res) => {
  const parentCategoryId = req.params.id;

  try {
    const deletedParentCategory = await parentCategory.findByIdAndDelete(parentCategoryId);
    if (!deletedParentCategory) {
      return res.status(404).json({ message: 'Parent Category Not Found' });
    }
    // Remove parent reference from child categories
    await childCategory.updateMany({ parents: parentCategoryId }, { $pull: { parents: parentCategoryId } });
    res.json({ message: 'Parent category deleted successfully' });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
}

// New function to get child categories by parent category ID
exports.getChildCategoriesByParentId = async (req, res) => {
  try {
    const parentCategoryId = req.params.id;
    const parentCategoryFound = await parentCategory.findById(parentCategoryId).populate('children');
    if (!parentCategoryFound) {
      return res.status(404).json({ message: 'Parent category not found' });
    }
    res.json(parentCategoryFound.children);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};