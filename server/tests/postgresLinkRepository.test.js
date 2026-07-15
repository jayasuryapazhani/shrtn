import { describe, expect, it, vi } from 'vitest'
import { createPostgresLinkRepository } from '../src/repositories/postgresLinkRepository.js'

describe('PostgreSQL link repository', () => {
  it('checks whether a short code exists', async () => {
    const pool = {
      query: vi.fn().mockResolvedValue({
        rows: [{ exists: true }],
      }),
    }

    const repository = createPostgresLinkRepository({
      pool,
    })

    await expect(
      repository.existsByCode('AbC123x'),
    ).resolves.toBe(true)

    expect(pool.query).toHaveBeenCalledWith(
      expect.stringContaining('SELECT EXISTS'),
      ['AbC123x'],
    )
  })

  it('saves and maps a link record', async () => {
    const pool = {
      query: vi.fn().mockResolvedValue({
        rows: [
          {
            original_url: 'https://example.com',
            short_code: 'AbC123x',
            created_at: new Date(
              '2026-07-13T03:00:00.000Z',
            ),
          },
        ],
      }),
    }

    const repository = createPostgresLinkRepository({
      pool,
    })

    const result = await repository.save({
      originalUrl: 'https://example.com',
      shortCode: 'AbC123x',
      createdAt: '2026-07-13T03:00:00.000Z',
    })

    expect(result).toEqual({
      originalUrl: 'https://example.com',
      shortCode: 'AbC123x',
      createdAt: '2026-07-13T03:00:00.000Z',
    })
  })

  it('finds a stored link by code', async () => {
    const pool = {
      query: vi.fn().mockResolvedValue({
        rowCount: 1,
        rows: [
          {
            original_url: 'https://example.com',
            short_code: 'AbC123x',
            created_at: new Date(
              '2026-07-13T03:00:00.000Z',
            ),
          },
        ],
      }),
    }

    const repository = createPostgresLinkRepository({
      pool,
    })

    await expect(
      repository.findByCode('AbC123x'),
    ).resolves.toEqual({
      originalUrl: 'https://example.com',
      shortCode: 'AbC123x',
      createdAt: '2026-07-13T03:00:00.000Z',
    })
  })

  it('returns null when a code does not exist', async () => {
    const pool = {
      query: vi.fn().mockResolvedValue({
        rowCount: 0,
        rows: [],
      }),
    }

    const repository = createPostgresLinkRepository({
      pool,
    })

    await expect(
      repository.findByCode('NoLink1'),
    ).resolves.toBeNull()
  })
  it('atomically records and returns a click', async () => {
  const pool = {
    query: vi.fn().mockResolvedValue({
      rowCount: 1,
      rows: [
        {
          original_url:
            'https://example.com',
          short_code: 'AbC123x',
          created_at: new Date(
            '2026-07-13T03:00:00.000Z',
          ),
          click_count: '3',
          last_clicked_at: new Date(
            '2026-07-15T01:00:00.000Z',
          ),
        },
      ],
    }),
  }

  const repository =
    createPostgresLinkRepository({
      pool,
    })

  await expect(
    repository.recordClick(
      'AbC123x',
      '2026-07-15T01:00:00.000Z',
    ),
  ).resolves.toEqual({
    originalUrl:
      'https://example.com',
    shortCode: 'AbC123x',
    createdAt:
      '2026-07-13T03:00:00.000Z',
    clickCount: 3,
    lastClickedAt:
      '2026-07-15T01:00:00.000Z',
  })

  expect(pool.query).toHaveBeenCalledWith(
    expect.stringContaining(
      'click_count = click_count + 1',
    ),
    [
      'AbC123x',
      '2026-07-15T01:00:00.000Z',
    ],
  )
})

it('returns null when recording an unknown code', async () => {
  const pool = {
    query: vi.fn().mockResolvedValue({
      rowCount: 0,
      rows: [],
    }),
  }

  const repository =
    createPostgresLinkRepository({
      pool,
    })

  await expect(
    repository.recordClick(
      'NoLink1',
      '2026-07-15T01:00:00.000Z',
    ),
  ).resolves.toBeNull()
})
it('returns analytics for a stored link', async () => {
  const pool = {
    query: vi.fn().mockResolvedValue({
      rowCount: 1,
      rows: [
        {
          original_url:
            'https://example.com',
          short_code: 'AbC123x',
          created_at: new Date(
            '2026-07-13T03:00:00.000Z',
          ),
          click_count: '4',
          last_clicked_at: new Date(
            '2026-07-15T02:00:00.000Z',
          ),
        },
      ],
    }),
  }

  const repository =
    createPostgresLinkRepository({
      pool,
    })

  await expect(
    repository.findAnalyticsByCode(
      'AbC123x',
    ),
  ).resolves.toEqual({
    originalUrl:
      'https://example.com',
    shortCode: 'AbC123x',
    createdAt:
      '2026-07-13T03:00:00.000Z',
    clickCount: 4,
    lastClickedAt:
      '2026-07-15T02:00:00.000Z',
  })

  expect(pool.query).toHaveBeenCalledWith(
    expect.stringContaining(
      'click_count',
    ),
    ['AbC123x'],
  )
})

it('returns null when analytics do not exist', async () => {
  const pool = {
    query: vi.fn().mockResolvedValue({
      rowCount: 0,
      rows: [],
    }),
  }

  const repository =
    createPostgresLinkRepository({
      pool,
    })

  await expect(
    repository.findAnalyticsByCode(
      'NoLink1',
    ),
  ).resolves.toBeNull()
})
})