import api from './api';

export const tryonService = {
  async uploadTryOn(userPhotoFile, productId) {
    const formData = new FormData();
    formData.append('user_photo', userPhotoFile);
    formData.append('product_id', productId);
    const res = await api.post('/tryon/upload', formData);
    return res.data;
  },

  async saveARResult(imageBase64, productId) {
    const res = await api.post('/tryon/save-ar-result', {
      image_base64: imageBase64,
      product_id: productId,
    });
    return res.data;
  },

  async getHistory(params = {}) {
    const res = await api.get('/tryon/history', { params });
    return res.data;
  },

  async deleteHistory(historyId) {
    const res = await api.delete(`/tryon/history/${historyId}`);
    return res.data;
  },
};
