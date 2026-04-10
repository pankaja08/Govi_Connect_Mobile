const mongoose = require('mongoose');

const soilTypeSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Soil type name is required'],
    enum: ['Clay', 'Loamy', 'Sandy', 'Silty'],
    unique: true
  }
}, { timestamps: true });

module.exports = mongoose.model('SoilType', soilTypeSchema);