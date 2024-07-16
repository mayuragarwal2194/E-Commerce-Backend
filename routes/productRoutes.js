const express = require('express');
const router = express.Router();
const { addProduct, getAllProducts, getProductById } = require('../controllers/productController');
const { uploadMiddleware,handleMulterError } = require('../config/multerConfig');

router.post('/add',uploadMiddleware,handleMulterError, addProduct);
router.get('/', getAllProducts);
router.get('/:id', getProductById);

module.exports = router;