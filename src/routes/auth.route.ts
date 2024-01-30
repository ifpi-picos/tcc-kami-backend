import { Router, Request, Response } from 'express'
import AuthServices from '../services/auth.services'
import UserController from '../controllers/user.controller'
import db from '../config/database'
import logger from '../config/logger'
import { LoginErrorCodes } from '../types/errors'
import { Discord_Id } from '../types/validations'
import { default as Events } from '../websocket/events'

const router = Router()
const authServices = new AuthServices()
const userController = new UserController(db)

router.post('/login', async (req: Request, res: Response) => {
    try {
        if (!req.body.username && !req.body.email) {
            res.status(400).json({
                error: 'Username or email is required',
            })
        } else if (!req.body.password) {
            res.status(400).json({
                error: 'Password is required',
            })
        } else {
            try {
                const token = await authServices.login(req.body)

                res.status(200).json({
                    token: token,
                })
            } catch (err: any) {
                if (err.code == LoginErrorCodes.INVALID_CREDENTIALS) {
                    res.status(400).json({
                        error: 'Invalid credentials',
                    })
                } else if (err.code == LoginErrorCodes.EMAIL_NOT_FOUND) {
                    res.status(404).json({
                        error: 'Email not found',
                    })
                } else if (err.code == LoginErrorCodes.USERNAME_NOT_FOUND) {
                    res.status(404).json({
                        error: 'Username not found',
                    })
                } else if (err.code == LoginErrorCodes.PASSWORD_INCORRECT) {
                    res.status(401).json({
                        error: 'Password is incorrect',
                    })
                } else {
                    throw err
                }
            }
        }
    } catch (err) {
        logger.registerError(err)
        res.status(500).end()
    }
})

router.post('/discord/sync', async (req: Request, res: Response) => {
    try {
        const user = await authServices.getDiscordUserByCode(req.body.code)

        if (user) {
            if (Discord_Id.isValid(user.id)) {
                const discordUserAlreadyOnDb = await userController.getByDiscordId(user.id)

                if (discordUserAlreadyOnDb && discordUserAlreadyOnDb.email) {
                    res.status(400).json({
                        error: 'Discord account already linked',
                    })
                    return
                } else if (discordUserAlreadyOnDb && !discordUserAlreadyOnDb.email) {
                    await userController.mergeByIdAndDiscordId(req.user, discordUserAlreadyOnDb)

                    const newUser = { ...req.user, discord_id: user.id }
                    Events.emit('userChanged', newUser)
                } else if (!discordUserAlreadyOnDb) {
                    await userController.updateById(req.user.id, { discord_id: user.id })

                    res.status(200).json({ success: 'Discord account linked successfully' })

                    const newUser = { ...req.user, discord_id: user.id }
                    Events.emit('userChanged', newUser)
                }
            } else {
                res.status(400).json({
                    error: 'Invalid Discord ID',
                })
            }
        } else {
            res.status(400).json({
                error: 'Invalid code',
            })
        }
    } catch (err) {
        logger.registerError(err)
        res.status(500).end()
    }
})

router.delete('/discord/unsync', async (req: Request, res: Response) => {
    try {
        await userController.updateById(req.user.id, { discord_id: null })

        res.status(200).json({ success: 'Discord account unlinked successfully' })

        const newUser = { ...req.user, discord_id: null }
        Events.emit('userChanged', newUser)
    } catch (err) {
        logger.registerError(err)
        res.status(500).end()
    }
})

export default router
