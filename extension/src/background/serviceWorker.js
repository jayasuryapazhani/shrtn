import {
  createShortLink,
} from '../services/linkApi'

import {
  savePendingContextActionResult,
} from '../services/contextActionStorage'

import {
  isSupportedWebUrl,
} from '../utils/url'

export const SHORTEN_PAGE_MENU_ID =
  'shrtn-shorten-current-page'

const SUPPORTED_PAGE_PATTERNS = [
  'http://*/*',
  'https://*/*',
]

function getErrorMessage(error) {
  return error instanceof Error
    ? error.message
    : 'The page could not be shortened.'
}

function removeAllContextMenus(chromeApi) {
  return new Promise((resolve, reject) => {
    chromeApi.contextMenus.removeAll(() => {
      const lastError =
        chromeApi.runtime?.lastError

      if (lastError) {
        reject(
          new Error(lastError.message),
        )

        return
      }

      resolve()
    })
  })
}

function createContextMenu(
  chromeApi,
  properties,
) {
  return new Promise((resolve, reject) => {
    chromeApi.contextMenus.create(
      properties,
      () => {
        const lastError =
          chromeApi.runtime?.lastError

        if (lastError) {
          reject(
            new Error(lastError.message),
          )

          return
        }

        resolve()
      },
    )
  })
}

export async function createContextMenus(
  chromeApi = globalThis.chrome,
) {
  if (
    typeof chromeApi?.contextMenus
      ?.removeAll !== 'function' ||
    typeof chromeApi?.contextMenus
      ?.create !== 'function'
  ) {
    return false
  }

  await removeAllContextMenus(chromeApi)

  await createContextMenu(chromeApi, {
    id: SHORTEN_PAGE_MENU_ID,
    title: 'Shorten this page with Shrtn',
    contexts: ['page'],
    documentUrlPatterns:
      SUPPORTED_PAGE_PATTERNS,
  })

  return true
}

export async function openResultPopup(
  chromeApi = globalThis.chrome,
) {
  if (
    typeof chromeApi?.action
      ?.openPopup === 'function'
  ) {
    try {
      await chromeApi.action.openPopup()

      return 'popup'
    } catch {
      // Use the toolbar badge fallback below.
    }
  }

  if (
    typeof chromeApi?.action
      ?.setBadgeText === 'function'
  ) {
    await chromeApi.action.setBadgeText({
      text: '1',
    })
  }

  if (
    typeof chromeApi?.action
      ?.setBadgeBackgroundColor ===
    'function'
  ) {
    await chromeApi.action
      .setBadgeBackgroundColor({
        color: '#026670',
      })
  }

  if (
    typeof chromeApi?.action
      ?.setTitle === 'function'
  ) {
    await chromeApi.action.setTitle({
      title:
        'Shrtn link ready — click to view',
    })
  }

  return 'badge'
}

export async function handleInstalled(
  details,
  chromeApi = globalThis.chrome,
  createMenus = createContextMenus,
) {
  if (
    details?.reason !== 'install' &&
    details?.reason !== 'update'
  ) {
    return false
  }

  try {
    return await createMenus(chromeApi)
  } catch (error) {
    console.error(
      'Shrtn could not create context menus.',
      error,
    )

    return false
  }
}

export async function handleContextMenuClick(
  info,
  tab,
  dependencies = {},
) {
  const {
    chromeApi = globalThis.chrome,
    createLink = createShortLink,
    saveResult =
      savePendingContextActionResult,
    showResult = openResultPopup,
  } = dependencies

  if (
    info?.menuItemId !==
    SHORTEN_PAGE_MENU_ID
  ) {
    return false
  }

  const originalUrl =
    info?.pageUrl ?? tab?.url ?? ''

  let pendingResult

  if (!isSupportedWebUrl(originalUrl)) {
    pendingResult = {
      status: 'error',
      originalUrl,
      message:
        'Shrtn can shorten only HTTP and HTTPS webpages.',
    }
  } else {
    try {
      const shortLink =
        await createLink(originalUrl)

      pendingResult = {
        status: 'success',
        originalUrl,
        shortLink,
      }
    } catch (error) {
      pendingResult = {
        status: 'error',
        originalUrl,
        message: getErrorMessage(error),
      }
    }
  }

  await saveResult(
    pendingResult,
    chromeApi,
  )

  await showResult(chromeApi)

  return true
}

export function registerServiceWorker(
  chromeApi = globalThis.chrome,
) {
  if (
    typeof chromeApi?.runtime?.onInstalled
      ?.addListener !== 'function' ||
    typeof chromeApi?.contextMenus?.onClicked
      ?.addListener !== 'function'
  ) {
    return false
  }

  chromeApi.runtime.onInstalled.addListener(
    (details) => {
      void handleInstalled(
        details,
        chromeApi,
      )
    },
  )

  chromeApi.contextMenus.onClicked.addListener(
    (info, tab) => {
      void handleContextMenuClick(
        info,
        tab,
        {
          chromeApi,
        },
      )
    },
  )

  return true
}

registerServiceWorker()