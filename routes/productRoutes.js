const express = require('express');
const multer = require('multer');
const Product = require('../models/product');
const router = express.Router();

// Multer configuration
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/');
  },
  filename: (req, file, cb) => {
    cb(null, `${Date.now()}-${file.originalname}`);
  },
});

const upload = multer({ storage });

// Get all products
router.get('/', async (req, res) => {
  try {
    const products = await Product.find();
    res.json(products);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get single product
router.get('/:id', async (req, res) => {
  try {
    const productId = req.params.id;
    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }
    res.json(product);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Create a new product
router.post('/', upload.single('image'), async (req, res) => {
  const newProduct = new Product({
    id: req.body.id,
    image: req.file ? `/uploads/${req.file.filename}` : '',
    itemName: req.body.itemName,
    new_price: req.body.new_price,
    old_price: req.body.old_price,
    category: req.body.category,
    isPopular: req.body.isPopular === 'true', // Ensure it's a boolean
  });

  try {
    const savedProduct = await newProduct.save();
    res.status(201).json(savedProduct);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Update a product
router.put('/:id', upload.single('image'), async (req, res) => {
  const productId = req.params.id;

  try {
    let updatedProduct = {
      id: req.body.id,
      itemName: req.body.itemName,
      new_price: req.body.new_price,
      old_price: req.body.old_price,
      category: req.body.category,
      isPopular: req.body.isPopular === 'true',
    };

    if (req.file) {
      updatedProduct.image = `/uploads/${req.file.filename}`;
    }

    const product = await Product.findByIdAndUpdate(productId, updatedProduct, { new: true });
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    res.json(product);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Delete a product
router.delete('/:id', async (req, res) => {
  const productId = req.params.id;

  try {
    const product = await Product.findByIdAndDelete(productId);
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    res.json({ message: 'Product deleted successfully' });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

module.exports = router;