import { drizzle } from 'drizzle-orm/mysql2';
import mysql from 'mysql2/promise';
import * as schema from "@shared/schema";

// MySQL connection configuration for Hostinger
const connectionConfig = {
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
};

if (!process.env.DB_USER || !process.env.DB_PASSWORD || !process.env.DB_NAME) {
  throw new Error(
    "Database credentials must be set: DB_HOST, DB_USER, DB_PASSWORD, DB_NAME",
  );
}

export const connection = mysql.createPool(connectionConfig);
export const db = drizzle(connection, { schema, mode: 'default' });