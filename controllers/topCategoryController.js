const ParentCategory = require('../models/parentCategory');
const TopCategory = require('../models/topCategory');


// Helper function to clean up category name
const cleanName = (name) => {
  return name.toLowerCase().trim().replace(/\s+/g, ' ');
};

// Get all Top categories
exports.getAllTopCategories = async (req, res) => {
  try {
    const topCategories = await TopCategory.find().populate('children');
    res.json(topCategories);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
}

// Get a single Top category by ID
exports.getTopById = async (req, res) => {
  try {
    const topCategoryId = req.params.id;
    const topCategory = await TopCategory.findById(topCategoryId).populate('children');

    if (!topCategory) {
      return res.status(404).json({ message: 'Top category not found' });
    }
    res.json(topCategory);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
}

// Add a new Top Category
exports.addTopCategory = async (req, res) => {
  let { name, isActive, showInNavbar } = req.body;

  if (!name || cleanName(name).length < 3) {
    return res.status(400).json({ message: 'Name is required and should be at least 3 characters long' });
  }

  // Clean up name
  name = cleanName(name);

  // Convert isActive and showInNavbar to boolean values if they are not already
  isActive = typeof isActive === 'boolean' ? isActive : isActive === 'false' ? false : true;
  showInNavbar = typeof showInNavbar === 'boolean' ? showInNavbar : showInNavbar === 'false' ? false : true;

  try {
    // Check if a category with the same name already exists
    const existingTopCategory = await TopCategory.findOne({ name });
    if (existingTopCategory) {
      return res.status(400).json({ message: 'Top Category with this name already exists' });
    }
    const newTopCategory = new TopCategory({
      name,
      isActive,
      showInNavbar
    });

    const savedTopCategory = await newTopCategory.save();
    res.status(201).json(savedTopCategory);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
}

// Update a Top Category
exports.updateTopCategory = async (req, res) => {
  const topCategoryId = req.params.id;

  if (req.body.name && cleanName(req.body.name).length < 3) {
    return res.status(400).json({ message: 'Name should be at least 3 characters long' });
  }

  // Clean up the name, if it's included in the request body
  if (req.body.name) {
    req.body.name = cleanName(req.body.name);
  }

  try {
    const updatedTopCategory = await TopCategory.findByIdAndUpdate(topCategoryId, req.body, { new: true });

    if (!updatedTopCategory) {
      return res.status(404).json({ message: 'Top category not found' });
    }
    res.json(updatedTopCategory);

  } catch (error) {
    res.status(400).json({ message: error.message });
  }
}

// Delete a Top Category
exports.deleteTopCategory = async (req, res) => {
  const topCategoryId = req.params.id;

  try {
    const deletedTopCategory = await TopCategory.findOneAndDelete({ _id: topCategoryId });
    if (!deletedTopCategory) {
      return res.status(404).json({ message: 'Top Category Not Found' });
    }

    // Set Top Category reference to null in its child categories
    await ParentCategory.updateMany({ topCategory: topCategoryId }, { $set: { topCategory: null } });

    res.json({ message: 'Top category deleted successfully' });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
}


// New function to get child categories by parent category ID
exports.getParentCategoriesByTopId = async (req, res) => {
  try {
  const topCategoryId = req.params.id;

  const topCategory = await TopCategory.findById(topCategoryId).populate('children');
  if (!topCategory) {
    return res.status(404).json({ message: 'Top category not found' });
  }
  res.json(topCategory.children);
  } catch (error) {
    res.status(500).json({ message: error.message });    
  }
}