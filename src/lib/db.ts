import { PrismaClient } from '@prisma/client'
import path from 'path'

// Always point to prisma/dev.db regardless of inherited env DATABASE_URL.
// This makes the file-based SQLite DB location deterministic for both
// the dev server and the seed script. To migrate to Supabase later,
// change `datasourceUrl` to `process.env.DATABASE_URL` and set
// DATABASE_URL="postgresql://..." in .env.
const DB_PATH = path.join(process.cwd(), 'prisma', 'dev.db')

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

export const db =
  globalForPrisma.prisma ??
  new PrismaClient({
    datasourceUrl: `file:${DB_PATH}`,
    log: ['error', 'warn'],
  })

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = db
