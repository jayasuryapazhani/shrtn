import { useEffect, useMemo, useState } from 'react'
import './App.css'
import { getActiveTabUrl } from './services/tabService'
import { isSupportedWebUrl } from './utils/url'

function App() {
  const [url, setUrl] = useState('')
  const [statusType, setStatusType] = useState('loading')
  const [statusMessage, setStatusMessage] = useState('Reading current tab...')

  const isValidUrl = useMemo(() => isSupportedWebUrl(url), [url])

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
          setStatusMessage('Current tab is ready to shorten.')
        } else {
          setStatusType('error')
          setStatusMessage('This browser page cannot be shortened.')
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

    loadActiveTab()

    return () => {
      cancelled = true
    }
  }, [])

  function handleUrlChange(event) {
    const nextUrl = event.target.value

    setUrl(nextUrl)

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
    setStatusMessage('Only HTTP and HTTPS URLs are supported.')
  }

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

      <section className="panel" aria-labelledby="create-link-heading">
        <h2 id="create-link-heading">Create a short link</h2>

        <label htmlFor="url">URL</label>

        <input
          id="url"
          name="url"
          type="url"
          value={url}
          placeholder="https://example.com"
          aria-invalid={url.length > 0 && !isValidUrl}
          disabled={statusType === 'loading'}
          onChange={handleUrlChange}
        />

        <button type="button" disabled>
          Shorten URL
        </button>

        <p
          className={`helper helper--${statusType}`}
          role={statusType === 'error' ? 'alert' : 'status'}
        >
          {statusMessage}
        </p>
      </section>

      <footer className="status">
        <span className="status__dot" aria-hidden="true" />
        Active-tab detection enabled
      </footer>
    </main>
  )
}

export default App