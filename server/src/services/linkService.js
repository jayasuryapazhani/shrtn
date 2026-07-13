import { AppError } from '../errors/AppError.js'

const MAX_CODE_GENERATION_ATTEMPTS = 5

export function createLinkService({
  linkRepository,
  codeGenerator,
  now = () => new Date(),
}) {
  return {
    createLink({ originalUrl, baseUrl }) {
      const normalizedBaseUrl = baseUrl.replace(/\/+$/, '')

      for (
        let attempt = 0;
        attempt < MAX_CODE_GENERATION_ATTEMPTS;
        attempt += 1
      ) {
        const shortCode = codeGenerator()

        if (!linkRepository.existsByCode(shortCode)) {
          const link = {
            originalUrl,
            shortCode,
            shortUrl: `${normalizedBaseUrl}/${shortCode}`,
            createdAt: now().toISOString(),
          }

          return linkRepository.save(link)
        }
      }

      throw new AppError({
        statusCode: 409,
        code: 'SHORT_CODE_CONFLICT',
        message: 'A unique short code could not be generated.',
      })
    },

    getLinkByCode(shortCode) {
      const link = linkRepository.findByCode(shortCode)

      if (!link) {
        throw new AppError({
          statusCode: 404,
          code: 'LINK_NOT_FOUND',
          message: 'The requested short link does not exist.',
        })
      }

      return link
    },
  }
}