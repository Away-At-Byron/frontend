import NextAuth, { type DefaultSession } from "next-auth"
import Credentials from "next-auth/providers/credentials"
import { eq } from "drizzle-orm"
import bcrypt from "bcryptjs"
import { z } from "zod"
import { db } from "@/db"
import { users, roles } from "@/db/schema"

declare module "next-auth" {
  interface Session {
    user: {
      id: string
      role: string
      propertyId: string | null
    } & DefaultSession["user"]
  }
}

const signInSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
})

export const { handlers, signIn, signOut, auth } = NextAuth({
  session: { strategy: "jwt", maxAge: 12 * 60 * 60 }, // 12h sliding (FRS §6.1 AC2)
  trustHost: true,
  pages: { signIn: "/signin" },
  providers: [
    Credentials({
      credentials: { email: {}, password: {} },
      async authorize(credentials) {
        const parsed = signInSchema.safeParse(credentials)
        if (!parsed.success) return null

        const row = await db
          .select({
            id: users.id,
            email: users.email,
            firstName: users.firstName,
            lastName: users.lastName,
            passwordHash: users.passwordHash,
            status: users.status,
            propertyId: users.propertyId,
            roleName: roles.name,
          })
          .from(users)
          .innerJoin(roles, eq(users.roleId, roles.id))
          .where(eq(users.email, parsed.data.email.toLowerCase()))
          .limit(1)

        const u = row[0]
        // Inactive users: response indistinguishable from wrong password
        // (FRS §6.1 AC4). Always run a bcrypt compare to avoid timing leaks.
        const hash = u?.passwordHash ?? "$2a$10$invalidinvalidinvalidinvalidinvalidinvalidinv"
        const valid = await bcrypt.compare(parsed.data.password, hash)
        if (!u || u.status !== "active" || !valid) return null

        return {
          id: u.id,
          email: u.email,
          name: `${u.firstName} ${u.lastName}`,
          role: u.roleName,
          propertyId: u.propertyId,
        }
      },
    }),
  ],
  callbacks: {
    jwt({ token, user }) {
      if (user) {
        token.userId = user.id
        token.role = (user as { role: string }).role
        token.propertyId = (user as { propertyId: string | null }).propertyId
      }
      return token
    },
    session({ session, token }) {
      session.user.id = token.userId as string
      session.user.role = token.role as string
      session.user.propertyId = (token.propertyId as string | null) ?? null
      return session
    },
  },
})
