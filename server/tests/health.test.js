import request from 'supertest'
import { describe, expect, it } from 'vitest'
import { createApp } from '../src/app.js'

describe('GET /health', () => {
  it('returns the Shrtn API health status', async () => {
    const app = createApp()

    const response = await request(app).get('/health')

    expect(response.status).toBe(200)
    expect(response.headers['content-type']).toMatch(/application\/json/)

    expect(response.body).toMatchObject({
      status: 'UP',
      service: 'shrtn-api',
      version: '1.0.0',
    })

    expect(typeof response.body.timestamp).toBe('string')
    expect(Number.isNaN(Date.parse(response.body.timestamp))).toBe(false)
  })
})

describe('unknown routes', () => {
  it('returns a structured 404 error', async () => {
    const app = createApp()

    const response = await request(app).get('/missing-route')

    expect(response.status).toBe(404)

    expect(response.body).toEqual({
      error: {
        code: 'ROUTE_NOT_FOUND',
        message: 'Route GET /missing-route does not exist.',
      },
    })
  })
})
