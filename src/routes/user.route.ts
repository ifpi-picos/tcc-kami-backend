import { Router, Request, Response } from 'express'
import logger from '../config/logger'
import UserServices from '../services/user.services'
import UserController from '../controllers/user.controller'
import db from '../config/database'
import { DiscordRest, DiscordRoutes } from '../utils/discord/rest'
import { default as Events } from '../websocket/events'

const router = Router()
const userServices = new UserServices(db)
const userController = new UserController(db)

router.get('/', async (req: Request, res: Response) => {
    try {
        if (req.query.discord === 'true' && req.user.discord_id) {
            const discordUser: any = await DiscordRest.get(DiscordRoutes.user(req.user.discord_id.toString()))

            if (discordUser) {
                res.status(200).json({
                    user: {
                        ...req.user,
                        discord: {
                            id: discordUser.id,
                            username: discordUser.username,
                            discriminator: discordUser.discriminator,
                            locale: discordUser.locale,
                            avatar_url: `https://cdn.discordapp.com/avatars/${discordUser.id}/${discordUser.avatar}.png`,
                        },
                    },
                })
            }
        } else {
            res.status(200).json({
                user: req.user,
            })
        }
    } catch (err) {
        logger.registerError(err)
        res.status(500).end()
    }
})

router.post('/', async (req: Request, res: Response) => {
    try {
        const invalidFields = await userServices.validateUser(req.body)

        if (invalidFields.length > 0) {
            res.status(400).json({
                invalidFields,
            })
        } else {
            const preparedUser = await userServices.prepareUser(req.body)

            await userController.create(preparedUser)

            res.status(201).json({ success: 'User created successfully' })
        }
    } catch (err) {
        logger.registerError(err)
        res.status(500).end()
    }
})

router.patch('/', async (req: Request, res: Response) => {
    try {
        const invalidFields = await userServices.validateUserUpdate(req.body)

        if (invalidFields.length > 0) {
            res.status(400).json({
                invalidFields,
            })
        } else {
            delete req.body.id
            delete req.body.discord_id
            delete req.body.is_beta
            delete req.body.is_premium
            delete req.body.last_use

            const preparedUser = await userServices.prepareUserUpdate(req.user, req.body)

            await userController.updateById(req.user.id, preparedUser)

            res.status(200).json({ success: 'User updated successfully' })

            if (preparedUser.password) {
                Events.emit('user-password-changed', req.user.id)
            } else {
                const newUser: Express.Request['user'] = {
                    id: req.user.id,
                    discord_id: req.user.discord_id,
                    username: req.body.username ? req.body.username : req.user.username,
                    avatar_url: req.body.avatar !== undefined ? req.body.avatar : req.user.avatar_url,
                    is_beta: req.user.is_beta,
                    is_premium: req.user.is_premium,
                }

                Events.emit('user-changed', newUser)
            }
        }
    } catch (err) {
        logger.registerError(err)
        res.status(500).end()
    }
})

export default router
