const express = require('express');
const router = express.Router();

const {
  getQuestions,
  createQuestion,
  updateQuestion,
  deleteQuestion,
  addAnswer,
  updateAnswer,
  deleteAnswer,
  uploadImages,
} = require('../controllers/forumController');

const { protect } = require('../middleware/auth');

// ── Question Routes ──────────────────────────────────────────────────────────

// GET  /api/forum  – public feed (also works when authenticated for myQuestions)
router.get('/', protect, getQuestions);

// POST /api/forum  – create question with optional image uploads (multer first)
router.post('/', protect, uploadImages, createQuestion);

// PATCH /api/forum/:id  – edit own question (text & category only)
router.patch('/:id', protect, updateQuestion);

// DELETE /api/forum/:id  – delete own question
router.delete('/:id', protect, deleteQuestion);

// ── Answer Routes ────────────────────────────────────────────────────────────

// POST /api/forum/:id/answers  – add an answer (any user or expert)
router.post('/:id/answers', protect, addAnswer);

// PATCH /api/forum/:id/answers/:answerId  – edit own answer
router.patch('/:id/answers/:answerId', protect, updateAnswer);

// DELETE /api/forum/:id/answers/:answerId  – delete own answer
router.delete('/:id/answers/:answerId', protect, deleteAnswer);

module.exports = router;
