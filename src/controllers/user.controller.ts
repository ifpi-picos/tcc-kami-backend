import { config } from '../config/config'

type PreparedUser = {
    username: string
    email: string
    avatar?: string
    password: string
}

function toUser(user: any): User | null {
    try {
        return {
            id: user.id,
            discord_id: user.discord_id,
            username: user.username,
            avatar: user.avatar,
            email: user.email,
            password: user.password,
            is_beta: user.is_beta,
            is_premium: user.is_premium,
            last_use: user.last_use,
        }
    } catch (err) {
        return null
    }
}

function toUserArray(users: any[]): User[] {
    const usersArray: User[] = []

    users.forEach(prismaUser => {
        const user = toUser(prismaUser)
        if (user) {
            usersArray.push(user)
        }
    })

    return usersArray
}

export default class UserController {
    private db: Db
    constructor(db: Db) {
        this.db = db
    }

    async create(user: PreparedUser): Promise<User | null> {
        return toUser(
            await this.db.users.create({
                data: {
                    username: user.username,
                    email: user.email,
                    avatar: user.avatar,
                    password: user.password,
                },
            }),
        )
    }

    async getById(id: number): Promise<User | null> {
        return toUser(
            await this.db.users.findUnique({
                where: {
                    id: id,
                },
            }),
        )
    }

    async getByUsername(username: string): Promise<User | null> {
        return toUser(
            await this.db.users.findUnique({
                where: {
                    username: username,
                },
            }),
        )
    }

    async getByEmail(email: string): Promise<User | null> {
        return toUser(
            await this.db.users.findUnique({
                where: {
                    email: email,
                },
            }),
        )
    }

    async getByDiscordId(discordId: string): Promise<User | null> {
        return toUser(
            await this.db.users.findUnique({
                where: {
                    discord_id: discordId,
                },
            }),
        )
    }

    async updateById(id: number, newUser: any): Promise<User | null> {
        return toUser(
            await this.db.users.update({
                where: {
                    id: id,
                },
                data: newUser,
            }),
        )
    }

    async mergeByIdAndDiscordId(user: Express.Request['user'], discordUser: User) {
        const newId = user.id
        const oldId = discordUser.id

        this.db.$transaction([
            this.db.sheets.updateMany({
                where: {
                    user_id: oldId,
                },
                data: {
                    user_id: newId,
                },
            }),
            this.db.irt_sheets.updateMany({
                where: {
                    user_id: oldId,
                },
                data: {
                    user_id: newId,
                },
            }),
            this.db.users_config.updateMany({
                where: {
                    user_id: oldId,
                },
                data: {
                    user_id: newId,
                },
            }),
            this.db.blocked_users.updateMany({
                where: {
                    user_id: oldId,
                },
                data: {
                    user_id: newId,
                },
            }),
            this.db.users.delete({
                where: {
                    id: oldId,
                },
            }),
            this.db.users.update({
                where: {
                    id: newId,
                },
                data: {
                    discord_id: `${discordUser.discord_id}`,
                },
            }),
        ])
    }
}
