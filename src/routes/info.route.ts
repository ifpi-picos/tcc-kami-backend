import { Router, Request, Response } from 'express'
import db from '../config/database'
import logger from '../config/logger'

const router = Router()

router.get('/', async (req: Request, res: Response) => {
    try {
        const query = await Promise.all([db.usage_info.findFirst(), db.sheets.count()])

        const usageData = {
            commandsCount: query[0]!.bot_commands_count,
            buttonsCount: query[0]!.bot_buttons_count,
            usersCount: query[0]!.bot_users_count,
            serversCount: query[0]!.bot_servers_count,
            sheetsCount: query[1],
        }

        res.status(200).json(usageData)
    } catch (err) {
        logger.registerError(err)
        res.status(500).end()
    }
})

export default router
