import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema';

let dbInstance: ReturnType<typeof drizzle<typeof schema>> | null = null;

export function hasDatabase() {
  return Boolean(process.env.DATABASE_URL);
}

export function getDb() {
  if (!process.env.DATABASE_URL) {
    throw new Error('DATABASE_URL is missing');
  }

  if (!dbInstance) {
    const sql = postgres(process.env.DATABASE_URL, { prepare: false });
    dbInstance = drizzle(sql, { schema });
  }

  return dbInstance;
}
