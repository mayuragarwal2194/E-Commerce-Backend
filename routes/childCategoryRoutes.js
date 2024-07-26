const express = require('express');
const ChildCategory = require('../models/childCategory');
const ParentCategory = require('../models/parentCategory');
const router = express.Router();
const { uploadNone } = require('../config/multerConfig'); // Import the multer configuration
const { getAllChildCategories, getChildById, deleteChildCategory, addChildCategory, updateChildCategory } = require('../controllers/childCategoryController');

router.post('/add', uploadNone, addChildCategory);
router.put('/:id',uploadNone, updateChildCategory);
router.get('/', getAllChildCategories);
router.get('/:id', getChildById);
router.delete('/:id', deleteChildCategory);


module.exports = router;