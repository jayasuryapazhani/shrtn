# Shrtn Database

Shrtn uses PostgreSQL for persistent short-link storage. The production database is hosted on Neon.

## Links table

| Column | PostgreSQL type | Purpose |
|---|---|---|
| `id` | `BIGSERIAL` | Internal primary key |
| `original_url` | `TEXT` | Original HTTP or HTTPS destination |
| `short_code` | `VARCHAR(7)` | Unique seven-character short code |
| `created_at` | `TIMESTAMPTZ` | Link creation timestamp |
| `click_count` | `BIGINT` | Number of successful redirects |
| `last_clicked_at` | `TIMESTAMPTZ` | Timestamp of the most recent redirect |

The `short_code` column is unique and is used to resolve public redirect requests.

## Migrations

Migration files are stored in:

```text
server/migrations
```

Current migrations:

| Migration | Purpose |
|---|---|
| `001_create_links.sql` | Creates the initial `links` table |
| `002_add_click_analytics.sql` | Adds `click_count` and `last_clicked_at` |

Run all migrations:

```powershell
npm --prefix .\server run db:migrate
```

The migration runner processes numbered SQL files in filename order.

## Environment variable

The backend requires a PostgreSQL connection string:

```dotenv
DATABASE_URL=postgresql://USER:PASSWORD@HOST/DATABASE?sslmode=require
```

Store the local value in:

```text
server/.env
```

Never commit the actual connection string.

## Click analytics

Each successful redirect performs an atomic PostgreSQL update that:

1. Increments `click_count`.
2. Sets `last_clicked_at` to the redirect timestamp.
3. Returns the updated link record.

The atomic update prevents concurrent redirects from overwriting one another.

Calling the analytics endpoint does not change either analytics field.

## Production database

The Railway backend connects to Neon through `DATABASE_URL`.

Railway runs:

```powershell
npm run db:migrate
```

before deploying the new application version.