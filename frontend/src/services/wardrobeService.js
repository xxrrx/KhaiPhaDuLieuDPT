import api from './api';

export const wardrobeService = {
  async getWardrobe(params = {}) {
    const res = await api.get('/wardrobe', { params });
    return res.data;
  },

  async addToWardrobe(productId) {
    const res = await api.post('/wardrobe', { product_id: productId });
    return res.data;
  },

  async removeFromWardrobe(itemId) {
    const res = await api.delete(`/wardrobe/${itemId}`);
    return res.data;
  },

  async getOutfits(params = {}) {
    const res = await api.get('/wardrobe/outfits', { params });
    return res.data;
  },

  async createOutfit(data) {
    const res = await api.post('/wardrobe/outfits', data);
    return res.data;
  },

  async getOutfit(id) {
    const res = await api.get(`/wardrobe/outfits/${id}`);
    return res.data;
  },

  async updateOutfit(id, data) {
    const res = await api.put(`/wardrobe/outfits/${id}`, data);
    return res.data;
  },

  async deleteOutfit(id) {
    const res = await api.delete(`/wardrobe/outfits/${id}`);
    return res.data;
  },

  async exportOutfit(id) {
    const res = await api.post(`/wardrobe/outfits/${id}/export`);
    return res.data;
  },
};
