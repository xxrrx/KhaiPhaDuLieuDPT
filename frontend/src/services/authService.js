import api from './api';

export const authService = {
  async login(username, password) {
    const res = await api.post('/auth/login', { username, password });
    return res.data;
  },

  async register(data) {
    const res = await api.post('/auth/register', data);
    return res.data;
  },

  async getMe() {
    const res = await api.get('/auth/me');
    return res.data;
  },

  async updateProfile(data) {
    const res = await api.put('/auth/me', data);
    return res.data;
  },

  async changePassword(data) {
    const res = await api.put('/auth/change-password', data);
    return res.data;
  },
};
