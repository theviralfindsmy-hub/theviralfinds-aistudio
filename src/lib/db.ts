import { PrismaClient } from '@prisma/client'
import path from 'path'

const dbPath = path.resolve(process.cwd(), 'db/custom.db')
const dbUrl = `file:${dbPath}`

// Normalize to absolute file path so Prisma resolves reliably from any directory
if (!process.env.DATABASE_URL || process.env.DATABASE_URL.includes('./db/custom.db')) {
  process.env.DATABASE_URL = dbUrl
}

// Bump this whenever the Prisma schema changes to force the dev server to
// create a fresh PrismaClient (with the newly-generated model delegates).
const PRISMA_SCHEMA_VERSION = 'full-schema-v3-seed-fixed'

const globalForPrisma = globalThis as unknown as {
  __prismaVersion?: string
  prisma: PrismaClient | undefined
}

// If the schema version changed, discard the old client
if (globalForPrisma.__prismaVersion !== PRISMA_SCHEMA_VERSION) {
  if (globalForPrisma.prisma) {
    try {
      void globalForPrisma.prisma.$disconnect()
    } catch {
      // ignore
    }
  }
  globalForPrisma.prisma = undefined
  globalForPrisma.__prismaVersion = PRISMA_SCHEMA_VERSION
}

let client: PrismaClient
try {
  client =
    globalForPrisma.prisma ??
    new PrismaClient({
      datasources: {
        db: {
          url: process.env.DATABASE_URL || dbUrl,
        },
      },
      log: process.env.NODE_ENV === 'production' ? ['warn', 'error'] : ['warn', 'error'],
    })
} catch (error) {
  console.warn('[AI Studio] Database not connected — using mock proxy', error)
  const noOp = {
    findMany: async () => [],
    findFirst: async () => null,
    findUnique: async () => null,
    create: async (d: any) => d?.data ?? {},
    update: async (d: any) => d?.data ?? {},
    delete: async () => ({}),
    count: async () => 0,
    aggregate: async () => ({ _sum: {}, _avg: {}, _count: {} }),
    groupBy: async () => [],
  }
  client = new Proxy({} as any, {
    get: (_, prop) => (prop === '$disconnect' ? async () => {} : noOp),
  })
}

export const db = client
export const prisma = client

if (process.env.NODE_ENV !== 'production' && !globalForPrisma.prisma) {
  globalForPrisma.prisma = db
}