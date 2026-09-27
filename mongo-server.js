// mongo-server.js - Standalone MongoDB Server Runner on Port 27017
const { MongoMemoryServer } = require('mongodb-memory-server');

let mongodInstance = null;

const startMongo = async () => {
  try {
    console.log('[MongoDB Runner] Initializing MongoDB instance on port 27017...');
    mongodInstance = await MongoMemoryServer.create({
      instance: {
        port: 27017,
        dbName: 'smart_workload'
      }
    });
    console.log(`[MongoDB Runner] MongoDB Server successfully started at: ${mongodInstance.getUri()}`);
    console.log('[MongoDB Runner] Port 27017 is READY for microservices and seed script.');
  } catch (err) {
    console.error('[MongoDB Runner] Failed to start MongoDB instance:', err.message);
    process.exit(1);
  }
};

const stopMongo = async () => {
  if (mongodInstance) {
    console.log('[MongoDB Runner] Stopping MongoDB instance...');
    await mongodInstance.stop();
  }
  process.exit(0);
};

process.on('SIGINT', stopMongo);
process.on('SIGTERM', stopMongo);

startMongo();
