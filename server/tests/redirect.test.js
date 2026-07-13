import request from 'supertest'
import { describe, expect, it, vi } from 'vitest'
import { createApp } from '../src/app.js'
import { createInMemoryLinkRepository } from '../src/repositories/inMemoryLinkRepository.js'

const FIXED_DATE = new Date('2026-07-13T03:00:00.000Z')

function fixedNow() {
  return FIXED_DATE
}

describe('GET /:shortCode', () => {
  it('redirects a created short link to its original URL', async () => {
    const repository = createInMemoryLinkRepository()

    const app = createApp({
      linkRepository: repository,
      codeGenerator: () => 'AbC123x',
      now: fixedNow,
    })

    const createResponse = await request(app)
      .post('/api/v1/links')
      .set('Host', 'localhost:5056')
      .send({
        originalUrl: 'https://example.com/products?id=123',
      })

    expect(createResponse.status).toBe(201)

    const redirectResponse = await request(app)
      .get('/AbC123x')
      .redirects(0)

    expect(redirectResponse.status).toBe(302)
    expect(redirectResponse.headers.location).toBe(
      'https://example.com/products?id=123',
    )
  })

  it('returns LINK_NOT_FOUND for an unknown valid short code', async () => {
    const response = await request(createApp())
      .get('/NoLink1')
      .redirects(0)

    expect(response.status).toBe(404)

    expect(response.body).toEqual({
      error: {
        code: 'LINK_NOT_FOUND',
        message: 'The requested short link does not exist.',
      },
    })
  })

  it('uses the generic route-not-found response for an invalid code format', async () => {
    const response = await request(createApp())
      .get('/not-valid')
      .redirects(0)

    expect(response.status).toBe(404)

    expect(response.body).toEqual({
      error: {
        code: 'ROUTE_NOT_FOUND',
        message: 'Route GET /not-valid does not exist.',
      },
    })
  })

  it('returns a safe 500 response when the repository fails', async () => {
    const consoleError = vi
      .spyOn(console, 'error')
      .mockImplementation(() => {})

    const failingRepository = {
      findByCode() {
        throw new Error('Repository unavailable')
      },
    }

    try {
      const app = createApp({
        linkRepository: failingRepository,
        codeGenerator: () => 'Error12',
        now: fixedNow,
      })

      const response = await request(app)
        .get('/Error12')
        .redirects(0)

      expect(response.status).toBe(500)

      expect(response.body).toEqual({
        error: {
          code: 'INTERNAL_SERVER_ERROR',
          message: 'An unexpected server error occurred.',
        },
      })
    } finally {
      consoleError.mockRestore()
    }
  })
})