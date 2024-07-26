const size = require('../models/size');

// Helper function to clean up category name
const cleanName = (name) => {
  return name.toLowerCase().trim().replace(/\s+/g, ' ');
};

// Get all Sizes
exports.getAllSizes = async (req, res) => {
  try {
    const sizes = await size.find();
    res.json(sizes);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
}

// Get size by ID
exports.getSizeById = async (req, res) => {
  try {
    const sizeId = req.params.id;
    const sizeFound = await size.findById(sizeId);
    if (!sizeFound) {
      return res.status(404).json({ message: 'Product not found' });
    }
    res.json(sizeFound);
  } catch (error) {
    console.error('Error in getSizeById:', error);
    res.status(500).json({ message: 'Failed to fetch Size' });
  }
}

// Add size
exports.addSize = async (req, res) => {
  try {
    let {
      sizeName,
      description
    } = req.body;

    sizeName = cleanName(sizeName);

    // Check if a size is already exists
    const existingSize = await size.findOne({ sizeName });
    if (existingSize) {
      return res.status(400).json({ message: 'Size already exists.' });
    }

    const newSize = new size({ sizeName, description });
    await newSize.save();
    res.status(201).json(newSize);

  } catch (error) {
    console.error('Error in addSize:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
}

// Delete Size
exports.deleteSize = async (req, res) => {
  try {
    const sizeId = req.params.id;

    const deletedSize = await size.findByIdAndDelete(sizeId);
    if (!deletedSize) {
      return res.status(404).json({ message: 'Size Not Found' });
    }

    res.json({ message: 'Size deleted successfully' });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
}