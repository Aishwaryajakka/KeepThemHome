import { neon, Pool } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import { drizzle as drizzleServerless } from 'drizzle-orm/neon-serverless';
import * as schema from './schema.js';

let database: ReturnType<typeof createDatabase> | undefined;
let transactionalDatabase: ReturnType<typeof createTransactionalDatabase> | undefined;

const createDatabase = () => {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) throw new Error('DATABASE_URL is not configured');
  return drizzle(neon(connectionString), { schema });
};

const createTransactionalDatabase = () => {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) throw new Error('DATABASE_URL is not configured');
  return drizzleServerless(new Pool({ connectionString }), { schema });
};

export const getDatabase = () => {
  database ??= createDatabase();
  return database;
};

export const getTransactionalDatabase = () => {
  transactionalDatabase ??= createTransactionalDatabase();
  return transactionalDatabase;
};
