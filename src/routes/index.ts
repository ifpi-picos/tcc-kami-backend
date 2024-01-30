import { Router } from 'express'
import AuthRoute from './auth.route'
import UserRoute from './user.route'
import InfoRoute from './info.route'
import TutorialRoute from './tutorial.route'
import CommandRoute from './command.route'
import SheetRoute from './sheet.route'
import MacroRoute from './macro.route'

const router = Router()

router.use('/auth', AuthRoute)
router.use('/user', UserRoute)
router.use('/info', InfoRoute)
router.use('/tutorial', TutorialRoute)
router.use('/command', CommandRoute)
router.use('/sheet', SheetRoute)
router.use('/macro', MacroRoute)

export default router
