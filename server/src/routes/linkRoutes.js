import { Router } from 'express'
import { createLinkController } from '../controllers/linkController.js'
import { validateBody } from '../middleware/validateRequest.js'
import { createLinkSchema } from '../validation/linkSchemas.js'

export function createLinkRouter({ linkService }) {
  const router = Router()
  const linkController = createLinkController({ linkService })

  router.post(
    '/',
    validateBody(createLinkSchema),
    linkController.create,
  )

  return router
}