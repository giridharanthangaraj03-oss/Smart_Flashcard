import api from './api';

export const getHealth = async () => {
  try {
    const { data } = await api.get('/health');
    return data;
  } catch (err) {
    // Handle 503 (degraded) response - still has health data
    if (err.response?.status === 503 && err.response?.data) {
      return err.response.data;
    }
    // Re-throw actual errors (connection refused, etc)
    throw err;
  }
};
