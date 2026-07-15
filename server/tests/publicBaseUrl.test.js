import request from 'supertest'
import { describe, expect, it } from 'vitest'
import { createApp } from '../src/app.js'
import { createInMemoryLinkRepository } from '../src/repositories/inMemoryLinkRepository.js'

describe('public base URL', () => {
  it('uses the configured public domain in short URLs', async () => {
    const app = createApp({
      linkRepository:
        createInMemoryLinkRepository(),
      codeGenerator: () => 'AbC123x',
      now: () =>
        new Date('2026-07-14T20:00:00.000Z'),
      publicBaseUrl:
        'https://shrtn-production.up.railway.app',
    })

    const response = await request(app)
      .post('/api/v1/links')
      .send({
        originalUrl: 'https://example.com',
      })

    expect(response.status).toBe(201)

    expect(response.headers.location).toBe(
      'https://shrtn-production.up.railway.app/AbC123x',
    )

    expect(response.body.data.shortUrl).toBe(
      'https://shrtn-production.up.railway.app/AbC123x',
    )
  })
})