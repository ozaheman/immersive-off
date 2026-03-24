const { MongoClient } = require('mongodb');
const { getStoreMeta } = require('../storeConfig');

class MongoAdapter {
  constructor({ uri, dbName }) {
    this.uri = uri;
    this.dbName = dbName;
    this.client = null;
    this.db = null;
  }

  async init() {
    if (!this.uri) throw new Error('MONGODB_URI is required when DB_PROVIDER=mongodb');
    this.client = new MongoClient(this.uri);
    await this.client.connect();
    this.db = this.client.db(this.dbName || 'urbanaxis');
    await this.db.collection('_counters').createIndex({ store: 1 }, { unique: true });
  }

  collection(storeName) {
    return this.db.collection(storeName);
  }

  async nextCounter(storeName) {
    const res = await this.db.collection('_counters').findOneAndUpdate(
      { store: storeName },
      { $inc: { seq: 1 } },
      { upsert: true, returnDocument: 'after' }
    );
    return Number(res.value?.seq || 1);
  }

  async get(storeName, key) {
    const meta = getStoreMeta(storeName);
    return this.collection(storeName).findOne({ [meta.keyPath]: key }, { projection: { _id: 0 } });
  }

  async getAll(storeName, filter = {}) {
    return this.collection(storeName).find(filter, { projection: { _id: 0 } }).toArray();
  }

  async put(storeName, data) {
    const meta = getStoreMeta(storeName);
    let key = data[meta.keyPath];

    if ((key === null || typeof key === 'undefined' || key === '') && meta.autoIncrement) {
      key = await this.nextCounter(storeName);
      data[meta.keyPath] = key;
    }

    if (key === null || typeof key === 'undefined' || key === '') {
      throw new Error(`Missing key ${meta.keyPath} for put in store ${storeName}`);
    }

    await this.collection(storeName).updateOne(
      { [meta.keyPath]: key },
      { $set: data },
      { upsert: true }
    );

    return key;
  }

  async add(storeName, data) {
    const meta = getStoreMeta(storeName);
    const payload = { ...data };

    if ((payload[meta.keyPath] === null || typeof payload[meta.keyPath] === 'undefined' || payload[meta.keyPath] === '') && meta.autoIncrement) {
      payload[meta.keyPath] = await this.nextCounter(storeName);
    }

    if (!meta.autoIncrement && (payload[meta.keyPath] === null || typeof payload[meta.keyPath] === 'undefined' || payload[meta.keyPath] === '')) {
      throw new Error(`Missing key ${meta.keyPath} for add in store ${storeName}`);
    }

    if (typeof payload[meta.keyPath] !== 'undefined') {
      const exists = await this.collection(storeName).findOne({ [meta.keyPath]: payload[meta.keyPath] }, { projection: { _id: 1 } });
      if (exists) throw new Error(`Duplicate key for ${storeName}.${meta.keyPath}=${payload[meta.keyPath]}`);
    }

    await this.collection(storeName).insertOne(payload);
    return payload[meta.keyPath];
  }

  async delete(storeName, key) {
    const meta = getStoreMeta(storeName);
    await this.collection(storeName).deleteOne({ [meta.keyPath]: key });
  }

  async clear(storeName, filter = {}) {
    await this.collection(storeName).deleteMany(filter);
  }

  async close() {
    if (this.client) await this.client.close();
  }
}

module.exports = MongoAdapter;
