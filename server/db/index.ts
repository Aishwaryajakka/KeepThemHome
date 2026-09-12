import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import * as schema from './schema.js';

let database: ReturnType<typeof createDatabase> | undefined;

const createDatabase = () => {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) throw new Error('DATABASE_URL is not configured');
  return drizzle(neon(connectionString), { schema });
};

export const getDatabase = () => {
  database ??= createDatabase();
  return database;
};
