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

const shortLinkResult =
  document.querySelector('#short-link-result')

const shortUrlInput =
  document.querySelector('#short-url')

const copyButton =
  document.querySelector('#copy-button')

  const resultShortCode =
  document.querySelector('#result-short-code')
const openLink =
  document.querySelector('#open-link')

const resultClickCount =
  document.querySelector('#result-click-count')

const resultLastClicked =
  document.querySelector('#result-last-clicked')




function setApiStatus(message, isOnline) {
  if (!apiStatus || !statusDot) {
    return
  }

  apiStatus.textContent = message

  statusDot.style.backgroundColor = isOnline
    ? 'var(--success)'
    : 'var(--error)'

  statusDot.style.boxShadow = isOnline
    ? '0 0 0 6px rgb(47 125 87 / 13%)'
    : '0 0 0 6px rgb(180 59 50 / 13%)'
}

function setFormMessage(message, type = '') {
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
    !shortenButton ||
    !originalUrlInput ||
    !shortenForm
  ) {
    return
  }

  shortenButton.disabled = isSubmitting
  originalUrlInput.disabled = isSubmitting

  shortenForm.setAttribute(
    'aria-busy',
    String(isSubmitting),
  )

  shortenButton.textContent = isSubmitting
    ? 'Creating...'
    : 'Shorten URL'
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

async function readJsonResponse(response) {
  try {
    return await response.json()
  } catch {
    throw new Error(
      'Shrtn API returned an invalid response.',
    )
  }
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

  return parsedUrl.toString()
}

async function checkApiHealth() {
  try {
    const response = await fetch('/health', {
      headers: {
        Accept: 'application/json',
      },
      cache: 'no-store',
    })

    const payload =
      await readJsonResponse(response)

    if (
      !response.ok ||
      payload?.status !== 'UP'
    ) {
      throw new Error(
        'API health check failed.',
      )
    }

    const version = payload.version
      ? ` · v${payload.version}`
      : ''

    setApiStatus(
      `Live API online${version}`,
      true,
    )
  } catch {
    setApiStatus(
      'Live API status unavailable',
      false,
    )
  }
}

async function createShortLink(originalUrl) {
  let response

  try {
    response = await fetch(
      '/api/v1/links',
      {
        method: 'POST',
        headers: {
          Accept: 'application/json',
          'Content-Type':
            'application/json',
        },
        body: JSON.stringify({
          originalUrl,
        }),
      },
    )
  } catch {
    throw new Error(
      'Shrtn API is temporarily unavailable. Please try again.',
    )
  }

  const payload =
    await readJsonResponse(response)

  if (!response.ok) {
    throw new Error(
      getApiErrorMessage(
        payload,
        'The link could not be shortened.',
      ),
    )
  }

  if (
    typeof payload?.data?.shortUrl !==
      'string' ||
    typeof payload?.data?.shortCode !==
      'string'
  ) {
    throw new Error(
      'Shrtn API response did not include a valid short link.',
    )
  }

  return payload.data
}

async function copyText(value) {
  if (navigator.clipboard?.writeText) {
    await navigator.clipboard.writeText(
      value,
    )

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

  shortUrlInput.setSelectionRange(0, 0)
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

      if (
        !originalUrlInput ||
        !shortLinkResult ||
        !shortUrlInput ||
        !copyButton
      ) {
        return
      }

      shortLinkResult.hidden = true
      shortUrlInput.value = ''
      copyButton.textContent = 'Copy'
      setFormMessage('')

      try {
        const originalUrl =
          validateOriginalUrl(
            originalUrlInput.value.trim(),
          )

        setSubmitting(true)

        setFormMessage(
          'Creating your short link...',
        )

        const createdLink =
          await createShortLink(
            originalUrl,
          )

        shortUrlInput.value =
          createdLink.shortUrl

        shortLinkResult.hidden = false

        setFormMessage(
          'Short link created successfully.',
          'success',
        )

        resultShortCode.textContent =
  createdLink.shortCode

openLink.href =
  createdLink.shortUrl

resultClickCount.textContent = '0'
resultLastClicked.textContent = 'Never'
      } catch (error) {
        setFormMessage(
          error instanceof Error
            ? error.message
            : 'The link could not be shortened.',
          'error',
        )
      } finally {
        setSubmitting(false)
      }
    },
  )
}

if (originalUrlInput) {
  originalUrlInput.addEventListener(
    'input',
    () => {
      if (
        formMessage?.dataset.type ===
        'error'
      ) {
        setFormMessage('')
      }
    },
  )
}

if (copyButton) {
  copyButton.addEventListener(
    'click',
    async () => {
      const shortUrl =
        shortUrlInput?.value

      if (!shortUrl) {
        return
      }

      try {
        await copyText(shortUrl)

        copyButton.textContent =
          'Copied'

        setFormMessage(
          'Short link copied to the clipboard.',
          'success',
        )

        window.setTimeout(() => {
          copyButton.textContent =
            'Copy'
        }, 1800)
      } catch {
        copyButton.textContent =
          'Copy failed'

        setFormMessage(
          'The short link could not be copied.',
          'error',
        )
      }
    },
  )
}

void checkApiHealth()
