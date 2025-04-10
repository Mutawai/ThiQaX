const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');

let mongoServer;

/**
 * Connect to the in-memory database.
 */
const connect = async () => {
  mongoServer = await MongoMemoryServer.create();
  const uri = mongoServer.getUri();

  const mongooseOpts = {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  };

  await mongoose.connect(uri, mongooseOpts);
};

/**
 * Drop database, close the connection and stop mongod.
 */
const closeDatabase = async () => {
  if (mongoServer) {
    await mongoose.connection.dropDatabase();
    await mongoose.connection.close();
    await mongoServer.stop();
  }
};

/**
 * Remove all data from collections but keep collections.
 */
const clearDatabase = async () => {
  if (mongoServer) {
    const collections = mongoose.connection.collections;

    for (const key in collections) {
      const collection = collections[key];
      await collection.deleteMany({});
    }
  }
};

/**
 * Setup function to be called before tests.
 * Connects to test database and sets up hooks.
 */
const setupTestDB = () => {
  // Before all tests, connect to the database
  beforeAll(async () => {
    await connect();
  });

  // After all tests, disconnect and close
  afterAll(async () => {
    await closeDatabase();
  });

  // Clear database between tests
  afterEach(async () => {
    await clearDatabase();
  });
};

module.exports = {
  setupTestDB,
  connect,
  closeDatabase,
  clearDatabase
};
