import { PrismaClient } from '@prisma/client'
import { config } from './config'

const db = new PrismaClient({
    datasources: {
        db: {
            url: config.default.DATABASE_URL,
        },
    },
})

export const checkConnection = async () => await db.$queryRaw`SELECT 1`
export default db
