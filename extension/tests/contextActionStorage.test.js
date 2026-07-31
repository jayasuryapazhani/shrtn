import {
  describe,
  expect,
  it,
  vi,
} from 'vitest'

import {
  PENDING_CONTEXT_RESULT_KEY,
  savePendingContextActionResult,
  takePendingContextActionResult,
} from '../src/services/contextActionStorage'

describe('context action storage', () => {
  it('stores a pending result', async () => {
    const set = vi.fn().mockResolvedValue()

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

    expect(receivedResult).toEqual(result)

    expect(remove).toHaveBeenCalledWith(
      PENDING_CONTEXT_RESULT_KEY,
    )
  })

  it('returns null when no result exists', async () => {
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

    expect(remove).not.toHaveBeenCalled()
  })
})