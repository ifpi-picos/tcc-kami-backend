import { Router, Request, Response } from 'express'
import logger from '../config/logger'
import tutorialsCache from '../utils/cache/tutorials'

const router = Router()

router.get('/', async (req: Request, res: Response) => {
    try {
        if (req.query.link) {
            const tutorial = tutorialsCache.getTutorial(`${req.query.link}`)

            if (tutorial) {
                res.status(200).json({ tutorial: tutorial })
            } else {
                res.status(404).json({ error: 'Tutorial not found' })
            }
        } else {
            const tutorials = tutorialsCache.getAllTutorials()

            res.status(200).json({ tutorials: tutorials })
        }
    } catch (err) {
        logger.registerError(err)
        res.status(500).end()
    }
})

export default router
