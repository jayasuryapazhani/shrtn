import {
  describe,
  expect,
  it,
} from 'vitest'

import {
  FALLBACK_EXTENSION_VERSION,
  getExtensionVersion,
} from '../src/utils/extensionInfo'

describe('extension information', () => {
  it('returns the manifest version', () => {
    const chromeApi = {
      runtime: {
        getManifest() {
          return {
            version: '1.1.0',
          }
        },
      },
    }

    expect(
      getExtensionVersion(chromeApi),
    ).toBe('1.1.0')
  })

  it('returns the fallback when the API is unavailable', () => {
    expect(
      getExtensionVersion({}),
    ).toBe(
      FALLBACK_EXTENSION_VERSION,
    )
  })

  it('returns the fallback for an invalid version', () => {
    const chromeApi = {
      runtime: {
        getManifest() {
          return {
            version: '',
          }
        },
      },
    }

    expect(
      getExtensionVersion(chromeApi),
    ).toBe(
      FALLBACK_EXTENSION_VERSION,
    )
  })
})