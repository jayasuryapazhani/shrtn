export function createInMemoryLinkRepository() {
  const linksByCode = new Map()

  return {
    existsByCode(shortCode) {
      return linksByCode.has(shortCode)
    },

    save(link) {
      const storedLink = { ...link }

      linksByCode.set(storedLink.shortCode, storedLink)

      return { ...storedLink }
    },

    findByCode(shortCode) {
      const link = linksByCode.get(shortCode)

      return link ? { ...link } : null
    },

    count() {
      return linksByCode.size
    },
  }
}