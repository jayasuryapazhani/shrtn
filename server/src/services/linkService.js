import { AppError } from '../errors/AppError.js'

const MAX_CODE_GENERATION_ATTEMPTS = 5
const UNIQUE_VIOLATION_CODE = '23505'

function createLinkNotFoundError() {
  return new AppError({
    statusCode: 404,
    code: 'LINK_NOT_FOUND',
    message:
      'The requested short link does not exist.',
  })
}

export function createLinkService({
  linkRepository,
  codeGenerator,
  now = () => new Date(),
}) {
  return {
    async createLink({
      originalUrl,
      baseUrl,
    }) {
      const normalizedBaseUrl =
        baseUrl.replace(/\/+$/, '')

      for (
        let attempt = 0;
        attempt <
        MAX_CODE_GENERATION_ATTEMPTS;
        attempt += 1
      ) {
        const shortCode = codeGenerator()

        if (
          await linkRepository.existsByCode(
            shortCode,
          )
        ) {
          continue
        }

        const createdAt =
          now().toISOString()

        try {
          const storedLink =
            await linkRepository.save({
              originalUrl,
              shortCode,
              createdAt,
            })

          return {
            ...storedLink,
            shortUrl:
              `${normalizedBaseUrl}/${shortCode}`,
          }
        } catch (error) {
          if (
            error?.code ===
            UNIQUE_VIOLATION_CODE
          ) {
            continue
          }

          throw error
        }
      }

      throw new AppError({
        statusCode: 409,
        code: 'SHORT_CODE_CONFLICT',
        message:
          'A unique short code could not be generated.',
      })
    },

    async getLinkByCode(shortCode) {
      const link =
        await linkRepository.findByCode(
          shortCode,
        )

      if (!link) {
        throw createLinkNotFoundError()
      }

      return link
    },

    async getLinkForRedirect(shortCode) {
      const clickedAt =
        now().toISOString()

      const link =
        await linkRepository.recordClick(
          shortCode,
          clickedAt,
        )

      if (!link) {
        throw createLinkNotFoundError()
      }

      return link
    },
  }
}