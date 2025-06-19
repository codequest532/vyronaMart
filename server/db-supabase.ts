import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from "@shared/schema";

// Supabase PostgreSQL connection (alternative to Neon)
if (!process.env.DATABASE_URL) {
  throw new Error(
    "DATABASE_URL must be set for Supabase connection",
  );
}

// Create the connection
const client = postgres(process.env.DATABASE_URL, {
  ssl: 'require',
  max: 1, // Supabase connection limit for free tier
});

export const db = drizzle(client, { schema });
export { client as pool };