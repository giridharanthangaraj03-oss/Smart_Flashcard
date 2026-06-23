import api from './api';

export const saveStudyProfile = async (profile) => {
  const { data } = await api.put('/auth/study-profile', profile);
  return data;
};

export const getStudyProfile = async () => {
  const { data } = await api.get('/auth/study-profile');
  return data;
};
