const Product = require('../models/product');
const childCategory = require('../models/childCategory');

const addProduct = async (req, res) => {
  try {
    const {
      id,
      itemName,
      newPrice,
      oldPrice,
      isPopular,
      shortDescription,
      fullDescription,
      stockStatus,
      tag,
      variants, // Added variants to the request body
      category
    } = req.body;

    // Check if a product with the given id already exists
    const existingProduct = await Product.findOne({ id });
    if (existingProduct) {
      return res.status(400).json({ message: 'Product with this id already exists.' });
    }

    // Collect gallery image filenames
    const featuredImage = req.files['featuredImage'] ? req.files['featuredImage'][0].filename : null;
    const galleryImages = req.files['galleryImages'] ? req.files['galleryImages'].map(file => file.filename) : [];

    const parsedVariants = JSON.parse(variants);

    // Create and save the new product
    const newProduct = new Product({
      id,
      itemName,
      newPrice,
      oldPrice,
      isPopular,
      shortDescription,
      fullDescription,
      featuredImage,
      galleryImages,
      stockStatus,
      tag,
      variants: parsedVariants, // Include variants when creating the product
      category
    });
    await newProduct.save();

    // Add the new product ID to the products array of the child category
    await childCategory.findByIdAndUpdate(category, { $push: { products: newProduct._id } });

    res.status(201).json({ message: 'Product added successfully', product: newProduct });
  } catch (error) {
    console.error('Error in addProduct:', error);
    res.status(500).json({ message: 'Server error', error });
  }
};

// Add a variant to an existing product
const addVariant = async (req, res) => {
  try {
    const { productId, sku, newPrice, oldPrice, quantity, attributes } = req.body;

    // Find the product by ID
    const product = await Product.findById(productId);

    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    // Create a new variant
    const newVariant = {
      sku,
      newPrice,
      oldPrice,
      quantity,
      attributes
    };

    // Add the new variant to the product's variants array
    product.variants.push(newVariant);

    // Save the updated product
    await product.save();

    res.status(200).json({
      message: 'Variant added successfully',
      product,
    });
  } catch (error) {
    console.error('Error in addVariant:', error);
    res.status(500).json({
      message: 'Error adding variant',
      error: error.message,
    });
  }
};

const getAllProducts = async (req, res) => {
  try {
    const products = await Product.find();
    res.json(products);
  } catch (error) {
    console.error('Error in getAllProducts:', error);
    res.status(500).json({ message: 'Failed to fetch products' });
  }
};

const getProductById = async (req, res) => {
  try {
    const productId = req.params.id;
    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }
    res.json(product);
  } catch (error) {
    console.error('Error in getProductById:', error);
    res.status(500).json({ message: 'Failed to fetch product details' });
  }
};

module.exports = {
  addProduct,
  getAllProducts,
  getProductById,
  addVariant,
};