const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const {
  getQuestions,
  createQuestion,
  addAnswer,
  deleteQuestion,
  editQuestion,
  getCommonQuestions,
} = require('../controllers/forumController');

// Public routes
router.get('/common', getCommonQuestions);
router.get('/', protect, getQuestions);

// Protected routes
router.post('/', protect, createQuestion);
router.post('/:questionId/answers', protect, addAnswer);
router.delete('/:questionId', protect, deleteQuestion);
router.patch('/:questionId', protect, editQuestion);

module.exports = router;
