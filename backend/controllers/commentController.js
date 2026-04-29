const Comment = require('../models/Comment');
const Blog = require('../models/Blog');
const Notification = require('../models/Notification');

// ───────────────────────────────────────────────
// GET /api/blogs/:id/comments
// Fetch all comments for a blog (public)
// ───────────────────────────────────────────────
exports.getBlogComments = async (req, res) => {
  try {
    const { id: blogId } = req.params;

    const comments = await Comment.find({ blogId })
      .populate('userId', 'name username')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: comments.length,
      data: comments
    });
  } catch (error) {
    console.error('Error fetching comments:', error);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};

// ───────────────────────────────────────────────
// POST /api/blogs/:id/comments
// Add a comment to a blog (registered users only)
// ───────────────────────────────────────────────
exports.addComment = async (req, res) => {
  try {
    const { id: blogId } = req.params;
    const { content, parentId } = req.body;

    if (!content || content.trim() === '') {
      return res.status(400).json({ success: false, message: 'Comment content is required' });
    }

    // Verify blog exists
    const blog = await Blog.findById(blogId);
    if (!blog) {
      return res.status(404).json({ success: false, message: 'Blog not found' });
    }

    // Expert adding their own comment/reply doesn't need to 'read' it
    const isOwner = blog.expertId.toString() === req.user._id.toString();

    const comment = await Comment.create({
      blogId,
      userId: req.user._id,
      content: content.trim(),
      likes: [],
      parentId: parentId || null,
      isReadByExpert: isOwner
    });

    // Populate user info before returning
    const populated = await Comment.findById(comment._id).populate('userId', 'name username');

    // ── Notification: expert replied to a user's comment ──────────────────
    // Only create a notification if:
    // 1. This is a reply (has a parentId)
    // 2. The person replying is the blog's expert
    if (parentId && isOwner) {
      const parentComment = await Comment.findById(parentId);
      // Only notify if the parent comment belongs to a DIFFERENT user (not the expert themselves)
      if (parentComment && parentComment.userId.toString() !== req.user._id.toString()) {
        await Notification.create({
          userId: parentComment.userId,        // Recipient: the user who wrote the original comment
          senderId: req.user._id,              // Sender: the expert
          blogId: blog._id,
          commentId: comment._id,
          type: 'expert_reply',
          title: '💬 Expert Replied to Your Comment',
          message: `An expert replied to your comment on "${blog.title}": "${content.trim().substring(0, 80)}${content.trim().length > 80 ? '...' : ''}"`
        });
      }
    }
    // ──────────────────────────────────────────────────────────────────────

    res.status(201).json({
      success: true,
      data: populated
    });
  } catch (error) {
    console.error('Error adding comment:', error);
    res.status(500).json({ success: false, message: error.message || 'Server Error' });
  }
};

// ───────────────────────────────────────────────
// PATCH /api/blogs/:id/comments/read
// Mark all comments on a blog as read (expert only)
// ───────────────────────────────────────────────
exports.markCommentsAsRead = async (req, res) => {
  try {
    const { id: blogId } = req.params;

    // Verify blog and ownership
    const blog = await Blog.findById(blogId);
    if (!blog) {
      return res.status(404).json({ success: false, message: 'Blog not found' });
    }

    if (blog.expertId.toString() !== req.user._id.toString() && req.user.role !== 'Admin') {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }

    await Comment.updateMany(
      { blogId, isReadByExpert: false },
      { isReadByExpert: true }
    );

    res.status(200).json({
      success: true,
      message: 'Comments marked as read'
    });
  } catch (error) {
    console.error('Error marking comments as read:', error);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};

// ───────────────────────────────────────────────
// POST /api/blogs/:id/comments/:commentId/like
// Toggle like on a comment (registered users only)
// ───────────────────────────────────────────────
exports.toggleLikeComment = async (req, res) => {
  try {
    const { commentId } = req.params;
    const userId = req.user._id;

    const comment = await Comment.findById(commentId);
    if (!comment) {
      return res.status(404).json({ success: false, message: 'Comment not found' });
    }

    const likeIndex = comment.likes.findIndex(id => id.toString() === userId.toString());

    if (likeIndex === -1) {
      // Not yet liked → add like
      comment.likes.push(userId);
    } else {
      // Already liked → remove like (toggle off)
      comment.likes.splice(likeIndex, 1);
    }

    await comment.save();

    res.status(200).json({
      success: true,
      liked: likeIndex === -1, // true if just liked, false if unliked
      likeCount: comment.likes.length,
      data: comment
    });
  } catch (error) {
    console.error('Error toggling like:', error);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};
