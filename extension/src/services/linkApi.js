const API_BASE_URL = 'http://localhost:5056'

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
      'Shrtn API is unavailable. Start the backend on port 5056.',
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