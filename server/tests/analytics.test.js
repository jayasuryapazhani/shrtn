import request from 'supertest'
import {
  describe,
  expect,
  it,
  vi,
} from 'vitest'
import { createApp } from '../src/app.js'
import { createInMemoryLinkRepository } from '../src/repositories/inMemoryLinkRepository.js'

const CREATED_AT =
  '2026-07-15T01:00:00.000Z'

const CLICKED_AT =
  '2026-07-15T02:00:00.000Z'

describe(
  'GET /api/v1/links/:shortCode/analytics',
  () => {
    it('returns analytics for a stored link', async () => {
      const repository =
        createInMemoryLinkRepository()

      repository.save({
        originalUrl:
          'https://example.com/analytics',
        shortCode: 'Stats12',
        createdAt: CREATED_AT,
      })

      repository.recordClick(
        'Stats12',
        CLICKED_AT,
      )

      repository.recordClick(
        'Stats12',
        CLICKED_AT,
      )

      const app = createApp({
        linkRepository: repository,
      })

      const response = await request(app)
        .get(
          '/api/v1/links/Stats12/analytics',
        )

      expect(response.status).toBe(200)

      expect(response.body).toEqual({
        data: {
          originalUrl:
            'https://example.com/analytics',
          shortCode: 'Stats12',
          createdAt: CREATED_AT,
          clickCount: 2,
          lastClickedAt: CLICKED_AT,
        },
      })
    })

    it('returns zero clicks for a new link', async () => {
      const repository =
        createInMemoryLinkRepository()

      repository.save({
        originalUrl:
          'https://example.com/new',
        shortCode: 'New1234',
        createdAt: CREATED_AT,
      })

      const app = createApp({
        linkRepository: repository,
      })

      const response = await request(app)
        .get(
          '/api/v1/links/New1234/analytics',
        )

      expect(response.status).toBe(200)

      expect(response.body.data).toEqual({
        originalUrl:
          'https://example.com/new',
        shortCode: 'New1234',
        createdAt: CREATED_AT,
        clickCount: 0,
        lastClickedAt: null,
      })
    })

    it('returns LINK_NOT_FOUND for an unknown code', async () => {
      const response = await request(
        createApp(),
      ).get(
        '/api/v1/links/NoLink1/analytics',
      )

      expect(response.status).toBe(404)

      expect(response.body).toEqual({
        error: {
          code: 'LINK_NOT_FOUND',
          message:
            'The requested short link does not exist.',
        },
      })
    })

    it('uses route-not-found for an invalid code format', async () => {
      const response = await request(
        createApp(),
      ).get(
        '/api/v1/links/not-valid/analytics',
      )

      expect(response.status).toBe(404)

      expect(response.body).toEqual({
        error: {
          code: 'ROUTE_NOT_FOUND',
          message:
            'Route GET /api/v1/links/not-valid/analytics does not exist.',
        },
      })
    })

    it('returns a safe 500 response when analytics lookup fails', async () => {
      const consoleError = vi
        .spyOn(console, 'error')
        .mockImplementation(() => {})

      const repository = {
        findAnalyticsByCode() {
          throw new Error(
            'Repository unavailable',
          )
        },
      }

      try {
        const app = createApp({
          linkRepository: repository,
        })

        const response = await request(app)
          .get(
            '/api/v1/links/Error12/analytics',
          )

        expect(response.status).toBe(500)

        expect(response.body).toEqual({
          error: {
            code:
              'INTERNAL_SERVER_ERROR',
            message:
              'An unexpected server error occurred.',
          },
        })
      } finally {
        consoleError.mockRestore()
      }
    })
  },
)