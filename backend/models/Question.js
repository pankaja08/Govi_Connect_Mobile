const mongoose = require('mongoose');

const answerSchema = new mongoose.Schema({
  text: { type: String, required: true, minlength: 5, maxlength: 5000 },
  author: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  authorName: { type: String },
  authorRole: { type: String },
  createdAt: { type: Date, default: Date.now }
});

const questionSchema = new mongoose.Schema({
  text: {
    type: String,
    required: [true, 'Question text is required'],
    minlength: [10, 'Question must be at least 10 characters'],
    maxlength: [500, 'Question cannot exceed 500 characters'],
    trim: true
  },
  category: {
    type: String,
    required: [true, 'Category is required'],
    enum: ['General Farming', 'Pest & Disease Management', 'Fertilizer Usage', 'Crop Cultivation', 'Weather & Irrigation', 'Market Prices'],
  },
  author: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  authorName: { type: String },
  authorRole: { type: String, default: 'User' },
  images: [{ type: String }],
  answers: [answerSchema],
  answerCount: { type: Number, default: 0 }
}, { timestamps: true });

// Keep answerCount in sync
questionSchema.pre('save', function (next) {
  this.answerCount = this.answers.length;
  next();
});

module.exports = mongoose.model('Question', questionSchema);
