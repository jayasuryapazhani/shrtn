function mapLinkRow(row) {
  return {
    originalUrl: row.original_url,
    shortCode: row.short_code,
    createdAt: new Date(
      row.created_at,
    ).toISOString(),
  }
}

function mapAnalyticsRow(row) {
  return {
    ...mapLinkRow(row),
    clickCount: Number(row.click_count),
    lastClickedAt: row.last_clicked_at
      ? new Date(
          row.last_clicked_at,
        ).toISOString()
      : null,
  }
}

export function createPostgresLinkRepository({
  pool,
}) {
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
          RETURNING
            original_url,
            short_code,
            created_at
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
          SELECT
            original_url,
            short_code,
            created_at
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
    async findAnalyticsByCode(shortCode) {
  const result = await pool.query(
    `
      SELECT
        original_url,
        short_code,
        created_at,
        click_count,
        last_clicked_at
      FROM links
      WHERE short_code = $1
    `,
    [shortCode],
  )

  if (result.rowCount === 0) {
    return null
  }

  return mapAnalyticsRow(result.rows[0])
},

    async recordClick(shortCode, clickedAt) {
      const result = await pool.query(
        `
          UPDATE links
          SET
            click_count = click_count + 1,
            last_clicked_at = $2
          WHERE short_code = $1
          RETURNING
            original_url,
            short_code,
            created_at,
            click_count,
            last_clicked_at
        `,
        [shortCode, clickedAt],
      )

      if (result.rowCount === 0) {
        return null
      }

      return mapAnalyticsRow(result.rows[0])
    },
  }
}