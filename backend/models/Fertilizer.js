const mongoose = require('mongoose');

const fertilizerSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Fertilizer name is required'],
    trim: true
  },
  description: {
    type: String,
    trim: true
  }
}, { timestamps: true });

module.exports = mongoose.model('Fertilizer', fertilizerSchema);