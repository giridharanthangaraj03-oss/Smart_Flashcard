require('dotenv').config();
const express = require('express');
const cors = require('cors');
const connectDB = require('./config/db');
const { getDbStatus } = require('./config/db');
const config = require('./config/env');
const errorHandler = require('./middleware/errorHandler');
const { checkNlpHealth } = require('./services/nlpClient');

const authRoutes = require('./routes/authRoutes');
const flashcardRoutes = require('./routes/flashcardRoutes');
const reviewRoutes = require('./routes/reviewRoutes');

const app = express();

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

app.get('/api/health', async (req, res) => {
  const nlpStatus = await checkNlpHealth();
  const database = getDbStatus();
  res.json({
    success: true,
    message: 'Smart Flashcard API is running',
    database,
    nlpService: nlpStatus,
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
