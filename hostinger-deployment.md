# Deploying VyronaMart to Hostinger

## Database Migration Options

### Option 1: Use Hostinger's MySQL Database (Recommended)
1. **Convert from PostgreSQL to MySQL**:
   - Update `drizzle.config.ts` to use MySQL dialect
   - Replace `@neondatabase/serverless` with `mysql2`
   - Update database schema for MySQL compatibility

### Option 2: External PostgreSQL Service
- Use services like ElephantSQL, Supabase, or Railway
- Keep existing Neon/PostgreSQL setup
- Update connection string only

### Option 3: Hostinger VPS with PostgreSQL
- Upgrade to VPS hosting
- Install PostgreSQL manually
- More control but requires server management

## Required Changes for Hostinger

### 1. Database Configuration Updates
```typescript
// drizzle.config.ts for MySQL
import { defineConfig } from "drizzle-kit";

export default defineConfig({
  out: "./migrations",
  schema: "./shared/schema.ts",
  dialect: "mysql",
  dbCredentials: {
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
  },
});
```

### 2. Database Connection Update
```typescript
// server/db.ts for MySQL
import { drizzle } from 'drizzle-orm/mysql2';
import mysql from 'mysql2/promise';
import * as schema from "@shared/schema";

const connection = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
});

export const db = drizzle(connection, { schema, mode: 'default' });
```

### 3. Schema Migration for MySQL
- Convert PostgreSQL-specific types to MySQL equivalents
- Update `serial()` to `int().primaryKey().autoincrement()`
- Replace `jsonb()` with `json()`
- Update timestamp handling

### 4. Environment Variables
Set these in Hostinger control panel:
```
DB_HOST=localhost
DB_USER=your_mysql_username
DB_PASSWORD=your_mysql_password
DB_NAME=your_database_name
NODE_ENV=production
```

### 5. Build Configuration
```json
// package.json updates
{
  "scripts": {
    "build": "vite build && tsc server/index.ts --outDir dist",
    "start": "node dist/index.js",
    "migrate": "drizzle-kit push:mysql"
  }
}
```

## Deployment Steps

1. **Prepare Database**:
   - Create MySQL database in Hostinger control panel
   - Note connection credentials

2. **Update Codebase**:
   - Switch to MySQL configuration
   - Update dependencies
   - Test locally with MySQL

3. **Upload to Hostinger**:
   - Build production version
   - Upload via File Manager or FTP
   - Configure environment variables

4. **Run Migrations**:
   - Execute database migrations
   - Seed initial data if needed

5. **Configure Domain**:
   - Point domain to application
   - Set up SSL certificate

## Cost Considerations
- **Shared Hosting**: ~$2-5/month (MySQL included)
- **VPS**: ~$10-20/month (PostgreSQL possible)
- **External DB**: $0-10/month (keep PostgreSQL)

Would you like me to implement the MySQL conversion or help set up an external PostgreSQL service?