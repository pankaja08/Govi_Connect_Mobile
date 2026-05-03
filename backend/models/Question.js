const mongoose = require('mongoose');

// ─── Embedded Answer Sub-Schema ─────────────────────────────────────────────
const answerSchema = new mongoose.Schema(
  {
    text: {
      type: String,
      required: [true, 'Answer text is required'],
      minlength: [5, 'Answer must be at least 5 characters'],
    },
    author: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    // Denormalised for fast reads (avoids extra populate per answer)
    authorName: { type: String, default: '' },
    authorRole: { type: String, default: 'User' },
  },
  { timestamps: true }
);

// ─── Question Schema ─────────────────────────────────────────────────────────
const questionSchema = new mongoose.Schema(
  {
    text: {
      type: String,
      required: [true, 'Question text is required'],
      minlength: [10, 'Question must be at least 10 characters'],
      trim: true,
    },
    category: {
      type: String,
      required: [true, 'Category is required'],
      enum: [
        'General Farming',
        'Pest & Disease Management',
        'Fertilizer Usage',
        'Crop Cultivation',
        'Weather & Irrigation',
        'Market Prices',
      ],
    },
    author: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    // Denormalised for fast reads
    authorName: { type: String, default: '' },
    authorRole: { type: String, default: 'User' },

    // Cloudinary image URLs
    images: [{ type: String }],

    // Embedded answers (both expert answers and community comments)
    answers: [answerSchema],
  },
  { timestamps: true }
);

// Full-text index for search
questionSchema.index({ text: 'text', category: 'text' });

module.exports = mongoose.model('Question', questionSchema);
