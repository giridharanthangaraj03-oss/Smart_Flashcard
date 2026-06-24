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

const nlpMetrics = {
  retryAttempts: 0,
  lastError: null,
  lastStatus: 'unknown',
};

const MAX_NLP_RETRY = 3;
const BASE_RETRY_DELAY_MS = 500;
const RETRY_STATUS_CODES = new Set([408, 429, 500, 502, 503, 504]);

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const shouldRetry = (error) => {
  if (!error) return false;
  if (error.code) {
    return ['ECONNREFUSED', 'ECONNRESET', 'ENOTFOUND', 'EAI_AGAIN', 'ECONNABORTED', 'ETIMEDOUT'].includes(error.code);
  }
  if (error.response && RETRY_STATUS_CODES.has(error.response.status)) {
    return true;
  }
  return false;
};

const postWithRetry = async (url, payload, options = {}) => {
  let lastError = null;

  for (let attempt = 1; attempt <= MAX_NLP_RETRY; attempt += 1) {
    try {
      return await axios.post(url, payload, options);
    } catch (error) {
      lastError = error;
      if (attempt >= MAX_NLP_RETRY || !shouldRetry(error)) {
        break;
      }

      nlpMetrics.retryAttempts += 1;
      nlpMetrics.lastStatus = 'retrying';

      const delay = BASE_RETRY_DELAY_MS * Math.pow(2, attempt - 1);
      const jitter = Math.floor(Math.random() * 150);
      await sleep(delay + jitter);
    }
  }

  throw lastError || new Error('NLP service retry failed');
};

const generateFlashcards = async (studyNotes, maxCards = 8) => {
  try {
    const response = await postWithRetry(
      `${config.nlpServiceUrl}/generate`,
      { text: studyNotes, max_cards: maxCards },
      { timeout: 120000 }
    );

    nlpMetrics.lastStatus = 'ok';
    return response.data.flashcards || [];
  } catch (error) {
    nlpMetrics.lastError = error.message;
    nlpMetrics.lastStatus = 'unavailable';

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
    nlpMetrics.lastStatus = 'ok';
    return response.data;
  } catch (error) {
    nlpMetrics.lastStatus = 'unavailable';
    nlpMetrics.lastError = error.message;
    return {
      status: 'unavailable',
      error: formatNlpDetail(error.response?.data?.detail) || error.message || 'NLP service error',
    };
  }
};

const pingNlpService = async () => {
  try {
    const response = await axios.get(`${config.nlpServiceUrl}/`, { timeout: 2500 });
    nlpMetrics.lastStatus = 'ok';
    return {
      status: 'ok',
      statusCode: response.status,
      service: 'nlp-service',
      uptime: response.data?.uptime_seconds,
    };
  } catch (error) {
    nlpMetrics.lastStatus = 'unavailable';
    nlpMetrics.lastError = error.message;
    return {
      status: 'unavailable',
      error: formatNlpDetail(error.response?.data?.detail) || error.message || 'NLP service error',
      code: error.response?.status || error.code || 'unknown',
    };
  }
};

module.exports = { generateFlashcards, checkNlpHealth, pingNlpService, nlpMetrics };
