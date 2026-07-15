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

    async analytics(request, response) {
  const analytics =
    await linkService.getLinkAnalytics(
      request.params.shortCode,
    )

  return response.status(200).json({
    data: analytics,
  })
},

    async redirect(request, response) {
      const link =
        await linkService.getLinkForRedirect(
          request.params.shortCode,
        )

      return response.redirect(302, link.originalUrl)
    },
  }
}