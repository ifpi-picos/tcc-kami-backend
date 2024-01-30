import db from '../config/database'
import { Request, Response, NextFunction } from 'express'
import AuthServices from '../services/auth.services'
import UserController from '../controllers/user.controller'
import { DateTime } from 'luxon'
import { config } from '../config/config'
import { Socket } from 'socket.io'

const authServices = new AuthServices()
const userController = new UserController(db)

const excludedRoutes = ['POST|/auth/login', 'GET|/info', 'GET|/tutorial', 'GET|/command', 'POST|/user']
const acessibleIfPublic = ['GET|/sheet/one', 'GET|/macro/one']

export async function verifyToken(req: Request, res: Response, next: NextFunction) {
    req.startTime = DateTime.now().setZone('America/Fortaleza').toMillis()
    if (!excludedRoutes.includes(`${req.method}|${req.path.endsWith('/') ? req.path.substring(0, req.path.length - 1) : req.path}`)) {
        if (req.headers.authorization) {
            if (req.headers.authorization === config.default.API_TOKEN) {
                next()
            } else {
                try {
                    const payload = authServices.verifyToken(req.headers.authorization)

                    if (payload) {
                        const user = await userController.getById(payload.id)

                        if (user) {
                            req.user = {
                                id: user.id,
                                discord_id: user.discord_id,
                                username: user.username,
                                avatar_url: user.avatar,
                                is_beta: user.is_beta,
                                is_premium: user.is_premium,
                            }
                        }

                        next()
                    } else {
                        if (
                            acessibleIfPublic.includes(
                                `${req.method}|${req.path.endsWith('/') ? req.path.substring(0, req.path.length - 1) : req.path}`,
                            )
                        ) {
                            next()
                        } else {
                            return res.status(401).json({ title: 'Unathorized', message: 'Invalid token' })
                        }
                    }
                } catch (err) {
                    if (
                        acessibleIfPublic.includes(`${req.method}|${req.path.endsWith('/') ? req.path.substring(0, req.path.length - 1) : req.path}`)
                    ) {
                        next()
                    } else {
                        return res.status(401).json({ title: 'Unathorized', message: 'Invalid token' })
                    }
                }
            }
        } else {
            if (acessibleIfPublic.includes(`${req.method}|${req.path.endsWith('/') ? req.path.substring(0, req.path.length - 1) : req.path}`)) {
                next()
            } else {
                return res.status(401).json({ title: 'Unathorized', message: 'Authorization token is required' })
            }
        }
    } else {
        next()
    }
}

export async function verifyTokenWebsocket(socket: Socket, next: (Error?: Error) => void) {
    if (!socket.handshake.headers.authorization) {
        socket.disconnect(true)
        next(new Error('Token not found'))
    } else {
        try {
            if (socket.handshake.headers.authorization.startsWith('Bearer')) {
                const payload = authServices.verifyToken(socket.handshake.headers.authorization.replace('Bearer ', '').replace(/ /g, '+').trim())

                if (!payload) {
                    socket.disconnect(true)
                    next(new Error('Invalid token'))
                } else {
                    const user = await userController.getById(payload.id)

                    if (user) {
                        socket.data = {
                            id: user.id,
                            discord_id: user.discord_id,
                            username: user.username,
                            avatar_url: user.avatar,
                            is_beta: user.is_beta,
                            is_premium: user.is_premium,
                        }

                        next()
                    } else {
                        socket.disconnect(true)
                        next(new Error('User not found'))
                    }
                }
            }
        } catch (err) {
            socket.disconnect(true)
            next(new Error('Error while trying to validate token'))
        }
    }
}
