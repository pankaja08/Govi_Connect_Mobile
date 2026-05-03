import apiClient from './client';

/**
 * Fetch all comments for a given blog.
 * @param {string} blogId
 */
export const getComments = (blogId) => apiClient.get(`/blogs/${blogId}/comments`);

/**
 * Post a new comment on a blog (requires auth token).
 * @param {string} blogId
 * @param {string} content
 */
export const postComment = (blogId, content, parentId = null) =>
  apiClient.post(`/blogs/${blogId}/comments`, { content, parentId });

/**
 * Mark all comments for a blog as read by expert (requires expert/admin auth).
 * @param {string} blogId
 */
export const markCommentsAsRead = (blogId) =>
  apiClient.patch(`/blogs/${blogId}/comments/read`);

/**
 * Toggle like on a specific comment (requires auth token).
 * @param {string} blogId
 * @param {string} commentId
 */
export const toggleCommentLike = (blogId, commentId) =>
  apiClient.post(`/blogs/${blogId}/comments/${commentId}/like`);

// ─── Forum Answer Helpers ───────────────────────────────────────────────────

/**
 * Add an answer to a forum question (any logged-in user / expert).
 * @param {string} questionId
 * @param {string} text
 */
export const addForumAnswer = (questionId, text) =>
  apiClient.post(`/forum/${questionId}/answers`, { text });

/**
 * Update an existing answer on a forum question (author only).
 * @param {string} questionId
 * @param {string} answerId
 * @param {string} text
 */
export const updateForumAnswer = (questionId, answerId, text) =>
  apiClient.patch(`/forum/${questionId}/answers/${answerId}`, { text });

/**
 * Delete an answer from a forum question (author or Admin).
 * @param {string} questionId
 * @param {string} answerId
 */
export const deleteForumAnswer = (questionId, answerId) =>
  apiClient.delete(`/forum/${questionId}/answers/${answerId}`);
