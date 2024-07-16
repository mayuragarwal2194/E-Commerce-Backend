const mongoose = require('mongoose');

const parentCategorySchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    minlength: 3,
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

module.exports = mongoose.model('ParentCategory', parentCategorySchema);