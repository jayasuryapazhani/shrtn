import pg from 'pg'

const { Pool } = pg

export function createDatabasePool({
  connectionString = process.env.DATABASE_URL,
} = {}) {
  if (!connectionString) {
    throw new Error('DATABASE_URL is required.')
  }

  return new Pool({
    connectionString,
    max: 5,
    connectionTimeoutMillis: 10000,
    idleTimeoutMillis: 30000,
  })
}