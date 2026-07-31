export const FALLBACK_EXTENSION_VERSION =
  '1.1.0'

export function getExtensionVersion(
  chromeApi = globalThis.chrome,
) {
  try {
    const version =
      chromeApi?.runtime
        ?.getManifest?.()
        ?.version

    if (
      typeof version !== 'string' ||
      !version.trim()
    ) {
      return FALLBACK_EXTENSION_VERSION
    }

    return version.trim()
  } catch {
    return FALLBACK_EXTENSION_VERSION
  }
}