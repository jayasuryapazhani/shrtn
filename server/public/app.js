const REQUEST_TIMEOUT_MS = 10000
const HEALTH_TIMEOUT_MS = 6000
const ANALYTICS_RETRY_COUNT = 1
const ANALYTICS_RETRY_DELAY_MS = 400
const COPY_RESET_DELAY_MS = 2000

const API_UNAVAILABLE_MESSAGE =
  'Shrtn API is temporarily unavailable. Please try again.'

const API_TIMEOUT_MESSAGE =
  'Shrtn API took too long to respond. Please try again.'

const apiStatus =
  document.querySelector('#api-status')

const statusDot =
  document.querySelector('.status-dot')

const shortenForm =
  document.querySelector('#shorten-form')

const originalUrlInput =
  document.querySelector('#original-url')

const shortenButton =
  document.querySelector('#shorten-button')

const formMessage =
  document.querySelector('#form-message')

const loadingResult =
  document.querySelector('#loading-result')

const shortLinkResult =
  document.querySelector(
    '#short-link-result',
  )

const shortUrlInput =
  document.querySelector('#short-url')

const copyButton =
  document.querySelector('#copy-button')

const resultShortCode =
  document.querySelector(
    '#result-short-code',
  )

const openLink =
  document.querySelector('#open-link')

const resultClickCount =
  document.querySelector(
    '#result-click-count',
  )

const resultLastClicked =
  document.querySelector(
    '#result-last-clicked',
  )

let copyResetTimerId = null

const dateTimeFormatter =
  new Intl.DateTimeFormat(
    undefined,
    {
      dateStyle: 'medium',
      timeStyle: 'short',
    },
  )

function setApiStatus(
  message,
  isOnline,
) {
  if (
    !apiStatus ||
    !statusDot
  ) {
    return
  }

  apiStatus.textContent = message

  statusDot.style.backgroundColor =
    isOnline
      ? 'var(--success)'
      : 'var(--error)'

  statusDot.style.boxShadow =
    isOnline
      ? '0 0 0 5px rgb(63 131 103 / 12%)'
      : '0 0 0 5px rgb(179 78 66 / 12%)'
}

function setFormMessage(
  message,
  type = '',
) {
  if (!formMessage) {
    return
  }

  formMessage.textContent = message

  if (type) {
    formMessage.dataset.type = type
  } else {
    delete formMessage.dataset.type
  }
}

function setSubmitting(isSubmitting) {
  if (
    !shortenForm ||
    !shortenButton ||
    !originalUrlInput
  ) {
    return
  }

  shortenForm.setAttribute(
    'aria-busy',
    String(isSubmitting),
  )

  shortenButton.disabled =
    isSubmitting

  originalUrlInput.disabled =
    isSubmitting

  shortenButton.textContent =
    isSubmitting
      ? 'Creating...'
      : 'Shorten URL'
}

function setLoading(isLoading) {
  if (!loadingResult) {
    return
  }

  loadingResult.hidden =
    !isLoading
}

function clearCopyResetTimer() {
  if (copyResetTimerId === null) {
    return
  }

  globalThis.clearTimeout(
    copyResetTimerId,
  )

  copyResetTimerId = null
}

function resetCopyFeedback() {
  clearCopyResetTimer()

  if (copyButton) {
    copyButton.textContent = 'Copy'
  }
}

function scheduleCopyReset() {
  clearCopyResetTimer()

  copyResetTimerId =
    globalThis.setTimeout(
      () => {
        if (copyButton) {
          copyButton.textContent =
            'Copy'
        }

        copyResetTimerId = null
      },
      COPY_RESET_DELAY_MS,
    )
}

function resetResult() {
  if (shortLinkResult) {
    shortLinkResult.hidden = true
  }

  if (shortUrlInput) {
    shortUrlInput.value = ''
  }

  if (resultShortCode) {
    resultShortCode.textContent = ''
  }

  if (openLink) {
    openLink.href = '#'
  }

  if (resultClickCount) {
    resultClickCount.textContent = '0'
  }

  if (resultLastClicked) {
    resultLastClicked.textContent =
      'Never'
  }

  resetCopyFeedback()
}

function getApiErrorMessage(
  payload,
  fallbackMessage,
) {
  return (
    payload?.error?.message ??
    fallbackMessage
  )
}

function isRetryableStatus(status) {
  return (
    status === 408 ||
    status === 429 ||
    status >= 500
  )
}

function wait(delayMs) {
  if (delayMs <= 0) {
    return Promise.resolve()
  }

  return new Promise((resolve) => {
    globalThis.setTimeout(
      resolve,
      delayMs,
    )
  })
}

async function fetchWithTimeout(
  url,
  options = {},
  timeoutMs =
    REQUEST_TIMEOUT_MS,
) {
  const controller =
    new AbortController()

  const timeoutId =
    globalThis.setTimeout(
      () => {
        controller.abort()
      },
      timeoutMs,
    )

  try {
    return await fetch(
      url,
      {
        ...options,
        signal: controller.signal,
      },
    )
  } catch (error) {
    if (controller.signal.aborted) {
      throw new Error(
        API_TIMEOUT_MESSAGE,
      )
    }

    throw error
  } finally {
    globalThis.clearTimeout(
      timeoutId,
    )
  }
}

async function readJsonResponse(
  response,
) {
  try {
    return await response.json()
  } catch {
    throw new Error(
      'Shrtn API returned an invalid response.',
    )
  }
}

async function requestJson(
  path,
  options,
  fallbackMessage,
  configuration = {},
) {
  const {
    timeoutMs =
      REQUEST_TIMEOUT_MS,

    retries = 0,

    retryDelayMs =
      ANALYTICS_RETRY_DELAY_MS,
  } = configuration

  let response

  for (
    let attempt = 0;
    attempt <= retries;
    attempt += 1
  ) {
    try {
      response =
        await fetchWithTimeout(
          path,
          options,
          timeoutMs,
        )
    } catch (error) {
      if (attempt < retries) {
        await wait(retryDelayMs)
        continue
      }

      if (
        error instanceof Error &&
        error.message ===
          API_TIMEOUT_MESSAGE
      ) {
        throw error
      }

      throw new Error(
        API_UNAVAILABLE_MESSAGE,
      )
    }

    const shouldRetry =
      !response.ok &&
      isRetryableStatus(
        response.status,
      ) &&
      attempt < retries

    if (shouldRetry) {
      await wait(retryDelayMs)
      continue
    }

    break
  }

  const payload =
    await readJsonResponse(response)

  if (!response.ok) {
    throw new Error(
      getApiErrorMessage(
        payload,
        fallbackMessage,
      ),
    )
  }

  return payload
}

function validateOriginalUrl(value) {
  if (!value) {
    throw new Error(
      'Enter an HTTP or HTTPS URL.',
    )
  }

  let parsedUrl

  try {
    parsedUrl = new URL(value)
  } catch {
    throw new Error(
      'Enter a valid URL.',
    )
  }

  if (
    parsedUrl.protocol !== 'http:' &&
    parsedUrl.protocol !== 'https:'
  ) {
    throw new Error(
      'Only HTTP and HTTPS URLs are supported.',
    )
  }

  return parsedUrl.href
}

function validateShortCode(shortCode) {
  return (
    typeof shortCode === 'string' &&
    /^[A-Za-z0-9]{7}$/.test(
      shortCode,
    )
  )
}

function formatDateTime(value) {
  if (!value) {
    return 'Never'
  }

  const date = new Date(value)

  if (
    Number.isNaN(
      date.getTime(),
    )
  ) {
    return 'Unavailable'
  }

  return dateTimeFormatter.format(
    date,
  )
}

async function checkApiHealth() {
  try {
    const response =
      await fetchWithTimeout(
        '/health',
        {
          headers: {
            Accept:
              'application/json',
          },

          cache: 'no-store',
        },
        HEALTH_TIMEOUT_MS,
      )

    const payload =
      await readJsonResponse(
        response,
      )

    if (
      !response.ok ||
      payload?.status !== 'UP'
    ) {
      throw new Error(
        'API health check failed.',
      )
    }

    setApiStatus(
      'Live API online',
      true,
    )
  } catch {
    setApiStatus(
      'Live API status unavailable',
      false,
    )
  }
}

async function createShortLink(
  originalUrl,
) {
  const payload =
    await requestJson(
      '/api/v1/links',
      {
        method: 'POST',

        headers: {
          Accept:
            'application/json',

          'Content-Type':
            'application/json',
        },

        body: JSON.stringify({
          originalUrl,
        }),
      },
      'The link could not be shortened.',
      {
        retries: 0,
      },
    )

  const createdLink =
    payload?.data

  if (
    typeof createdLink?.shortUrl !==
      'string' ||
    typeof createdLink?.shortCode !==
      'string'
  ) {
    throw new Error(
      'Shrtn API response did not include a valid short link.',
    )
  }

  return createdLink
}

async function getLinkAnalytics(
  shortCode,
) {
  if (
    !validateShortCode(shortCode)
  ) {
    throw new Error(
      'A valid short code is required to load analytics.',
    )
  }

  const payload =
    await requestJson(
      `/api/v1/links/${shortCode}/analytics`,
      {
        method: 'GET',

        headers: {
          Accept:
            'application/json',
        },

        cache: 'no-store',
      },
      'Link analytics could not be loaded.',
      {
        retries:
          ANALYTICS_RETRY_COUNT,
      },
    )

  const analytics =
    payload?.data

  if (
    typeof analytics?.clickCount !==
      'number' ||
    typeof analytics?.shortCode !==
      'string'
  ) {
    throw new Error(
      'Shrtn API response did not include valid analytics.',
    )
  }

  return analytics
}

function renderCreatedLink(
  createdLink,
) {
  if (
    !shortLinkResult ||
    !shortUrlInput ||
    !resultShortCode ||
    !openLink
  ) {
    return
  }

  shortUrlInput.value =
    createdLink.shortUrl

  resultShortCode.textContent =
    createdLink.shortCode

  openLink.href =
    createdLink.shortUrl

  if (resultClickCount) {
    resultClickCount.textContent =
      '0'
  }

  if (resultLastClicked) {
    resultLastClicked.textContent =
      'Never'
  }

  shortLinkResult.hidden = false
}

async function updateAnalytics(
  shortCode,
) {
  if (resultClickCount) {
    resultClickCount.textContent =
      'Loading...'
  }

  if (resultLastClicked) {
    resultLastClicked.textContent =
      'Loading...'
  }

  try {
    const analytics =
      await getLinkAnalytics(
        shortCode,
      )

    if (resultClickCount) {
      resultClickCount.textContent =
        String(
          analytics.clickCount,
        )
    }

    if (resultLastClicked) {
      resultLastClicked.textContent =
        formatDateTime(
          analytics.lastClickedAt,
        )
    }

    return true
  } catch {
    if (resultClickCount) {
      resultClickCount.textContent =
        'Unavailable'
    }

    if (resultLastClicked) {
      resultLastClicked.textContent =
        'Unavailable'
    }

    return false
  }
}

async function copyText(value) {
  if (
    navigator.clipboard
      ?.writeText
  ) {
    await navigator.clipboard
      .writeText(value)

    return
  }

  if (!shortUrlInput) {
    throw new Error(
      'Copy input is unavailable.',
    )
  }

  shortUrlInput.focus()
  shortUrlInput.select()

  const copied =
    document.execCommand('copy')

  shortUrlInput.setSelectionRange(
    0,
    0,
  )

  shortUrlInput.blur()

  if (!copied) {
    throw new Error(
      'Copy command failed.',
    )
  }
}

if (shortenForm) {
  shortenForm.addEventListener(
    'submit',
    async (event) => {
      event.preventDefault()

      if (!originalUrlInput) {
        return
      }

      resetResult()
      setFormMessage('')

      let originalUrl

      try {
        originalUrl =
          validateOriginalUrl(
            originalUrlInput
              .value
              .trim(),
          )
      } catch (error) {
        setFormMessage(
          error instanceof Error
            ? error.message
            : 'Enter a valid URL.',
          'error',
        )

        originalUrlInput.focus()
        return
      }

      setSubmitting(true)
      setLoading(true)

      setFormMessage(
        'Creating your short link...',
      )

      try {
        const createdLink =
          await createShortLink(
            originalUrl,
          )

        setLoading(false)

        renderCreatedLink(
          createdLink,
        )

        setFormMessage(
          'Short link created. Loading analytics...',
        )

        const analyticsLoaded =
          await updateAnalytics(
            createdLink.shortCode,
          )

        if (analyticsLoaded) {
          setFormMessage(
            'Short link and analytics loaded successfully.',
            'success',
          )
        } else {
          setFormMessage(
            'Short link created. Analytics are temporarily unavailable.',
            'success',
          )
        }
      } catch (error) {
        resetResult()

        setFormMessage(
          error instanceof Error
            ? error.message
            : 'The link could not be shortened.',
          'error',
        )
      } finally {
        setLoading(false)
        setSubmitting(false)
      }
    },
  )
}

if (originalUrlInput) {
  originalUrlInput.addEventListener(
    'input',
    () => {
      resetResult()
      setLoading(false)

      if (
        originalUrlInput
          .value
          .trim()
      ) {
        setFormMessage('')
      } else {
        setFormMessage(
          'Enter an HTTP or HTTPS URL.',
        )
      }
    },
  )
}

if (copyButton) {
  copyButton.addEventListener(
    'click',
    async () => {
      const shortUrl =
        shortUrlInput
          ?.value
          .trim()

      if (!shortUrl) {
        return
      }

      clearCopyResetTimer()

      try {
        await copyText(shortUrl)

        copyButton.textContent =
          'Copied'

        setFormMessage(
          'Short link copied to the clipboard.',
          'success',
        )
      } catch {
        copyButton.textContent =
          'Copy failed'

        setFormMessage(
          'The short link could not be copied.',
          'error',
        )
      } finally {
        scheduleCopyReset()
      }
    },
  )
}

globalThis.addEventListener(
  'beforeunload',
  () => {
    clearCopyResetTimer()
  },
)

resetResult()
setLoading(false)
void checkApiHealth()