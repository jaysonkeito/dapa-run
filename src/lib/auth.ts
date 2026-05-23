import { NextAuthOptions } from "next-auth"
import CredentialsProvider from "next-auth/providers/credentials"
import bcrypt from "bcryptjs"
import { db } from "@/lib/db"

// Ensure NEXTAUTH_URL is set - required for deployed sites
if (!process.env.NEXTAUTH_URL) {
  process.env.NEXTAUTH_URL = 'https://dapa-run-dumaguete.space-z.ai'
}

// Auto-detect secure cookie setting based on NEXTAUTH_URL
const isProduction = process.env.NEXTAUTH_URL?.startsWith('https') ?? false
// Use "lax" for sameSite even in production - the site is same-origin
// "none" is only needed for cross-site cookie scenarios
const sameSiteValue = "lax"

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null
        const user = await db.user.findUnique({ where: { email: credentials.email } })
        if (!user) return null
        const isValid = await bcrypt.compare(credentials.password, user.password)
        if (!isValid) return null
        return { id: user.id, email: user.email, name: user.name, role: user.role }
      }
    })
  ],
  session: {
    strategy: "jwt",
    maxAge: 15 * 60, // 15 minutes - matches inactivity timeout
  },
  jwt: {
    maxAge: 15 * 60, // 15 minutes
  },
  cookies: {
    sessionToken: {
      name: `next-auth.session-token`,
      options: {
        httpOnly: true,
        sameSite: sameSiteValue,
        path: "/",
        secure: isProduction,
        // No maxAge = session cookie (deleted when browser/tab closes)
      },
    },
    callbackUrl: {
      name: `next-auth.callback-url`,
      options: {
        sameSite: sameSiteValue,
        path: "/",
        secure: isProduction,
      },
    },
    csrfToken: {
      name: `next-auth.csrf-token`,
      options: {
        httpOnly: true,
        sameSite: sameSiteValue,
        path: "/",
        secure: isProduction,
      },
    },
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.role = (user as unknown as Record<string, unknown>).role
        token.id = user.id
      }
      return token
    },
    async session({ session, token }) {
      if (session.user) {
        (session.user as Record<string, unknown>).role = token.role
        ;(session.user as Record<string, unknown>).id = token.id
      }
      return session
    }
  },
  pages: {
    signIn: "/admin/login",
    error: "/admin/login",
  },
  secret: process.env.NEXTAUTH_SECRET || "dapa-run-secret-key-2026",
}
