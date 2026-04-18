const mongoose = require('mongoose');

const ActivitySchema = new mongoose.Schema({
  activityType: {
    type: String,
    enum: {
      values: ['FERTILIZER', 'PESTICIDE', 'WEEDING', 'OTHER'],
      message: '{VALUE} is not a valid activity type'
    },
    required: [true, 'Activity type is required']
  },
  activityName: {
    type: String,
    required: [true, 'Activity name/description is required'],
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
});

const cropSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Crop must belong to a user']
  },
  cropName: {
    type: String,
    required: [true, 'Crop name is required'],
    trim: true
  },
  season: {
    type: String,
    enum: {
      values: ['Yala', 'Maha', 'Inter-season'],
      message: '{VALUE} is not a valid season'
    },
    required: [true, 'Season is required']
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
    required: [true, 'Field size is required']
  },
  seedVariety: {
    type: String,
    trim: true
  },
  yieldAmount: {
    type: Number,
    default: 0
  },
  incomeAmount: {
    type: Number,
    default: 0
  },
  activities: [ActivitySchema]
}, { timestamps: true });

module.exports = mongoose.model('Crop', cropSchema);
