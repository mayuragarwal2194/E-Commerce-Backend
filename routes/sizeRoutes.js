const express = require('express');
const router = express.Router();
const { getAllSizes, getSizeById, addSize } = require('../controllers/sizeController');
const { uploadNone } = require('../config/multerConfig');


router.get('/', getAllSizes);
router.get('/:id', getSizeById);
router.post('/add', uploadNone ,addSize);

module.exports = router;
