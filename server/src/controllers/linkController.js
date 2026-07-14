export function createLinkController({ linkService }) {
  return {
    async create(request, response) {
      const requestBaseUrl =
        `${request.protocol}://${request.get('host')}`

      const baseUrl =
        request.app.locals.publicBaseUrl ??
        requestBaseUrl

      const link = await linkService.createLink({
        originalUrl: request.validatedBody.originalUrl,
        baseUrl,
      })

      return response
        .status(201)
        .location(link.shortUrl)
        .json({
          data: link,
        })
    },

    async redirect(request, response) {
      const link = await linkService.getLinkByCode(
        request.params.shortCode,
      )

      return response.redirect(302, link.originalUrl)
    },
  }
}