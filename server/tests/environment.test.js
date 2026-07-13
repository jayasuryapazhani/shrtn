import { describe, expect, it } from 'vitest'
import { resolvePort } from '../src/config/environment.js'

describe('resolvePort', () => {
  it('uses port 5056 when PORT is not configured', () => {
    expect(resolvePort(undefined)).toBe(5056)
  })

  it('accepts a valid configured port', () => {
    expect(resolvePort('8080')).toBe(8080)
  })

  it('rejects a non-numeric port', () => {
    expect(() => resolvePort('invalid')).toThrow(
      'PORT must be an integer between 1 and 65535.',
    )
  })

  it('rejects a port outside the valid range', () => {
    expect(() => resolvePort('65536')).toThrow(
      'PORT must be an integer between 1 and 65535.',
    )
  })
})