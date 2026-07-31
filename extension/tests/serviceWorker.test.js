import {
  describe,
  expect,
  it,
  vi,
} from 'vitest'

import {
  handleInstalled,
  registerServiceWorker,
} from '../src/background/serviceWorker'

describe('service worker registration', () => {
  it('registers the installation listener', () => {
    const addListener = vi.fn()

    const chromeApi = {
      runtime: {
        onInstalled: {
          addListener,
        },
      },
    }

    const wasRegistered =
      registerServiceWorker(chromeApi)

    expect(wasRegistered).toBe(true)

    expect(addListener).toHaveBeenCalledTimes(1)

    expect(addListener).toHaveBeenCalledWith(
      handleInstalled,
    )
  })

  it('returns false when the Chrome API is unavailable', () => {
    expect(
      registerServiceWorker(undefined),
    ).toBe(false)

    expect(
      registerServiceWorker({}),
    ).toBe(false)
  })

  it('handles the installation event', () => {
    expect(handleInstalled()).toBeUndefined()
  })
})