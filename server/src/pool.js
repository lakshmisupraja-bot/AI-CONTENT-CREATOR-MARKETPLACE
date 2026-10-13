import pg from 'pg'

const { Pool } = pg
const connectionString = process.env.DATABASE_URL?.trim()

if (!connectionString) {
  console.error('DATABASE_URL is required to start the CreatorBridge API.')
  process.exit(1)
}

export const pool = new Pool({
  connectionString,
  ssl: process.env.DATABASE_SSL === 'true'
    ? { rejectUnauthorized: true }
    : undefined,
  max: 10,
  idleTimeoutMillis: 30_000,
  connectionTimeoutMillis: 10_000,
})

pool.on('error', (error) => {
  console.error('Unexpected idle PostgreSQL client error.', error)
})
