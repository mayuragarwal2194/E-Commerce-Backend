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
            // console.log(`Looking up size: ${sizeName.toLowerCase()}`);
            const sizeDoc = await Size.findOne({ sizeName: sizeName.toLowerCase() });
            // console.log(`Found sizeDoc for ${sizeName}:`, sizeDoc);
            return sizeDoc ? sizeDoc._id : null;
          })
        );
        sizeIds = sizeIds.filter(id => id !== null); // Remove any null values
        // console.log(`Size IDs for variant ${index}:`, sizeIds);
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

// Update Product
const updateProduct = async (req, res) => {
  try {
    // console.log('Request body:', req.body);
    // console.log('Request files:', req.files);

    const productId = req.params.id;
    const {
      itemName,
      newPrice,
      oldPrice,
      isPopular,
      shortDescription,
      fullDescription,
      stockStatus,
      tag,
      category,
      variants
    } = req.body;

    // console.log('Product ID:', productId);

    // Find the existing product
    const existingProduct = await Product.findById(productId);
    if (!existingProduct) {
      return res.status(404).json({ message: 'Product not found' });
    }

    // console.log('Existing product:', existingProduct);

    // Handle image uploads
    const featuredImage = req.files?.find(file => file.fieldname === 'featuredImage')?.filename || existingProduct.featuredImage;
    const newGalleryImages = req.files?.filter(file => file.fieldname === 'galleryImages').map(file => file.filename) || existingProduct.galleryImages;

    // console.log('Featured image:', featuredImage);
    // console.log('New gallery images:', newGalleryImages);

    // Update fields conditionally
    if (itemName !== undefined) existingProduct.itemName = itemName;
    if (newPrice !== undefined) existingProduct.newPrice = newPrice;
    if (oldPrice !== undefined) existingProduct.oldPrice = oldPrice;
    if (isPopular !== undefined) existingProduct.isPopular = isPopular;
    if (shortDescription !== undefined) existingProduct.shortDescription = shortDescription;
    if (fullDescription !== undefined) existingProduct.fullDescription = fullDescription;
    if (stockStatus !== undefined) existingProduct.stockStatus = stockStatus;
    if (tag !== undefined) existingProduct.tag = tag;

    if (category !== undefined) {
      // console.log('Existing category:', existingProduct.category.toString());
      // console.log('New category:', category);

      // Check if category has changed
      if (existingProduct.category.toString() !== category) {
        // console.log('Category has changed. Updating child categories.');

        // Remove product ID from the old category's products array
        await childCategory.findByIdAndUpdate(existingProduct.category, { $pull: { products: existingProduct._id } });
        // console.log(`Removed product ID from old category: ${existingProduct.category}`);

        // Add product ID to the new category's products array
        await childCategory.findByIdAndUpdate(category, { $push: { products: existingProduct._id } });
        // console.log(`Added product ID to new category: ${category}`);

        existingProduct.category = category;
      }
    }

    if (req.files) existingProduct.featuredImage = featuredImage;
    if (req.files) existingProduct.galleryImages = newGalleryImages;

    // Update variants if provided
    if (variants !== undefined) {
      let parsedVariants;
      try {
        parsedVariants = JSON.parse(variants);
      } catch (parseError) {
        console.error('Error parsing variants JSON:', parseError);
        return res.status(400).json({ message: 'Invalid variants JSON format', error: parseError.message });
      }

      // console.log('Parsed variants:', parsedVariants);

      const updatedVariants = await Promise.all(parsedVariants.map(async (variant, index) => {
        const variantFeaturedImageKey = `variantFeaturedImage${index}`;
        const variantGalleryImagesKey = `variantGalleryImages${index}`;
        const variantFeaturedImage = req.files?.find(file => file.fieldname === variantFeaturedImageKey)?.filename || variant.variantFeaturedImage;
        const variantGalleryImages = req.files?.filter(file => file.fieldname === variantGalleryImagesKey).map(file => file.filename) || variant.variantGalleryImages;

        // console.log(`Variant ${index} featured image:`, variantFeaturedImage);
        // console.log(`Variant ${index} gallery images:`, variantGalleryImages);

        let sizeIds = [];
        if (variant.attributes?.size) {
          const sizeArray = Array.isArray(variant.attributes.size) ? variant.attributes.size : [variant.attributes.size];
          sizeIds = await Promise.all(sizeArray.map(async sizeName => {
            const sizeDoc = await Size.findOne({ sizeName: sizeName.toLowerCase() });
            return sizeDoc ? sizeDoc._id : null;
          }));
          sizeIds = sizeIds.filter(id => id !== null);
        }

        // console.log(`Variant ${index} size IDs:`, sizeIds);

        return { ...variant, variantFeaturedImage, variantGalleryImages, attributes: { ...variant.attributes, size: sizeIds } };
      }));

      existingProduct.variants = updatedVariants;
    }

    // console.log('Updated product:', existingProduct);

    await existingProduct.save();

    res.status(200).json({ message: 'Product updated successfully', product: existingProduct });
  } catch (error) {
    console.error('Error in updateProduct:', error);
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
        // console.log(`Deleted file ${filePath}`);
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
    const topCategoryId = req.params.categoryId;
    console.log('Top Category ID:', topCategoryId);

    // Find parent categories for the given top category
    const parentCategories = await ParentCategory.find({ topCategory: topCategoryId });
    console.log('Parent Categories:', parentCategories);

    if (!parentCategories.length) {
      return res.status(404).json({ message: 'No parent categories found for this top category' });
    }

    // Extract parent category IDs
    const parentCategoryIds = parentCategories.map(parent => parent._id);
    console.log('Parent Category IDs:', parentCategoryIds);

    // Find child categories for the given parent categories
    const childCategories = await childCategory.find({ parent: { $in: parentCategoryIds } });
    console.log('Child Categories:', childCategories);

    if (!childCategories.length) {
      return res.status(404).json({ message: 'No child categories found for these parent categories' });
    }

    // Extract child category IDs
    const childCategoryIds = childCategories.map(child => child._id);
    console.log('Child Category IDs:', childCategoryIds);

    // Find products associated with the child categories
    const products = await Product.find({ category: { $in: childCategoryIds } });
    console.log('Products:', products);

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
  getProductsByCategory,
  updateProduct
};