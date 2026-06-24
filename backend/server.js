require('dotenv').config();
const express = require('express');
const cors = require('cors');
const connectDB = require('./config/db');
const { getDbStatus } = require('./config/db');
const config = require('./config/env');
const errorHandler = require('./middleware/errorHandler');
const { checkNlpHealth, pingNlpService, nlpMetrics } = require('./services/nlpClient');

const authRoutes = require('./routes/authRoutes');
const flashcardRoutes = require('./routes/flashcardRoutes');
const reviewRoutes = require('./routes/reviewRoutes');

const app = express();

const appMetrics = {
  startTime: Date.now(),
  requestCount: 0,
  apiErrors: 0,
  flashcardRequests: 0,
  flashcardFailures: 0,
  nlpHealthChecks: 0,
  nlpPingChecks: 0,
};

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin) return callback(null, true);
      if (origin.startsWith('http://localhost')) return callback(null, true);
      if (origin === config.frontendUrl) return callback(null, true);
      return callback(new Error('Not allowed by CORS'));
    },
    credentials: true,
  })
);
app.use(express.json({ limit: '2mb' }));

app.use((req, res, next) => {
  appMetrics.requestCount += 1;
  if (req.path.startsWith('/api/flashcards')) {
    appMetrics.flashcardRequests += 1;
  }

  res.on('finish', () => {
    if (res.statusCode >= 400) {
      appMetrics.apiErrors += 1;
      if (req.path === '/api/flashcards/generate') {
        appMetrics.flashcardFailures += 1;
      }
    }
  });

  next();
});

app.get('/api/health', async (req, res) => {
  appMetrics.nlpHealthChecks += 1;
  const nlpStatus = await checkNlpHealth();
  const database = getDbStatus();
  const healthy = database.status === 'connected' && nlpStatus.status !== 'unavailable';

  res.status(healthy ? 200 : 503).json({
    success: healthy,
    message: healthy ? 'Smart Flashcard API is running' : 'Smart Flashcard API is degraded',
    database,
    nlpService: nlpStatus,
    uptime_seconds: Math.floor((Date.now() - appMetrics.startTime) / 1000),
  });
});

app.get('/api/ping', async (req, res) => {
  appMetrics.nlpPingChecks += 1;
  const pingResult = await pingNlpService();
  const database = getDbStatus();

  res.json({
    success: true,
    service: 'smart-flashcard-api',
    timestamp: new Date().toISOString(),
    uptime_seconds: Math.floor((Date.now() - appMetrics.startTime) / 1000),
    database,
    nlpPing: pingResult,
  });
});

app.get('/api/metrics', (req, res) => {
  res.json({
    success: true,
    uptime_seconds: Math.floor((Date.now() - appMetrics.startTime) / 1000),
    metrics: appMetrics,
    nlpMetrics,
    database: getDbStatus(),
  });
});

app.use('/api/auth', authRoutes);
app.use('/api/flashcards', flashcardRoutes);
app.use('/api/review', reviewRoutes);

app.use(errorHandler);

const startServer = async () => {
  await connectDB();

  const PORT = config.port;
  const server = app.listen(PORT, () => {
    const db = getDbStatus();
    console.log(`Server running on port ${PORT}`);
    if (db.status !== 'connected') {
      console.warn('API started, but MongoDB is not connected. Auth and data routes will fail until Atlas credentials are fixed.');
    }
  });

  server.on('error', (error) => {
    if (error.code === 'EADDRINUSE') {
      console.error(`Port ${PORT} is already in use.`);
      console.error('Stop the other process with:');
      console.error(`  netstat -ano | findstr :${PORT}`);
      console.error('  taskkill /PID <pid> /F');
      process.exit(1);
    }
    throw error;
  });
};

startServer();

module.exports = app;
