import api from './api';

export const productService = {
  async getProducts(params = {}) {
    const res = await api.get('/products', { params });
    return res.data;
  },

  async getProduct(id) {
    const res = await api.get(`/products/${id}`);
    return res.data;
  },

  async getCategories() {
    const res = await api.get('/products/categories');
    return res.data;
  },

  async getSimilarProducts(productId) {
    const res = await api.get(`/products/${productId}/similar`);
    return res.data;
  },

  async searchByImage(imageFile) {
    const formData = new FormData();
    formData.append('image', imageFile);
    const res = await api.post('/products/search-by-image', formData);
    return res.data;
  },
};
