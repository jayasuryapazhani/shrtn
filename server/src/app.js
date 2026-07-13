import express from 'express'

export function createApp() {
  const app = express()

  app.disable('x-powered-by')

  app.use(
    express.json({
      limit: '10kb',
    }),
  )

  app.get('/health', (request, response) => {
    void request

    return response.status(200).json({
      status: 'UP',
      service: 'shrtn-api',
      version: '0.1.0',
      timestamp: new Date().toISOString(),
    })
  })

  app.use((request, response) => {
    return response.status(404).json({
      error: {
        code: 'ROUTE_NOT_FOUND',
        message: `Route ${request.method} ${request.originalUrl} does not exist.`,
      },
    })
  })

  return app
}