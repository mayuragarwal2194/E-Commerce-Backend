const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
  id: Number,
  image: String,
  itemName: String,
  new_price: Number,
  old_price: Number,
  category: String,
  isPopular: {
    type: Boolean,
    default: false
  }
});

const Product = mongoose.model('Product', productSchema);

module.exports = Product;
