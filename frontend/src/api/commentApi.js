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
