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
})