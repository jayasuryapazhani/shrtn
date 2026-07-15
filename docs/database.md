# Shrtn Database

Shrtn uses PostgreSQL hosted on Neon for persistent short-link storage.

| `click_count` | `BIGINT` | Number of successful redirects |
| `last_clicked_at` | `TIMESTAMPTZ` | Timestamp of the most recent redirect |


- `001_create_links.sql` creates the links table.
- `002_add_click_analytics.sql` adds click-count and last-click tracking.


## Environment variable

The backend requires:

```dotenv
DATABASE_URL=postgresql://USER:PASSWORD@HOST/DATABASE?sslmode=require

## Click analytics

Each successful redirect atomically increments `click_count` and updates
`last_clicked_at`.

The atomic PostgreSQL update prevents concurrent redirect requests from
overwriting one another.