const mongoose = require('mongoose');

const cropSchema = new mongoose.Schema({
  cropName: {
    type: String,
    required: [true, 'Crop name is required'],
    trim: true
  },
  careInstructions: {
    type: String,
    required: [true, 'Care instructions are required'],
    trim: true
  },
  imageUrl: {
    type: String,
    trim: true,
    default: ''
  },
  locations: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Location',
    required: true
  }],
  seasons: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Season',
    required: true
  }],
  soilTypes: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'SoilType'
  }],
  fertilizers: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Fertilizer'
  }],
  diseases: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Disease'
  }],
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }
}, { timestamps: true });

module.exports = mongoose.model('Crop', cropSchema);