import {
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react'

import './App.css'

import {
  createShortLink,
  getLinkAnalytics,
} from './services/linkApi'

import {
  createQrCodeDataUrl,
} from './services/qrCodeService'

import {
  getActiveTabUrl,
} from './services/tabService'

import {
  isSupportedWebUrl,
} from './utils/url'

import {
  findDuplicateRecentResult,
} from './utils/duplicateLink'

import {
  clearRecentGeneratedResults,
  getLastGeneratedResult,
  getRecentGeneratedResults,
  saveLastGeneratedResult,
  takePendingContextActionResult,
} from './services/contextActionStorage'

const COPY_LABEL_RESET_DELAY_MS = 2000

const dateTimeFormatter =
  new Intl.DateTimeFormat(
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

function formatResultSource(source) {
  if (source === 'context-page') {
    return 'Page menu'
  }

  if (source === 'context-link') {
    return 'Link menu'
  }

  return 'Popup'
}

async function clearActionSignal(
  chromeApi = globalThis.chrome,
) {
  try {
    if (
      typeof chromeApi?.action
        ?.setBadgeText === 'function'
    ) {
      await chromeApi.action.setBadgeText({
        text: '',
      })
    }

    if (
      typeof chromeApi?.action
        ?.setTitle === 'function'
    ) {
      await chromeApi.action.setTitle({
        title: 'Open Shrtn',
      })
    }
  } catch {
    // Badge cleanup must not break the popup.
  }
}

function App() {
  const [url, setUrl] =
    useState('')

  const [
    shortLink,
    setShortLink,
  ] = useState(null)

  const [
    analytics,
    setAnalytics,
  ] = useState(null)

  const [
    analyticsError,
    setAnalyticsError,
  ] = useState('')

  const [
    qrCodeDataUrl,
    setQrCodeDataUrl,
  ] = useState('')

  const [
    shouldFocusQr,
    setShouldFocusQr,
  ] = useState(false)

  const [
    recentLinks,
    setRecentLinks,
  ] = useState([])

  const [
    isClearingRecentLinks,
    setIsClearingRecentLinks,
  ] = useState(false)

  const [
    isReadingTab,
    setIsReadingTab,
  ] = useState(true)

  const [
    isSubmitting,
    setIsSubmitting,
  ] = useState(false)

  const [
    isLoadingAnalytics,
    setIsLoadingAnalytics,
  ] = useState(false)

  const [
    copyLabel,
    setCopyLabel,
  ] = useState('Copy')

  const [
    statusType,
    setStatusType,
  ] = useState('loading')

  const [
    statusMessage,
    setStatusMessage,
  ] = useState(
    'Reading current tab...',
  )

  const urlInputRef =
    useRef(null)

  const qrSectionRef =
    useRef(null)

  const copyLabelTimerRef =
    useRef(null)


  const isValidUrl = useMemo(
    () => isSupportedWebUrl(url),
    [url],
  )

  const duplicateRecentResult = useMemo(
  () => {
    const duplicate =
      findDuplicateRecentResult(
        url,
        recentLinks,
      )

    if (!duplicate) {
      return null
    }

    if (
      shortLink?.shortUrl ===
      duplicate.shortLink?.shortUrl
    ) {
      return null
    }

    return duplicate
  },
  [
    url,
    recentLinks,
    shortLink,
  ],
)

  useEffect(() => {
    let cancelled = false

    async function initializePopup() {
      try {
        const [
          pendingResult,
          storedRecentLinks,
        ] = await Promise.all([
          takePendingContextActionResult(),
          getRecentGeneratedResults(),
        ])

        if (cancelled) {
          return
        }

        setRecentLinks(
          storedRecentLinks,
        )

        if (pendingResult) {
          setUrl(
            pendingResult.originalUrl ??
              '',
          )

          void clearActionSignal()

          if (
            pendingResult.status ===
              'success' &&
            pendingResult.shortLink
              ?.shortUrl
          ) {
            const showQr =
              pendingResult.showQr ===
              true

            setShouldFocusQr(showQr)
            setStatusType('loading')

            setStatusMessage(
              showQr
                ? 'Preparing your QR code...'
                : 'Loading your right-click result...',
            )

            setShortLink(
              pendingResult.shortLink,
            )
          } else {
            setStatusType('error')

            setStatusMessage(
              pendingResult.message ??
                'The URL could not be shortened.',
            )
          }

          return
        }

        const lastGeneratedResult =
          await getLastGeneratedResult()

        if (cancelled) {
          return
        }

        if (lastGeneratedResult) {
          setUrl(
            lastGeneratedResult
              .originalUrl ??
              lastGeneratedResult
                .shortLink
                ?.originalUrl ??
              '',
          )

          setShouldFocusQr(false)
          setStatusType('loading')

          setStatusMessage(
            'Restoring your last generated link...',
          )

          setShortLink(
            lastGeneratedResult
              .shortLink,
          )

          return
        }

        const activeUrl =
          await getActiveTabUrl()

        if (cancelled) {
          return
        }

        setUrl(activeUrl)

        if (
          isSupportedWebUrl(activeUrl)
        ) {
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

    void initializePopup()

    return () => {
      cancelled = true
    }
  }, [])

  useEffect(() => {
  return () => {
    if (
      copyLabelTimerRef.current !==
      null
    ) {
      globalThis.clearTimeout(
        copyLabelTimerRef.current,
      )
    }
  }
}, [])

  useEffect(() => {
    if (
      !shortLink?.shortUrl ||
      !shortLink?.shortCode
    ) {
      return undefined
    }

    let cancelled = false

    async function loadGeneratedContent() {
      setQrCodeDataUrl('')
      setAnalytics(null)
      setAnalyticsError('')

      const [
        qrResult,
        analyticsResult,
      ] = await Promise.allSettled([
        createQrCodeDataUrl(
          shortLink.shortUrl,
        ),

        getLinkAnalytics(
          shortLink.shortCode,
        ),
      ])

      if (cancelled) {
        return
      }

      if (
        qrResult.status ===
        'fulfilled'
      ) {
        setQrCodeDataUrl(
          qrResult.value,
        )
      }

      if (
        analyticsResult.status ===
        'fulfilled'
      ) {
        setAnalytics(
          analyticsResult.value,
        )
      } else {
        setAnalyticsError(
          analyticsResult.reason instanceof
            Error
            ? analyticsResult.reason
                .message
            : 'Analytics could not be loaded.',
        )
      }

      const qrSucceeded =
        qrResult.status ===
        'fulfilled'

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
    }

    void loadGeneratedContent()

    return () => {
      cancelled = true
    }
  }, [shortLink])

  useEffect(() => {
    if (
      !shouldFocusQr ||
      !qrCodeDataUrl
    ) {
      return
    }

    qrSectionRef.current
      ?.scrollIntoView({
        behavior: 'smooth',
        block: 'start',
      })

    setShouldFocusQr(false)
  }, [
    qrCodeDataUrl,
    shouldFocusQr,
  ])

  function clearCopyLabelTimer() {
  if (
    copyLabelTimerRef.current ===
    null
  ) {
    return
  }

  globalThis.clearTimeout(
    copyLabelTimerRef.current,
  )

  copyLabelTimerRef.current = null
}

function resetCopyFeedback() {
  clearCopyLabelTimer()
  setCopyLabel('Copy')
}

function scheduleCopyLabelReset() {
  clearCopyLabelTimer()

  copyLabelTimerRef.current =
    globalThis.setTimeout(
      () => {
        setCopyLabel('Copy')

        copyLabelTimerRef.current =
          null
      },
      COPY_LABEL_RESET_DELAY_MS,
    )
}

  function resetGeneratedContent() {
    setShortLink(null)
    setAnalytics(null)
    setAnalyticsError('')
    setQrCodeDataUrl('')
    setShouldFocusQr(false)
    resetCopyFeedback()
  }

  function handleUrlChange(event) {
    const nextUrl =
      event.target.value

    setUrl(nextUrl)
    resetGeneratedContent()

    if (!nextUrl.trim()) {
      setStatusType('error')

      setStatusMessage(
        'Enter an HTTP or HTTPS URL.',
      )

      return
    }

    if (
      isSupportedWebUrl(nextUrl)
    ) {
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

  async function createLinkFromCurrentUrl(
    options = {},
  ) {
    const {
      allowDuplicate = false,
    } = options

    if (
      !isValidUrl ||
      isSubmitting
    ) {
      return
    }

    if (
      duplicateRecentResult &&
      !allowDuplicate
    ) {
      setStatusType('warning')

      setStatusMessage(
        'This URL already has a recent Shrtn link.',
      )

      return
    }

    const originalUrl =
      url.trim()

    setIsSubmitting(true)
    resetGeneratedContent()
    setStatusType('loading')

    setStatusMessage(
      'Creating your short link...',
    )

    try {
      const createdLink =
        await createShortLink(
          originalUrl,
        )

      setStatusType('loading')

      setStatusMessage(
        'Short link created. Preparing QR code and analytics...',
      )

      setShortLink(createdLink)

      try {
        const storedResult =
          await saveLastGeneratedResult({
            originalUrl,
            source: 'popup',
            shortLink: createdLink,
          })

        if (storedResult) {
          const updatedRecentLinks =
            await getRecentGeneratedResults()

          setRecentLinks(
            updatedRecentLinks,
          )
        }
      } catch {
        // Storage failure must not hide
        // a successfully generated link.
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

  function handleSubmit(event) {
    event.preventDefault()

    void createLinkFromCurrentUrl()
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

      setAnalytics(
        refreshedAnalytics,
      )

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

  clearCopyLabelTimer()

  try {
    await navigator.clipboard
      .writeText(
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
  } finally {
    scheduleCopyLabelReset()
  }
}

  function handleShortenAnother() {
  resetGeneratedContent()
  setUrl('')

  setStatusType('loading')

  setStatusMessage(
    'Enter another HTTP or HTTPS URL.',
  )

  globalThis.requestAnimationFrame?.(
    () => {
      urlInputRef.current?.focus()
    },
  )
}

  function handleSelectRecentLink(
    recentResult,
  ) {
    const selectedShortLink =
      recentResult?.shortLink

    if (
      !selectedShortLink?.shortUrl ||
      !selectedShortLink?.shortCode
    ) {
      return
    }

    setUrl(
      recentResult.originalUrl ??
        selectedShortLink.originalUrl ??
        '',
    )

    setAnalytics(null)
    setAnalyticsError('')
    setQrCodeDataUrl('')
    setShouldFocusQr(false)
    resetCopyFeedback()
    setStatusType('loading')

    setStatusMessage(
      'Loading the selected recent link...',
    )

    setShortLink({
      ...selectedShortLink,
    })
  }

  async function handleClearRecentLinks() {
    if (isClearingRecentLinks) {
      return
    }

    setIsClearingRecentLinks(true)

    try {
      const wasCleared =
        await clearRecentGeneratedResults()

      if (!wasCleared) {
        throw new Error(
          'Recent links storage is unavailable.',
        )
      }

      setRecentLinks([])
      setStatusType('success')

      setStatusMessage(
        'Recent links cleared successfully.',
      )
    } catch (error) {
      setStatusType('error')

      setStatusMessage(
        error instanceof Error
          ? error.message
          : 'Recent links could not be cleared.',
      )
    } finally {
      setIsClearingRecentLinks(false)
    }
  }

  return (
    <main className="popup">
      <header className="brand">
        <div className="brand__identity">
          <img
            className="brand__logo"
            src="/assets/link-logo.png"
            alt=""
          />

          <div>
            <h1>Shrtn</h1>

            <p>
              Shorten. Track. Share.
            </p>
          </div>
        </div>

        <a
          className="brand__website"
          href="https://shrtn.up.railway.app"
          target="_blank"
          rel="noreferrer"
        >
          Website

          <span aria-hidden="true">
            ↗
          </span>
        </a>
      </header>

      <section
        className="panel sketch-panel"
        aria-labelledby="create-link-heading"
      >
        <div className="panel__heading">
          <p className="eyebrow">
            Browser extension
          </p>

          <h2 id="create-link-heading">
            Shorten this link
          </h2>

          <span
            className="sketch-underline"
            aria-hidden="true"
          />
        </div>

        <form
          aria-busy={isSubmitting}
          onSubmit={handleSubmit}
        >
          <label htmlFor="url">
            URL
          </label>

          <div className="url-field">
            <span
              className="url-field__icon"
              aria-hidden="true"
            >
              ↗
            </span>

            <input
              ref={urlInputRef}
              id="url"
              name="url"
              type="url"
              value={url}
              placeholder="https://example.com"
              aria-invalid={
                url.length > 0 &&
                !isValidUrl
              }
              disabled={
                isReadingTab ||
                isSubmitting
              }
              onChange={handleUrlChange}
            />
          </div>

          <button
            className="button button--primary"
            type="submit"
              disabled={
                !isValidUrl ||
                isSubmitting ||
                isReadingTab ||
                Boolean(
                  duplicateRecentResult,
                )
              }
          >
            {isSubmitting && (
              <span
                className="button__spinner"
                aria-hidden="true"
              />
            )}

            {isSubmitting
              ? 'Shortening...'
              : 'Shorten URL'}
          </button>
        </form>

        <p
          className={
            `helper helper--${statusType}`
          }
          role={
            statusType === 'error'
              ? 'alert'
              : 'status'
          }
        >
          <span
            className="helper__dot"
            aria-hidden="true"
          />

          {statusMessage}
        </p>
            {duplicateRecentResult &&
              !isSubmitting && (
                <section
                  className="duplicate-warning"
                  aria-labelledby="duplicate-warning-heading"
                >
                  <div className="duplicate-warning__content">
                    <span
                      className="duplicate-warning__icon"
                      aria-hidden="true"
                    >
                      !
                    </span>

                    <div className="duplicate-warning__details">
                      <h3 id="duplicate-warning-heading">
                        Already shortened
                      </h3>

                      <p>
                        This URL already has a recent
                        Shrtn link.
                      </p>

                      <code>
                        {
                          duplicateRecentResult
                            .shortLink.shortUrl
                        }
                      </code>
                    </div>
                  </div>

                  <div className="duplicate-warning__actions">
                    <button
                      className="button button--use-existing"
                      type="button"
                      onClick={() => {
                        handleSelectRecentLink(
                          duplicateRecentResult,
                        )
                      }}
                    >
                      Use existing link
                    </button>

                    <button
                      className="button button--create-another"
                      type="button"
                      onClick={() => {
                        void createLinkFromCurrentUrl({
                          allowDuplicate: true,
                        })
                      }}
                    >
                      Create another
                    </button>
                  </div>
                </section>
              )}
        {isSubmitting && (
          <section
            className="loading-card sketch-panel"
            aria-label="Creating short link"
          >
            <span className="skeleton skeleton--short" />

            <span className="skeleton skeleton--long" />

            <span className="skeleton skeleton--medium" />
          </section>
        )}

        {shortLink && (
          <section
            className="result sketch-panel"
            aria-labelledby="result-heading"
          >
            <div className="result__header">
              <div>
                <span className="result__label">
                  Your short link
                </span>

                <h3 id="result-heading">
                  Ready to share
                </h3>
              </div>

              <span className="result__code">
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
                aria-live="polite"
                onClick={handleCopy}
              >
                {copyLabel}
              </button>

              <a
                className="button button--open"
                href={shortLink.shortUrl}
                target="_blank"
                rel="noreferrer"
              >
                Open
              </a>
            </div>

            <section
              className="analytics"
              aria-labelledby="analytics-heading"
              aria-busy={
                isLoadingAnalytics
              }
            >
              <div className="analytics__header">
                <h3 id="analytics-heading">
                  Analytics
                </h3>

                <button
                  className="button button--secondary"
                  type="button"
                  disabled={
                    isLoadingAnalytics
                  }
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
                      {
                        analytics
                          .clickCount
                      }
                    </dd>
                  </div>

                  <div className="analytics__metric">
                    <dt>Created</dt>

                    <dd>
                      {formatDateTime(
                        analytics
                          .createdAt,
                      )}
                    </dd>
                  </div>

                  <div className="analytics__metric">
                    <dt>
                      Last clicked
                    </dt>

                    <dd>
                      {formatDateTime(
                        analytics
                          .lastClickedAt,
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

              {analytics &&
                analyticsError && (
                  <p
                    className="analytics__message analytics__message--error"
                    role="alert"
                  >
                    {analyticsError}
                  </p>
                )}
            </section>

            {qrCodeDataUrl && (
              <section
                ref={qrSectionRef}
                className="qr"
                aria-labelledby="qr-heading"
              >
                <div className="qr__heading">
                  <div>
                    <span className="result__label">
                      Share another way
                    </span>

                    <h3 id="qr-heading">
                      QR code
                    </h3>
                  </div>

                  <a
                    className="button button--download"
                    href={qrCodeDataUrl}
                    download={
                      `shrtn-${shortLink.shortCode}.png`
                    }
                  >
                    Download
                  </a>
                </div>

                <div className="qr__image-wrap">
                  <img
                    src={qrCodeDataUrl}
                    alt={
                      `QR code for ${shortLink.shortUrl}`
                    }
                  />
                </div>
              </section>
            )}
                            <div className="result__next-action">
                  <button
                    className="button button--shorten-another"
                    type="button"
                    onClick={handleShortenAnother}
                  >
                    <span aria-hidden="true">
                      +
                    </span>

                    Shorten another
                  </button>
                </div>
          </section>
        )}
      </section>

      {recentLinks.length > 0 && (
        <section
          className="recent sketch-panel"
          aria-labelledby="recent-links-heading"
        >
          <div className="recent__header">
            <div>
              <p className="eyebrow">
                Local history
              </p>

              <h2 id="recent-links-heading">
                Recent links
              </h2>

              <p className="recent__count">
                {recentLinks.length}
                {' '}
                {recentLinks.length === 1
                  ? 'saved link'
                  : 'saved links'}
              </p>
            </div>

            <button
              className="button button--clear-history"
              type="button"
              disabled={
                isClearingRecentLinks
              }
              onClick={
                handleClearRecentLinks
              }
            >
              {isClearingRecentLinks
                ? 'Clearing...'
                : 'Clear'}
            </button>
          </div>

          <ol className="recent__list">
            {recentLinks.map(
              (recentResult) => {
                const recentShortLink =
                  recentResult.shortLink

                const originalUrl =
                  recentResult.originalUrl ??
                  recentShortLink
                    .originalUrl ??
                  'Original URL unavailable'

                return (
                  <li
                    className="recent__item"
                    key={
                      recentShortLink
                        .shortUrl
                    }
                  >
                    <button
                      className="recent__select"
                      type="button"
                      title={originalUrl}
                      onClick={() => {
                        handleSelectRecentLink(
                          recentResult,
                        )
                      }}
                    >
                      <span className="recent__original">
                        {originalUrl}
                      </span>

                      <span className="recent__short">
                        {
                          recentShortLink
                            .shortUrl
                        }
                      </span>

                      <span className="recent__meta">
                        {formatResultSource(
                          recentResult.source,
                        )}

                        <span
                          aria-hidden="true"
                        >
                          {' · '}
                        </span>

                        {formatDateTime(
                          recentResult.savedAt,
                        )}
                      </span>
                    </button>

                    <a
                      className="recent__open"
                      href={
                        recentShortLink
                          .shortUrl
                      }
                      target="_blank"
                      rel="noreferrer"
                      aria-label={
                        `Open ${recentShortLink.shortUrl}`
                      }
                      title="Open short link"
                    >
                      ↗
                    </a>
                  </li>
                )
              },
            )}
          </ol>
        </section>
      )}

      <footer className="status">
        <span
          className="status__dot"
          aria-hidden="true"
        />

        <span>
          Live API
        </span>

        <span aria-hidden="true">
          ·
        </span>

        <span>
          QR and analytics enabled
        </span>
      </footer>
    </main>
  )
}

export default App