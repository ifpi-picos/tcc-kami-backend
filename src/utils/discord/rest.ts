import { REST } from '@discordjs/rest'
import { Routes as DiscordRoutes } from 'discord-api-types/v10'
import { config } from '../../config/config'

const DiscordRest = new REST({ version: '10' }).setToken(config.default.BOT_TOKEN)

export { DiscordRest, DiscordRoutes }
