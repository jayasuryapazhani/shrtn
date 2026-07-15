import request from 'supertest'
import {
  describe,
  expect,
  it,
} from 'vitest'
import { createApp } from '../src/app.js'
import {
  createRateLimiters,
} from '../src/middleware/security.js'
import { createInMemoryLinkRepository } from '../src/repositories/inMemoryLinkRepository.js'

function createTestRateLimiters({
  apiLimit = 100,
  createLinkLimit = 100,
  redirectLimit = 100,
} = {}) {
  return createRateLimiters({
    windowMs: 60 * 1000,
    apiLimit,
    createLinkLimit,
    redirectLimit,
  })
}

describe('API security', () => {
  it('sets defensive HTTP response headers', async () => {
    const response = await request(
      createApp(),
    ).get('/health')

    expect(response.status).toBe(200)

    expect(
      response.headers[
        'x-content-type-options'
      ],
    ).toBe('nosniff')

    expect(
      response.headers['x-frame-options'],
    ).toBe('SAMEORIGIN')

    expect(
      response.headers[
        'referrer-policy'
      ],
    ).toBe('no-referrer')

    expect(
      response.headers['x-powered-by'],
    ).toBeUndefined()
  })

  it('disables HSTS during local development', async () => {
    const response = await request(
      createApp({
        isProduction: false,
      }),
    ).get('/health')

    expect(
      response.headers[
        'strict-transport-security'
      ],
    ).toBeUndefined()
  })

  it('enables HSTS in production', async () => {
    const response = await request(
      createApp({
        isProduction: true,
      }),
    ).get('/health')

    expect(
      response.headers[
        'strict-transport-security'
      ],
    ).toContain('max-age=')
  })

  it('rate limits API requests per trusted client IP', async () => {
    const app = createApp({
      trustProxy: 1,
      rateLimiters:
        createTestRateLimiters({
          apiLimit: 1,
        }),
    })

    const firstResponse =
      await request(app)
        .get(
          '/api/v1/links/NoLink1/analytics',
        )
        .set(
          'X-Forwarded-For',
          '203.0.113.10',
        )

    expect(firstResponse.status).toBe(404)

    const blockedResponse =
      await request(app)
        .get(
          '/api/v1/links/NoLink1/analytics',
        )
        .set(
          'X-Forwarded-For',
          '203.0.113.10',
        )

    expect(blockedResponse.status).toBe(429)

    expect(blockedResponse.body).toEqual({
      error: {
        code: 'RATE_LIMIT_EXCEEDED',
        message:
          'Too many requests. Please try again later.',
      },
    })

    expect(
      blockedResponse.headers.ratelimit,
    ).toBeDefined()

    const otherClientResponse =
      await request(app)
        .get(
          '/api/v1/links/NoLink1/analytics',
        )
        .set(
          'X-Forwarded-For',
          '203.0.113.11',
        )

    expect(
      otherClientResponse.status,
    ).toBe(404)
  })

  it('applies a stricter create-link limit', async () => {
    const repository =
      createInMemoryLinkRepository()

    let sequence = 0

    const app = createApp({
      linkRepository: repository,
      codeGenerator: () => {
        sequence += 1

        return sequence === 1
          ? 'Limit01'
          : 'Limit02'
      },
      rateLimiters:
        createTestRateLimiters({
          createLinkLimit: 1,
        }),
    })

    const firstResponse =
      await request(app)
        .post('/api/v1/links')
        .send({
          originalUrl:
            'https://example.com/one',
        })

    expect(firstResponse.status).toBe(201)

    const blockedResponse =
      await request(app)
        .post('/api/v1/links')
        .send({
          originalUrl:
            'https://example.com/two',
        })

    expect(blockedResponse.status).toBe(429)

    expect(
      blockedResponse.body.error.code,
    ).toBe('RATE_LIMIT_EXCEEDED')
  })

  it('limits repeated redirect requests', async () => {
    const repository =
      createInMemoryLinkRepository()

    repository.save({
      originalUrl:
        'https://example.com/redirect',
      shortCode: 'Rate123',
      createdAt:
        '2026-07-15T01:00:00.000Z',
    })

    const app = createApp({
      linkRepository: repository,
      rateLimiters:
        createTestRateLimiters({
          redirectLimit: 1,
        }),
    })

    const firstResponse =
      await request(app)
        .get('/Rate123')
        .redirects(0)

    expect(firstResponse.status).toBe(302)

    const blockedResponse =
      await request(app)
        .get('/Rate123')
        .redirects(0)

    expect(blockedResponse.status).toBe(429)

    expect(
      blockedResponse.body.error.code,
    ).toBe('RATE_LIMIT_EXCEEDED')
  })

  it('does not rate limit Railway health checks', async () => {
    const app = createApp({
      rateLimiters:
        createTestRateLimiters({
          apiLimit: 1,
          createLinkLimit: 1,
          redirectLimit: 1,
        }),
    })

    for (
      let requestNumber = 0;
      requestNumber < 5;
      requestNumber += 1
    ) {
      const response =
        await request(app).get('/health')

      expect(response.status).toBe(200)
    }
  })
})