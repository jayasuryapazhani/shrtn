const DEFAULT_PORT = 5056
const MINIMUM_PORT = 1
const MAXIMUM_PORT = 65535

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