const mongoose = require('mongoose');

const sizeSchema = new mongoose.Schema({
  sizeName: {
    type: String,
    required: true,
    lowercase: true // Automatically convert to lowercase
  },
  description: {
    type: String,
    default: ''
  }
},{ timestamps: true });

module.exports = mongoose.model('size', sizeSchema);