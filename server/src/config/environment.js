const DEFAULT_PORT = 5056
const MINIMUM_PORT = 1
const MAXIMUM_PORT = 65535
const SUPPORTED_PROTOCOLS = new Set(['http:', 'https:'])

export function resolvePort(rawPort) {
  if (rawPort === undefined) {
    return DEFAULT_PORT
  }

  const port = Number(rawPort)

  if (
    !Number.isInteger(port) ||
    port < MINIMUM_PORT ||
    port > MAXIMUM_PORT
  ) {
    throw new Error(
      `PORT must be an integer between ${MINIMUM_PORT} and ${MAXIMUM_PORT}. Received: ${rawPort}`,
    )
  }

  return port
}

export function resolvePublicBaseUrl(rawValue) {
  if (rawValue === undefined) {
    return undefined
  }

  const value = rawValue.trim()

  if (!value || !URL.canParse(value)) {
    throw new Error(
      `PUBLIC_BASE_URL must be a valid HTTP or HTTPS URL. Received: ${rawValue}`,
    )
  }

  const parsedUrl = new URL(value)

  if (!SUPPORTED_PROTOCOLS.has(parsedUrl.protocol)) {
    throw new Error(
      'PUBLIC_BASE_URL must use HTTP or HTTPS.',
    )
  }

  if (parsedUrl.username || parsedUrl.password) {
    throw new Error(
      'PUBLIC_BASE_URL must not contain credentials.',
    )
  }

  if (
    parsedUrl.pathname !== '/' ||
    parsedUrl.search ||
    parsedUrl.hash
  ) {
    throw new Error(
      'PUBLIC_BASE_URL must contain only the origin without a path, query, or fragment.',
    )
  }

  return parsedUrl.origin
}