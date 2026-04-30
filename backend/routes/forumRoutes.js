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
  editAnswer,
  deleteAnswer
} = require('../controllers/forumController');

const upload = require('../middleware/upload');

// Public routes
router.get('/common', getCommonQuestions);
router.get('/', protect, getQuestions);

// Protected routes
router.post('/', protect, upload.array('images', 5), createQuestion);
router.post('/:questionId/answers', protect, addAnswer);
router.patch('/:questionId/answers/:answerId', protect, editAnswer);
router.delete('/:questionId/answers/:answerId', protect, deleteAnswer);
router.delete('/:questionId', protect, deleteQuestion);
router.patch('/:questionId', protect, editQuestion);

module.exports = router;
