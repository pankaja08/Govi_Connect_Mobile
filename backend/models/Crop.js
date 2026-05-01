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
    // Note: main branch uses 'createdBy', but current branch uses 'user'. 
    // Setting required to false to avoid breaking creation on merge.
    required: false
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
    required: [false, 'Season is required'] // Made false to avoid breaking main controllers
  },
  plantedDate: {
    type: Date,
    required: [false, 'Planted date is required'] // Made false to avoid breaking main controllers
  },
  harvestExpectedDate: {
    type: Date,
    required: [false, 'Expected harvest date is required'] // Made false to avoid breaking main controllers
  },
  fieldSize: {
    type: Number,
    required: [false, 'Field size is required'] // Made false to avoid breaking main controllers
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
  activities: [ActivitySchema],
  careInstructions: {
    type: String,
    required: [false, 'Care instructions are required'], // Made false to avoid breaking HEAD controllers
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
    required: false
  }],
  seasons: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Season',
    required: false
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
    required: false // Made false to avoid breaking HEAD controllers
  }
}, { timestamps: true });

module.exports = mongoose.model('Crop', cropSchema);
