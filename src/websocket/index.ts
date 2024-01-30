import { config } from '../config/config'
import db from '../config/database'
import { default as Events } from '../websocket/events'
import { Server } from 'socket.io'
import tutorialsCache from '../utils/cache/tutorials'
import AuthServices from '../services/auth.services'
import UserController from '../controllers/user.controller'
import { loggerWebsocket } from '../middlewares/logger.middleware'
import { verifyTokenWebsocket } from '../middlewares/verifyToken.middleware'

const authServices = new AuthServices()
const userController = new UserController(db)

export default function createSocket(server: any) {
    const io = new Server(server, {
        cors: {
            origin: config.default.CORS_ORIGIN,
        },
    })

    io.use(verifyTokenWebsocket)
    io.use(loggerWebsocket)

    io.on('connection', socket => {
        if (socket.data) {
            socket.on('tutorialsSearch', search => {
                const tutorials = tutorialsCache.searchTutorials(search)

                socket.emit('tutorialsFound', { tutorials: tutorials })
            })

            socket.on('open-sheet', sheetId => {
                socket.join(`sheet-${sheetId}`)
            })

            socket.on('close-sheet', sheetId => {
                socket.leave(`sheet-${sheetId}`)
            })

            socket.on('open-macro', macroId => {
                socket.join(`macro-${macroId}`)
            })

            socket.on('close-macro', macroId => {
                socket.leave(`macro-${macroId}`)
            })
        }
    })

    Events.on('user-password-changed', (userId: number) => {
        io.to(`${userId}`).emit('user-password-changed')
    })

    Events.on('user-changed', (user: Express.Request['user']) => {
        io.to(`${user.id}`).emit('user-changed', { user: user })
    })

    Events.on('sheet-updated', (socketIdentifier: string, sheet: Sheet) => {
        io.to(`sheet-${sheet.id}`).emit('sheet-updated', sheet, socketIdentifier)
    })

    Events.on('sheet-deleted', (sheetId: number) => {
        io.to(`sheet-${sheetId}`).emit('sheet-deleted', sheetId)
    })

    Events.on('macro-updated', (socketIdentifier: string, macro: Macro) => {
        io.to(`macro-${macro.id}`).emit('macro-updated', macro, socketIdentifier)
    })

    Events.on('macro-deleted', (macroId: number) => {
        io.to(`macro-${macroId}`).emit('macro-deleted', macroId)
    })
}
