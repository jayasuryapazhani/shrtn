import request from 'supertest'
import { describe, expect, it, vi } from 'vitest'
import { createApp } from '../src/app.js'
import { createInMemoryLinkRepository } from '../src/repositories/inMemoryLinkRepository.js'

const FIXED_DATE = new Date('2026-07-13T00:00:00.000Z')

function fixedNow() {
  return FIXED_DATE
}

describe('POST /api/v1/links', () => {
  it('creates a short link for a valid HTTPS URL', async () => {
    const repository = createInMemoryLinkRepository()

    const app = createApp({
      linkRepository: repository,
      codeGenerator: () => 'AbC123x',
      now: fixedNow,
    })

    const response = await request(app)
      .post('/api/v1/links')
      .set('Host', 'localhost:5056')
      .send({
        originalUrl: 'https://example.com/products?id=123',
      })

    expect(response.status).toBe(201)
    expect(response.headers.location).toBe(
      'http://localhost:5056/AbC123x',
    )

    expect(response.body).toEqual({
      data: {
        originalUrl: 'https://example.com/products?id=123',
        shortCode: 'AbC123x',
        shortUrl: 'http://localhost:5056/AbC123x',
        createdAt: '2026-07-13T00:00:00.000Z',
      },
    })

    expect(repository.count()).toBe(1)
  })

  it('trims whitespace around the original URL', async () => {
    const app = createApp({
      codeGenerator: () => 'Trim123',
      now: fixedNow,
    })

    const response = await request(app)
      .post('/api/v1/links')
      .set('Host', 'localhost:5056')
      .send({
        originalUrl: '  https://example.com/docs  ',
      })

    expect(response.status).toBe(201)
    expect(response.body.data.originalUrl).toBe(
      'https://example.com/docs',
    )
  })

  it('rejects a request without originalUrl', async () => {
    const response = await request(createApp())
      .post('/api/v1/links')
      .send({})

    expect(response.status).toBe(400)
    expect(response.body.error.code).toBe('VALIDATION_ERROR')
    expect(response.body.error.details).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          field: 'originalUrl',
        }),
      ]),
    )
  })

it('rejects an invalid URL', async () => {
  const response = await request(createApp())
    .post('/api/v1/links')
    .send({
      originalUrl: 'not a URL',
    })

  expect(response.status).toBe(400)
  expect(response.body.error.code).toBe('VALIDATION_ERROR')
  expect(response.body.error.details).toEqual(
    expect.arrayContaining([
      expect.objectContaining({
        field: 'originalUrl',
        message: 'originalUrl must be a valid URL.',
      }),
    ]),
  )
})

  it('rejects unsupported URL protocols', async () => {
    const response = await request(createApp())
      .post('/api/v1/links')
      .send({
        originalUrl: 'ftp://example.com/file.zip',
      })

    expect(response.status).toBe(400)
    expect(response.body.error.code).toBe('VALIDATION_ERROR')
    expect(response.body.error.details).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          message: 'Only HTTP and HTTPS URLs are supported.',
        }),
      ]),
    )
  })

  it('rejects unsupported request fields', async () => {
    const response = await request(createApp())
      .post('/api/v1/links')
      .send({
        originalUrl: 'https://example.com',
        unsupportedField: true,
      })

    expect(response.status).toBe(400)
    expect(response.body.error.code).toBe('VALIDATION_ERROR')
  })

  it('returns 400 for malformed JSON', async () => {
    const response = await request(createApp())
      .post('/api/v1/links')
      .set('Content-Type', 'application/json')
      .send('{"originalUrl":')

    expect(response.status).toBe(400)
    expect(response.body).toEqual({
      error: {
        code: 'INVALID_JSON',
        message: 'The request body contains invalid JSON.',
      },
    })
  })

  it('returns 413 when the request body exceeds 10 KB', async () => {
    const largeUrl = `https://example.com/${'a'.repeat(12000)}`

    const response = await request(createApp())
      .post('/api/v1/links')
      .send({
        originalUrl: largeUrl,
      })

    expect(response.status).toBe(413)
    expect(response.body.error.code).toBe('REQUEST_TOO_LARGE')
  })

  it('returns 409 when a unique short code cannot be generated', async () => {
    const repository = createInMemoryLinkRepository()

    repository.save({
      originalUrl: 'https://existing.example.com',
      shortCode: 'Same123',
      shortUrl: 'http://localhost:5056/Same123',
      createdAt: '2026-07-13T00:00:00.000Z',
    })

    const app = createApp({
      linkRepository: repository,
      codeGenerator: () => 'Same123',
      now: fixedNow,
    })

    const response = await request(app)
      .post('/api/v1/links')
      .send({
        originalUrl: 'https://new.example.com',
      })

    expect(response.status).toBe(409)
    expect(response.body).toEqual({
      error: {
        code: 'SHORT_CODE_CONFLICT',
        message: 'A unique short code could not be generated.',
      },
    })
  })

  it('returns a safe 500 response for an unexpected repository error', async () => {
    const consoleError = vi
      .spyOn(console, 'error')
      .mockImplementation(() => {})

    const failingRepository = {
      existsByCode() {
        throw new Error('Repository unavailable')
      },

      save() {
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
        .post('/api/v1/links')
        .send({
          originalUrl: 'https://example.com',
        })

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