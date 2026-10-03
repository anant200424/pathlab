import { MongoMemoryServer } from 'mongodb-memory-server';
import mongoose from 'mongoose';
import { beforeAll, afterAll, beforeEach } from 'vitest';
import { seedInitialData } from '../src/database/seeder.js';

let mongod: MongoMemoryServer;

beforeAll(async () => {
  // Use in-memory MongoDB for testing
  mongod = await MongoMemoryServer.create();
  const uri = mongod.getUri();
  await mongoose.connect(uri);
  await seedInitialData();
});

afterAll(async () => {
  await mongoose.disconnect();
  if (mongod) {
    await mongod.stop();
  }
});

beforeEach(async () => {
  // Optionally clean collections between tests if needed, keeping seeded roles intact
});
