const ChildCategory = require('../models/childCategory');
const ParentCategory = require('../models/parentCategory');
const mongoose = require('mongoose');

// Helper function to clean up category name
const cleanName = (name) => {
  return name.toLowerCase().trim().replace(/\s+/g, ' ');
};

// Get all child categories
exports.getAllChildCategories = async (req, res) => {
  try {
    const childCategories = await ChildCategory.find().populate('parent').populate('products');
    res.json(childCategories);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
}

// Get a single child category by ID
exports.getChildById = async (req, res) => {
  const childCategoryId = req.params.id;

  try {
    // Find the child category by ID and populate its parent categories
    const child = await ChildCategory.findById(childCategoryId).populate('parent').populate('products');

    // If the child category is not found, return a 404 status with a message
    if (!child) {
      return res.status(404).json({ message: 'Child Category Not Found' });
    }

    // Return the found child category
    res.json(child);
  } catch (error) {
    // If there is an error, return a 400 status with the error message
    res.status(400).json({ message: error.message });
  }
}

// Delete a child category
exports.deleteChildCategory = async (req, res) => {
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
}

// Add a new child category
exports.addChildCategory = async (req, res) => {
  let { name, parent, isActive, showInNavbar } = req.body;

  // Validate name length
  if (!name || cleanName(name).length < 3) {
    return res.status(400).json({ message: 'Name is required and should be at least 3 characters long' });
  }

  // Clean up name
  name = cleanName(name);

  // Validate parent category
  if (!parent) {
    return res.status(400).json({ message: 'Parent category is required' });
  }

  let parentId;
  try {
    // Check if parent is an ObjectId or name
    if (/^[0-9a-fA-F]{24}$/.test(parent)) {
      // Parent is an ObjectId
      parentId = parent;
    } else {
      // Parent is a name
      parent = cleanName(parent);
      const parentCategory = await ParentCategory.findOne({ name: parent });
      if (!parentCategory) {
        return res.status(400).json({ message: 'Parent category does not exist' });
      }
      parentId = parentCategory._id;
    }

    // Check if the child category already exists for the given parent
    const existingChildCategory = await ChildCategory.findOne({ name, parent: parentId });
    if (existingChildCategory) {
      return res.status(400).json({ message: 'This child category name already exists under the selected parent category' });
    }

    // Create new child category
    const newChildCategory = new ChildCategory({
      name,
      parent: parentId,
      isActive: typeof isActive === 'boolean' ? isActive : true,
      showInNavbar: typeof showInNavbar === 'boolean' ? showInNavbar : true,
    });

    const savedChildCategory = await newChildCategory.save();

    // Update parent category to include new child
    await ParentCategory.findByIdAndUpdate(parentId, { $push: { children: savedChildCategory._id } });

    res.status(201).json(savedChildCategory);
  } catch (error) {
    if (error.code === 11000 && error.keyPattern && error.keyPattern.name === 1 && error.keyPattern.parent === 1) {
      // MongoDB duplicate key error
      return res.status(400).json({ message: 'This child category name already exists under the selected parent category' });
    }
    res.status(400).json({ message: error.message });
  }
};


// Update a Child Category
exports.updateChildCategory = async (req, res) => {
  const childCategoryId = req.params.id;
  let { name, parent, isActive, showInNavbar } = req.body;

  // Validate name length if it's included in the request body
  if (name && cleanName(name).length < 3) {
    return res.status(400).json({ message: 'Name should be at least 3 characters long' });
  }

  // Clean up name if it's included in the request body
  if (name) {
    name = cleanName(name);
  }

  // Initialize parentId
  let parentId;

  // Validate parent category if it's included in the request body
  if (parent) {
    // If parent is an ObjectId
    if (mongoose.Types.ObjectId.isValid(parent)) {
      parentId = parent;
    } else {
      // If parent is a name, find by name
      parent = cleanName(parent);
      const parentCategory = await ParentCategory.findOne({ name: parent });
      if (!parentCategory) {
        return res.status(400).json({ message: 'Parent category does not exist' });
      }
      parentId = parentCategory._id;
    }
  }

  try {
    // Find the existing child category
    const existingChildCategory = await ChildCategory.findById(childCategoryId);
    if (!existingChildCategory) {
      return res.status(404).json({ message: 'Child Category Not Found' });
    }

    // Prepare update data
    const updateData = {
      name: name || existingChildCategory.name,
      isActive: typeof isActive === 'boolean' ? isActive : existingChildCategory.isActive,
      showInNavbar: typeof showInNavbar === 'boolean' ? showInNavbar : existingChildCategory.showInNavbar,
    };

    // Handle parent update if needed
    if (parentId && existingChildCategory.parent.toString() !== parentId.toString()) {
      // Remove the child category from the old parent category
      await ParentCategory.updateOne(
        { _id: existingChildCategory.parent },
        { $pull: { children: childCategoryId } }
      );

      // Add the child category to the new parent category
      await ParentCategory.updateOne(
        { _id: parentId },
        { $push: { children: childCategoryId } }
      );

      // Include parentId in the update data
      updateData.parent = parentId;
    }

    // Update the child category
    const updatedChildCategory = await ChildCategory.findByIdAndUpdate(childCategoryId, updateData, { new: true });

    res.json(updatedChildCategory);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};


