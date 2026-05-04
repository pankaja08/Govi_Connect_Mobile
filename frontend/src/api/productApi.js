import apiClient from './client';

export const productApi = {
  // Get all products with optional filters
  getAll: (params = {}) => apiClient.get('/products', { params }),

  // Get top rated products
  getTopRated: () => apiClient.get('/products', { params: { topRated: 'true' } }),

  // Get product by ID
  getById: (id) => apiClient.get(`/products/${id}`),

  // Get my listed products
  getMyProducts: () => apiClient.get('/products/my'),

  // Create a new product
  create: (data) => apiClient.post('/products', data),

  // Update an existing product (seller only)
  update: (id, data) => apiClient.patch(`/products/${id}`, data),

  // Delete a product (seller only)
  delete: (id) => apiClient.delete(`/products/${id}`),

  // Rate a product (value 1-5)
  rate: (id, value) => apiClient.post(`/products/${id}/rate`, { value }),

  // Toggle favorite
  toggleFavorite: (id) => apiClient.post(`/products/${id}/fav`),
};
