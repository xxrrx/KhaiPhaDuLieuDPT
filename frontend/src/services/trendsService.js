import api from './api';

export const trendsService = {
  async getTrends(params = {}) {
    const res = await api.get('/trends', { params });
    return res.data;
  },

  async getChartData(params = {}) {
    const res = await api.get('/trends/chart-data', { params });
    return res.data;
  },

  async getPredictions() {
    const res = await api.get('/trends/predictions');
    return res.data;
  },
};
