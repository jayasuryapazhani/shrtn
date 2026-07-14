import { useEffect, useMemo, useState } from 'react'
import './App.css'
import { createShortLink } from './services/linkApi'
import { getActiveTabUrl } from './services/tabService'
import { isSupportedWebUrl } from './utils/url'

function App() {
  const [url, setUrl] = useState('')
  const [shortLink, setShortLink] = useState(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [copyLabel, setCopyLabel] = useState('Copy')
  const [statusType, setStatusType] = useState('loading')
  const [statusMessage, setStatusMessage] = useState(
    'Reading current tab...',
  )

  const isValidUrl = useMemo(
    () => isSupportedWebUrl(url),
    [url],
  )

  useEffect(() => {
    let cancelled = false

    async function loadActiveTab() {
      try {
        const activeUrl = await getActiveTabUrl()

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
      }
    }

    void loadActiveTab()

    return () => {
      cancelled = true
    }
  }, [])

  function handleUrlChange(event) {
    const nextUrl = event.target.value

    setUrl(nextUrl)
    setShortLink(null)
    setCopyLabel('Copy')

    if (!nextUrl.trim()) {
      setStatusType('error')
      setStatusMessage('Enter an HTTP or HTTPS URL.')
      return
    }

    if (isSupportedWebUrl(nextUrl)) {
      setStatusType('success')
      setStatusMessage('URL is ready to shorten.')
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
    setShortLink(null)
    setCopyLabel('Copy')
    setStatusType('loading')
    setStatusMessage('Creating your short link...')

    try {
      const createdLink = await createShortLink(url)

      setShortLink(createdLink)
      setStatusType('success')
      setStatusMessage(
        'Short link created and saved successfully.',
      )
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

  const isReadingTab =
    statusType === 'loading' && !isSubmitting

  return (
    <main className="popup">
      <header className="brand">
        <div className="brand__mark" aria-hidden="true">
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
            disabled={isReadingTab || isSubmitting}
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
              ? 'Shortening...'
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
              <h3 id="result-heading">Short URL</h3>

              <span>{shortLink.shortCode}</span>
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
          </section>
        )}
      </section>

      <footer className="status">
        <span
          className="status__dot"
          aria-hidden="true"
        />
        PostgreSQL-backed shortening enabled
      </footer>
    </main>
  )
}

export default App