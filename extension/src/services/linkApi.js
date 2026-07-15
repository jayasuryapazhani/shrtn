const API_BASE_URL = 'https://shrtn.up.railway.app'

function getApiErrorMessage(payload) {
  return (
    payload?.error?.message ??
    'The link could not be shortened.'
  )
}

export async function createShortLink(originalUrl) {
  let response

  try {
    response = await fetch(`${API_BASE_URL}/api/v1/links`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        originalUrl,
      }),
    })
  } catch {
    throw new Error(
      'Shrtn API is temporarily unavailable. Please try again.',
    )
  }

  let payload

  try {
    payload = await response.json()
  } catch {
    throw new Error('Shrtn API returned an invalid response.')
  }

  if (!response.ok) {
    throw new Error(getApiErrorMessage(payload))
  }

  if (!payload?.data?.shortUrl) {
    throw new Error(
      'Shrtn API response did not include a short URL.',
    )
  }

  return payload.data
}