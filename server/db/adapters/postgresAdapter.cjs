const { Pool } = require('pg');
const { getStoreMeta } = require('../storeConfig.cjs');

class PostgresAdapter {
  constructor({ connectionString, sslMode }) {
    this.connectionString = connectionString;
    this.sslMode = (sslMode || 'require').toLowerCase();
    this.pool = null;
  }

  async init() {
    if (!this.connectionString) {
      throw new Error('POSTGRES_URL is required when DB_PROVIDER=postgresql');
    }

    const ssl = this.sslMode === 'disable' ? false : { rejectUnauthorized: false };
    this.pool = new Pool({ connectionString: this.connectionString, ssl });

    await this.pool.query(`
      CREATE TABLE IF NOT EXISTS app_records (
        store TEXT NOT NULL,
        key TEXT NOT NULL,
        payload JSONB NOT NULL,
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        PRIMARY KEY (store, key)
      );
    `);

    await this.pool.query(`
      CREATE TABLE IF NOT EXISTS app_counters (
        store TEXT PRIMARY KEY,
        seq BIGINT NOT NULL DEFAULT 0
      );
    `);
  }

  async nextCounter(storeName) {
    const res = await this.pool.query(
      `
      INSERT INTO app_counters (store, seq)
      VALUES ($1, 1)
      ON CONFLICT (store)
      DO UPDATE SET seq = app_counters.seq + 1
      RETURNING seq;
      `,
      [storeName]
    );
    return Number(res.rows[0].seq);
  }

  keyToStorageString(key) {
    return String(key);
  }

  async get(storeName, key) {
    const keyStr = this.keyToStorageString(key);
    const res = await this.pool.query(
      'SELECT payload FROM app_records WHERE store = $1 AND key = $2 LIMIT 1',
      [storeName, keyStr]
    );
    return res.rows[0]?.payload || null;
  }

  async getAll(storeName, filter = {}) {
    const keys = Object.keys(filter || {});
    if (keys.length === 0) {
      const res = await this.pool.query('SELECT payload FROM app_records WHERE store = $1', [storeName]);
      return res.rows.map(r => r.payload);
    }

    const res = await this.pool.query('SELECT payload FROM app_records WHERE store = $1', [storeName]);
    return res.rows.map(r => r.payload).filter((item) => {
      return keys.every((k) => String(item?.[k]) === String(filter[k]));
    });
  }

  async put(storeName, data) {
    const meta = getStoreMeta(storeName);
    const payload = { ...data };
    let key = payload[meta.keyPath];

    if ((key === null || typeof key === 'undefined' || key === '') && meta.autoIncrement) {
      key = await this.nextCounter(storeName);
      payload[meta.keyPath] = key;
    }

    if (key === null || typeof key === 'undefined' || key === '') {
      throw new Error(`Missing key ${meta.keyPath} for put in store ${storeName}`);
    }

    const keyStr = this.keyToStorageString(key);
    await this.pool.query(
      `
      INSERT INTO app_records (store, key, payload)
      VALUES ($1, $2, $3::jsonb)
      ON CONFLICT (store, key)
      DO UPDATE SET payload = EXCLUDED.payload, updated_at = NOW();
      `,
      [storeName, keyStr, JSON.stringify(payload)]
    );

    return key;
  }

  async add(storeName, data) {
    const meta = getStoreMeta(storeName);
    const payload = { ...data };

    if ((payload[meta.keyPath] === null || typeof payload[meta.keyPath] === 'undefined' || payload[meta.keyPath] === '') && meta.autoIncrement) {
      payload[meta.keyPath] = await this.nextCounter(storeName);
    }

    const key = payload[meta.keyPath];
    if (key === null || typeof key === 'undefined' || key === '') {
      throw new Error(`Missing key ${meta.keyPath} for add in store ${storeName}`);
    }

    const keyStr = this.keyToStorageString(key);
    const exists = await this.pool.query('SELECT 1 FROM app_records WHERE store = $1 AND key = $2 LIMIT 1', [storeName, keyStr]);
    if (exists.rowCount > 0) {
      throw new Error(`Duplicate key for ${storeName}.${meta.keyPath}=${key}`);
    }

    await this.pool.query(
      'INSERT INTO app_records (store, key, payload) VALUES ($1, $2, $3::jsonb)',
      [storeName, keyStr, JSON.stringify(payload)]
    );

    return key;
  }

  async delete(storeName, key) {
    const keyStr = this.keyToStorageString(key);
    await this.pool.query('DELETE FROM app_records WHERE store = $1 AND key = $2', [storeName, keyStr]);
  }

  async clear(storeName, filter = {}) {
    const keys = Object.keys(filter || {});
    if (keys.length === 0) {
      await this.pool.query('DELETE FROM app_records WHERE store = $1', [storeName]);
      return;
    }

    const all = await this.getAll(storeName);
    const toDelete = all.filter((item) => keys.every((k) => String(item?.[k]) === String(filter[k])));
    await Promise.all(toDelete.map((item) => this.delete(storeName, item[getStoreMeta(storeName).keyPath])));
  }

  async close() {
    if (this.pool) await this.pool.end();
  }
}

module.exports = PostgresAdapter;
