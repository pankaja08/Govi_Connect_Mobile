const express = require('express');
const router = express.Router();
const { createBlog, getMyBlogs, getAllBlogs, updateBlog, deleteBlog } = require('../controllers/blogController');
const { protect } = require('../middleware/auth');

// Route to get all blogs
router.get('/', protect, getAllBlogs);

// Route to create a new blog
// Requires the user to be authenticated
router.post('/', protect, createBlog);

// Route to get blogs for the logged in expert
router.get('/me', protect, getMyBlogs);

// Route to update a specific blog
router.put('/:id', protect, updateBlog);

// Route to delete a specific blog
router.delete('/:id', protect, deleteBlog);

module.exports = router;
