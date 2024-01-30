import { Request, Response, NextFunction } from 'express'
import { DateTime } from 'luxon'
import color from 'colors'
import LogHandler from '../logs'
import { Socket } from 'socket.io'

const logHandler = new LogHandler()

export function logger(req: Request, res: Response, next: NextFunction) {
    let sentReponse: any
    const oldJson = res.json
    res.json = json => {
        sentReponse = json
        res.json = oldJson
        return res.json(json)
    }

    const time = DateTime.now().setZone('America/Fortaleza').toLocaleString(DateTime.DATETIME_SHORT_WITH_SECONDS)
    const resource = `${req.method} ${req.url}`

    res.on('finish', () => {
        let info
        if (req.user && Object.keys(req.body)[0]) {
            const data = req.body

            if (data.password) {
                data.password = '*'
            }

            info = `User: [ID: ${req.user.id} Name: ${req.user.username}}] | Body Request: [${JSON.stringify(data)}]`
        } else if (req.user && !Object.keys(req.body)[0]) {
            info = `User: [ID: ${req.user.id} Name: ${req.user.username}}]`
        } else if (Object.keys(req.body)[0]) {
            const data = req.body

            if (data.password) {
                data.password = '*'
            }

            info = `Body Request: [${JSON.stringify(data)}]`
        } else {
            info = 'Não autenticado | Sem body'
        }

        if (sentReponse && resource.split('?')[0] != 'GET /tutorial') {
            info += ` | Body Response: [${JSON.stringify(sentReponse)}]`
        }

        let status: string = res.statusCode.toString()
        const statusNoColor = status

        if (parseInt(status) >= 200 && parseInt(status) < 300) {
            status = color.green(status)
        } else if (parseInt(status) >= 300 && parseInt(status) < 400) {
            status = color.cyan(status)
        } else if (parseInt(status) >= 400 && parseInt(status) < 500) {
            status = color.yellow(status)
        } else {
            status = color.red(status)
        }

        const execTime = (DateTime.now().toMillis() - req.startTime).toString() + 'ms'

        if (process.env.NODE_ENV != 'test') {
            console.log(
                `[ ${color.green(time)} ] - [ ${color.green(resource)} ] - [ ${color.cyan(info)} ] - [ ${status} ${color.underline(execTime)} ]\n`,
            )
        }
        logHandler.updateActualLogFile(`[ ${time} ] - [ ${resource} ] - [ ${info} ] - [ ${statusNoColor} ${execTime} ]\n`)
    })

    next()
}

export function loggerWebsocket(socket: Socket, next: (Error?: Error) => void) {
    let time = DateTime.now().setZone('America/Fortaleza').toLocaleString(DateTime.DATETIME_SHORT_WITH_SECONDS)
    const info = `User: [ID: ${socket.data.id} Name: ${socket.data.username}]`

    logHandler.updateActualLogFile(`[ ${time} ] - [ ${info} ] - [ Websocket Connected ]\n`)
    console.log(`[ ${color.green(time)} ] - [ ${color.cyan(info)} ] - [ ${color.yellow('Websocket Connected')} ]\n`)

    socket.on('disconnect', () => {
        time = DateTime.now().setZone('America/Fortaleza').toLocaleString(DateTime.DATETIME_SHORT_WITH_SECONDS)

        if (process.env.NODE_ENV != 'test') {
            console.log(`[ ${color.green(time)} ] - [ ${color.cyan(info)} ] - [ ${color.yellow('Websocket Disconnected')} ]\n`)
        }
        logHandler.updateActualLogFile(`[ ${time} ] - [ ${info} ] - [ Websocket Disconnected ]\n`)
    })

    socket.onAny((event, ...args) => {
        time = DateTime.now().setZone('America/Fortaleza').toLocaleString(DateTime.DATETIME_SHORT_WITH_SECONDS)

        logHandler.updateActualLogFile(`[ ${time} ] - [ WS IN ${event} ] - [ ${info} ] - [ Request Body: ${JSON.stringify(args)} ]\n`)
        console.log(
            `[ ${color.green(time)} ] - [ WS IN ${color.green(event)} ] - [ ${color.cyan(info)} ] - [ ${color.cyan(
                `Request Body: ${JSON.stringify(args)}`,
            )} ]\n`,
        )
    })

    socket.onAnyOutgoing((event, ...args) => {
        time = DateTime.now().setZone('America/Fortaleza').toLocaleString(DateTime.DATETIME_SHORT_WITH_SECONDS)

        logHandler.updateActualLogFile(`[ ${time} ] - [ WS OUT ${event} ] - [ ${info} ] - [ Response Body: ${JSON.stringify(args)} ]\n`)
        console.log(
            `[ ${color.green(time)} ] - [ WS OUT ${color.green(event)} ] - [ ${color.cyan(info)} ] - [ ${color.cyan(
                `Response Body: ${JSON.stringify(args)}`,
            )} ]\n`,
        )
    })

    next()
}
