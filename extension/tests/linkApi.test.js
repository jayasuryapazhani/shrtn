import {
  afterEach,
  describe,
  expect,
  it,
  vi,
} from 'vitest'

import {
  createShortLink,
  getLinkAnalytics,
} from '../src/services/linkApi'

function createLinkResponse() {
  return {
    ok: true,
    status: 201,

    json:
      vi.fn().mockResolvedValue({
        data: {
          originalUrl:
            'https://example.com',

          shortCode:
            'AbC123x',

          shortUrl:
            'https://shrtn.up.railway.app/AbC123x',

          createdAt:
            '2026-07-13T12:00:00.000Z',
        },
      }),
  }
}

function createAnalyticsResponse() {
  return {
    ok: true,
    status: 200,

    json:
      vi.fn().mockResolvedValue({
        data: {
          originalUrl:
            'https://example.com',

          shortCode:
            'AbC123x',

          createdAt:
            '2026-07-15T01:00:00.000Z',

          clickCount: 3,

          lastClickedAt:
            '2026-07-15T02:00:00.000Z',
        },
      }),
  }
}

afterEach(() => {
  vi.useRealTimers()
  vi.unstubAllGlobals()
})

describe('createShortLink', () => {
  it('creates and returns a shortened link', async () => {
    const fetchMock =
      vi.fn().mockResolvedValue(
        createLinkResponse(),
      )

    vi.stubGlobal(
      'fetch',
      fetchMock,
    )

    const result =
      await createShortLink(
        'https://example.com',
      )

    expect(result.shortUrl).toBe(
      'https://shrtn.up.railway.app/AbC123x',
    )

    expect(
      fetchMock,
    ).toHaveBeenCalledWith(
      'https://shrtn.up.railway.app/api/v1/links',

      expect.objectContaining({
        method: 'POST',

        headers: {
          'Content-Type':
            'application/json',
        },

        body: JSON.stringify({
          originalUrl:
            'https://example.com',
        }),

        signal:
          expect.any(Object),
      }),
    )
  })

  it('returns the API error message', async () => {
    vi.stubGlobal(
      'fetch',

      vi.fn().mockResolvedValue({
        ok: false,
        status: 400,

        json:
          vi.fn().mockResolvedValue({
            error: {
              message:
                'Only HTTP and HTTPS URLs are supported.',
            },
          }),
      }),
    )

    await expect(
      createShortLink(
        'ftp://example.com',
      ),
    ).rejects.toThrow(
      'Only HTTP and HTTPS URLs are supported.',
    )
  })

  it('reports when the API is unavailable', async () => {
    vi.stubGlobal(
      'fetch',

      vi.fn().mockRejectedValue(
        new Error(
          'Connection refused',
        ),
      ),
    )

    await expect(
      createShortLink(
        'https://example.com',
      ),
    ).rejects.toThrow(
      'Shrtn API is temporarily unavailable. Please try again.',
    )
  })

  it('does not automatically retry link creation', async () => {
    const fetchMock =
      vi.fn().mockRejectedValue(
        new Error(
          'Connection refused',
        ),
      )

    vi.stubGlobal(
      'fetch',
      fetchMock,
    )

    await expect(
      createShortLink(
        'https://example.com',
        {
          retryDelayMs: 0,
        },
      ),
    ).rejects.toThrow(
      'Shrtn API is temporarily unavailable. Please try again.',
    )

    expect(
      fetchMock,
    ).toHaveBeenCalledOnce()
  })

  it('stops a link request after the timeout', async () => {
    vi.useFakeTimers()

    const fetchMock = vi.fn(
      (_url, options) =>
        new Promise(
          (_resolve, reject) => {
            options.signal
              .addEventListener(
                'abort',
                () => {
                  const error =
                    new Error(
                      'Request aborted',
                    )

                  error.name =
                    'AbortError'

                  reject(error)
                },
              )
          },
        ),
    )

    vi.stubGlobal(
      'fetch',
      fetchMock,
    )

    const rejection =
      expect(
        createShortLink(
          'https://example.com',
          {
            timeoutMs: 25,
          },
        ),
      ).rejects.toThrow(
        'Shrtn API took too long to respond. Please try again.',
      )

    await vi.advanceTimersByTimeAsync(
      25,
    )

    await rejection

    expect(
      fetchMock,
    ).toHaveBeenCalledOnce()
  })

  it('rejects a successful response without a short URL', async () => {
    vi.stubGlobal(
      'fetch',

      vi.fn().mockResolvedValue({
        ok: true,
        status: 201,

        json:
          vi.fn().mockResolvedValue({
            data: {},
          }),
      }),
    )

    await expect(
      createShortLink(
        'https://example.com',
      ),
    ).rejects.toThrow(
      'Shrtn API response did not include a short URL.',
    )
  })
})

describe('getLinkAnalytics', () => {
  it('returns analytics for a short code', async () => {
    const fetchMock =
      vi.fn().mockResolvedValue(
        createAnalyticsResponse(),
      )

    vi.stubGlobal(
      'fetch',
      fetchMock,
    )

    const result =
      await getLinkAnalytics(
        'AbC123x',
      )

    expect(
      result.clickCount,
    ).toBe(3)

    expect(
      fetchMock,
    ).toHaveBeenCalledWith(
      'https://shrtn.up.railway.app/api/v1/links/AbC123x/analytics',

      expect.objectContaining({
        method: 'GET',

        signal:
          expect.any(Object),
      }),
    )
  })

  it('returns an analytics API error', async () => {
    vi.stubGlobal(
      'fetch',

      vi.fn().mockResolvedValue({
        ok: false,
        status: 404,

        json:
          vi.fn().mockResolvedValue({
            error: {
              message:
                'The requested short link does not exist.',
            },
          }),
      }),
    )

    await expect(
      getLinkAnalytics(
        'NoLink1',
        {
          retryDelayMs: 0,
        },
      ),
    ).rejects.toThrow(
      'The requested short link does not exist.',
    )
  })

  it('retries analytics after a network failure', async () => {
    const fetchMock = vi
      .fn()
      .mockRejectedValueOnce(
        new Error(
          'Connection refused',
        ),
      )
      .mockResolvedValueOnce(
        createAnalyticsResponse(),
      )

    vi.stubGlobal(
      'fetch',
      fetchMock,
    )

    const result =
      await getLinkAnalytics(
        'AbC123x',
        {
          retryDelayMs: 0,
        },
      )

    expect(
      result.clickCount,
    ).toBe(3)

    expect(
      fetchMock,
    ).toHaveBeenCalledTimes(2)
  })

  it('retries analytics after a temporary server error', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce({
        ok: false,
        status: 503,

        json:
          vi.fn().mockResolvedValue({
            error: {
              message:
                'Service unavailable.',
            },
          }),
      })
      .mockResolvedValueOnce(
        createAnalyticsResponse(),
      )

    vi.stubGlobal(
      'fetch',
      fetchMock,
    )

    const result =
      await getLinkAnalytics(
        'AbC123x',
        {
          retryDelayMs: 0,
        },
      )

    expect(
      result.clickCount,
    ).toBe(3)

    expect(
      fetchMock,
    ).toHaveBeenCalledTimes(2)
  })

  it('reports when analytics cannot reach the API after retrying', async () => {
    const fetchMock =
      vi.fn().mockRejectedValue(
        new Error(
          'Connection refused',
        ),
      )

    vi.stubGlobal(
      'fetch',
      fetchMock,
    )

    await expect(
      getLinkAnalytics(
        'AbC123x',
        {
          retryDelayMs: 0,
        },
      ),
    ).rejects.toThrow(
      'Shrtn API is temporarily unavailable. Please try again.',
    )

    expect(
      fetchMock,
    ).toHaveBeenCalledTimes(2)
  })

  it('rejects an invalid analytics response', async () => {
    vi.stubGlobal(
      'fetch',

      vi.fn().mockResolvedValue({
        ok: true,
        status: 200,

        json:
          vi.fn().mockResolvedValue({
            data: {},
          }),
      }),
    )

    await expect(
      getLinkAnalytics(
        'AbC123x',
      ),
    ).rejects.toThrow(
      'Shrtn API response did not include valid analytics.',
    )
  })
})