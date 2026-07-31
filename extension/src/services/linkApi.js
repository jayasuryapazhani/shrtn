const API_BASE_URL =
  'https://shrtn.up.railway.app'

export const API_REQUEST_TIMEOUT_MS =
  10000

export const API_RETRY_DELAY_MS =
  400

export const ANALYTICS_RETRY_COUNT =
  1

const API_UNAVAILABLE_MESSAGE =
  'Shrtn API is temporarily unavailable. Please try again.'

const API_TIMEOUT_MESSAGE =
  'Shrtn API took too long to respond. Please try again.'

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
  options,
  timeoutMs,
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

async function requestJson(
  path,
  options,
  fallbackMessage,
  requestConfiguration = {},
) {
  const {
    timeoutMs =
      API_REQUEST_TIMEOUT_MS,

    retries = 0,

    retryDelayMs =
      API_RETRY_DELAY_MS,
  } = requestConfiguration

  let response

  for (
    let attempt = 0;
    attempt <= retries;
    attempt += 1
  ) {
    try {
      response =
        await fetchWithTimeout(
          `${API_BASE_URL}${path}`,
          options,
          timeoutMs,
        )
    } catch (error) {
      const hasRetryRemaining =
        attempt < retries

      if (hasRetryRemaining) {
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

    const shouldRetryResponse =
      !response.ok &&
      isRetryableStatus(
        response.status,
      ) &&
      attempt < retries

    if (shouldRetryResponse) {
      await wait(retryDelayMs)
      continue
    }

    break
  }

  let payload

  try {
    payload =
      await response.json()
  } catch {
    throw new Error(
      'Shrtn API returned an invalid response.',
    )
  }

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

export async function createShortLink(
  originalUrl,
  requestConfiguration = {},
) {
  const payload =
    await requestJson(
      '/api/v1/links',
      {
        method: 'POST',

        headers: {
          'Content-Type':
            'application/json',
        },

        body: JSON.stringify({
          originalUrl,
        }),
      },
      'The link could not be shortened.',
      {
        ...requestConfiguration,
        retries: 0,
      },
    )

  if (!payload?.data?.shortUrl) {
    throw new Error(
      'Shrtn API response did not include a short URL.',
    )
  }

  return payload.data
}

export async function getLinkAnalytics(
  shortCode,
  requestConfiguration = {},
) {
  if (
    typeof shortCode !== 'string' ||
    !/^[A-Za-z0-9]{7}$/.test(
      shortCode,
    )
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
      },
      'Link analytics could not be loaded.',
      {
        retries:
          ANALYTICS_RETRY_COUNT,

        ...requestConfiguration,
      },
    )

  if (
    !payload?.data ||
    typeof payload.data.shortCode !==
      'string' ||
    typeof payload.data.clickCount !==
      'number'
  ) {
    throw new Error(
      'Shrtn API response did not include valid analytics.',
    )
  }

  return payload.data
}