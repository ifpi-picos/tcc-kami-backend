class Config_Production {
    ENV: string
    PORT: number
    API_BASE: string
    DATABASE_URL: string | undefined
    DATABASE_NAME: string | undefined
    BOT_TOKEN: string | undefined
    CLIENT_ID: string | undefined
    CLIENT_SECRET: string | undefined
    O_AUTH_URI: string | undefined
    O_AUTH_REDIRECT_URI: string | undefined
    JWT_KEY: string | undefined
    AES_KEY: string | undefined
    API_TOKEN: string | undefined
    CORS_ORIGIN: string | string[]
    SALT_ROUNDS: number | undefined
    constructor() {
        this.ENV = 'production'
        this.PORT = Number(process.env.PORT)
        this.API_BASE = '/'
        this.DATABASE_URL = process.env.DATABASE_URL
        this.DATABASE_NAME = process.env.DATABASE_NAME
        this.BOT_TOKEN = process.env.BOT_TOKEN
        this.CLIENT_ID = process.env.CLIENT_ID
        this.CLIENT_SECRET = process.env.CLIENT_SECRET
        this.O_AUTH_URI = process.env.O_AUTH_URI
        this.O_AUTH_REDIRECT_URI = process.env.O_AUTH_REDIRECT_URI
        this.JWT_KEY = process.env.JWT_KEY
        this.AES_KEY = process.env.AES_KEY
        this.API_TOKEN = process.env.API_TOKEN
        this.SALT_ROUNDS = Number(process.env.SALT_ROUNDS)

        if (process.env.CORS_ORIGIN) {
            this.CORS_ORIGIN = process.env.CORS_ORIGIN.search(',') != -1 ? process.env.CORS_ORIGIN.split(',') : process.env.CORS_ORIGIN
        } else {
            this.CORS_ORIGIN = '*'
        }
    }
}

export default new Config_Production()
