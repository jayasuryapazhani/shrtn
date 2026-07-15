import express from 'express'
import {
  errorHandler,
  notFoundHandler,
} from './middleware/errorHandlers.js'
import {
  createHelmetMiddleware,
  createRateLimiters,
} from './middleware/security.js'
import { createInMemoryLinkRepository } from './repositories/inMemoryLinkRepository.js'
import { createLinkRouter } from './routes/linkRoutes.js'
import { createRedirectRouter } from './routes/redirectRoutes.js'
import { createLinkService } from './services/linkService.js'
import { generateShortCode } from './utils/shortCode.js'

export function createApp({
  linkRepository =
    createInMemoryLinkRepository(),
  codeGenerator = generateShortCode,
  now = () => new Date(),
  publicBaseUrl,
  isProduction =
    process.env.NODE_ENV === 'production',
  trustProxy = false,
  rateLimiters = createRateLimiters(),
} = {}) {
  const app = express()

  app.set('trust proxy', trustProxy)
  app.disable('x-powered-by')
app.locals.publicBaseUrl = publicBaseUrl

  app.use(
    createHelmetMiddleware({
      isProduction,
    }),
  )

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
      version: '0.8.0',
      timestamp: new Date().toISOString(),
    })
  })

  app.use('/api/v1', rateLimiters.api)

  app.use(
    '/api/v1/links',
    createLinkRouter({
      linkService,
      createLinkLimiter:
        rateLimiters.createLink,
    }),
  )

  app.use(
    '/',
    createRedirectRouter({
      linkService,
      redirectLimiter:
        rateLimiters.redirect,
    }),
  )

  app.use(notFoundHandler)
  app.use(errorHandler)

  return app
}