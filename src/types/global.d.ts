import * as validations from './validations'
import { PrismaClient } from '@prisma/client'

export {}

declare global {
    type Db = PrismaClient

    enum Ban_Type {
        TEMPORARY = 'TEMPORARY',
        PERMANENT = 'PERMANENT',
        UNBANNED = 'UNBANNED',
    }

    enum Available_Languagues {
        PT_BR = 'PT_BR',
        EN_US = 'EN_US',
    }

    enum Section_Type {
        STANDARD = 0,
        DESCRIPTION = 1,
    }

    enum Attribute_Type {
        TEXT = 0,
        NUMBER = 1,
        IMAGE = 2,
        LIST = 3,
        BAR = 4,
    }

    enum Macro_Type {
        NORMAL = 0,
        MODIFIER_PLUS = 1,
        MODIFIER_MINUS = 2,
    }

    type Discord_Id = validations.Discord_Id
    type Server_Id = validations.Server_Id
    type Msg_Id = validations.Msg_Id
    type Channel_Id = validations.Channel_Id
    type Sheet_Name = validations.Sheet_Name
    type Macro_Name = validations.Macro_Name

    type User = {
        id: number
        discord_id?: Discord_Id
        username: string
        avatar?: string
        email: string
        password: string
        is_beta: boolean
        is_premium: boolean
        last_use: Date
    }

    type Blocked_User = {
        id: number
        user_id: number
        ban_count: number
        current_ban: Ban_Type
        ban_duration: Date
    }

    type Irt_Sheet = {
        id: number
        user_id: number
        sheet_name: Sheet_Name
        msg_id: Msg_Id
        channel_id: Channel_Id
        server_id: Server_Id
    }

    type Server_Config = {
        id: number
        server_id: Server_Id
        languague: Available_Languagues
        force_languague: boolean
    }

    type Sheet = {
        id: number
        user_id: number
        user?: Express.Request['user']
        sheet_name: Sheet_Name
        sheet_password: string
        is_public: boolean
        attributes: {
            sections: [
                {
                    name: string
                    position: number
                    type: Section_Type
                    attributes: [
                        {
                            name: string
                            position: number
                            type: Attribute_Type
                            value: string | number
                            config?: {
                                width?: number
                                height?: number
                                max?: number
                                min?: number
                                step?: number
                                max_length?: number
                                min_length?: number
                            }
                        },
                    ]
                },
            ]
        }
        legacy: boolean
        last_use: Date
    }

    type Sheet_Head = {
        id: number
        user_id: number
        sheet_name: Sheet_Name
    }

    type Macro = {
        id: number
        user_id: number
        user?: Express.Request['user']
        macro_name: Macro_Name
        macros: {
            sections: [
                {
                    name: string
                    position: number
                    macros: [
                        {
                            name: string
                            position: number
                            value: string
                            type: Macro_Type
                        },
                    ]
                },
            ]
        }
        is_public: boolean
        last_use: Date
    }

    type Macro_Head = {
        id: number
        user_id: number
        sheet_id?: number
        macro_name: string
    }

    type Usage_Info = {
        bot_commands_count: number
        bot_buttons_count: number
        bot_users_count: number
        bot_servers_count: number
    }

    type User_Config = {
        id: number
        user_id: number
        languague: Available_Languagues
        default_sheet: Sheet_Name
        secret_roll: boolean
        secret_insan: boolean
        secret_general: boolean
        secret_sheet: boolean
        secret_send: boolean
    }

    type Tutorial = {
        link: string
        title: string
        description: string
        thumb: string
        tags: string[]
        tutorial: string
    }

    type Command = {
        name: string
        description: string
        type: number
    }

    namespace Express {
        interface Application {
            start: function
        }
        interface Request {
            startTime: number
            user: {
                id: number
                discord_id?: Discord_Id
                username: string
                avatar_url?: string
                is_beta: boolean
                is_premium: boolean
            }
        }
    }
}
