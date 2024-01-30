import { config } from '../config/config'
import bcrypt from 'bcrypt'

type PreparedUser = {
    username: string
    email: string
    password: string
}

type PreparedUserUpdate = {
    username?: string
    avatar?: string | null
    password?: string
}

class UserServices {
    private db: Db
    public emailRegex: RegExp
    public usernameRegex: RegExp
    public avatarURLRegex: RegExp
    constructor(db: Db) {
        this.db = db
        this.emailRegex = new RegExp(
            /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/,
        )
        this.usernameRegex = new RegExp(/^[a-zA-Z0-9_]+$/)
        this.avatarURLRegex = new RegExp(/(https?:\/\/.*.(?:png|jpg|jpeg|webp|gif|gifv))/i)
    }

    async validateUser(user: User): Promise<Array<{ field: string; message: string }>> {
        const invalidFields = []
        if (!user.username) {
            invalidFields.push({
                field: 'username',
                message: 'Nome de usuário é obrigatório',
            })
        }

        if (user.username.length < 3) {
            invalidFields.push({
                field: 'username',
                message: 'Nome de usuário deve ter pelo menos 3 caracteres',
            })
        }

        if (user.username.length > 32) {
            invalidFields.push({
                field: 'username',
                message: 'Nome de usuário deve ter no máximo 32 caracteres',
            })
        }

        if (!this.usernameRegex.test(user.username)) {
            invalidFields.push({
                field: 'username',
                message: 'Nome de usuário deve conter apenas letras, números e underlines',
            })
        }

        if (!this.usernameRegex.test(user.username)) {
            invalidFields.push({
                field: 'username',
                message: 'Nome de usuário deve conter apenas letras, números e underlines',
            })
        }

        if (!user.email) {
            invalidFields.push({
                field: 'email',
                message: 'Email é obrigatório',
            })
        }

        if (!this.emailRegex.test(user.email)) {
            invalidFields.push({
                field: 'email',
                message: 'Email inválido',
            })
        }

        if (!user.password) {
            invalidFields.push({
                field: 'password',
                message: 'Senha é obrigatória',
            })
        }

        if (user.password.length < 8) {
            invalidFields.push({
                field: 'password',
                message: 'Senha deve ter pelo menos 8 caracteres',
            })
        }

        try {
            await this.db.users.findFirstOrThrow({ where: { username: user.username } })

            invalidFields.push({
                field: 'username',
                message: 'Nome de usuário já existe',
            })
        } catch (err) {}

        try {
            await this.db.users.findFirstOrThrow({ where: { email: user.email } })

            invalidFields.push({
                field: 'email',
                message: 'Email já existe',
            })
        } catch (err) {}

        return invalidFields
    }

    async validateUserUpdate(user: User): Promise<Array<{ field: string; message: string }>> {
        const invalidFields = []

        if (user.username && user.username.length < 3) {
            invalidFields.push({
                field: 'username',
                message: 'Nome de usuário deve ter pelo menos 3 caracteres',
            })
        }

        if (user.username && user.username.length > 32) {
            invalidFields.push({
                field: 'username',
                message: 'Nome de usuário deve ter no máximo 32 caracteres',
            })
        }

        if (user.username && !this.usernameRegex.test(user.username)) {
            invalidFields.push({
                field: 'username',
                message: 'Nome de usuário deve conter apenas letras, números e underlines',
            })
        }

        if (user.password && user.password.length < 8) {
            invalidFields.push({
                field: 'password',
                message: 'Senha deve ter pelo menos 8 caracteres',
            })
        }

        if (user.avatar && !this.avatarURLRegex.test(user.avatar)) {
            invalidFields.push({
                field: 'avatarURL',
                message: 'URL de avatar inválida',
            })
        }

        if (user.username) {
            try {
                await this.db.users.findFirstOrThrow({ where: { username: user.username } })

                invalidFields.push({
                    field: 'username',
                    message: 'Nome de usuário já existe',
                })
            } catch (err) {}
        }

        return invalidFields
    }

    async prepareUser(user: User): Promise<PreparedUser> {
        const preparedUser: PreparedUser = {
            username: user.username,
            email: user.email,
            password: user.password,
        }

        preparedUser.password = await bcrypt.hashSync(preparedUser.password, config.default.SALT_ROUNDS)

        return preparedUser
    }

    async prepareUserUpdate(originalUser: { avatar_url?: string }, user: User): Promise<PreparedUserUpdate> {
        const preparedUser: PreparedUserUpdate = {
            username: user.username ? user.username : undefined,
            avatar: user.avatar === originalUser.avatar_url ? undefined : user.avatar === null ? null : user.avatar,
            password: user.password ? user.password : undefined,
        }

        if (preparedUser.password) {
            preparedUser.password = await bcrypt.hashSync(preparedUser.password, config.default.SALT_ROUNDS)
        }

        return preparedUser
    }
}

export default UserServices
