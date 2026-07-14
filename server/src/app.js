import express from 'express'
import {
  errorHandler,
  notFoundHandler,
} from './middleware/errorHandlers.js'
import { createInMemoryLinkRepository } from './repositories/inMemoryLinkRepository.js'
import { createLinkRouter } from './routes/linkRoutes.js'
import { createRedirectRouter } from './routes/redirectRoutes.js'
import { createLinkService } from './services/linkService.js'
import { generateShortCode } from './utils/shortCode.js'

export function createApp({
  linkRepository = createInMemoryLinkRepository(),
  codeGenerator = generateShortCode,
  now = () => new Date(),
} = {}) {
  const app = express()

  app.disable('x-powered-by')

  app.use(
    express.json({
      limit: '10kb',
    }),
  )

  const linkService = createLinkService({
    linkRepository,
    codeGenerator,
    now,
  })

  app.get('/health', (request, response) => {
    void request

    return response.status(200).json({
      status: 'UP',
      service: 'shrtn-api',
      version: '0.4.0',
      timestamp: new Date().toISOString(),
    })
  })

  app.use('/api/v1/links', createLinkRouter({ linkService }))

  app.use('/', createRedirectRouter({ linkService }))

  app.use(notFoundHandler)
  app.use(errorHandler)

  return app
}