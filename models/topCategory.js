const mongoose = require("mongoose");

const topCategorySchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
    minlength: 3
  },
  children: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'ParentCategory',
  }],
  isActive: {
    type: Boolean,
    default: true,
  },
  showInNavbar: {
    type: Boolean,
    default: true,
  }, 
}, {timestamps: true});

module.exports = mongoose.model('TopCategory', topCategorySchema);