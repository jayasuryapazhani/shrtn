import {
  describe,
  expect,
  it,
  vi,
} from 'vitest'

import {
  GENERATE_LINK_QR_MENU_ID,
  GENERATE_PAGE_QR_MENU_ID,
  SHORTEN_LINK_MENU_ID,
  SHORTEN_PAGE_MENU_ID,
  createContextMenus,
  handleContextMenuClick,
  handleInstalled,
  openResultPopup,
  registerServiceWorker,
} from '../src/background/serviceWorker'

describe('service worker', () => {
  it('creates page, link, and QR context menus', async () => {
    const removeAll = vi.fn(
      (callback) => {
        callback()
      },
    )

    const create = vi.fn(
      (_properties, callback) => {
        callback()
      },
    )

    const chromeApi = {
      runtime: {},
      contextMenus: {
        removeAll,
        create,
      },
    }

    await expect(
      createContextMenus(chromeApi),
    ).resolves.toBe(true)

    expect(
      removeAll,
    ).toHaveBeenCalledOnce()

    expect(
      create,
    ).toHaveBeenCalledTimes(4)

    expect(
      create,
    ).toHaveBeenNthCalledWith(
      1,
      {
        id: SHORTEN_PAGE_MENU_ID,
        title:
          'Shorten this page with Shrtn',
        contexts: ['page'],
        documentUrlPatterns: [
          'http://*/*',
          'https://*/*',
        ],
      },
      expect.any(Function),
    )

    expect(
      create,
    ).toHaveBeenNthCalledWith(
      2,
      {
        id: GENERATE_PAGE_QR_MENU_ID,
        title:
          'Generate QR for this page with Shrtn',
        contexts: ['page'],
        documentUrlPatterns: [
          'http://*/*',
          'https://*/*',
        ],
      },
      expect.any(Function),
    )

    expect(
      create,
    ).toHaveBeenNthCalledWith(
      3,
      {
        id: SHORTEN_LINK_MENU_ID,
        title:
          'Shorten this link with Shrtn',
        contexts: ['link'],
        documentUrlPatterns: [
          'http://*/*',
          'https://*/*',
        ],
        targetUrlPatterns: [
          'http://*/*',
          'https://*/*',
        ],
      },
      expect.any(Function),
    )

    expect(
      create,
    ).toHaveBeenNthCalledWith(
      4,
      {
        id: GENERATE_LINK_QR_MENU_ID,
        title:
          'Generate QR for this link with Shrtn',
        contexts: ['link'],
        documentUrlPatterns: [
          'http://*/*',
          'https://*/*',
        ],
        targetUrlPatterns: [
          'http://*/*',
          'https://*/*',
        ],
      },
      expect.any(Function),
    )
  })

  it('creates menus after installation', async () => {
    const createMenus =
      vi.fn().mockResolvedValue(true)

    await expect(
      handleInstalled(
        {
          reason: 'install',
        },
        {},
        createMenus,
      ),
    ).resolves.toBe(true)

    expect(
      createMenus,
    ).toHaveBeenCalledWith({})
  })

  it('ignores unrelated installation events', async () => {
    const createMenus = vi.fn()

    await expect(
      handleInstalled(
        {
          reason: 'chrome_update',
        },
        {},
        createMenus,
      ),
    ).resolves.toBe(false)

    expect(
      createMenus,
    ).not.toHaveBeenCalled()
  })

  it('shortens the current page', async () => {
    const shortLink = {
      originalUrl:
        'https://example.com/article',
      shortCode: 'AbC123x',
      shortUrl:
        'https://shrtn.up.railway.app/AbC123x',
      createdAt:
        '2026-07-31T13:00:00.000Z',
    }

    const createLink =
      vi.fn().mockResolvedValue(
        shortLink,
      )

    const saveResult =
      vi.fn().mockResolvedValue()

    const showResult =
      vi.fn().mockResolvedValue(
        'popup',
      )

    const chromeApi = {}

    await expect(
      handleContextMenuClick(
        {
          menuItemId:
            SHORTEN_PAGE_MENU_ID,
          pageUrl:
            'https://example.com/article',
        },
        {},
        {
          chromeApi,
          createLink,
          saveResult,
          showResult,
        },
      ),
    ).resolves.toBe(true)

    expect(
      createLink,
    ).toHaveBeenCalledWith(
      'https://example.com/article',
    )

    expect(
      saveResult,
    ).toHaveBeenCalledWith(
      {
        status: 'success',
        originalUrl:
          'https://example.com/article',
        source: 'context-page',
        shortLink,
      },
      chromeApi,
    )

    expect(
      showResult,
    ).toHaveBeenCalledWith(
      chromeApi,
    )
  })

  it('generates a QR result for the current page', async () => {
    const shortLink = {
      originalUrl:
        'https://example.com/article',
      shortCode: 'QrP123x',
      shortUrl:
        'https://shrtn.up.railway.app/QrP123x',
      createdAt:
        '2026-07-31T14:30:00.000Z',
    }

    const createLink =
      vi.fn().mockResolvedValue(
        shortLink,
      )

    const saveResult =
      vi.fn().mockResolvedValue()

    const showResult =
      vi.fn().mockResolvedValue(
        'popup',
      )

    const chromeApi = {}

    await expect(
      handleContextMenuClick(
        {
          menuItemId:
            GENERATE_PAGE_QR_MENU_ID,
          pageUrl:
            'https://example.com/article',
        },
        {},
        {
          chromeApi,
          createLink,
          saveResult,
          showResult,
        },
      ),
    ).resolves.toBe(true)

    expect(
      createLink,
    ).toHaveBeenCalledWith(
      'https://example.com/article',
    )

    expect(
      saveResult,
    ).toHaveBeenCalledWith(
      {
        status: 'success',
        originalUrl:
          'https://example.com/article',
        source: 'context-page',
        shortLink,
        showQr: true,
      },
      chromeApi,
    )

    expect(
      showResult,
    ).toHaveBeenCalledWith(
      chromeApi,
    )
  })

  it('shortens a selected hyperlink', async () => {
    const shortLink = {
      originalUrl:
        'https://developer.mozilla.org/docs',
      shortCode: 'DeF456y',
      shortUrl:
        'https://shrtn.up.railway.app/DeF456y',
      createdAt:
        '2026-07-31T14:00:00.000Z',
    }

    const createLink =
      vi.fn().mockResolvedValue(
        shortLink,
      )

    const saveResult =
      vi.fn().mockResolvedValue()

    const showResult =
      vi.fn().mockResolvedValue(
        'popup',
      )

    const chromeApi = {}

    await expect(
      handleContextMenuClick(
        {
          menuItemId:
            SHORTEN_LINK_MENU_ID,
          pageUrl:
            'https://example.com/article',
          linkUrl:
            'https://developer.mozilla.org/docs',
        },
        {},
        {
          chromeApi,
          createLink,
          saveResult,
          showResult,
        },
      ),
    ).resolves.toBe(true)

    expect(
      createLink,
    ).toHaveBeenCalledWith(
      'https://developer.mozilla.org/docs',
    )

    expect(
      createLink,
    ).not.toHaveBeenCalledWith(
      'https://example.com/article',
    )

    expect(
      saveResult,
    ).toHaveBeenCalledWith(
      {
        status: 'success',
        originalUrl:
          'https://developer.mozilla.org/docs',
        source: 'context-link',
        shortLink,
      },
      chromeApi,
    )

    expect(
      showResult,
    ).toHaveBeenCalledWith(
      chromeApi,
    )
  })

  it('generates a QR result for a selected hyperlink', async () => {
    const shortLink = {
      originalUrl:
        'https://developer.mozilla.org/docs',
      shortCode: 'QrL456y',
      shortUrl:
        'https://shrtn.up.railway.app/QrL456y',
      createdAt:
        '2026-07-31T14:40:00.000Z',
    }

    const createLink =
      vi.fn().mockResolvedValue(
        shortLink,
      )

    const saveResult =
      vi.fn().mockResolvedValue()

    const showResult =
      vi.fn().mockResolvedValue(
        'popup',
      )

    const chromeApi = {}

    await expect(
      handleContextMenuClick(
        {
          menuItemId:
            GENERATE_LINK_QR_MENU_ID,
          pageUrl:
            'https://example.com',
          linkUrl:
            'https://developer.mozilla.org/docs',
        },
        {},
        {
          chromeApi,
          createLink,
          saveResult,
          showResult,
        },
      ),
    ).resolves.toBe(true)

    expect(
      createLink,
    ).toHaveBeenCalledWith(
      'https://developer.mozilla.org/docs',
    )

    expect(
      saveResult,
    ).toHaveBeenCalledWith(
      {
        status: 'success',
        originalUrl:
          'https://developer.mozilla.org/docs',
        source: 'context-link',
        shortLink,
        showQr: true,
      },
      chromeApi,
    )

    expect(
      showResult,
    ).toHaveBeenCalledWith(
      chromeApi,
    )
  })

  it('rejects an unsupported hyperlink URL', async () => {
    const createLink = vi.fn()

    const saveResult =
      vi.fn().mockResolvedValue()

    const showResult =
      vi.fn().mockResolvedValue(
        'popup',
      )

    const chromeApi = {}

    await expect(
      handleContextMenuClick(
        {
          menuItemId:
            SHORTEN_LINK_MENU_ID,
          pageUrl:
            'https://example.com',
          linkUrl:
            'mailto:hello@example.com',
        },
        {},
        {
          chromeApi,
          createLink,
          saveResult,
          showResult,
        },
      ),
    ).resolves.toBe(true)

    expect(
      createLink,
    ).not.toHaveBeenCalled()

    expect(
      saveResult,
    ).toHaveBeenCalledWith(
      {
        status: 'error',
        originalUrl:
          'mailto:hello@example.com',
        source: 'context-link',
        message:
          'Shrtn can shorten only HTTP and HTTPS URLs.',
      },
      chromeApi,
    )

    expect(
      showResult,
    ).toHaveBeenCalledWith(
      chromeApi,
    )
  })

  it('stores a controlled API error', async () => {
    const createLink =
      vi.fn().mockRejectedValue(
        new Error(
          'Shrtn API is unavailable.',
        ),
      )

    const saveResult =
      vi.fn().mockResolvedValue()

    const showResult =
      vi.fn().mockResolvedValue(
        'popup',
      )

    const chromeApi = {}

    await expect(
      handleContextMenuClick(
        {
          menuItemId:
            SHORTEN_PAGE_MENU_ID,
          pageUrl:
            'https://example.com',
        },
        {},
        {
          chromeApi,
          createLink,
          saveResult,
          showResult,
        },
      ),
    ).resolves.toBe(true)

    expect(
      saveResult,
    ).toHaveBeenCalledWith(
      {
        status: 'error',
        originalUrl:
          'https://example.com',
        source: 'context-page',
        message:
          'Shrtn API is unavailable.',
      },
      chromeApi,
    )

    expect(
      showResult,
    ).toHaveBeenCalledWith(
      chromeApi,
    )
  })

  it('ignores other context-menu items', async () => {
    const createLink = vi.fn()

    await expect(
      handleContextMenuClick(
        {
          menuItemId:
            'another-extension-action',
        },
        {},
        {
          createLink,
        },
      ),
    ).resolves.toBe(false)

    expect(
      createLink,
    ).not.toHaveBeenCalled()
  })

  it('opens the extension popup', async () => {
    const openPopup =
      vi.fn().mockResolvedValue()

    await expect(
      openResultPopup({
        action: {
          openPopup,
        },
      }),
    ).resolves.toBe('popup')

    expect(
      openPopup,
    ).toHaveBeenCalledOnce()
  })

  it('uses a toolbar badge when popup opening fails', async () => {
    const setBadgeText =
      vi.fn().mockResolvedValue()

    const setBadgeBackgroundColor =
      vi.fn().mockResolvedValue()

    const setTitle =
      vi.fn().mockResolvedValue()

    await expect(
      openResultPopup({
        action: {
          openPopup:
            vi.fn().mockRejectedValue(
              new Error(
                'Popup could not open.',
              ),
            ),

          setBadgeText,
          setBadgeBackgroundColor,
          setTitle,
        },
      }),
    ).resolves.toBe('badge')

    expect(
      setBadgeText,
    ).toHaveBeenCalledWith({
      text: '1',
    })

    expect(
      setBadgeBackgroundColor,
    ).toHaveBeenCalledWith({
      color: '#026670',
    })

    expect(
      setTitle,
    ).toHaveBeenCalledWith({
      title:
        'Shrtn link ready — click to view',
    })
  })

  it('registers installation and context-menu listeners', () => {
    const addInstalledListener =
      vi.fn()

    const addContextMenuListener =
      vi.fn()

    const chromeApi = {
      runtime: {
        onInstalled: {
          addListener:
            addInstalledListener,
        },
      },

      contextMenus: {
        onClicked: {
          addListener:
            addContextMenuListener,
        },
      },
    }

    expect(
      registerServiceWorker(chromeApi),
    ).toBe(true)

    expect(
      addInstalledListener,
    ).toHaveBeenCalledWith(
      expect.any(Function),
    )

    expect(
      addContextMenuListener,
    ).toHaveBeenCalledWith(
      expect.any(Function),
    )
  })
})