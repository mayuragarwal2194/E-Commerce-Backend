const Product = require('../models/product');
const childCategory = require('../models/childCategory');
const ParentCategory = require('../models/parentCategory');
const Size = require('../models/size');
const fs = require('fs');
const path = require('path');

// Add a product
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
      variants, // JSON string from frontend
      category
    } = req.body;

    // Check if a product with the given id already exists
    const existingProduct = await Product.findOne({ id });
    if (existingProduct) {
      return res.status(400).json({ message: 'Product with this id already exists.' });
    }

    // Collect gallery image filenames
    const featuredImage = req.files.find(file => file.fieldname === 'featuredImage')?.filename || null;
    const galleryImages = req.files.filter(file => file.fieldname === 'galleryImages').map(file => file.filename) || [];

    // Parse variants data from JSON string
    const parsedVariants = await Promise.all(JSON.parse(variants).map(async (variant, index) => {
      const variantFeaturedImageKey = `variantFeaturedImage${index}`;
      const variantGalleryImagesKey = `variantGalleryImages${index}`;
      const variantFeaturedImage = req.files.find(file => file.fieldname === variantFeaturedImageKey)?.filename || null;
      const variantGalleryImages = req.files.filter(file => file.fieldname === variantGalleryImagesKey).map(file => file.filename) || [];

      // Convert size names to size IDs
      let sizeIds = [];
      if (variant.attributes && variant.attributes.size) {
        const sizeArray = Array.isArray(variant.attributes.size) ? variant.attributes.size : [variant.attributes.size];
        sizeIds = await Promise.all(
          sizeArray.map(async sizeName => {
            console.log(`Looking up size: ${sizeName.toLowerCase()}`);
            const sizeDoc = await Size.findOne({ sizeName: sizeName.toLowerCase() });
            console.log(`Found sizeDoc for ${sizeName}:`, sizeDoc);
            return sizeDoc ? sizeDoc._id : null;
          })
        );
        sizeIds = sizeIds.filter(id => id !== null); // Remove any null values
        console.log(`Size IDs for variant ${index}:`, sizeIds);
      }

      return { ...variant, variantFeaturedImage, variantGalleryImages, attributes: { ...variant.attributes, size: sizeIds } };
    }));

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
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Get all Products
const getAllProducts = async (req, res) => {
  try {
    const products = await Product.find().populate('category');
    res.json(products);
  } catch (error) {
    console.error('Error in getAllProducts:', error);
    res.status(500).json({ message: 'Failed to fetch products' });
  }
};

// Get product by id
const getProductById = async (req, res) => {
  try {
    const productId = req.params.id;
    const product = await Product.findById(productId).populate('category');
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }
    res.json(product);
  } catch (error) {
    console.error('Error in getProductById:', error);
    res.status(500).json({ message: 'Failed to fetch product details' });
  }
};

// Helper function to delete files from a directory
const deleteFiles = (files, dir) => {
  files.forEach(file => {
    const filePath = path.join(__dirname, '../uploads', dir, file);
    fs.unlink(filePath, (err) => {
      if (err) {
        console.error(`Error deleting file ${filePath}:`, err);
      } else {
        console.log(`Deleted file ${filePath}`);
      }
    });
  });
};

const deleteProduct = async (req, res) => {
  try {
    const productId = req.params.id;

    // Find the product to be deleted
    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({ message: 'Product with this ID not found' });
    }

    // Delete the product
    const deletedProduct = await Product.findByIdAndDelete(productId);
    if (!deletedProduct) {
      return res.status(404).json({ message: 'Product with this ID not found' });
    }

    // Remove product reference from associated child categories
    await childCategory.updateMany(
      { products: productId },
      { $pull: { products: productId } }
    );

    // Delete the featured image if it exists
    if (deletedProduct.featuredImage) {
      deleteFiles([deletedProduct.featuredImage], 'featured');
    }

    // Delete the gallery images if they exist
    if (deletedProduct.galleryImages.length > 0) {
      deleteFiles(deletedProduct.galleryImages, 'gallery');
    }

    // Delete variant images if they exist
    if (deletedProduct.variants.length > 0) {
      deletedProduct.variants.forEach(variant => {
        if (variant.variantFeaturedImage) {
          deleteFiles([variant.variantFeaturedImage], 'variants/featured');
        }
        if (variant.variantGalleryImages.length > 0) {
          deleteFiles(variant.variantGalleryImages, 'variants/gallery');
        }
      });
    }

    res.json({ message: 'Product deleted successfully' });
  } catch (error) {
    console.error('Error in deleteProduct:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Get all products by parent category id
const getProductsByCategory = async (req, res) => {
  try {
    const parentCategoryId = req.params.categoryId;

    // Find child categories for the given parent category
    const childCategories = await childCategory.find({ parents: parentCategoryId });

    if (!childCategories.length) {
      return res.status(404).json({ message: 'No child categories found for this parent category' });
    }

    // Extract child category IDs
    const childCategoryIds = childCategories.map(child => child._id);

    // Find products associated with the child categories
    const products = await Product.find({ category: { $in: childCategoryIds } });

    res.json(products);
  } catch (error) {
    console.error('Error fetching products by category:', error);
    res.status(500).json({ message: 'Failed to fetch products' });
  }
};


module.exports = {
  addProduct,
  getAllProducts,
  getProductById,
  // addVariant,
  deleteProduct,
  getProductsByCategory
};