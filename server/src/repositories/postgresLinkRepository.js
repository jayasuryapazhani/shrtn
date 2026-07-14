function mapLinkRow(row) {
  return {
    originalUrl: row.original_url,
    shortCode: row.short_code,
    createdAt: new Date(row.created_at).toISOString(),
  }
}

export function createPostgresLinkRepository({ pool }) {
  return {
    async existsByCode(shortCode) {
      const result = await pool.query(
        `
          SELECT EXISTS (
            SELECT 1
            FROM links
            WHERE short_code = $1
          ) AS exists
        `,
        [shortCode],
      )

      return result.rows[0].exists
    },

    async save(link) {
      const result = await pool.query(
        `
          INSERT INTO links (
            original_url,
            short_code,
            created_at
          )
          VALUES ($1, $2, $3)
          RETURNING original_url, short_code, created_at
        `,
        [
          link.originalUrl,
          link.shortCode,
          link.createdAt,
        ],
      )

      return mapLinkRow(result.rows[0])
    },

    async findByCode(shortCode) {
      const result = await pool.query(
        `
          SELECT original_url, short_code, created_at
          FROM links
          WHERE short_code = $1
        `,
        [shortCode],
      )

      if (result.rowCount === 0) {
        return null
      }

      return mapLinkRow(result.rows[0])
    },
  }
}