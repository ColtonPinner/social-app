const { Pool } = require('pg');

const connectionString = process.env.CLOUDFLARE_DATABASE_URL || process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error('CLOUDFLARE_DATABASE_URL or DATABASE_URL is required');
}

const pool = new Pool({ connectionString });

module.exports = { pool };
