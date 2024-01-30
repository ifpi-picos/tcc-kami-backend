import { DateTime } from 'luxon'
import * as fs from 'fs'
import path from 'path'
import { inspect } from 'util'
import color from 'colors'

export default class LogHandler {
    actualLogFile: string
    constructor() {
        const day = DateTime.now().setZone('America/Fortaleza').toFormat('dd-LL-yyyy')

        try {
            fs.readFileSync(path.join(__dirname, `log-${day}.log`))
        } catch (err) {
            fs.writeFileSync(path.join(__dirname, `log-${day}.log`), '')
        }

        this.actualLogFile = path.join(__dirname, `log-${day}.log`)

        this.rotateLogs()
    }

    public updateActualLogFile(log: string) {
        const day = DateTime.now().setZone('America/Fortaleza').toFormat('dd-LL-yyyy')

        if (path.join(__dirname, `log-${day}.log`) == this.actualLogFile) {
            fs.appendFileSync(this.actualLogFile, log)
        } else {
            fs.writeFileSync(path.join(__dirname, `log-${day}.log`), '')
            this.actualLogFile = path.join(__dirname, `log-${day}.log`)
            fs.appendFileSync(this.actualLogFile, log)
        }
    }

    private async rotateLogs() {
        let logs = fs.readdirSync(path.join(__dirname))

        logs = logs.filter(fileName => {
            return fileName.match(/\.log$/g) != null
        })

        for (const _i in logs) {
            if (logs.length > 30) {
                let older = DateTime.now().setZone('America/Fortaleza')
                logs.forEach((log: string) => {
                    const logTime = DateTime.fromFormat(log.replace('log-', '').replace('.log', ''), 'dd-LL-yyyy').setZone('America/Fortaleza')

                    if (logTime.toMillis() < older.toMillis()) {
                        older = logTime
                    }
                })

                fs.rmSync(path.join(__dirname, `log-${older.toFormat('dd-LL-yyyy')}.log`))
                logs = logs.filter(fileName => {
                    const logTime = DateTime.fromFormat(fileName.replace('log-', '').replace('.log', ''), 'dd-LL-yyyy').setZone('America/Fortaleza')

                    if (logTime.toMillis() == older.toMillis()) {
                        return false
                    } else {
                        return true
                    }
                })
            } else {
                break
            }
        }
    }

    public registerError(err: unknown) {
        const errorString = inspect(err, false, 99)

        const time = DateTime.now().setZone('America/Fortaleza').toLocaleString(DateTime.DATETIME_SHORT_WITH_SECONDS)

        if (process.env.NODE_ENV != 'test') {
            console.log(`[ ${color.green(time)} ] - [ ${color.red('Error 500')} ]\n${errorString}\n---------------------------\n`)
        }

        this.updateActualLogFile(`[ ${time} ] - [ Error 500 ]\n`)
        this.updateActualLogFile(errorString)
        this.updateActualLogFile(`\n---------------------------\n`)
    }

    public searchLogFile(date: DateTime) {
        const day = date.toFormat('dd-LL-yyyy')

        try {
            return fs.readFileSync(path.join(__dirname, `log-${day}.log`))
        } catch (err) {
            return false
        }
    }
}
