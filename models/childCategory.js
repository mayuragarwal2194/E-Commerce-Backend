const mongoose = require("mongoose");

const ChildCategorySchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
    minlength: 3
  },
  parent: {  // Changed from 'parents' to 'parent'
    type: mongoose.Schema.Types.ObjectId,
    ref: 'ParentCategory',
    required: true
  },
  products: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
  }],
  isActive: {
    type: Boolean,
    default: true,
  },
  showInNavbar: {
    type: Boolean,
    default: true,
  }
}, {timestamps: true});

// Compound index to ensure unique name within each parent
ChildCategorySchema.index({ name: 1, parent: 1 }, { unique: true });  // Changed 'parents' to 'parent'

module.exports = mongoose.model('ChildCategory', ChildCategorySchema);