import { Router } from 'express'
import { verifyToken } from './verifyToken.middleware'
import { logger } from './logger.middleware'

const router = Router()

router.use(verifyToken)
router.use(logger)

export default router
