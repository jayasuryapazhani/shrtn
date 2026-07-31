export const PENDING_CONTEXT_RESULT_KEY =
  'pendingContextActionResult'

export const LAST_GENERATED_RESULT_KEY =
  'lastGeneratedResult'

export const RECENT_GENERATED_RESULTS_KEY =
  'recentGeneratedResults'

export const MAX_RECENT_RESULTS = 20

function getLocalStorage(
  chromeApi = globalThis.chrome,
) {
  return chromeApi?.storage?.local
}

function isValidGeneratedResult(result) {
  return Boolean(
    result?.shortLink?.shortUrl &&
      result?.shortLink?.shortCode,
  )
}

function createStoredResult(result) {
  return {
    originalUrl:
      result.originalUrl ??
      result.shortLink.originalUrl ??
      '',

    source:
      result.source ?? 'popup',

    shortLink:
      result.shortLink,

    savedAt:
      new Date().toISOString(),
  }
}

export async function savePendingContextActionResult(
  result,
  chromeApi = globalThis.chrome,
) {
  const storageArea =
    getLocalStorage(chromeApi)

  if (
    typeof storageArea?.set !==
    'function'
  ) {
    throw new Error(
      'Chrome local storage is unavailable.',
    )
  }

  await storageArea.set({
    [PENDING_CONTEXT_RESULT_KEY]:
      result,
  })
}

export async function takePendingContextActionResult(
  chromeApi = globalThis.chrome,
) {
  const storageArea =
    getLocalStorage(chromeApi)

  if (
    typeof storageArea?.get !==
      'function' ||
    typeof storageArea?.remove !==
      'function'
  ) {
    return null
  }

  const storedValue =
    await storageArea.get(
      PENDING_CONTEXT_RESULT_KEY,
    )

  const result =
    storedValue?.[
      PENDING_CONTEXT_RESULT_KEY
    ] ?? null

  if (result) {
    await storageArea.remove(
      PENDING_CONTEXT_RESULT_KEY,
    )
  }

  return result
}

export async function getRecentGeneratedResults(
  chromeApi = globalThis.chrome,
) {
  const storageArea =
    getLocalStorage(chromeApi)

  if (
    typeof storageArea?.get !==
    'function'
  ) {
    return []
  }

  const storedValue =
    await storageArea.get(
      RECENT_GENERATED_RESULTS_KEY,
    )

  const results =
    storedValue?.[
      RECENT_GENERATED_RESULTS_KEY
    ]

  if (!Array.isArray(results)) {
    return []
  }

  return results
    .filter(isValidGeneratedResult)
    .slice(0, MAX_RECENT_RESULTS)
}

export async function saveLastGeneratedResult(
  result,
  chromeApi = globalThis.chrome,
) {
  const storageArea =
    getLocalStorage(chromeApi)

  if (
    typeof storageArea?.set !==
    'function'
  ) {
    return false
  }

  if (!isValidGeneratedResult(result)) {
    return false
  }

  const storedResult =
    createStoredResult(result)

  const existingResults =
    await getRecentGeneratedResults(
      chromeApi,
    )

  const filteredResults =
    existingResults.filter(
      (existingResult) => {
        const existingShortUrl =
          existingResult.shortLink
            ?.shortUrl

        const existingShortCode =
          existingResult.shortLink
            ?.shortCode

        return (
          existingShortUrl !==
            storedResult.shortLink
              .shortUrl &&
          existingShortCode !==
            storedResult.shortLink
              .shortCode
        )
      },
    )

  const recentResults = [
    storedResult,
    ...filteredResults,
  ].slice(0, MAX_RECENT_RESULTS)

  await storageArea.set({
    [LAST_GENERATED_RESULT_KEY]:
      storedResult,

    [RECENT_GENERATED_RESULTS_KEY]:
      recentResults,
  })

  return storedResult
}

export async function getLastGeneratedResult(
  chromeApi = globalThis.chrome,
) {
  const storageArea =
    getLocalStorage(chromeApi)

  if (
    typeof storageArea?.get !==
    'function'
  ) {
    return null
  }

  const storedValue =
    await storageArea.get(
      LAST_GENERATED_RESULT_KEY,
    )

  const result =
    storedValue?.[
      LAST_GENERATED_RESULT_KEY
    ] ?? null

  if (!isValidGeneratedResult(result)) {
    return null
  }

  return result
}

export async function clearRecentGeneratedResults(
  chromeApi = globalThis.chrome,
) {
  const storageArea =
    getLocalStorage(chromeApi)

  if (
    typeof storageArea?.remove !==
    'function'
  ) {
    return false
  }

  await storageArea.remove(
    RECENT_GENERATED_RESULTS_KEY,
  )

  return true
}