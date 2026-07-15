# Shrtn

Shrtn is a browser extension and REST API for creating persistent short links, generating QR codes, and tracking redirect analytics.

The extension reads the active browser tab, creates a public short URL, generates a downloadable QR code, and displays click analytics directly inside the popup.

## Live API

Production API:

```text
https://shrtn.up.railway.app
```

Health endpoint:

```text
https://shrtn.up.railway.app/health
```

## Features

- Create seven-character short links
- Support HTTP and HTTPS destination URLs
- Redirect public short URLs to their original destinations
- Persist links in PostgreSQL
- Generate downloadable QR codes
- Copy shortened URLs to the clipboard
- Track redirect click counts
- Track the most recent click timestamp
- Display analytics in the browser extension
- Validate request bodies and short-code formats
- Apply security headers with Helmet
- Apply API and redirect rate limiting
- Run automated server and extension checks through GitHub Actions

## Architecture

```text
Chrome or Brave extension
          |
          v
https://shrtn.up.railway.app
          |
          v
Node.js and Express REST API
          |
          v
Neon PostgreSQL
```

## Technology stack

### Browser extension

- React
- Vite
- Chrome Manifest V3
- JavaScript
- QRCode

### Backend

- Node.js
- Express
- PostgreSQL
- Zod
- Nano ID
- Helmet
- Express Rate Limit

### Testing and delivery

- Vitest
- Supertest
- Oxlint
- Postman
- OpenAPI 3.0
- GitHub Actions
- Railway
- Neon

## Project structure

```text
shrtn/
├── .github/
│   └── workflows/
│       └── ci.yml
├── docs/
│   ├── database.md
│   └── openapi.yaml
├── extension/
│   ├── public/
│   ├── src/
│   └── tests/
├── postman/
├── server/
│   ├── migrations/
│   ├── src/
│   └── tests/
├── .env.example
└── README.md
```

## Prerequisites

Install the following before running Shrtn locally:

- Node.js 20 or newer
- npm
- PostgreSQL or a Neon PostgreSQL database
- Chrome, Brave, or another Chromium-based browser
- Git

## Environment configuration

Create the backend environment file:

```powershell
Copy-Item .\.env.example .\server\.env
```

Update `server/.env`:

```dotenv
DATABASE_URL=postgresql://USER:PASSWORD@HOST/DATABASE?sslmode=require
PUBLIC_BASE_URL=http://localhost:5056
```

`DATABASE_URL` is required.

`PUBLIC_BASE_URL` is optional locally. When it is omitted, Shrtn builds short URLs from the incoming request origin. Railway automatically uses `RAILWAY_PUBLIC_DOMAIN` in production.

Never commit `server/.env`.

## Install dependencies

Install backend dependencies:

```powershell
npm --prefix .\server install
```

Install extension dependencies:

```powershell
npm --prefix .\extension install
```

## Run database migrations

```powershell
npm --prefix .\server run db:migrate
```

Current migrations:

```text
001_create_links.sql
002_add_click_analytics.sql
```

## Start the backend

```powershell
npm --prefix .\server run dev
```

Local API:

```text
http://localhost:5056
```

Test the health endpoint:

```powershell
curl.exe http://localhost:5056/health
```

## Build the extension

```powershell
npm --prefix .\extension run build
```

The production extension is generated in:

```text
extension/dist
```

## Load the extension in Chrome or Brave

1. Open the browser extensions page.
2. Enable Developer mode.
3. Choose **Load unpacked**.
4. Select the `extension/dist` directory.
5. Pin Shrtn to the browser toolbar.
6. Open a normal HTTP or HTTPS webpage.
7. Open Shrtn and select **Shorten URL**.

The committed extension configuration connects to the public Railway API.

## API endpoints

| Method | Endpoint | Purpose |
|---|---|---|
| `GET` | `/health` | Check API health |
| `POST` | `/api/v1/links` | Create a short link |
| `GET` | `/api/v1/links/{shortCode}/analytics` | Retrieve link analytics |
| `GET` | `/{shortCode}` | Redirect to the original URL |

See [`docs/openapi.yaml`](docs/openapi.yaml) for the complete API contract.

## Example: create a short link

```powershell
'{"originalUrl":"https://example.com"}' |
  curl.exe `
    -X POST "http://localhost:5056/api/v1/links" `
    -H "Content-Type: application/json" `
    --data-binary "@-"
```

Example response:

```json
{
  "data": {
    "originalUrl": "https://example.com",
    "shortCode": "AbC123x",
    "shortUrl": "http://localhost:5056/AbC123x",
    "createdAt": "2026-07-15T01:00:00.000Z"
  }
}
```

## Example: retrieve analytics

```powershell
curl.exe `
  "http://localhost:5056/api/v1/links/AbC123x/analytics"
```

Example response:

```json
{
  "data": {
    "originalUrl": "https://example.com",
    "shortCode": "AbC123x",
    "createdAt": "2026-07-15T01:00:00.000Z",
    "clickCount": 3,
    "lastClickedAt": "2026-07-15T02:00:00.000Z"
  }
}
```

Reading analytics does not increment the click count. Only successful short-link redirects update analytics.

## Security

Shrtn includes:

- Helmet security headers
- Disabled `X-Powered-By` disclosure
- HTTP Strict Transport Security in production
- A 10 KB JSON request-body limit
- General API rate limiting
- Stricter short-link creation rate limiting
- Redirect rate limiting
- Trusted proxy configuration for Railway

Rate-limit counters use an in-memory store and reset when the API process restarts. A shared external store would be required for multiple API replicas.

## Automated validation

Run all backend checks:

```powershell
npm --prefix .\server run check
```

Run all extension checks:

```powershell
npm --prefix .\extension run check
```

The GitHub Actions workflow runs both commands for pushes and pull requests targeting `main`.

## Deployment

### Backend

The backend is deployed on Railway from the `main` branch.

Railway configuration:

```text
Root directory: /server
Start command: npm start
Pre-deploy command: npm run db:migrate
Health endpoint: /health
```

Required Railway variables:

```dotenv
DATABASE_URL=<Neon PostgreSQL connection string>
NODE_ENV=production
```

Railway supplies `PORT` and `RAILWAY_PUBLIC_DOMAIN`.

### Database

The production PostgreSQL database is hosted on Neon. See [`docs/database.md`](docs/database.md) for the schema and migration details.

## Current versions

```text
Backend API:       0.8.0
Browser extension: 0.6.0
```

## Status

Shrtn Version 1 includes the complete URL-shortening workflow:

```text
Active tab
  -> public short link
  -> QR code
  -> persistent redirect
  -> click analytics
```