import { AppError } from '../errors/AppError.js'

export function validateBody(schema) {
  return function bodyValidationMiddleware(request, response, next) {
    void response

    const result = schema.safeParse(request.body)

    if (!result.success) {
      const details = result.error.issues.map((issue) => ({
        field: issue.path.length > 0 ? issue.path.join('.') : 'body',
        message: issue.message,
      }))

      return next(
        new AppError({
          statusCode: 400,
          code: 'VALIDATION_ERROR',
          message: 'Request validation failed.',
          details,
        }),
      )
    }

    request.validatedBody = result.data

    return next()
  }
}