const ParentCategory = require('../models/parentCategory');
const ChildCategory = require('../models/childCategory');
const TopCategory = require('../models/topCategory');
const mongoose = require("mongoose");

// Helper function to clean up category name
const cleanName = (name) => {
  return name.toLowerCase().trim().replace(/\s+/g, ' ');
};

// Get all parent categories
exports.getAllParentCategories = async (req, res) => {
  try {
    const parentCategories = await ParentCategory.find().populate('children');
    res.json(parentCategories);
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch Parent Categories' });
  }
}

// Get a single parent category by ID
exports.getParentById = async (req, res) => {
  try {
    const parentCategoryId = req.params.id;
    const parent = await ParentCategory.findById(parentCategoryId).populate('children');

    if (!parent) {
      return res.status(404).json({ message: 'Parent category not found' });
    }
    res.json(parent);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
}

// Add a new parent category
exports.addParentCategory = async (req, res) => {
  let { name, topCategory, isActive, showInNavbar } = req.body;

  // Validate name length
  if (!name || cleanName(name).length < 3) {
    return res.status(400).json({ message: 'Name is required and should be at least 3 characters long' });
  }

  // Clean up name
  name = cleanName(name);

  // Validate top category
  if (!topCategory) {
    return res.status(400).json({ message: 'Top category is required' });
  }

  let topCatId;

  try {
    // Check if Top Category is an ObjectId or name
    if (/^[0-9a-fA-F]{24}$/.test(topCategory)) {
      // Top Category is an ObjectId
      topCatId = topCategory;
    } else {
      // Top Category is a name
      topCategory = cleanName(topCategory);
      const topCategoryFound = await TopCategory.findOne({ name: topCategory });
      if (!topCategoryFound) {
        return res.status(400).json({ message: 'Top category does not exist' });
      }
      topCatId = topCategoryFound._id;
    }

    // Check if a parent category with the same name already exists under the selected top category
    const existingParentCategory = await ParentCategory.findOne({ name, topCategory: topCatId });
    if (existingParentCategory) {
      return res.status(400).json({ message: 'This parent category name already exists under the selected top category' });
    }

    // Create new parent category
    const newParentCategory = new ParentCategory({
      name,
      topCategory: topCatId,
      isActive: typeof isActive === 'boolean' ? isActive : true,
      showInNavbar: typeof showInNavbar === 'boolean' ? showInNavbar : true,
    });

    const savedParentCategory = await newParentCategory.save();

    // Update top category to include new parent
    await TopCategory.findByIdAndUpdate(topCatId, { $push: { children: savedParentCategory._id } });

    res.status(201).json(savedParentCategory);
  } catch (error) {
    if (error.code === 11000 && error.keyPattern && error.keyPattern.name === 1 && error.keyPattern.topCategory === 1) {
      // MongoDB duplicate key error for compound index
      return res.status(400).json({ message: 'This parent category name already exists under the selected top category' });
    }
    res.status(400).json({ message: error.message });
  }
};

// Update a parent category
exports.updateParentCategory = async (req, res) => {
  const parentCategoryId = req.params.id;
  let { name, topCategory, isActive, showInNavbar } = req.body;

  if (name && cleanName(name).length < 3) {
    return res.status(400).json({ message: 'Name should be at least 3 characters long' });
  }

  // Clean up the name, if it's included in the request body
  if (name) {
    name = cleanName(name);
  }

  // Initialize topCatId
  let topCatId;

  // Validate Top category if it's included in the request body
  if (topCategory) {
    // If TopCategory is an ObjectId
    if (mongoose.Types.ObjectId.isValid(topCategory)) {
      topCatId = topCategory;
    } else {
      // If Top Category is a name, find by name
      topCategory = cleanName(topCategory);
      const topCategoryFound = await TopCategory.findOne({ name: topCategory });
      if (!topCategoryFound) {
        return res.status(400).json({ message: 'Top category does not exist' });
      }
      topCatId = topCategoryFound._id;
    }
  }

  try {
    // Find the existing parent category
    const existingParentCategory = await ParentCategory.findById(parentCategoryId);

    if (!existingParentCategory) {
      return res.status(404).json({ message: 'Parent Category Not Found' });
    }

    // Prepare update data
    const updateData = {
      name: name || existingParentCategory.name,
      isActive: isActive !== undefined ? (isActive === 'true' || isActive === true) : existingParentCategory.isActive,
      showInNavbar: showInNavbar !== undefined ? (showInNavbar === 'true' || showInNavbar === true) : existingParentCategory.showInNavbar,
    };

    // Handle Top Category update if needed
    if (topCatId && (!existingParentCategory.topCategory || existingParentCategory.topCategory.toString() !== topCatId.toString())) {
      // Remove the Parent category from the old Top category
      if (existingParentCategory.topCategory) {
        await TopCategory.updateOne(
          { _id: existingParentCategory.topCategory },
          { $pull: { children: parentCategoryId } }
        );
      }

      // Add the Parent category to the new Top category
      await TopCategory.updateOne(
        { _id: topCatId },
        { $push: { children: parentCategoryId } }
      );

      // Include top Category ID in the update data
      updateData.topCategory = topCatId;
    }

    // Update the Parent category
    const updatedParentCategory = await ParentCategory.findByIdAndUpdate(parentCategoryId, updateData, { new: true });

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
    const deletedParentCategory = await ParentCategory.findByIdAndDelete(parentCategoryId);
    if (!deletedParentCategory) {
      return res.status(404).json({ message: 'Parent Category Not Found' });
    }
    
    // Remove parent reference from child categories
    await ChildCategory.updateMany({ parent: parentCategoryId }, { $set: { parent: null } });

    // Remove parent reference from Top categories
    await TopCategory.updateMany({ children: parentCategoryId }, { $pull: { children: parentCategoryId } });

    res.json({ message: 'Parent category deleted successfully' });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
}

// New function to get child categories by parent category ID
exports.getChildCategoriesByParentId = async (req, res) => {
  try {
    const parentCategoryId = req.params.id;
    const parentCategoryFound = await ParentCategoryIdarentCategory.findById(parentCategoryId).populate('children');
    if (!parentCategoryFound) {
      return res.status(404).json({ message: 'Parent category not found' });
    }
    res.json(parentCategoryFound.children);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};