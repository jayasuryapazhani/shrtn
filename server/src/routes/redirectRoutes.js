import { Router } from 'express'
import { createLinkController } from '../controllers/linkController.js'
import { validateShortCodeParam } from '../middleware/validateShortCode.js'

export function createRedirectRouter({ linkService }) {
  const router = Router()
  const linkController = createLinkController({ linkService })

  router.get(
    '/:shortCode',
    validateShortCodeParam,
    linkController.redirect,
  )

  return router
}