import type { NextAuthOptions } from 'next-auth'
import { PrismaAdapter } from '@next-auth/prisma-adapter'
import CredentialsProvider from 'next-auth/providers/credentials'
import GoogleProvider from 'next-auth/providers/google'
import FacebookProvider from 'next-auth/providers/facebook'
import bcrypt from 'bcryptjs'
import { db } from '@/lib/db'

// Demo credentials seeded by /api/auth/seed-demo
const DEMO_EMAIL = 'demo@theviralfindsmy.com'
const DEMO_PASSWORD = 'demo123'

async function ensureDemoUser() {
  try {
    const existing = await db.user.findUnique({ where: { email: DEMO_EMAIL } })
    if (existing) return existing
    const passwordHash = await bcrypt.hash(DEMO_PASSWORD, 10)
    return await db.user.create({
      data: {
        email: DEMO_EMAIL,
        name: 'Demo Affiliate',
        passwordHash,
        role: 'affiliate',
        isActive: true,
        emailVerified: new Date(),
        lastLoginAt: new Date(),
      },
    })
  } catch (error) {
    console.error('Failed to ensure demo user:', error)
    return null
  }
}

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(db),
  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  secret: (() => {
    const secret = process.env.NEXTAUTH_SECRET
    if (!secret) {
      if (process.env.NODE_ENV === 'production') {
        throw new Error('NEXTAUTH_SECRET environment variable is required in production')
      }
      console.warn('[auth] WARNING: NEXTAUTH_SECRET is not set. Using insecure dev fallback. Set NEXTAUTH_SECRET before deploying!')
      return 'dev-only-insecure-secret-do-not-use-in-production'
    }
    return secret
  })(),
  pages: {
    signIn: '/auth/login',
    error: '/auth/login',
  },
  providers: [
    CredentialsProvider({
      id: 'credentials',
      name: 'Email & Password',
      credentials: {
        email: { label: 'Email', type: 'email', placeholder: 'you@example.com' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error('Email and password are required')
        }

        const email = credentials.email.trim().toLowerCase()

        // Demo-mode fallback: if no users in DB at all, allow demo login
        const userCount = await db.user.count().catch(() => 0)
        if (userCount === 0) {
          await ensureDemoUser()
        }

        const user = await db.user.findUnique({ where: { email } })

        // If user not found AND email matches demo, create demo user on-the-fly
        if (!user && email === DEMO_EMAIL) {
          const demoUser = await ensureDemoUser()
          if (!demoUser) return null
          await db.user.update({
            where: { id: demoUser.id },
            data: { lastLoginAt: new Date() },
          })
          return {
            id: demoUser.id,
            email: demoUser.email,
            name: demoUser.name,
            image: demoUser.image ?? null,
            role: demoUser.role,
          }
        }

        if (!user) {
          throw new Error('No account found with this email. Please register first.')
        }

        if (!user.isActive) {
          throw new Error('Your account has been deactivated. Contact support.')
        }

        // Verify password — only bcrypt hashes are accepted
        const isHashed = user.passwordHash.startsWith('$2a$') || user.passwordHash.startsWith('$2b$') || user.passwordHash.startsWith('$2y$')
        if (!isHashed) {
          // Non-bcrypt hash detected — force password reset for security
          throw new Error('Your password needs to be reset for security reasons. Please use the password reset feature.')
        }
        const valid = await bcrypt.compare(credentials.password, user.passwordHash)

        if (!valid) {
          throw new Error('Incorrect password. Please try again.')
        }

        await db.user.update({
          where: { id: user.id },
          data: { lastLoginAt: new Date() },
        })

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          image: user.image ?? null,
          role: user.role,
        }
      },
    }),
    ...(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET
      ? [
          GoogleProvider({
            clientId: process.env.GOOGLE_CLIENT_ID,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET,
          }),
        ]
      : []),
    ...(process.env.FACEBOOK_CLIENT_ID && process.env.FACEBOOK_CLIENT_SECRET
      ? [
          FacebookProvider({
            clientId: process.env.FACEBOOK_CLIENT_ID,
            clientSecret: process.env.FACEBOOK_CLIENT_SECRET,
          }),
        ]
      : []),
  ],
  callbacks: {
    async jwt({ token, user, account }) {
      // Initial sign-in
      if (user) {
        token.id = user.id as string
        token.role = (user as { role?: string }).role ?? 'affiliate'
      }
      // OAuth sign-in (no user role yet, fetch from DB)
      if (account?.provider && account.provider !== 'credentials' && !token.role) {
        const dbUser = await db.user.findUnique({ where: { email: token.email! } })
        if (dbUser) {
          token.id = dbUser.id
          token.role = dbUser.role
        }
      }
      return token
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string
        session.user.role = token.role as string
      }
      return session
    },
  },
  events: {
    async createUser({ user }) {
      // Auto-create demo user's lastLoginAt if missing
      if (user.email) {
        try {
          await db.user.update({
            where: { id: user.id },
            data: { lastLoginAt: new Date() },
          })
        } catch {
          // ignore
        }
      }
    },
  },
  debug: false,
}
