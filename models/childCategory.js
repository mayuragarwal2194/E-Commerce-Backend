const mongoose = require("mongoose");

const ChildCategorySchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
    minlength: 3
  },
  parents: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'ParentCategory',
  }],
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
ChildCategorySchema.index({ name: 1, parents: 1 }, { unique: true });

module.exports = mongoose.model('ChildCategory', ChildCategorySchema);