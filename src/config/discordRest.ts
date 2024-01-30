import { config } from './config'
import { REST } from '@discordjs/rest'
import { Routes } from 'discord-api-types/v10'

const rest = new REST({ version: '10' }).setToken(config.default.BOT_TOKEN)

const discord = {
    ...rest,
    routes: Routes,
}

export default discord
