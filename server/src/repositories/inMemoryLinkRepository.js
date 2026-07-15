function mapStoredLink(storedLink) {
  return {
    originalUrl: storedLink.originalUrl,
    shortCode: storedLink.shortCode,
    createdAt: storedLink.createdAt,
  }
}

export function createInMemoryLinkRepository() {
  const linksByCode = new Map()

  return {
    existsByCode(shortCode) {
      return linksByCode.has(shortCode)
    },

    save(link) {
      const storedLink = {
        ...link,
        clickCount: 0,
        lastClickedAt: null,
      }

      linksByCode.set(
        storedLink.shortCode,
        storedLink,
      )

      return mapStoredLink(storedLink)
    },

    findByCode(shortCode) {
      const storedLink =
        linksByCode.get(shortCode)

      return storedLink
        ? mapStoredLink(storedLink)
        : null
    },

    findAnalyticsByCode(shortCode) {
  const storedLink =
    linksByCode.get(shortCode)

  if (!storedLink) {
    return null
  }

  return {
    ...mapStoredLink(storedLink),
    clickCount: storedLink.clickCount,
    lastClickedAt:
      storedLink.lastClickedAt,
  }
},

    recordClick(shortCode, clickedAt) {
      const storedLink =
        linksByCode.get(shortCode)

      if (!storedLink) {
        return null
      }

      storedLink.clickCount += 1
      storedLink.lastClickedAt = clickedAt

      return {
        ...mapStoredLink(storedLink),
        clickCount: storedLink.clickCount,
        lastClickedAt:
          storedLink.lastClickedAt,
      }
    },

    count() {
      return linksByCode.size
    },
  }
}