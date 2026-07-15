import 'dotenv/config'
import {
  readFile,
  readdir,
} from 'node:fs/promises'
import { createDatabasePool } from './pool.js'

const migrationsDirectory = new URL(
  '../../migrations/',
  import.meta.url,
)

let pool

try {
  pool = createDatabasePool()

  const entries = await readdir(
    migrationsDirectory,
    {
      withFileTypes: true,
    },
  )

  const migrationFiles = entries
    .filter(
      (entry) =>
        entry.isFile() &&
        /^\d+.*\.sql$/.test(entry.name),
    )
    .map((entry) => entry.name)
    .sort()

  if (migrationFiles.length === 0) {
    throw new Error(
      'No database migration files were found.',
    )
  }

  for (const fileName of migrationFiles) {
    const migrationFile = new URL(
      fileName,
      migrationsDirectory,
    )

    const sql = await readFile(
      migrationFile,
      'utf8',
    )

    await pool.query(sql)

    console.log(
      `[Shrtn DB] Applied ${fileName}.`,
    )
  }

  console.log(
    `[Shrtn DB] ${migrationFiles.length} migration(s) completed successfully.`,
  )
} catch (error) {
  console.error(
    '[Shrtn DB] Migration failed.',
    error instanceof Error
      ? error.message
      : error,
  )

  process.exitCode = 1
} finally {
  if (pool) {
    await pool.end()
  }
}