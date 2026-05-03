const mongoose = require('mongoose');

// --- Embedded Activity Sub-Schema ---
const farmActivitySchema = new mongoose.Schema({
  activityType: {
    type: String,
    enum: ['FERTILIZER', 'PESTICIDE', 'WEEDING', 'OTHER'],
    required: [true, 'Activity type is required'],
    default: 'FERTILIZER'
  },
  activityName: {
    type: String,
    required: [true, 'Activity description is required'],
    trim: true
  },
  activityDate: {
    type: Date,
    required: [true, 'Activity date is required'],
    default: Date.now
  },
  isCompleted: {
    type: Boolean,
    default: false
  }
}, { timestamps: true });

// --- Main FarmCrop Schema ---
const farmCropSchema = new mongoose.Schema({
  farmer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'A crop log must belong to a farmer']
  },
  cropName: {
    type: String,
    required: [true, 'Crop name is required'],
    trim: true
  },
  season: {
    type: String,
    enum: ['Yala', 'Maha', 'Inter-season'],
    required: [true, 'Season is required'],
    default: 'Yala'
  },
  plantedDate: {
    type: Date,
    required: [true, 'Planted date is required']
  },
  harvestExpectedDate: {
    type: Date,
    required: [true, 'Expected harvest date is required']
  },
  fieldSize: {
    type: Number,
    required: [true, 'Field size is required'],
    min: [0.01, 'Field size must be greater than 0']
  },
  seedVariety: {
    type: String,
    trim: true,
    default: ''
  },
  yieldAmount: {
    type: Number,
    default: 0,
    min: [0, 'Yield cannot be negative']
  },
  incomeAmount: {
    type: Number,
    default: 0,
    min: [0, 'Income cannot be negative']
  },
  activities: [farmActivitySchema]
}, { timestamps: true, collection: 'crop_logs' });

// Index for efficient per-farmer queries
farmCropSchema.index({ farmer: 1, createdAt: -1 });

module.exports = mongoose.model('FarmCrop', farmCropSchema);
