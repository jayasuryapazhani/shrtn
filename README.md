# Shrtn

Shrtn is a full-stack URL shortener and Manifest V3 browser extension for creating persistent short links, generating downloadable QR codes, and tracking redirect analytics.

Version 1.1.0 adds browser context-menu actions, local recent-link history, result restoration, duplicate detection, and more resilient API handling.

<p align="center">
  <a href="https://chromewebstore.google.com/detail/shrtn/adodmibgcbmnhdagfkipjpjfkeaalfim">
    <strong>Install from the Chrome Web Store</strong>
  </a>
  &middot;
  <a href="https://shrtn.up.railway.app">
    <strong>Open the website</strong>
  </a>
  &middot;
  <a href="https://shrtn.up.railway.app/privacy">
  <strong>Privacy</strong>
  </a>
  &middot;
  <a href="https://github.com/jayasuryapazhani/shrtn/issues">
    <strong>Support</strong>
  </a>
</p>

## Product overview

Shrtn provides two ways to create short links:

- Use the browser extension while visiting any HTTP or HTTPS page.
- Use the live web shortener without installing the extension.

The extension can shorten the current page or a selected hyperlink directly from the browser context menu. Generated results include a public short URL, downloadable QR code, click analytics, and browser-local history.

## Screenshots

### Landing page

<p align="center">
  <a href="https://shrtn.up.railway.app">
    <img
      src="docs/screenshots/v1.1.0/landing-page.png"
      alt="Shrtn v1.1.0 landing page"
      width="100%"
    >
  </a>
</p>

### Browser extension workflow

<p align="center">
  <img
    src="docs/screenshots/v1.1.0/01-short-link-result.png"
    alt="Shrtn browser extension shortening, analytics, QR code, and recent-link workflow"
    width="100%"
  >
</p>

### Browser context-menu actions

<table>
  <tr>
    <td width="50%" align="center">
      <strong>Shorten the current page</strong>
    </td>
    <td width="50%" align="center">
      <strong>Shorten a hyperlink without opening it</strong>
    </td>
  </tr>
  <tr>
    <td width="50%">
      <img
        src="docs/screenshots/v1.1.0/02-page-context-menu.png"
        alt="Shrtn context-menu actions for the current browser page"
        width="100%"
      >
    </td>
    <td width="50%">
      <img
        src="docs/screenshots/v1.1.0/03-link-context-menu.png"
        alt="Shrtn context-menu actions for a selected hyperlink"
        width="100%"
      >
    </td>
  </tr>
</table>

### QR codes and recent links

<table>
  <tr>
    <td width="50%" align="center">
      <strong>Downloadable QR codes</strong>
    </td>
    <td width="50%" align="center">
      <strong>Local recent-link history</strong>
    </td>
  </tr>
  <tr>
    <td width="50%">
      <img
        src="docs/screenshots/v1.1.0/04-qr-code.png"
        alt="Shrtn QR code and click analytics"
        width="100%"
      >
    </td>
    <td width="50%">
      <img
        src="docs/screenshots/v1.1.0/05-recent-links.png"
        alt="Shrtn recent-link history stored locally in the browser"
        width="100%"
      >
    </td>
  </tr>
</table>

## What is new in v1.1.0

### Browser context-menu actions

Right-click the current page to:

- Shorten the current page.
- Generate a QR code for the current page.

Right-click a hyperlink to:

- Shorten the selected link without opening it.
- Generate a QR code for the selected link.

### Local recent-link history

- Store up to 20 recent extension results.
- Reopen previously generated links.
- Display whether a result came from the popup, page menu, or link menu.
- Clear the local history from the extension.
- Restore the most recent result after reopening the popup.

### Duplicate-link handling

When a URL already exists in recent history, Shrtn can:

- Reuse the existing result.
- Open its QR code.
- Deliberately create another short link.

### Reliability improvements

- Apply timeouts to extension API requests.
- Retry safe analytics requests after temporary failures.
- Avoid automatically retrying link-creation requests, preventing accidental duplicate creation.
- Reset copy-button feedback automatically.
- Display the installed extension version and support links.

## Features

### Browser extension

- Read the active HTTP or HTTPS browser tab.
- Create seven-character public short links.
- Shorten pages through the browser context menu.
- Shorten hyperlinks without opening them.
- Generate downloadable QR codes.
- Copy generated URLs to the clipboard.
- Open generated links in a new tab.
- Display redirect click counts.
- Display creation and last-clicked timestamps.
- Refresh analytics manually.
- Restore the most recently generated result.
- Store up to 20 recent results locally.
- Detect duplicate URLs in local history.
- Clear recent-link history.
- Display API availability.
- Link directly to the website, store listing, and support page.

### Website and REST API

- Create short links through the landing page.
- Redirect short URLs to their original destinations.
- Persist link records in PostgreSQL.
- Track successful redirect counts.
- Track the most recent redirect timestamp.
- Validate URL and short-code formats.
- Return structured JSON responses.
- Apply API and redirect rate limiting.
- Serve a production landing page from Express.
- Expose a health-check endpoint for deployment monitoring.

## Privacy model

Shrtn does not require an account.

The extension stores recent results locally using browser storage. This local history contains the URLs and metadata required to reopen recent results.

The backend stores only the link records required for:

- Resolving public short URLs.
- Redirecting users to the original URL.
- Tracking redirect counts.
- Recording creation and last-clicked timestamps.

QR codes are generated inside the browser extension and are not stored as image files by the backend.

## Architecture

```text
Chrome or Chromium-based browser
              |
              | Popup or context-menu action
              v
  https://shrtn.up.railway.app
              |
              v
     Node.js and Express API
              |
              v
       Neon PostgreSQL
```

### Extension workflow

```text
Current page or selected hyperlink
              |
              v
     Shrtn extension action
              |
              v
      POST /api/v1/links
              |
              v
 Short URL + QR code + analytics
              |
              v
  Browser-local recent history
```

### Redirect workflow

```text
Public short URL
       |
       v
GET /{shortCode}
       |
       v
Increment analytics
       |
       v
HTTP redirect to original URL
```

## Technology stack

| Area | Technology |
|---|---|
| Extension UI | React, JavaScript, CSS |
| Extension build | Vite |
| Browser platform | Chrome Manifest V3 |
| Background processing | Manifest V3 service worker |
| QR generation | QRCode |
| Backend | Node.js, Express |
| Validation | Zod |
| Short-code generation | Nano ID |
| Database | PostgreSQL |
| Database hosting | Neon |
| Security | Helmet, Express Rate Limit |
| Testing | Vitest, Supertest |
| Linting | Oxlint |
| API documentation | OpenAPI 3.0 |
| API testing | Postman |
| Continuous integration | GitHub Actions |
| Deployment | Railway |

## Project structure

```text
shrtn/
├── .github/
│   └── workflows/
│       └── ci.yml
├── docs/
│   ├── screenshots/
│   │   └── v1.1.0/
│   ├── database.md
│   └── openapi.yaml
├── extension/
│   ├── public/
│   │   ├── icons/
│   │   └── manifest.json
│   ├── src/
│   │   ├── background/
│   │   ├── services/
│   │   └── utils/
│   ├── tests/
│   └── vite.config.js
├── postman/
├── server/
│   ├── migrations/
│   ├── public/
│   │   ├── assets/
│   │   ├── app.js
│   │   ├── index.html
│   │   └── styles.css
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

## Local development

### Clone the repository

```powershell
git clone `
  https://github.com/jayasuryapazhani/shrtn.git

Set-Location .\shrtn
```

### Install backend dependencies

```powershell
npm --prefix .\server install
```

### Install extension dependencies

```powershell
npm --prefix .\extension install
```

## Environment configuration

Create the backend environment file:

```powershell
Copy-Item `
  .\.env.example `
  .\server\.env
```

Update `server/.env`:

```dotenv
DATABASE_URL=postgresql://USER:PASSWORD@HOST/DATABASE?sslmode=require
PUBLIC_BASE_URL=http://localhost:5056
```

`DATABASE_URL` is required.

`PUBLIC_BASE_URL` is optional during local development. When omitted, Shrtn builds short URLs from the incoming request origin.

Never commit `server/.env`.

## Database migrations

Run all database migrations:

```powershell
npm --prefix .\server run db:migrate
```

Current migrations:

```text
001_create_links.sql
002_add_click_analytics.sql
```

## Start the backend and website

```powershell
npm --prefix .\server run dev
```

The default local address is:

```text
http://localhost:5056
```

Test the health endpoint:

```powershell
Invoke-RestMethod `
  -Uri "http://localhost:5056/health"
```

Expected status:

```text
UP
```

## Build the extension

```powershell
npm --prefix .\extension run build
```

The production extension is generated in:

```text
extension/dist
```

## Load the extension locally

1. Open the extensions page in Chrome, Brave, or another compatible Chromium browser.
2. Enable **Developer mode**.
3. Select **Load unpacked**.
4. Select the `extension/dist` directory.
5. Pin Shrtn to the browser toolbar.
6. Open a normal HTTP or HTTPS webpage.
7. Open the Shrtn popup or use the page context menu.

The committed production configuration connects to:

```text
https://shrtn.up.railway.app
```

## API endpoints

| Method | Endpoint | Purpose |
|---|---|---|
| `GET` | `/health` | Check API and database availability |
| `POST` | `/api/v1/links` | Create a short link |
| `GET` | `/api/v1/links/{shortCode}/analytics` | Retrieve redirect analytics |
| `GET` | `/{shortCode}` | Redirect to the original URL |

See [`docs/openapi.yaml`](docs/openapi.yaml) for the complete API contract.

## Example: create a short link

```powershell
'{"originalUrl":"https://example.com"}' |
  curl.exe `
    -X POST `
    "http://localhost:5056/api/v1/links" `
    -H "Content-Type: application/json" `
    --data-binary "@-"
```

Example response:

```json
{
  "data": {
    "originalUrl": "https://example.com/",
    "shortCode": "AbC123x",
    "shortUrl": "http://localhost:5056/AbC123x",
    "createdAt": "2026-08-01T13:00:00.000Z"
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
    "originalUrl": "https://example.com/",
    "shortCode": "AbC123x",
    "createdAt": "2026-08-01T13:00:00.000Z",
    "clickCount": 3,
    "lastClickedAt": "2026-08-01T14:00:00.000Z"
  }
}
```

Reading analytics does not increment the click count. Only successful public short-link redirects update analytics.

## Security

Shrtn includes:

- Helmet security headers.
- Disabled `X-Powered-By` disclosure.
- HTTP Strict Transport Security in production.
- A 10 KB JSON request-body limit.
- General API rate limiting.
- Stricter short-link creation rate limiting.
- Redirect rate limiting.
- URL and short-code validation.
- Trusted proxy configuration for Railway.
- Restricted extension host permissions.

Rate-limit counters currently use an in-memory store and reset when the API process restarts. A shared external store would be required for multiple API replicas.

## Automated validation

Run all backend checks:

```powershell
npm --prefix .\server run check
```

Current backend validation:

```text
48 automated tests
0 lint errors
```

Run all extension checks:

```powershell
npm --prefix .\extension run check
```

Current extension validation:

```text
45 automated tests
0 lint errors
Production build completed
```

Total automated tests:

```text
93
```

GitHub Actions runs the extension and backend checks for pushes and pull requests targeting `main`.

## Deployment

### Backend and landing page

Railway deploys the `server` directory from the `main` branch.

```text
Root directory:       /server
Start command:        npm start
Pre-deploy command:   npm run db:migrate
Health endpoint:      /health
```

Required Railway variables:

```dotenv
DATABASE_URL=<Neon PostgreSQL connection string>
NODE_ENV=production
```

Railway supplies:

```text
PORT
RAILWAY_PUBLIC_DOMAIN
```

### Database

The production PostgreSQL database is hosted on Neon.

See [`docs/database.md`](docs/database.md) for the schema and migration details.

### Browser extension

The production extension is distributed through the Chrome Web Store:

https://chromewebstore.google.com/detail/shrtn/adodmibgcbmnhdagfkipjpjfkeaalfim

## Current versions

```text
Browser extension: 1.1.0
Backend API:       1.0.0
Landing page:      v1.1.0 design
```

## Live services

| Service | Address |
|---|---|
| Website | `https://shrtn.up.railway.app` |
| Privacy policy | `https://shrtn.up.railway.app/privacy` |
| Production API | `https://shrtn.up.railway.app` |
| Health endpoint | `https://shrtn.up.railway.app/health` |
| Chrome Web Store | `https://chromewebstore.google.com/detail/shrtn/adodmibgcbmnhdagfkipjpjfkeaalfim` |
| Support | `https://github.com/jayasuryapazhani/shrtn/issues` |

## Support and feedback

Report bugs or request improvements through GitHub Issues:

https://github.com/jayasuryapazhani/shrtn/issues

## Author

Built by [Jayasurya Pazhani](https://github.com/jayasuryapazhani).
