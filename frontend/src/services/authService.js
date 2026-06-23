import api from './api';

export const signup = async (payload) => {
  const { data } = await api.post('/auth/signup', payload);
  return data;
};

export const login = async (payload) => {
  const { data } = await api.post('/auth/login', payload);
  return data;
};

export const getProfile = async () => {
  const { data } = await api.get('/auth/profile');
  return data;
};
