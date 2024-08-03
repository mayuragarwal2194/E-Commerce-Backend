const express = require('express');
const router = express.Router();
const { uploadNone } = require('../config/multerConfig');

const { getAllTopCategories, addTopCategory, getTopById, updateTopCategory, deleteTopCategory, getParentCategoriesByTopId } = require('../controllers/topCategoryController');

router.post('/', uploadNone, addTopCategory);
router.put('/:id',uploadNone, updateTopCategory);
router.get('/', getAllTopCategories);
router.get('/:id', getTopById);
router.delete('/:id', deleteTopCategory);

// New route to get child categories by parent category ID
router.get('/:id/children', getParentCategoriesByTopId);


module.exports = router;
