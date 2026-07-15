const API_BASE_URL =
  'https://shrtn.up.railway.app'

const API_UNAVAILABLE_MESSAGE =
  'Shrtn API is temporarily unavailable. Please try again.'

function getApiErrorMessage(
  payload,
  fallbackMessage,
) {
  return payload?.error?.message ?? fallbackMessage
}

async function requestJson(
  path,
  options,
  fallbackMessage,
) {
  let response

  try {
    response = await fetch(
      `${API_BASE_URL}${path}`,
      options,
    )
  } catch {
    throw new Error(API_UNAVAILABLE_MESSAGE)
  }

  let payload

  try {
    payload = await response.json()
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

export async function createShortLink(originalUrl) {
  const payload = await requestJson(
    '/api/v1/links',
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        originalUrl,
      }),
    },
    'The link could not be shortened.',
  )

  if (!payload?.data?.shortUrl) {
    throw new Error(
      'Shrtn API response did not include a short URL.',
    )
  }

  return payload.data
}

export async function getLinkAnalytics(shortCode) {
  if (
    typeof shortCode !== 'string' ||
    !/^[A-Za-z0-9]{7}$/.test(shortCode)
  ) {
    throw new Error(
      'A valid short code is required to load analytics.',
    )
  }

  const payload = await requestJson(
    `/api/v1/links/${shortCode}/analytics`,
    {
      method: 'GET',
    },
    'Link analytics could not be loaded.',
  )

  if (
    !payload?.data ||
    typeof payload.data.shortCode !== 'string' ||
    typeof payload.data.clickCount !== 'number'
  ) {
    throw new Error(
      'Shrtn API response did not include valid analytics.',
    )
  }

  return payload.data
}