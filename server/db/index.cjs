const MongoAdapter = require('./adapters/mongoAdapter.cjs');
const PostgresAdapter = require('./adapters/postgresAdapter.cjs');

function createAdapterFromEnv(env) {
  const provider = (env.DB_PROVIDER || 'indexeddb').toLowerCase();

  if (provider === 'mongodb') {
    return new MongoAdapter({
      uri: env.MONGODB_URI,
      dbName: env.MONGODB_DB_NAME || 'urbanaxis'
    });
  }

  if (provider === 'postgresql') {
    return new PostgresAdapter({
      connectionString: env.POSTGRES_URL,
      sslMode: env.POSTGRES_SSL_MODE || 'require'
    });
  }

  return null;
}

module.exports = {
  createAdapterFromEnv
};
