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

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('createShortLink', () => {
  it('creates and returns a shortened link', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: vi.fn().mockResolvedValue({
        data: {
          originalUrl: 'https://example.com',
          shortCode: 'AbC123x',
          shortUrl: 'https://shrtn.up.railway.app/AbC123x',
          createdAt: '2026-07-13T12:00:00.000Z',
        },
      }),
    })

    vi.stubGlobal('fetch', fetchMock)

    const result = await createShortLink(
      'https://example.com',
    )

    expect(result.shortUrl).toBe(
      'https://shrtn.up.railway.app/AbC123x',
    )

    expect(fetchMock).toHaveBeenCalledWith(
      'https://shrtn.up.railway.app/api/v1/links',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          originalUrl: 'https://example.com',
        }),
      },
    )
  })

  it('returns the API error message', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: false,
        json: vi.fn().mockResolvedValue({
          error: {
            message:
              'Only HTTP and HTTPS URLs are supported.',
          },
        }),
      }),
    )

    await expect(
      createShortLink('ftp://example.com'),
    ).rejects.toThrow(
      'Only HTTP and HTTPS URLs are supported.',
    )
  })

  it('reports when the API is unavailable', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockRejectedValue(
        new Error('Connection refused'),
      ),
    )

    await expect(
      createShortLink('https://example.com'),
    ).rejects.toThrow(
      'Shrtn API is temporarily unavailable. Please try again.',
    )
  })

  it('rejects a successful response without a short URL', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        json: vi.fn().mockResolvedValue({
          data: {},
        }),
      }),
    )

    await expect(
      createShortLink('https://example.com'),
    ).rejects.toThrow(
      'Shrtn API response did not include a short URL.',
    )
  })
})
describe('getLinkAnalytics', () => {
  it('returns analytics for a short code', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: vi.fn().mockResolvedValue({
        data: {
          originalUrl:
            'https://example.com',
          shortCode: 'AbC123x',
          createdAt:
            '2026-07-15T01:00:00.000Z',
          clickCount: 3,
          lastClickedAt:
            '2026-07-15T02:00:00.000Z',
        },
      }),
    })

    vi.stubGlobal('fetch', fetchMock)

    const result =
      await getLinkAnalytics('AbC123x')

    expect(result.clickCount).toBe(3)

    expect(fetchMock).toHaveBeenCalledWith(
      'https://shrtn.up.railway.app/api/v1/links/AbC123x/analytics',
      {
        method: 'GET',
      },
    )
  })

  it('returns an analytics API error', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: false,
        json: vi.fn().mockResolvedValue({
          error: {
            message:
              'The requested short link does not exist.',
          },
        }),
      }),
    )

    await expect(
      getLinkAnalytics('NoLink1'),
    ).rejects.toThrow(
      'The requested short link does not exist.',
    )
  })

  it('reports when analytics cannot reach the API', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockRejectedValue(
        new Error('Connection refused'),
      ),
    )

    await expect(
      getLinkAnalytics('AbC123x'),
    ).rejects.toThrow(
      'Shrtn API is temporarily unavailable. Please try again.',
    )
  })

  it('rejects an invalid analytics response', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        json: vi.fn().mockResolvedValue({
          data: {},
        }),
      }),
    )

    await expect(
      getLinkAnalytics('AbC123x'),
    ).rejects.toThrow(
      'Shrtn API response did not include valid analytics.',
    )
  })
})