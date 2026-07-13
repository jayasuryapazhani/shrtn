export function createLinkController({ linkService }) {
  return {
    create(request, response) {
      const baseUrl = `${request.protocol}://${request.get('host')}`

      const link = linkService.createLink({
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
  }
}