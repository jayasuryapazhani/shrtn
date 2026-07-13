import { customAlphabet } from 'nanoid'

const SHORT_CODE_ALPHABET =
  '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz'

const createCode = customAlphabet(SHORT_CODE_ALPHABET, 7)

export function generateShortCode() {
  return createCode()
}