import { AppError } from '../errors/AppError.js'

function sendErrorResponse(response, statusCode, code, message, details) {
  const body = {
    error: {
      code,
      message,
    },
  }

  if (details !== undefined) {
    body.error.details = details
  }

  return response.status(statusCode).json(body)
}

export function notFoundHandler(request, response) {
  return sendErrorResponse(
    response,
    404,
    'ROUTE_NOT_FOUND',
    `Route ${request.method} ${request.originalUrl} does not exist.`,
  )
}

export function errorHandler(error, request, response, next) {
  void request
  void next

  if (error?.type === 'entity.parse.failed') {
    return sendErrorResponse(
      response,
      400,
      'INVALID_JSON',
      'The request body contains invalid JSON.',
    )
  }

  if (error?.type === 'entity.too.large') {
    return sendErrorResponse(
      response,
      413,
      'REQUEST_TOO_LARGE',
      'The request body is too large.',
    )
  }

  if (error instanceof AppError) {
    return sendErrorResponse(
      response,
      error.statusCode,
      error.code,
      error.message,
      error.details,
    )
  }

  console.error('[Shrtn API] Unhandled error:', error)

  return sendErrorResponse(
    response,
    500,
    'INTERNAL_SERVER_ERROR',
    'An unexpected server error occurred.',
  )
}