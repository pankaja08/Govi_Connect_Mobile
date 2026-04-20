const express = require('express');
const router = express.Router();
const { createBlog, getMyBlogs, getAllBlogs, updateBlog, deleteBlog } = require('../controllers/blogController');
const { getBlogComments, addComment, toggleLikeComment, markCommentsAsRead } = require('../controllers/commentController');
const { protect } = require('../middleware/auth');

// ── Blog CRUD Routes ──────────────────────────────────────
// Route to get all blogs (Publicly available)
router.get('/', getAllBlogs);

// Route to create a new blog
router.post('/', protect, createBlog);

// Route to get blogs for the logged in expert
router.get('/me', protect, getMyBlogs);

// Route to update a specific blog
router.put('/:id', protect, updateBlog);

// Route to delete a specific blog
router.delete('/:id', protect, deleteBlog);

// ── Comment Routes ────────────────────────────────────────
// Fetch all comments for a blog (public)
router.get('/:id/comments', getBlogComments);

// Add a comment to a blog (must be logged in)
router.post('/:id/comments', protect, addComment);

// Mark all comments for a blog as read by expert
router.patch('/:id/comments/read', protect, markCommentsAsRead);

// Toggle like on a specific comment (must be logged in)
router.post('/:id/comments/:commentId/like', protect, toggleLikeComment);

module.exports = router;
