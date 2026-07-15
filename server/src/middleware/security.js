import { rateLimit } from 'express-rate-limit'
import helmet from 'helmet'

const DEFAULT_WINDOW_MS = 15 * 60 * 1000

const RATE_LIMIT_ERROR = {
  error: {
    code: 'RATE_LIMIT_EXCEEDED',
    message:
      'Too many requests. Please try again later.',
  },
}

function createLimiter({
  windowMs,
  limit,
  identifier,
}) {
  return rateLimit({
    windowMs,
    limit,
    identifier,
    standardHeaders: 'draft-8',
    legacyHeaders: false,
    message: RATE_LIMIT_ERROR,
  })
}

export function createHelmetMiddleware({
  isProduction = false,
} = {}) {
  const options = {
    contentSecurityPolicy: false,
    crossOriginResourcePolicy: {
      policy: 'cross-origin',
    },
  }

  if (!isProduction) {
    options.strictTransportSecurity = false
  }

  return helmet(options)
}

export function createRateLimiters({
  windowMs = DEFAULT_WINDOW_MS,
  apiLimit = 120,
  createLinkLimit = 20,
  redirectLimit = 300,
} = {}) {
  return {
    api: createLimiter({
      windowMs,
      limit: apiLimit,
      identifier: 'api',
    }),

    createLink: createLimiter({
      windowMs,
      limit: createLinkLimit,
      identifier: 'create-link',
    }),

    redirect: createLimiter({
      windowMs,
      limit: redirectLimit,
      identifier: 'redirect',
    }),
  }
}