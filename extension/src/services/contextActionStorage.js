export const PENDING_CONTEXT_RESULT_KEY =
  'pendingContextActionResult'

export const LAST_GENERATED_RESULT_KEY =
  'lastGeneratedResult'

function getLocalStorage(
  chromeApi = globalThis.chrome,
) {
  return chromeApi?.storage?.local
}

export async function savePendingContextActionResult(
  result,
  chromeApi = globalThis.chrome,
) {
  const storageArea =
    getLocalStorage(chromeApi)

  if (
    typeof storageArea?.set !== 'function'
  ) {
    throw new Error(
      'Chrome local storage is unavailable.',
    )
  }

  await storageArea.set({
    [PENDING_CONTEXT_RESULT_KEY]: result,
  })
}

export async function takePendingContextActionResult(
  chromeApi = globalThis.chrome,
) {
  const storageArea =
    getLocalStorage(chromeApi)

  if (
    typeof storageArea?.get !== 'function' ||
    typeof storageArea?.remove !== 'function'
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

export async function saveLastGeneratedResult(
  result,
  chromeApi = globalThis.chrome,
) {
  const storageArea =
    getLocalStorage(chromeApi)

  if (
    typeof storageArea?.set !== 'function'
  ) {
    return false
  }

  if (
    !result?.shortLink?.shortUrl ||
    !result?.shortLink?.shortCode
  ) {
    return false
  }

  const storedResult = {
    originalUrl:
      result.originalUrl ??
      result.shortLink.originalUrl ??
      '',

    source:
      result.source ?? 'popup',

    shortLink: result.shortLink,

    savedAt:
      new Date().toISOString(),
  }

  await storageArea.set({
    [LAST_GENERATED_RESULT_KEY]:
      storedResult,
  })

  return storedResult
}

export async function getLastGeneratedResult(
  chromeApi = globalThis.chrome,
) {
  const storageArea =
    getLocalStorage(chromeApi)

  if (
    typeof storageArea?.get !== 'function'
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

  if (
    !result?.shortLink?.shortUrl ||
    !result?.shortLink?.shortCode
  ) {
    return null
  }

  return result
}