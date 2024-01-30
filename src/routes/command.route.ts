import { Router, Request, Response } from 'express'
import logger from '../config/logger'
import commandsCache from '../utils/cache/commands'

const router = Router()

router.get('/', async (req: Request, res: Response) => {
    try {
        const commands = commandsCache.getAllCommands()

        res.status(200).json({ commands: commands })
    } catch (err) {
        logger.registerError(err)
        res.status(500).end()
    }
})

router.post('/', async (req: Request, res: Response) => {
    try {
        await commandsCache.setCommands(req.body.commands)

        res.status(201).json({ success: 'Commands set on DB' })
    } catch (err: any) {
        if (err.name == 'ValidationError') {
            res.status(400).json({ error: err.message })
        } else {
            logger.registerError(err)
            res.status(500).end()
        }
    }
})

export default router
