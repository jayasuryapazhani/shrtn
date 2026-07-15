import { useEffect, useMemo, useState } from 'react'
import './App.css'
import {
  createShortLink,
  getLinkAnalytics,
} from './services/linkApi'
import { createQrCodeDataUrl } from './services/qrCodeService'
import { getActiveTabUrl } from './services/tabService'
import { isSupportedWebUrl } from './utils/url'

const dateTimeFormatter = new Intl.DateTimeFormat(
  undefined,
  {
    dateStyle: 'medium',
    timeStyle: 'short',
  },
)

function formatDateTime(value) {
  if (!value) {
    return 'Never'
  }

  const date = new Date(value)

  if (Number.isNaN(date.getTime())) {
    return 'Unavailable'
  }

  return dateTimeFormatter.format(date)
}

function App() {
  const [url, setUrl] = useState('')
  const [shortLink, setShortLink] = useState(null)
  const [analytics, setAnalytics] = useState(null)
  const [analyticsError, setAnalyticsError] =
    useState('')
  const [qrCodeDataUrl, setQrCodeDataUrl] =
    useState('')
  const [isReadingTab, setIsReadingTab] =
    useState(true)
  const [isSubmitting, setIsSubmitting] =
    useState(false)
  const [
    isLoadingAnalytics,
    setIsLoadingAnalytics,
  ] = useState(false)
  const [copyLabel, setCopyLabel] =
    useState('Copy')
  const [statusType, setStatusType] =
    useState('loading')
  const [statusMessage, setStatusMessage] =
    useState('Reading current tab...')

  const isValidUrl = useMemo(
    () => isSupportedWebUrl(url),
    [url],
  )

  useEffect(() => {
    let cancelled = false

    async function loadActiveTab() {
      try {
        const activeUrl =
          await getActiveTabUrl()

        if (cancelled) {
          return
        }

        setUrl(activeUrl)

        if (isSupportedWebUrl(activeUrl)) {
          setStatusType('success')
          setStatusMessage(
            'Current tab is ready to shorten.',
          )
        } else {
          setStatusType('error')
          setStatusMessage(
            'This browser page cannot be shortened.',
          )
        }
      } catch (error) {
        if (cancelled) {
          return
        }

        setStatusType('error')
        setStatusMessage(
          error instanceof Error
            ? error.message
            : 'The current tab could not be read.',
        )
      } finally {
        if (!cancelled) {
          setIsReadingTab(false)
        }
      }
    }

    void loadActiveTab()

    return () => {
      cancelled = true
    }
  }, [])

  function resetGeneratedContent() {
    setShortLink(null)
    setAnalytics(null)
    setAnalyticsError('')
    setQrCodeDataUrl('')
    setCopyLabel('Copy')
  }

  function handleUrlChange(event) {
    const nextUrl = event.target.value

    setUrl(nextUrl)
    resetGeneratedContent()

    if (!nextUrl.trim()) {
      setStatusType('error')
      setStatusMessage(
        'Enter an HTTP or HTTPS URL.',
      )
      return
    }

    if (isSupportedWebUrl(nextUrl)) {
      setStatusType('success')
      setStatusMessage(
        'URL is ready to shorten.',
      )
      return
    }

    setStatusType('error')
    setStatusMessage(
      'Only HTTP and HTTPS URLs are supported.',
    )
  }

  async function handleSubmit(event) {
    event.preventDefault()

    if (!isValidUrl || isSubmitting) {
      return
    }

    setIsSubmitting(true)
    resetGeneratedContent()
    setStatusType('loading')
    setStatusMessage(
      'Creating your short link...',
    )

    try {
      const createdLink =
        await createShortLink(url)

      setShortLink(createdLink)

      const [qrResult, analyticsResult] =
        await Promise.allSettled([
          createQrCodeDataUrl(
            createdLink.shortUrl,
          ),
          getLinkAnalytics(
            createdLink.shortCode,
          ),
        ])

      if (qrResult.status === 'fulfilled') {
        setQrCodeDataUrl(qrResult.value)
      }

      if (
        analyticsResult.status ===
        'fulfilled'
      ) {
        setAnalytics(analyticsResult.value)
      } else {
        setAnalyticsError(
          analyticsResult.reason instanceof Error
            ? analyticsResult.reason.message
            : 'Analytics could not be loaded.',
        )
      }

      const qrSucceeded =
        qrResult.status === 'fulfilled'

      const analyticsSucceeded =
        analyticsResult.status ===
        'fulfilled'

      if (
        qrSucceeded &&
        analyticsSucceeded
      ) {
        setStatusType('success')
        setStatusMessage(
          'Short link, QR code, and analytics created successfully.',
        )
      } else if (!qrSucceeded) {
        setStatusType('error')
        setStatusMessage(
          'Short link created, but the QR code could not be generated.',
        )
      } else {
        setStatusType('success')
        setStatusMessage(
          'Short link and QR code created. Analytics could not be loaded.',
        )
      }
    } catch (error) {
      setStatusType('error')
      setStatusMessage(
        error instanceof Error
          ? error.message
          : 'The link could not be shortened.',
      )
    } finally {
      setIsSubmitting(false)
    }
  }

  async function handleRefreshAnalytics() {
    if (
      !shortLink?.shortCode ||
      isLoadingAnalytics
    ) {
      return
    }

    setIsLoadingAnalytics(true)
    setAnalyticsError('')
    setStatusType('loading')
    setStatusMessage(
      'Refreshing link analytics...',
    )

    try {
      const refreshedAnalytics =
        await getLinkAnalytics(
          shortLink.shortCode,
        )

      setAnalytics(refreshedAnalytics)
      setStatusType('success')
      setStatusMessage(
        'Analytics refreshed successfully.',
      )
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : 'Analytics could not be refreshed.'

      setAnalyticsError(message)
      setStatusType('error')
      setStatusMessage(message)
    } finally {
      setIsLoadingAnalytics(false)
    }
  }

  async function handleCopy() {
    if (!shortLink?.shortUrl) {
      return
    }

    try {
      await navigator.clipboard.writeText(
        shortLink.shortUrl,
      )

      setCopyLabel('Copied')
      setStatusType('success')
      setStatusMessage(
        'Short link copied to the clipboard.',
      )
    } catch {
      setCopyLabel('Copy failed')
      setStatusType('error')
      setStatusMessage(
        'The short link could not be copied.',
      )
    }
  }

  return (
    <main className="popup">
      <header className="brand">
        <div
          className="brand__mark"
          aria-hidden="true"
        >
          S
        </div>

        <div>
          <h1>Shrtn</h1>
          <p>Shorten. Scan. Share.</p>
        </div>
      </header>

      <section
        className="panel"
        aria-labelledby="create-link-heading"
      >
        <h2 id="create-link-heading">
          Create a short link
        </h2>

        <form onSubmit={handleSubmit}>
          <label htmlFor="url">URL</label>

          <input
            id="url"
            name="url"
            type="url"
            value={url}
            placeholder="https://example.com"
            aria-invalid={
              url.length > 0 && !isValidUrl
            }
            disabled={
              isReadingTab || isSubmitting
            }
            onChange={handleUrlChange}
          />

          <button
            className="button button--primary"
            type="submit"
            disabled={
              !isValidUrl ||
              isSubmitting ||
              isReadingTab
            }
          >
            {isSubmitting
              ? 'Creating...'
              : 'Shorten URL'}
          </button>
        </form>

        <p
          className={`helper helper--${statusType}`}
          role={
            statusType === 'error'
              ? 'alert'
              : 'status'
          }
        >
          {statusMessage}
        </p>

        {shortLink && (
          <section
            className="result"
            aria-labelledby="result-heading"
          >
            <div className="result__header">
              <h3 id="result-heading">
                Short URL
              </h3>

              <span>
                {shortLink.shortCode}
              </span>
            </div>

            <div className="result__field">
              <input
                type="text"
                value={shortLink.shortUrl}
                aria-label="Generated short URL"
                readOnly
              />

              <button
                className="button button--copy"
                type="button"
                onClick={handleCopy}
              >
                {copyLabel}
              </button>
            </div>

            <section
              className="analytics"
              aria-labelledby="analytics-heading"
            >
              <div className="analytics__header">
                <h3 id="analytics-heading">
                  Analytics
                </h3>

                <button
                  className="button button--secondary"
                  type="button"
                  disabled={isLoadingAnalytics}
                  onClick={
                    handleRefreshAnalytics
                  }
                >
                  {isLoadingAnalytics
                    ? 'Refreshing...'
                    : 'Refresh'}
                </button>
              </div>

              {analytics ? (
                <dl className="analytics__grid">
                  <div className="analytics__metric analytics__metric--primary">
                    <dt>Clicks</dt>
                    <dd>
                      {analytics.clickCount}
                    </dd>
                  </div>

                  <div className="analytics__metric">
                    <dt>Created</dt>
                    <dd>
                      {formatDateTime(
                        analytics.createdAt,
                      )}
                    </dd>
                  </div>

                  <div className="analytics__metric">
                    <dt>Last clicked</dt>
                    <dd>
                      {formatDateTime(
                        analytics.lastClickedAt,
                      )}
                    </dd>
                  </div>
                </dl>
              ) : (
                <p
                  className="analytics__message"
                  aria-live="polite"
                >
                  {isLoadingAnalytics
                    ? 'Loading analytics...'
                    : analyticsError ||
                      'Analytics are unavailable.'}
                </p>
              )}

              {analytics && analyticsError && (
                <p
                  className="analytics__message analytics__message--error"
                  role="alert"
                >
                  {analyticsError}
                </p>
              )}
            </section>

            {qrCodeDataUrl && (
              <div className="qr">
                <img
                  src={qrCodeDataUrl}
                  alt={`QR code for ${shortLink.shortUrl}`}
                />

                <a
                  className="button button--download"
                  href={qrCodeDataUrl}
                  download={`shrtn-${shortLink.shortCode}.png`}
                >
                  Download QR
                </a>
              </div>
            )}
          </section>
        )}
      </section>

      <footer className="status">
        <span
          className="status__dot"
          aria-hidden="true"
        />
        Public shortening and analytics enabled
      </footer>
    </main>
  )
}

export default App