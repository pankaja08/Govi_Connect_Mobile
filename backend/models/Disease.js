const mongoose = require('mongoose');

const diseaseSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Disease name is required'],
    trim: true
  },
  symptoms: {
    type: String,
    trim: true
  },
  treatment: {
    type: String,
    trim: true
  }
}, { timestamps: true });

module.exports = mongoose.model('Disease', diseaseSchema);