import apiClient from './client';

/**
 * Fetch all forum questions with optional filters.
 * @param {object} params - { sort, search, category, myQuestions }
 */
export const getQuestions = (params = {}) =>
  apiClient.get('/forum', { params });

/**
 * Post a new question (multipart/form-data so images can be attached).
 * @param {FormData} formData
 */
export const createQuestion = (formData) =>
  apiClient.post('/forum', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });

/**
 * Update an existing question (owner only, within 1-hour window).
 * @param {string} id
 * @param {object} data - { text, category }
 */
export const updateQuestion = (id, data) =>
  apiClient.patch(`/forum/${id}`, data);

/**
 * Delete a question (owner or Admin).
 * @param {string} id
 */
export const deleteQuestion = (id) =>
  apiClient.delete(`/forum/${id}`);
