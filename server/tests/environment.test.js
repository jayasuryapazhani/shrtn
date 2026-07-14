import { describe, expect, it } from 'vitest'
import {
  resolvePort,
  resolvePublicBaseUrl,
} from '../src/config/environment.js'

describe('resolvePort', () => {
  it('uses port 5056 when PORT is undefined', () => {
    expect(resolvePort(undefined)).toBe(5056)
  })

  it('converts a valid PORT value to a number', () => {
    expect(resolvePort('8080')).toBe(8080)
  })

  it('rejects a non-integer PORT value', () => {
    expect(() => resolvePort('abc')).toThrow(
      'PORT must be an integer',
    )
  })

  it('rejects a PORT value outside the valid range', () => {
    expect(() => resolvePort('70000')).toThrow(
      'PORT must be an integer',
    )
  })
})

describe('resolvePublicBaseUrl', () => {
  it('returns undefined when no URL is configured', () => {
    expect(
      resolvePublicBaseUrl(undefined),
    ).toBeUndefined()
  })

  it('normalizes a valid HTTPS origin', () => {
    expect(
      resolvePublicBaseUrl(
        'https://shrtn-production.up.railway.app/',
      ),
    ).toBe(
      'https://shrtn-production.up.railway.app',
    )
  })

  it('supports localhost HTTP URLs', () => {
    expect(
      resolvePublicBaseUrl(
        'http://localhost:5056',
      ),
    ).toBe('http://localhost:5056')
  })

  it('rejects unsupported protocols', () => {
    expect(() =>
      resolvePublicBaseUrl('ftp://example.com'),
    ).toThrow(
      'PUBLIC_BASE_URL must use HTTP or HTTPS.',
    )
  })

  it('rejects paths, queries, and fragments', () => {
    expect(() =>
      resolvePublicBaseUrl(
        'https://example.com/api?value=1',
      ),
    ).toThrow(
      'PUBLIC_BASE_URL must contain only the origin',
    )
  })
})