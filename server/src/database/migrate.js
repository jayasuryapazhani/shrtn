import 'dotenv/config'
import { readFile } from 'node:fs/promises'
import { createDatabasePool } from './pool.js'

const migrationFile = new URL(
  '../../migrations/001_create_links.sql',
  import.meta.url,
)

let pool

try {
  pool = createDatabasePool()

  const sql = await readFile(migrationFile, 'utf8')

  await pool.query(sql)

  console.log('[Shrtn DB] Migration completed successfully.')
} catch (error) {
  console.error(
    '[Shrtn DB] Migration failed.',
    error instanceof Error ? error.message : error,
  )

  process.exitCode = 1
} finally {
  if (pool) {
    await pool.end()
  }
}