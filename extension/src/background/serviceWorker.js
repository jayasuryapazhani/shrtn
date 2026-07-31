export function handleInstalled() {
  return undefined
}

export function registerServiceWorker(
  chromeApi = globalThis.chrome,
) {
  const addInstalledListener =
    chromeApi?.runtime?.onInstalled?.addListener

  if (
    typeof addInstalledListener !== 'function'
  ) {
    return false
  }

  addInstalledListener(handleInstalled)

  return true
}

registerServiceWorker()