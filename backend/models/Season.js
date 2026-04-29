const mongoose = require('mongoose');

const seasonSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Season name is required'],
    enum: ['Maha', 'Yala'],
    unique: true
  }
}, { timestamps: true });

module.exports = mongoose.model('Season', seasonSchema);