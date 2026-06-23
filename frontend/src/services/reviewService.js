import api from './api';

export const updateReview = async (cardId, payload) => {
  const { data } = await api.put(`/review/${cardId}`, payload);
  return data;
};

export const getReviewHistory = async (setId) => {
  const { data } = await api.get(`/review/history/${setId}`);
  return data;
};
