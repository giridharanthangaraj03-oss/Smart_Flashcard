const mongoose = require('mongoose');
const https = require('https');
const config = require('./env');
const { getFallbackMongoUri, getMongoConfigSummary } = require('./mongoUri');

mongoose.set('bufferCommands', false);

const atlasOptions = {
  serverSelectionTimeoutMS: 30000,
  socketTimeoutMS: 45000,
  maxPoolSize: 10,
  family: 4,
  autoSelectFamily: false,
};

const logAuthHelp = (error, summary) => {
  if (!error.message.toLowerCase().includes('auth')) {
    return;
  }

  console.error('\nAtlas authentication failed. Fix it with these steps:');
  console.error('1. Open MongoDB Atlas -> Database Access');
  console.error('2. Confirm the database user exists and is enabled');
  console.error(`3. Username in .env must match exactly: ${summary.username || 'check MONGO_USER'}`);
  console.error('4. Reset the user password in Atlas and paste the new value into backend/.env');
  console.error('5. If the password has special characters (@, #, /, etc.), use MONGO_PASSWORD instead of MONGO_URI');
  console.error('6. Save .env and run: npm run test:mongo\n');
};

const logIpWhitelistHelp = async (error) => {
  const message = error.message.toLowerCase();
  if (!message.includes('whitelist') && !message.includes('could not connect to any servers')) {
    return;
  }

  console.error('\nAtlas network access is blocking this machine.');
  console.error('Fix in MongoDB Atlas -> Network Access:');
  console.error('1. Click "Add IP Address"');
  console.error('2. Choose "Allow Access from Anywhere" (0.0.0.0/0) for development');
  console.error('3. Save and wait 1-2 minutes');
  console.error('4. Restart backend: npm run dev');

  try {
    const publicIp = await new Promise((resolve, reject) => {
      https
        .get('https://api.ipify.org?format=json', (res) => {
          let data = '';
          res.on('data', (chunk) => {
            data += chunk;
          });
          res.on('end', () => resolve(JSON.parse(data).ip));
        })
        .on('error', reject);
    });
    console.error(`\nYour current public IP appears to be: ${publicIp}`);
    console.error(`Add this IP in Atlas if you do not want to use 0.0.0.0/0.\n`);
  } catch {
    console.error('\nCould not detect public IP automatically. Visit https://ifconfig.me in your browser.\n');
  }
};

const logSslHelp = (error) => {
  const message = error.message.toLowerCase();
  if (!message.includes('ssl') && !message.includes('tls') && !message.includes('alert')) {
    return;
  }

  console.error('\nAtlas SSL/TLS connection failed. Try these fixes:');
  console.error('1. Atlas -> Network Access -> allow your current IP or 0.0.0.0/0 for development');
  console.error('2. Confirm the cluster is not paused in Atlas -> Database');
  console.error('3. Copy the standard connection string from Atlas and set MONGO_URI_STANDARD in backend/.env');
  console.error('4. Temporarily disable VPN/antivirus SSL scanning');
  console.error('5. Restart the backend after saving .env\n');
};

const tryConnect = async (uri) => {
  mongoose.set('strictQuery', true);
  return mongoose.connect(uri, atlasOptions);
};

const connectDB = async () => {
  if (!config.mongoUri) {
    console.error('MongoDB is not configured. Set either:');
    console.error('  MONGO_URI=mongodb+srv://...');
    console.error('or');
    console.error('  MONGO_USER=your_user');
    console.error('  MONGO_PASSWORD=your_password');
    console.error('  MONGO_CLUSTER=cluster0.xxxxx.mongodb.net');
    console.error('  MONGO_DB_NAME=smart-flashcards');
    if (process.env.NODE_ENV === 'production') {
      process.exit(1);
    }
    return;
  }

  const summary = getMongoConfigSummary(config.mongoUri);
  const fallbackUri = getFallbackMongoUri();

  try {
    const conn = await tryConnect(config.mongoUri);
    console.log(`MongoDB Atlas connected: ${conn.connection.host}`);
    console.log(`Database: ${conn.connection.name}`);
    console.log(`User: ${summary.username}`);
    return;
  } catch (primaryError) {
    console.error(`MongoDB Atlas connection error: ${primaryError.message}`);
    logAuthHelp(primaryError, summary);
    logSslHelp(primaryError);
    await logIpWhitelistHelp(primaryError);

    if (fallbackUri) {
      try {
        console.log('Retrying with MONGO_URI_STANDARD fallback...');
        const conn = await tryConnect(fallbackUri);
        console.log(`MongoDB Atlas connected via fallback URI: ${conn.connection.host}`);
        console.log(`Database: ${conn.connection.name}`);
        return;
      } catch (fallbackError) {
        console.error(`Fallback MongoDB connection error: ${fallbackError.message}`);
        logSslHelp(fallbackError);
        await logIpWhitelistHelp(fallbackError);
      }
    } else if (
      primaryError.message.toLowerCase().includes('ssl') ||
      primaryError.message.toLowerCase().includes('tls')
    ) {
      console.error('Tip: add MONGO_URI_STANDARD from Atlas Connect -> Drivers for a non-SRV fallback.');
    }

    if (!primaryError.message.toLowerCase().includes('auth')) {
      console.error(
        'Also check: Atlas cluster is running, your IP is whitelisted, and the cluster hostname is correct.',
      );
    }

    if (process.env.NODE_ENV === 'production') {
      process.exit(1);
    }
  }
};

const getDbStatus = () => {
  const states = {
    0: 'disconnected',
    1: 'connected',
    2: 'connecting',
    3: 'disconnecting',
  };

  return {
    status: states[mongoose.connection.readyState] || 'unknown',
    name: mongoose.connection.name || null,
    host: mongoose.connection.host || null,
  };
};

mongoose.connection.on('disconnected', () => {
  console.warn('MongoDB Atlas disconnected');
});

mongoose.connection.on('reconnected', () => {
  console.log('MongoDB Atlas reconnected');
});

module.exports = connectDB;
module.exports.getDbStatus = getDbStatus;
