import { isValidShortCode } from '../validation/shortCode.js'

export function validateShortCodeParam(request, response, next) {
  void response

  if (!isValidShortCode(request.params.shortCode)) {
    return next('route')
  }

  return next()
}