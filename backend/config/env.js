require('dotenv').config();
const { buildMongoUri } = require('./mongoUri');

module.exports = {
  port: process.env.PORT || 5000,
  mongoUri: buildMongoUri(),
  jwtSecret: process.env.JWT_SECRET || 'f40ec7f7b5475abe4b9e1862f6a5bdc936487ce02e46786b1ad6f642320192bde2c8b217d704b203866297bd5d5130df4be1f223e1519a01135620aeb8dd91d0',
  jwtExpire: process.env.JWT_EXPIRE || '7d',
  nlpServiceUrl: process.env.NLP_SERVICE_URL || 'http://localhost:8000',
  frontendUrl: process.env.FRONTEND_URL || 'http://localhost:5173',
};
