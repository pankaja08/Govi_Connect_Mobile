const mongoose = require('mongoose');

const locationSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Location name is required'],
    enum: ['Dry Zone', 'Intermediate Zone', 'Wet Zone'],
    unique: true
  }
}, { timestamps: true });

module.exports = mongoose.model('Location', locationSchema);