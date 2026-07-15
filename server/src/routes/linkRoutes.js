import { Router } from 'express'
import { createLinkController } from '../controllers/linkController.js'
import { validateBody } from '../middleware/validateRequest.js'
import { validateShortCodeParam } from '../middleware/validateShortCode.js'
import { createLinkSchema } from '../validation/linkSchemas.js'

export function createLinkRouter({ linkService }) {
  const router = Router()
  const linkController =
    createLinkController({ linkService })

  router.post(
    '/',
    validateBody(createLinkSchema),
    linkController.create,
  )

  router.get(
    '/:shortCode/analytics',
    validateShortCodeParam,
    linkController.analytics,
  )

  return router
}