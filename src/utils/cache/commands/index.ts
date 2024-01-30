import fs from 'fs'
import path from 'path'
import db from '../../../config/database'

class ValidationError extends Error {
    code: string
    constructor(message: string, code: string) {
        super(message)
        this.name = 'ValidationError'
        this.code = code
    }
}

class Commands_Cache {
    private db: Db
    readonly jsonPath: string
    constructor(db: Db) {
        this.db = db
        this.jsonPath = path.join(__dirname, 'json', 'commands.json')

        this.db.commands.findMany().then((commands: Command[]) => {
            try {
                fs.mkdirSync(path.join(__dirname, 'json'))
            } catch (err: any) {
                if (err.code != 'EEXIST') {
                    throw err
                }
            }
            fs.writeFileSync(this.jsonPath, JSON.stringify(commands), { flag: 'w+' })
        })
    }

    async setCommands(commands: Command[]) {
        const validatedCommands: Command[] = []
        commands.forEach(command => {
            if ((typeof command.name == 'string' && typeof command.description == 'string' && command.type == 1) || command.type == 3) {
                validatedCommands.push({
                    name: command.name,
                    description: command.description,
                    type: command.type,
                })
            } else {
                throw new ValidationError(`${JSON.stringify(command)} is not a valid command`, `Not a valid Command type`)
            }
        })

        try {
            fs.writeFileSync(this.jsonPath, JSON.stringify(validatedCommands), { flag: 'w+' })

            await this.db.commands.deleteMany()
            await this.db.commands.createMany({ data: validatedCommands })

            return true
        } catch (err) {
            throw err
        }
    }

    getAllCommands() {
        const commands: Command[] = require(this.jsonPath)

        return commands
    }
}

const commandsCache = new Commands_Cache(db)

export default commandsCache
