const SHORT_CODE_PATTERN = /^[A-Za-z0-9]{7}$/

export function isValidShortCode(value) {
  return SHORT_CODE_PATTERN.test(value)
}