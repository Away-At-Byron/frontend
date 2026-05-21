import NextAuth, { type DefaultSession } from "next-auth"
import Credentials from "next-auth/providers/credentials"
import { eq } from "drizzle-orm"
import bcrypt from "bcryptjs"
import { z } from "zod"
import { db } from "@/db"
import { contacts, users, roles } from "@/db/schema"
import { verifyOtp } from "@/lib/otp"

export type SubjectType = "user" | "contact"

declare module "next-auth" {
  interface Session {
    user: {
      id: string
      role: string
      propertyId: string | null
      subjectType: SubjectType
    } & DefaultSession["user"]
  }
}

const SHORT_SESSION_SEC = 24 * 60 * 60 // 1 day
const LONG_SESSION_SEC = 30 * 24 * 60 * 60 // 30 days

const staffSignInSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  otp: z.string().regex(/^\d{6}$/),
  rememberMe: z.enum(["true", "false"]).default("false"),
})

const contactSignInSchema = z.object({
  email: z.string().email(),
  otp: z.string().regex(/^\d{6}$/),
})

export const { handlers, signIn, signOut, auth } = NextAuth({
  session: { strategy: "jwt", maxAge: LONG_SESSION_SEC },
  trustHost: true,
  pages: { signIn: "/signin" },
  providers: [
    Credentials({
      id: "credentials",
      name: "Staff",
      credentials: { email: {}, password: {}, otp: {}, rememberMe: {} },
      async authorize(credentials) {
        const parsed = staffSignInSchema.safeParse(credentials)
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
        // Always run bcrypt to keep "no such user" timing-indistinguishable
        // from "wrong password" (FRS §6.1 AC4).
        const hash = u?.passwordHash ?? "$2a$10$invalidinvalidinvalidinvalidinvalidinvalidinv"
        const passwordOk = await bcrypt.compare(parsed.data.password, hash)
        if (!u || u.status !== "active" || !passwordOk) return null

        const otpOk = await verifyOtp("user", u.id, parsed.data.otp)
        if (!otpOk) return null

        await db
          .update(users)
          .set({ lastLoginAt: new Date(), updatedAt: new Date() })
          .where(eq(users.id, u.id))

        return {
          id: u.id,
          email: u.email,
          name: `${u.firstName} ${u.lastName}`,
          role: u.roleName,
          propertyId: u.propertyId,
          subjectType: "user" as const,
          rememberMe: parsed.data.rememberMe === "true",
        }
      },
    }),
    Credentials({
      id: "contact-otp",
      name: "Contact portal",
      credentials: { email: {}, otp: {} },
      async authorize(credentials) {
        const parsed = contactSignInSchema.safeParse(credentials)
        if (!parsed.success) return null

        const emailLower = parsed.data.email.toLowerCase()
        const row = await db
          .select({
            id: contacts.id,
            email: contacts.email,
            firstName: contacts.firstName,
            lastName: contacts.lastName,
            propertyId: contacts.propertyId,
            portalEnabled: contacts.portalEnabled,
          })
          .from(contacts)
          .where(eq(contacts.email, emailLower))
          .limit(1)

        const c = row[0]
        if (!c || !c.portalEnabled || !c.email) return null

        const otpOk = await verifyOtp("contact", c.id, parsed.data.otp)
        if (!otpOk) return null

        await db
          .update(contacts)
          .set({ lastLoginAt: new Date(), updatedAt: new Date() })
          .where(eq(contacts.id, c.id))

        return {
          id: c.id,
          email: c.email,
          name: `${c.firstName} ${c.lastName}`,
          role: "contact",
          propertyId: c.propertyId,
          subjectType: "contact" as const,
          rememberMe: false,
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
        token.subjectType = (user as { subjectType: SubjectType }).subjectType
        token.rememberMe = (user as { rememberMe?: boolean }).rememberMe === true
      }
      const window =
        token.subjectType === "contact"
          ? SHORT_SESSION_SEC
          : token.rememberMe
            ? LONG_SESSION_SEC
            : SHORT_SESSION_SEC
      token.exp = Math.floor(Date.now() / 1000) + window
      return token
    },
    session({ session, token }) {
      session.user.id = token.userId as string
      session.user.role = token.role as string
      session.user.propertyId = (token.propertyId as string | null) ?? null
      session.user.subjectType = (token.subjectType as SubjectType) ?? "user"
      return session
    },
  },
})
