import { z } from 'zod'

const SUPPORTED_PROTOCOLS = new Set(['http:', 'https:'])

function hasSupportedProtocol(value) {
  if (!URL.canParse(value)) {
    // The .url() validator handles malformed URLs.
    return true
  }

  const parsedUrl = new URL(value)

  return SUPPORTED_PROTOCOLS.has(parsedUrl.protocol)
}

export const createLinkSchema = z
  .object({
    originalUrl: z
      .string()
      .trim()
      .min(1, 'originalUrl is required.')
      .max(4096, 'originalUrl must not exceed 4096 characters.')
      .url('originalUrl must be a valid URL.')
      .refine(
        hasSupportedProtocol,
        'Only HTTP and HTTPS URLs are supported.',
      ),
  })
  .strict()