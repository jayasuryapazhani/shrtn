import {
  describe,
  expect,
  it,
  vi,
} from 'vitest'

import {
  LAST_GENERATED_RESULT_KEY,
  PENDING_CONTEXT_RESULT_KEY,
  getLastGeneratedResult,
  saveLastGeneratedResult,
  savePendingContextActionResult,
  takePendingContextActionResult,
} from '../src/services/contextActionStorage'

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

  it('stores the last generated result', async () => {
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
    })
  })

  it('restores the last generated result', async () => {
    const storedResult = {
      originalUrl:
        'https://example.com/article',

      source:
        'popup',

      shortLink: {
        originalUrl:
          'https://example.com/article',

        shortCode:
          'AbC123x',

        shortUrl:
          'https://shrtn.up.railway.app/AbC123x',

        createdAt:
          '2026-07-31T15:00:00.000Z',
      },

      savedAt:
        '2026-07-31T15:01:00.000Z',
    }

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