const axios = require('axios');
const config = require('../config/env');

const formatNlpDetail = (detail) => {
  if (!detail) return 'NLP service error';
  if (typeof detail === 'string') return detail;
  if (Array.isArray(detail)) {
    return detail
      .map((item) => (typeof item === 'string' ? item : item.msg || item.message || ''))
      .filter(Boolean)
      .join(', ') || 'NLP service error';
  }
  if (typeof detail === 'object') {
    return detail.msg || detail.message || 'NLP service error';
  }
  return 'NLP service error';
};

const generateFlashcards = async (studyNotes, maxCards = 8) => {
  try {
    const response = await axios.post(
      `${config.nlpServiceUrl}/generate`,
      { text: studyNotes, max_cards: maxCards },
      { timeout: 120000 }
    );
    return response.data.flashcards || [];
  } catch (error) {
    if (error.code === 'ECONNREFUSED') {
      throw new Error('NLP service is not running. Please start the Python NLP service on port 8000.');
    }
    if (error.response) {
      throw new Error(formatNlpDetail(error.response.data?.detail) || 'NLP service error');
    }
    throw new Error('Failed to generate flashcards: ' + error.message);
  }
};
const checkNlpHealth = async () => {
  try {
    const response = await axios.get(`${config.nlpServiceUrl}/health`, { timeout: 5000 });
    return response.data;
  } catch {
    return { status: 'unavailable' };
  }
};

module.exports = { generateFlashcards, checkNlpHealth };
