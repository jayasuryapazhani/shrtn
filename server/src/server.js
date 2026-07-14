import 'dotenv/config'
import { createApp } from './app.js'
import { resolvePort } from './config/environment.js'
import { createDatabasePool } from './database/pool.js'
import { createPostgresLinkRepository } from './repositories/postgresLinkRepository.js'

let port

try {
  port = resolvePort(process.env.PORT)
} catch (error) {
  const message =
    error instanceof Error
      ? error.message
      : 'Invalid server configuration.'

  console.error(`[Shrtn API] ${message}`)
  process.exit(1)
}

let pool

try {
  pool = createDatabasePool()
} catch (error) {
  const message =
    error instanceof Error
      ? error.message
      : 'Invalid database configuration.'

  console.error(`[Shrtn API] ${message}`)
  process.exit(1)
}

const linkRepository = createPostgresLinkRepository({
  pool,
})

const app = createApp({
  linkRepository,
})

let server
let shuttingDown = false

async function startServer() {
  await pool.query('SELECT 1')

  server = app.listen(port, () => {
    console.log(`[Shrtn API] Running at http://localhost:${port}`)
    console.log('[Shrtn API] PostgreSQL connected.')
  })

  server.on('error', async (error) => {
    if (error.code === 'EADDRINUSE') {
      console.error(`[Shrtn API] Port ${port} is already in use.`)
    } else {
      console.error('[Shrtn API] Failed to start.', error)
    }

    await pool.end()
    process.exit(1)
  })
}

async function shutdown(signal) {
  if (shuttingDown) {
    return
  }

  shuttingDown = true

  console.log(`[Shrtn API] ${signal} received. Shutting down.`)

  if (server) {
    await new Promise((resolve, reject) => {
      server.close((error) => {
        if (error) {
          reject(error)
          return
        }

        resolve()
      })
    })
  }

  await pool.end()

  console.log('[Shrtn API] Shutdown complete.')
  process.exit(0)
}

process.on('SIGINT', () => {
  void shutdown('SIGINT')
})

process.on('SIGTERM', () => {
  void shutdown('SIGTERM')
})

startServer().catch(async (error) => {
  console.error(
    '[Shrtn API] Database connection failed.',
    error instanceof Error ? error.message : error,
  )

  await pool.end()
  process.exit(1)
})