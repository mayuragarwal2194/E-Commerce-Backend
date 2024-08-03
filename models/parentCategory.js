const mongoose = require('mongoose');

const parentCategorySchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
    minlength: 3,
  },
  topCategory: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'TopCategory',
    required: true,
  },
  children: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'ChildCategory',
  }],
  isActive: {
    type: Boolean,
    default: true,
  },
  showInNavbar: {
    type: Boolean,
    default: true,
  },
}, { timestamps: true });

// Define compound index on name and topCategory
parentCategorySchema.index({ name: 1, topCategory: 1 }, { unique: true });

module.exports = mongoose.model('ParentCategory', parentCategorySchema);