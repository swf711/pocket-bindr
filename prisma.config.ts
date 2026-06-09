import { defineConfig } from 'prisma/config'
import dotenv from 'dotenv'

dotenv.config({ path: '.env.local' })
dotenv.config({ path: '.env' })

const rawUrl = process.env.DIRECT_URL ?? process.env.DATABASE_URL
// dotenv preserves backslash escapes (e.g. \$) literally; strip them for the DB driver
const url = rawUrl?.replace(/\\\$/g, '$')

export default defineConfig({
  datasource: {
    url,
  },
})
