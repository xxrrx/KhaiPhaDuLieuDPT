import api from './api';

export const socialService = {
  async getFeed(params = {}) {
    const res = await api.get('/social/feed', { params });
    return res.data;
  },

  async getPost(id) {
    const res = await api.get(`/social/posts/${id}`);
    return res.data;
  },

  async createPost(formData) {
    const res = await api.post('/social/posts', formData);
    return res.data;
  },

  async deletePost(id) {
    const res = await api.delete(`/social/posts/${id}`);
    return res.data;
  },

  async likePost(id) {
    const res = await api.post(`/social/posts/${id}/like`);
    return res.data;
  },

  async unlikePost(id) {
    const res = await api.delete(`/social/posts/${id}/like`);
    return res.data;
  },

  async getComments(postId, params = {}) {
    const res = await api.get(`/social/posts/${postId}/comments`, { params });
    return res.data;
  },

  async addComment(postId, content) {
    const res = await api.post(`/social/posts/${postId}/comments`, { content });
    return res.data;
  },

  async deleteComment(commentId) {
    const res = await api.delete(`/social/comments/${commentId}`);
    return res.data;
  },

  async follow(userId) {
    const res = await api.post(`/social/follow/${userId}`);
    return res.data;
  },

  async unfollow(userId) {
    const res = await api.delete(`/social/follow/${userId}`);
    return res.data;
  },

  async getUserProfile(userId) {
    const res = await api.get(`/social/users/${userId}/profile`);
    return res.data;
  },
};
