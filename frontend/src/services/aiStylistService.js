import api from './api';

export const aiStylistService = {
  async analyze(photoFile) {
    const formData = new FormData();
    formData.append('photo', photoFile);
    const res = await api.post('/ai-stylist/analyze', formData);
    return res.data;
  },

  async recommend(data) {
    const res = await api.post('/ai-stylist/recommend', data);
    return res.data;
  },

  async getAnalysisHistory(params = {}) {
    const res = await api.get('/ai-stylist/analysis-history', { params });
    return res.data;
  },

  async getColorPalette(season = null) {
    const params = season ? { season } : {};
    const res = await api.get('/ai-stylist/color-palette', { params });
    return res.data;
  },
};
