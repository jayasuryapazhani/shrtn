import {
  describe,
  expect,
  it,
} from 'vitest'

import {
  findDuplicateRecentResult,
  normalizeUrlForComparison,
} from '../src/utils/duplicateLink'

function createRecentResult(
  originalUrl,
  shortCode = 'AbC123x',
) {
  return {
    originalUrl,
    source: 'popup',

    shortLink: {
      originalUrl,
      shortCode,

      shortUrl:
        `https://shrtn.up.railway.app/${shortCode}`,

      createdAt:
        '2026-07-31T16:00:00.000Z',
    },

    savedAt:
      '2026-07-31T16:01:00.000Z',
  }
}

describe('duplicate link utilities', () => {
  it('normalizes an HTTP or HTTPS URL', () => {
    expect(
      normalizeUrlForComparison(
        '  https://EXAMPLE.com  ',
      ),
    ).toBe(
      'https://example.com/',
    )
  })

  it('rejects unsupported protocols', () => {
    expect(
      normalizeUrlForComparison(
        'mailto:hello@example.com',
      ),
    ).toBe('')
  })

  it('finds an exact recent URL match', () => {
    const recentResult =
      createRecentResult(
        'https://example.com/article',
      )

    expect(
      findDuplicateRecentResult(
        'https://example.com/article',
        [recentResult],
      ),
    ).toBe(recentResult)
  })

  it('finds a normalized recent URL match', () => {
    const recentResult =
      createRecentResult(
        'https://example.com/',
      )

    expect(
      findDuplicateRecentResult(
        'https://EXAMPLE.com',
        [recentResult],
      ),
    ).toBe(recentResult)
  })

  it('returns null for a different URL', () => {
    const recentResult =
      createRecentResult(
        'https://example.com/first',
      )

    expect(
      findDuplicateRecentResult(
        'https://example.com/second',
        [recentResult],
      ),
    ).toBeNull()
  })
})