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
export const postComment = (blogId, content) =>
  apiClient.post(`/blogs/${blogId}/comments`, { content });

/**
 * Toggle like on a specific comment (requires auth token).
 * @param {string} blogId
 * @param {string} commentId
 */
export const toggleCommentLike = (blogId, commentId) =>
  apiClient.post(`/blogs/${blogId}/comments/${commentId}/like`);
