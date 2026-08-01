import request from 'supertest'
import {
  describe,
  expect,
  it,
} from 'vitest'
import { createApp } from '../src/app.js'

describe('GET /privacy', () => {
  it(
    'serves the Shrtn privacy policy',
    async () => {
      const app = createApp()

      const response =
        await request(app).get(
          '/privacy',
        )

      expect(response.status).toBe(200)

      expect(
        response.headers['content-type'],
      ).toMatch(/text\/html/)

      expect(response.text).toContain(
        'Privacy Policy | Shrtn',
      )

      expect(response.text).toContain(
        'Privacy at Shrtn',
      )

      expect(response.text).toContain(
        'Chrome Web Store Limited Use',
      )
    },
  )
})