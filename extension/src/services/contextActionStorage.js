export const PENDING_CONTEXT_RESULT_KEY =
  'pendingContextActionResult'

export async function savePendingContextActionResult(
  result,
  chromeApi = globalThis.chrome,
) {
  const storageArea =
    chromeApi?.storage?.local

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
    chromeApi?.storage?.local

  if (
    typeof storageArea?.get !== 'function' ||
    typeof storageArea?.remove !== 'function'
  ) {
    return null
  }

  const storedValue = await storageArea.get(
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