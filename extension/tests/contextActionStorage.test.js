import {
  describe,
  expect,
  it,
  vi,
} from 'vitest'

import {
  LAST_GENERATED_RESULT_KEY,
  MAX_RECENT_RESULTS,
  PENDING_CONTEXT_RESULT_KEY,
  RECENT_GENERATED_RESULTS_KEY,
  clearRecentGeneratedResults,
  getLastGeneratedResult,
  getRecentGeneratedResults,
  saveLastGeneratedResult,
  savePendingContextActionResult,
  takePendingContextActionResult,
} from '../src/services/contextActionStorage'

function createGeneratedResult(
  shortCode,
  overrides = {},
) {
  return {
    originalUrl:
      `https://example.com/${shortCode}`,

    source: 'popup',

    shortLink: {
      originalUrl:
        `https://example.com/${shortCode}`,

      shortCode,

      shortUrl:
        `https://shrtn.up.railway.app/${shortCode}`,

      createdAt:
        '2026-07-31T15:00:00.000Z',
    },

    savedAt:
      '2026-07-31T15:01:00.000Z',

    ...overrides,
  }
}

describe('context action storage', () => {
  it('stores a pending result', async () => {
    const set =
      vi.fn().mockResolvedValue()

    const result = {
      status: 'success',

      originalUrl:
        'https://example.com',
    }

    await savePendingContextActionResult(
      result,
      {
        storage: {
          local: {
            set,
          },
        },
      },
    )

    expect(set).toHaveBeenCalledWith({
      [PENDING_CONTEXT_RESULT_KEY]:
        result,
    })
  })

  it('returns and removes a pending result', async () => {
    const result = {
      status: 'success',

      originalUrl:
        'https://example.com',
    }

    const get =
      vi.fn().mockResolvedValue({
        [PENDING_CONTEXT_RESULT_KEY]:
          result,
      })

    const remove =
      vi.fn().mockResolvedValue()

    const receivedResult =
      await takePendingContextActionResult({
        storage: {
          local: {
            get,
            remove,
          },
        },
      })

    expect(receivedResult).toEqual(
      result,
    )

    expect(remove).toHaveBeenCalledWith(
      PENDING_CONTEXT_RESULT_KEY,
    )
  })

  it('returns null when no pending result exists', async () => {
    const get =
      vi.fn().mockResolvedValue({})

    const remove = vi.fn()

    const result =
      await takePendingContextActionResult({
        storage: {
          local: {
            get,
            remove,
          },
        },
      })

    expect(result).toBeNull()

    expect(
      remove,
    ).not.toHaveBeenCalled()
  })

  it('stores the last result and adds it to recent links', async () => {
    const get =
      vi.fn().mockResolvedValue({})

    const set =
      vi.fn().mockResolvedValue()

    const shortLink = {
      originalUrl:
        'https://example.com/article',

      shortCode:
        'AbC123x',

      shortUrl:
        'https://shrtn.up.railway.app/AbC123x',

      createdAt:
        '2026-07-31T15:00:00.000Z',
    }

    const storedResult =
      await saveLastGeneratedResult(
        {
          originalUrl:
            'https://example.com/article',

          source:
            'context-page',

          shortLink,
        },
        {
          storage: {
            local: {
              get,
              set,
            },
          },
        },
      )

    expect(storedResult).toEqual({
      originalUrl:
        'https://example.com/article',

      source:
        'context-page',

      shortLink,

      savedAt:
        expect.any(String),
    })

    expect(set).toHaveBeenCalledWith({
      [LAST_GENERATED_RESULT_KEY]: {
        originalUrl:
          'https://example.com/article',

        source:
          'context-page',

        shortLink,

        savedAt:
          expect.any(String),
      },

      [RECENT_GENERATED_RESULTS_KEY]: [
        {
          originalUrl:
            'https://example.com/article',

          source:
            'context-page',

          shortLink,

          savedAt:
            expect.any(String),
        },
      ],
    })
  })

  it('restores the last generated result', async () => {
    const storedResult =
      createGeneratedResult(
        'AbC123x',
      )

    const get =
      vi.fn().mockResolvedValue({
        [LAST_GENERATED_RESULT_KEY]:
          storedResult,
      })

    const result =
      await getLastGeneratedResult({
        storage: {
          local: {
            get,
          },
        },
      })

    expect(get).toHaveBeenCalledWith(
      LAST_GENERATED_RESULT_KEY,
    )

    expect(result).toEqual(
      storedResult,
    )
  })

  it('returns valid recent results', async () => {
    const firstResult =
      createGeneratedResult('First01')

    const secondResult =
      createGeneratedResult('Second2')

    const get =
      vi.fn().mockResolvedValue({
        [RECENT_GENERATED_RESULTS_KEY]: [
          firstResult,

          {
            originalUrl:
              'https://invalid.example.com',

            shortLink: {
              shortCode:
                'Invalid',
            },
          },

          secondResult,
        ],
      })

    const results =
      await getRecentGeneratedResults({
        storage: {
          local: {
            get,
          },
        },
      })

    expect(results).toEqual([
      firstResult,
      secondResult,
    ])
  })

  it('moves a repeated result to the beginning', async () => {
    const repeatedResult =
      createGeneratedResult('Repeat1')

    const otherResult =
      createGeneratedResult('Other01')

    const get =
      vi.fn().mockResolvedValue({
        [RECENT_GENERATED_RESULTS_KEY]: [
          otherResult,
          repeatedResult,
        ],
      })

    const set =
      vi.fn().mockResolvedValue()

    await saveLastGeneratedResult(
      {
        originalUrl:
          repeatedResult.originalUrl,

        source:
          'context-link',

        shortLink:
          repeatedResult.shortLink,
      },
      {
        storage: {
          local: {
            get,
            set,
          },
        },
      },
    )

    const savedValue =
      set.mock.calls[0][0]

    const recentResults =
      savedValue[
        RECENT_GENERATED_RESULTS_KEY
      ]

    expect(recentResults).toHaveLength(
      2,
    )

    expect(
      recentResults[0].shortLink
        .shortCode,
    ).toBe('Repeat1')

    expect(
      recentResults[0].source,
    ).toBe('context-link')

    expect(
      recentResults[1].shortLink
        .shortCode,
    ).toBe('Other01')
  })

  it('keeps no more than twenty recent results', async () => {
    const existingResults =
      Array.from(
        {
          length:
            MAX_RECENT_RESULTS,
        },
        (_, index) =>
          createGeneratedResult(
            `Code${index}`,
          ),
      )

    const get =
      vi.fn().mockResolvedValue({
        [RECENT_GENERATED_RESULTS_KEY]:
          existingResults,
      })

    const set =
      vi.fn().mockResolvedValue()

    await saveLastGeneratedResult(
      createGeneratedResult(
        'Newest1',
      ),
      {
        storage: {
          local: {
            get,
            set,
          },
        },
      },
    )

    const savedValue =
      set.mock.calls[0][0]

    const recentResults =
      savedValue[
        RECENT_GENERATED_RESULTS_KEY
      ]

    expect(recentResults).toHaveLength(
      MAX_RECENT_RESULTS,
    )

    expect(
      recentResults[0].shortLink
        .shortCode,
    ).toBe('Newest1')

    expect(
      recentResults.some(
        (result) =>
          result.shortLink
            .shortCode ===
          'Code19',
      ),
    ).toBe(false)
  })

  it('clears recent results', async () => {
    const remove =
      vi.fn().mockResolvedValue()

    await expect(
      clearRecentGeneratedResults({
        storage: {
          local: {
            remove,
          },
        },
      }),
    ).resolves.toBe(true)

    expect(remove).toHaveBeenCalledWith(
      RECENT_GENERATED_RESULTS_KEY,
    )
  })

  it('ignores an invalid saved result', async () => {
    const get =
      vi.fn().mockResolvedValue({
        [LAST_GENERATED_RESULT_KEY]: {
          originalUrl:
            'https://example.com',

          shortLink: {
            shortUrl:
              'https://shrtn.up.railway.app/invalid',
          },
        },
      })

    const result =
      await getLastGeneratedResult({
        storage: {
          local: {
            get,
          },
        },
      })

    expect(result).toBeNull()
  })
})