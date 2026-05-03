const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true
    },
    senderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    blogId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Blog',
      default: null
    },
    commentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Comment',
      default: null
    },
    questionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Question',
      default: null
    },
    productId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product',
      default: null
    },
    type: {
      type: String,
      enum: ['expert_reply', 'product_approval', 'forum_reply'],
      default: 'expert_reply'
    },
    title: {
      type: String,
      required: true
    },
    message: {
      type: String,
      required: true
    },
    isRead: {
      type: Boolean,
      default: false
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model('Notification', notificationSchema);
