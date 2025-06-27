const mongoose = require('mongoose');

const sizeSchema = new mongoose.Schema({
  size: { type: String, required: true },
  price: { type: Number, required: true },
  price_adjustment: { type: Number, required: true }
}, { _id: false });

const cakeSchema = new mongoose.Schema({
  name: { type: String, required: true },
  flavor: { type: String },
  price: { type: Number, required: true },
  original_price: { type: Number },  // optional
  image: { type: String, required: true },
  rating: { type: Number, default: 0 },
  reviews: { type: Number },  // total review count as in your example
  description: { type: String },
  label: { type: String },
  tag: { type: String },
  sizes: [sizeSchema],
  product_details: [String]  // array of strings like "Cake Flavour: Red Velvet"
}, { timestamps: true });

module.exports = mongoose.model('Cake', cakeSchema);
