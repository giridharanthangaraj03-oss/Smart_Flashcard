require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
const mongoose = require('mongoose');
const { buildMongoUri, getFallbackMongoUri, getMongoConfigSummary } = require('../config/mongoUri');

const options = {
  serverSelectionTimeoutMS: 30000,
  family: 4,
  autoSelectFamily: false,
};

const testUri = async (label, uri) => {
  console.log(`\nTesting ${label}...`);
  const summary = getMongoConfigSummary(uri);
  console.log(`User: ${summary.username}`);
  console.log(`Host: ${summary.host}`);
  console.log(`Database: ${summary.database}`);

  try {
    const conn = await mongoose.connect(uri, options);
    console.log('MongoDB Atlas connection successful');
    console.log(`Connected host: ${conn.connection.host}`);
    console.log(`Database: ${conn.connection.name}`);
    await mongoose.disconnect();
    return true;
  } catch (error) {
    console.error('Connection failed:', error.message);
    if (mongoose.connection.readyState !== 0) {
      await mongoose.disconnect();
    }
    return false;
  }
};

const run = async () => {
  const primaryUri = buildMongoUri();
  const fallbackUri = getFallbackMongoUri();

  if (!primaryUri) {
    console.error('MongoDB config missing from backend/.env');
    process.exit(1);
  }

  const primaryOk = await testUri('primary URI', primaryUri);
  if (primaryOk) {
    console.log('\nDisconnected cleanly');
    process.exit(0);
  }

  if (fallbackUri) {
    const fallbackOk = await testUri('fallback URI', fallbackUri);
    if (fallbackOk) {
      console.log('\nUse MONGO_URI_STANDARD in .env if primary SRV keeps failing.');
      process.exit(0);
    }
  } else {
    console.error('\nNo MONGO_URI_STANDARD fallback configured.');
    console.error('In Atlas: Connect -> Drivers -> copy the standard connection string and add:');
    console.error('MONGO_URI_STANDARD=mongodb://...');
  }

  process.exit(1);
};

run();
