// const mongoose = require('mongoose');

// const variantSchema = new mongoose.Schema({
//   sku: {
//     type: String,
//     required: true,
//     unique: true,
//   },
//   attributes: {
//     color: {
//       type: String,
//       required: true,
//     },
//     size: {
//       type: String,
//       required: true,
//     },
//   },
//   newPrice: {
//     type: Number,
//     required: true,
//   },
//   oldPrice: Number,
//   quantity: {
//     type: Number,
//     required: true
//   },
//    variantFeaturedImage: {
//     type: String,
//     default: '',
//   },
//   variantGalleryImages: {
//     type: [String],
//     default: []
//   }
// }, { timestamps: true });

// const productSchema = new mongoose.Schema({
//   id: {
//     type: Number,
//     unique: true,
//     required: true
//   },
//   itemName: {
//     type: String,
//     trim: true,
//     required: true
//   },
//   newPrice: {
//     type: Number,
//     required: true
//   },
//   oldPrice: Number,
//   isPopular: {
//     type: Boolean,
//     default: false
//   },
//   shortDescription: {
//     type: String,
//     required: true,
//     trim: true
//   },
//   fullDescription: {
//     type: String,
//     required: true,
//     trim: true
//   },
//   // variants: [variantSchema],
//   featuredImage: {
//     type: String,
//     default: '',
//   },
//    galleryImages: {
//     type: [String],
//     default: [],
//   },
//   stockStatus: {
//     type: String,
//     enum: ['In Stock', 'Out Of Stock'],
//     default: 'In Stock',
//   },
//   tag: {
//     type: String,
//     enum: ['best seller white', 'best seller black', 'new white', 'new black']
//   },
// }, { timestamps: true });


// // Pre-save middleware to update stock status
// // productSchema.pre('save', function (next) {
// //   this.stockStatus = this.variants.some(variant => variant.quantity > 0) ? 'In Stock' : 'Out Of Stock';
// //   next();
// // });

// module.exports = mongoose.model('Product', productSchema);

[
  {
    "attributes": {
      "color": "Black",
      "size": "M"
    },
    "sku": "1534",
    "newPrice": 4,
    "oldPrice": 515,
    "quantity": 0
  },
  {
    "attributes": {
      "color": "Red",
      "size": "M"
    },
    "sku": "1544",
    "newPrice": 451,
    "oldPrice": 1565,
    "quantity": 0
  }
]