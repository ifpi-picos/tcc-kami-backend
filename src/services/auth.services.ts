import { config } from '../config/config'
import db from '../config/database'
import bcrypt from 'bcrypt'
import axios from 'axios'
import { URLSearchParams } from 'url'
import DiscordOauth2 from 'discord-oauth2'
import jwt from 'jsonwebtoken'
import { LoginError } from '../types/errors'
import UserController from '../controllers/user.controller'
import { LoginErrorCodes } from '../types/errors'

class AuthServices {
    private userController: UserController
    constructor() {
        this.userController = new UserController(db)
    }

    async getDiscordUserByCode(code: string) {
        const oauth = new DiscordOauth2()

        const params = new URLSearchParams()
        params.append('client_id', `${config.default.CLIENT_ID}`)
        params.append('client_secret', `${config.default.CLIENT_SECRET}`)
        params.append('grant_type', 'authorization_code')
        params.append('code', code)
        params.append('redirect_uri', `${config.default.O_AUTH_REDIRECT_URI}`)
        params.append('scope', 'identify')

        const headers = {
            'Content-Type': 'application/x-www-form-urlencoded',
            Accept: 'application/json',
        }

        const response = await axios.post('https://discord.com/api/oauth2/token', params, { headers })
        const userInfo = await oauth.getUser(response.data.access_token)

        const user = {
            id: userInfo.id,
            username: userInfo.username,
            discriminator: userInfo.discriminator,
            locale: userInfo.locale,
            avatar_url: `https://cdn.discordapp.com/avatars/${userInfo.id}/${userInfo.avatar}.png`,
        }

        return user
    }

    async login(user: { username?: string; email?: string; password: string }): Promise<string> {
        let userFromDb: User | null = null
        if (user.email) {
            userFromDb = await this.userController.getByEmail(user.email)
        } else if (user.username) {
            userFromDb = await this.userController.getByUsername(user.username)
        }

        if (userFromDb) {
            const isPasswordCorrect = await bcrypt.compare(user.password, userFromDb.password)

            if (isPasswordCorrect) {
                const jwtToken = jwt.sign({ id: userFromDb.id }, config.default.JWT_KEY, { expiresIn: '7d' })

                return jwtToken
            } else {
                throw new LoginError('Password is incorrect', LoginErrorCodes.PASSWORD_INCORRECT)
            }
        } else {
            if (user.email) {
                throw new LoginError('Email not found', LoginErrorCodes.EMAIL_NOT_FOUND)
            } else if (user.username) {
                throw new LoginError('Username not found', LoginErrorCodes.USERNAME_NOT_FOUND)
            } else {
                throw new LoginError('Invalid credentials', LoginErrorCodes.INVALID_CREDENTIALS)
            }
        }
    }

    verifyToken(token: string): jwt.JwtPayload | false {
        try {
            const decodedToken = jwt.verify(token, config.default.JWT_KEY)

            return decodedToken as jwt.JwtPayload
        } catch (error) {
            return false
        }
    }

    refreshToken(token: string): string {
        const decodedToken = jwt.decode(token) as jwt.JwtPayload

        const newToken = jwt.sign({ id: decodedToken.id }, config.default.JWT_KEY, { expiresIn: '7d' })

        return newToken
    }
}

export default AuthServices
