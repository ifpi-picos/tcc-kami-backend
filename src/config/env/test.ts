class Config_Test {
    env: string
    PORT: number
    API_BASE: string
    DATABASE_URL: string | undefined
    CORS_ORIGIN: string | string[]
    constructor() {
        this.env = 'test'
        this.PORT = Number(process.env.PORT)
        this.API_BASE = '/'
        this.DATABASE_URL = process.env.TEST_DATABASE_URL

        if (process.env.CORS_ORIGIN) {
            this.CORS_ORIGIN = process.env.CORS_ORIGIN.search(',') != -1 ? process.env.CORS_ORIGIN.split(',') : process.env.CORS_ORIGIN
        } else {
            this.CORS_ORIGIN = '*'
        }
    }
}

export default new Config_Test()
