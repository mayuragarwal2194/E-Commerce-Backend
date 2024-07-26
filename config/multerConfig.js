const multer = require('multer');
const path = require('path');
const { v4: uuidv4 } = require('uuid');

// Set storage engine
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    if (file.fieldname === 'featuredImage') {
      cb(null, 'uploads/featured');
    } else if (file.fieldname === 'galleryImages') {
      cb(null, 'uploads/gallery');
    } else if (file.fieldname.startsWith('variantFeaturedImage')) {
      cb(null, 'uploads/variants/featured');
    } else if (file.fieldname.startsWith('variantGalleryImages')) {
      cb(null, 'uploads/variants/gallery');
    } else {
      cb(new Error('Unexpected field'));
    }
  },
  filename: function (req, file, cb) {
    const uniqueName = `${uuidv4()}${path.extname(file.originalname)}`;
    cb(null, uniqueName);
  }
});

// Initialize upload
const uploadMiddleware = multer({
  storage: storage,
  limits: { fileSize: 1024 * 1024 * 5 }, // Limit file size to 5MB
  fileFilter: function (req, file, cb) {
    checkFileType(file, cb);
  }
}).any(); // Accept any field names

// Check file type
function checkFileType(file, cb) {
  // Allowed file types
  const filetypes = /jpeg|jpg|png|webp|gif/;
  // Check the file extension
  const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
  // Check the MIME type
  const mimetype = filetypes.test(file.mimetype);

  if (mimetype && extname) {
    return cb(null, true);
  } else {
    cb('Error: Images Only!');
  }
}

// Middleware to handle form-data without files
const uploadNone = multer().none();

// Error handling middleware
const handleMulterError = (err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    return res.status(400).json({ error: 'Multer error: ' + err.message });
  } else if (err) {
    return res.status(500).json({ error: 'Server error: ' + err.message });
  }
  next();
};

module.exports = {
  uploadMiddleware,
  uploadNone,
  handleMulterError
};