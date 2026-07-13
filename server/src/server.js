import { createApp } from './app.js'
import { resolvePort } from './config/environment.js'

let port

try {
  port = resolvePort(process.env.PORT)
} catch (error) {
  const message =
    error instanceof Error ? error.message : 'Invalid server configuration.'

  console.error(`[Shrtn API] ${message}`)
  process.exit(1)
}

const app = createApp()

const server = app.listen(port, () => {
  console.log(`[Shrtn API] Running at http://localhost:${port}`)
})

server.on('error', (error) => {
  if (error.code === 'EADDRINUSE') {
    console.error(`[Shrtn API] Port ${port} is already in use.`)
  } else {
    console.error('[Shrtn API] Failed to start.', error)
  }

  process.exit(1)
})

function shutdown(signal) {
  console.log(`[Shrtn API] ${signal} received. Shutting down.`)

  server.close(() => {
    console.log('[Shrtn API] Shutdown complete.')
    process.exit(0)
  })
}

process.on('SIGINT', () => {
  shutdown('SIGINT')
})

process.on('SIGTERM', () => {
  shutdown('SIGTERM')
})