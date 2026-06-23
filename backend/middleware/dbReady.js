const mongoose = require('mongoose');

const dbReady = (req, res, next) => {
  if (mongoose.connection.readyState === 1) {
    return next();
  }

  return res.status(503).json({
    success: false,
    message:
      'Database is not connected. Whitelist your IP in MongoDB Atlas (Network Access), wait 1-2 minutes, then restart the backend.',
  });
};

module.exports = dbReady;
