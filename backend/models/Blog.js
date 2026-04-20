const mongoose = require('mongoose');

const blogSchema = new mongoose.Schema({
  expertId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  title: {
    type: String,
    required: [true, 'Title is required'],
    minlength: [5, 'Title must be at least 5 characters long']
  },
  content: {
    type: String,
    required: [true, 'Blog content is required'],
    validate: {
      validator: function(v) {
        // Very basic length validation ensuring minimum length of HTML structure + content
        // Frontend handles stricter text-only length parsing
        return v && v.length >= 200;
      },
      message: 'Blog content must be at least 200 characters long'
    }
  },
  location: {
    type: String,
    required: [true, 'Location is required']
  },
  season: {
    type: String,
    required: [true, 'Season is required']
  },
  cropType: {
    type: String,
    required: [true, 'Crop Type is required']
  },
  farmingMethod: {
    type: String,
    required: [true, 'Farming Method is required']
  },
  imageUrl: {
    type: String,
    required: [true, 'Cover image URL is required']
  },
  likes: {
    type: Number,
    default: 0
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Blog', blogSchema);
