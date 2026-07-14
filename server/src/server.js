import 'dotenv/config'
import { createApp } from './app.js'
import {
  resolvePort,
  resolvePublicBaseUrl,
} from './config/environment.js'
import { createDatabasePool } from './database/pool.js'
import { createPostgresLinkRepository } from './repositories/postgresLinkRepository.js'

let port
let publicBaseUrl

try {
  port = resolvePort(process.env.PORT)

  const railwayBaseUrl =
    process.env.RAILWAY_PUBLIC_DOMAIN
      ? `https://${process.env.RAILWAY_PUBLIC_DOMAIN}`
      : undefined

  publicBaseUrl = resolvePublicBaseUrl(
    process.env.PUBLIC_BASE_URL ??
      railwayBaseUrl,
  )
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
  publicBaseUrl,
})

let server
let shuttingDown = false

async function startServer() {
  await pool.query('SELECT 1')

  server = app.listen(port, () => {
    console.log(
      `[Shrtn API] Running on port ${port}`,
    )

    console.log('[Shrtn API] PostgreSQL connected.')

    console.log(
      publicBaseUrl
        ? `[Shrtn API] Public URL: ${publicBaseUrl}`
        : `[Shrtn API] Local URL: http://localhost:${port}`,
    )
  })

  server.on('error', async (error) => {
    if (error.code === 'EADDRINUSE') {
      console.error(
        `[Shrtn API] Port ${port} is already in use.`,
      )
    } else {
      console.error(
        '[Shrtn API] Failed to start.',
        error,
      )
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

  console.log(
    `[Shrtn API] ${signal} received. Shutting down.`,
  )

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
    error instanceof Error
      ? error.message
      : error,
  )

  await pool.end()
  process.exit(1)
})