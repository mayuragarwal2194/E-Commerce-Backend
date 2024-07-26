const express = require('express');
const router = express.Router();
const { 
  getAllParentCategories, 
  getParentById, 
  addParentcategory, 
  updateParentcCategory, 
  deleteParentCategory, 
  getChildCategoriesByParentId 
} = require('../controllers/parentCategoryController');


router.post('/add', addParentcategory);
router.put('/:id', updateParentcCategory);
router.get('/', getAllParentCategories);
router.get('/:id', getParentById);
router.delete('/:id', deleteParentCategory);

// New route to get child categories by parent category ID
router.get('/:id/children', getChildCategoriesByParentId);

module.exports = router;