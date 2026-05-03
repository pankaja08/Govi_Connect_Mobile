import apiClient from './client';

export const productApi = {
  // ── Public Browse ──────────────────────────────────────────────────────────
  getAll: (params) => apiClient.get('/products', { params }),
  getTopRated: () => apiClient.get('/products/top-rated'),
  getById: (id) => apiClient.get(`/products/${id}`),

  // ── Seller ─────────────────────────────────────────────────────────────────
  getMyProducts: () => apiClient.get('/products/my'),
  create: (data) => apiClient.post('/products', data),
  update: (id, data) => apiClient.patch(`/products/${id}`, data),
  delete: (id) => apiClient.delete(`/products/${id}`),

  // ── Interactions ───────────────────────────────────────────────────────────
  rate: (id, value) => apiClient.post(`/products/${id}/rate`, { value }),
  toggleFavorite: (id) => apiClient.post(`/products/${id}/favorite`),

  // ── Admin Approval ─────────────────────────────────────────────────────────
  getPending: () => apiClient.get('/products/admin/pending'),
  approve: (id) => apiClient.patch(`/products/${id}/approve`),
  reject: (id, note) => apiClient.patch(`/products/${id}/reject`, { note }),
};
