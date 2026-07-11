/**
 * Creates the first platform super-admin from environment variables.
 *
 * This is intentionally separate from the optional demo seed: a fresh stack
 * can become operable without shipping a known account or password.
 */
import 'dotenv/config'
import { PrismaPg } from '@prisma/adapter-pg'
import { PrismaClient } from '@prisma/client'

const email = process.env.PLATFORM_SUPER_ADMIN_EMAIL?.trim().toLowerCase()
const password = process.env.PLATFORM_SUPER_ADMIN_PASSWORD
const name = process.env.PLATFORM_SUPER_ADMIN_NAME?.trim() || 'Platform Super Admin'
const resetPassword = process.env.PLATFORM_SUPER_ADMIN_RESET_PASSWORD === 'true'

function configurationError(message: string): never {
  throw new Error(`[bootstrap-platform-admin] ${message}`)
}

async function main(): Promise<void> {
  if (!email && !password) {
    console.log('[bootstrap-platform-admin] No platform super-admin configured; skipping.')
    return
  }
  if (!email || !/^\S+@\S+\.\S+$/.test(email)) {
    configurationError('PLATFORM_SUPER_ADMIN_EMAIL must be a valid email address.')
  }
  if (!password || password.length < 16) {
    configurationError('PLATFORM_SUPER_ADMIN_PASSWORD must contain at least 16 characters.')
  }

  const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! })
  const prisma = new PrismaClient({ adapter })
  try {
    const existing = await prisma.$queryRaw<Array<{ id: string }>>`
      SELECT id FROM "user" WHERE email = ${email} LIMIT 1
    `

    let authUserId: string
    if (existing[0]?.id) {
      authUserId = existing[0].id
      const credentials = await prisma.$queryRaw<Array<{ id: string }>>`
        SELECT id FROM account
        WHERE "userId" = ${authUserId} AND "providerId" = 'credential'
        LIMIT 1
      `
      if (resetPassword || !credentials[0]?.id) {
        const { hashPassword } = await import('better-auth/crypto')
        const hashedPassword = await hashPassword(password)
        const now = new Date()
        if (credentials[0]?.id) {
          await prisma.$executeRaw`
            UPDATE account
            SET password = ${hashedPassword}, "updatedAt" = ${now}
            WHERE id = ${credentials[0].id}
          `
        } else {
          const { randomBytes } = await import('crypto')
          await prisma.$executeRaw`
            INSERT INTO account (id, "accountId", "providerId", "userId", password, "createdAt", "updatedAt")
            VALUES (${randomBytes(16).toString('hex')}, ${email}, 'credential', ${authUserId}, ${hashedPassword}, ${now}, ${now})
          `
        }
      }
    } else {
      const { hashPassword } = await import('better-auth/crypto')
      const { randomBytes } = await import('crypto')
      authUserId = randomBytes(16).toString('hex')
      const accountId = randomBytes(16).toString('hex')
      const hashedPassword = await hashPassword(password)
      const now = new Date()

      await prisma.$executeRaw`
        INSERT INTO "user" (id, name, email, "emailVerified", "createdAt", "updatedAt")
        VALUES (${authUserId}, ${name}, ${email}, true, ${now}, ${now})
      `
      await prisma.$executeRaw`
        INSERT INTO account (id, "accountId", "providerId", "userId", password, "createdAt", "updatedAt")
        VALUES (${accountId}, ${email}, 'credential', ${authUserId}, ${hashedPassword}, ${now}, ${now})
      `
    }

    await prisma.user.upsert({
      where: { email },
      update: { authUserId, fullName: name, globalRole: 'super_admin', status: 'Active' },
      create: { authUserId, email, fullName: name, globalRole: 'super_admin', status: 'Active' },
    })

    console.log(`[bootstrap-platform-admin] Platform super-admin is ready for ${email}.`)
  } finally {
    await prisma.$disconnect()
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error)
  process.exit(1)
})
