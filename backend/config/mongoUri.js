const buildMongoUri = () => {
  if (process.env.MONGO_URI && !process.env.MONGO_URI.includes('<')) {
    return process.env.MONGO_URI.trim();
  }

  const user = process.env.MONGO_USER?.trim();
  const password = process.env.MONGO_PASSWORD?.trim();
  const cluster = process.env.MONGO_CLUSTER?.trim();
  const dbName = process.env.MONGO_DB_NAME?.trim() || 'smart-flashcards';

  if (!user || !password || !cluster) {
    return null;
  }

  const encodedUser = encodeURIComponent(user);
  const encodedPassword = encodeURIComponent(password);
  const host = cluster.replace(/^mongodb(\+srv)?:\/\//, '');

  return `mongodb+srv://${encodedUser}:${encodedPassword}@${host}/${dbName}?retryWrites=true&w=majority&authSource=admin&tls=true`;
};

const getFallbackMongoUri = () => {
  const fallback = process.env.MONGO_URI_STANDARD?.trim();
  if (fallback && !fallback.includes('<')) {
    return fallback;
  }
  return null;
};

const getMongoConfigSummary = (uri) => {
  if (!uri) {
    return { configured: false };
  }

  try {
    const withoutProtocol = uri.replace(/^mongodb(\+srv)?:\/\//, '');
    const [credentials, rest] = withoutProtocol.split('@');
    const [username] = credentials.split(':');
    const hostPart = rest.split('/')[0];
    const dbPart = rest.split('/')[1]?.split('?')[0];

    return {
      configured: true,
      username,
      host: hostPart,
      database: dbPart || 'smart-flashcards',
      usesSrv: uri.startsWith('mongodb+srv://'),
    };
  } catch {
    return { configured: true, parseError: true };
  }
};

module.exports = { buildMongoUri, getFallbackMongoUri, getMongoConfigSummary };
