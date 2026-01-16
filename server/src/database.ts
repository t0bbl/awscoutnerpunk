import { MongoClient, Db } from 'mongodb';
import { config } from './config';

let db: Db;

export async function connectDatabase(): Promise<Db> {
  const client = new MongoClient(config.mongoUri);
  await client.connect();
  db = client.db();
  console.log('Connected to MongoDB');
  return db;
}

export function getDatabase(): Db {
  if (!db) {
    throw new Error('Database not initialized');
  }
  return db;
}
