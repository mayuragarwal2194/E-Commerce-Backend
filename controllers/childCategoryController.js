const childCategory = require('../models/childCategory');
const parentCategory = require('../models/parentCategory');

// Helper function to clean up category name
const cleanName = (name) => {
  return name.toLowerCase().trim().replace(/\s+/g, ' ');
};

// Get all child categories
exports.getAllChildCategories = async (req, res) => {
  try {
    const childCategories = await childCategory.find().populate('parents').populate('products');
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
    const child = await childCategory.findById(childCategoryId).populate('parents').populate('products');

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
    const deletedChildCategory = await childCategory.findByIdAndDelete(childCategoryId)
    if (!deletedChildCategory) {
      return res.status(404).json({ message: 'Child Category Not Found' });
    }

    // Remove child reference from parent categories
    await parentCategory.updateMany({ children: childCategoryId }, { $pull: { children: childCategoryId } });
    res.json({ message: 'Child category deleted successfully' });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
}

// Add a new child category
exports.addChildCategory = async (req, res) => {
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
    const parentCategories = await parentCategory.find({ name: { $in: parents } });
    if (parentCategories.length !== parents.length) {
      return res.status(400).json({ message: 'One or more parent categories do not exist' });
    }

    const parentIds = parentCategories.map(parent => parent._id);

    // Check if the child category already exists for the given parent(s)
    const existingChildCategory = await childCategory.findOne({ name, parents: { $all: parentIds } });
    if (existingChildCategory) {
      return res.status(400).json({ message: 'This child category name already exists under the selected parent category' });
    }

    // Create new child category
    const newChildCategory = new childCategory({
      name,
      parents: parentIds,
      isActive: typeof isActive === 'boolean' ? isActive : true,
      showInNavbar: typeof showInNavbar === 'boolean' ? showInNavbar : true,
    });

    const savedChildCategory = await newChildCategory.save();

    // Update parent categories to include new child
    await parentCategory.updateMany({ _id: { $in: parentIds } }, { $push: { children: savedChildCategory._id } });

    res.status(201).json(savedChildCategory);
  } catch (error) {
    if (error.code === 11000 && error.keyPattern && error.keyPattern.name === 1 && error.keyPattern.parents === 1) {
      // MongoDB duplicate key error
      return res.status(400).json({ message: 'This child category name already exists under the selected parent category' });
    }
    res.status(400).json({ message: error.message });
  }
}

// Update a Child Category
exports.updateChildCategory = async (req, res) => {
  const childCategoryId = req.params.id;
  let { name, parents, isActive, showInNavbar } = req.body;

  // Validate name length if it's included in the request body
  if (name && cleanName(name).length < 3) {
    return res.status(400).json({ message: 'Name should be at least 3 characters long' });
  }

  // Clean up name if it's included in the request body
  if (name) {
    name = cleanName(name);
  }

  // Ensure parents is an array if it's included in the request body
  if (parents) {
    if (!Array.isArray(parents)) {
      parents = [parents];
    }

    // Convert parent names to lowercase and clean up
    parents = parents.map(parent => cleanName(parent));
  }

  try {
    // Find the existing child category
    const existingChildCategory = await childCategory.findById(childCategoryId);
    if (!existingChildCategory) {
      return res.status(404).json({ message: 'Child Category Not Found' });
    }

    // Check if all parent categories exist and convert names to IDs if parents are being updated
    let parentIds;
    if (parents) {
      const parentCategories = await parentCategory.find({ name: { $in: parents } });
      if (parentCategories.length !== parents.length) {
        return res.status(400).json({ message: 'One or more parent categories do not exist' });
      }
      parentIds = parentCategories.map(parent => parent._id);
    }

    // Update the child category
    const updateData = {
      name: name || existingChildCategory.name,
      isActive: typeof isActive === 'boolean' ? isActive : existingChildCategory.isActive,
      showInNavbar: typeof showInNavbar === 'boolean' ? showInNavbar : existingChildCategory.showInNavbar,
    };
    if (parents) {
      updateData.parents = parentIds;
    }
    const updatedChildCategory = await childCategory.findByIdAndUpdate(childCategoryId, updateData, { new: true });

    // If parents are being updated, handle the parent-child relationship
    if (parents) {
      // Remove the child category from old parent categories
      await parentCategory.updateMany(
        { _id: { $in: existingChildCategory.parents } },
        { $pull: { children: childCategoryId } }
      );

      // Add the child category to new parent categories
      await parentCategory.updateMany(
        { _id: { $in: parentIds } },
        { $push: { children: childCategoryId } }
      );
    }

    res.json(updatedChildCategory);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};
