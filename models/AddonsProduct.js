const mongoose = require('mongoose');
const AddonsProduct = new mongoose.Schema({
    name: { type: String, required: true },
    image: { type: String, required: true },
    price: { type: Number, required: true },
    tag: { type: String },
  }, { timestamps: true });

  module.exports = mongoose.model('AddonsProduct', AddonsProduct);