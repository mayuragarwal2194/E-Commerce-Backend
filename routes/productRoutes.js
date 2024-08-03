const express = require('express');
const router = express.Router();
const { 
  addProduct, 
  getAllProducts, 
  getProductById, 
  deleteProduct, 
  getProductsByCategory, 
  updateProduct
} = require('../controllers/productController');
const { uploadMiddleware,handleMulterError } = require('../config/multerConfig');

router.post('/add',uploadMiddleware,handleMulterError, addProduct);
router.get('/', getAllProducts);
router.get('/:id', getProductById);
router.delete('/:id', deleteProduct);
router.put('/:id',uploadMiddleware, handleMulterError, updateProduct);

// New route to get products by category
router.get('/category/:categoryId', getProductsByCategory);

module.exports = router;