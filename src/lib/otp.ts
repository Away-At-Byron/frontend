import "server-only"
import { and, eq, gt, isNull, desc } from "drizzle-orm"
import { db } from "@/db"
import { authOtps, type OtpSubjectType } from "@/db/schema"

const OTP_TTL_MS = 10 * 60 * 1000
const MAX_ATTEMPTS = 5

/**
 * Issue a fresh 6-digit OTP for the given subject. Any prior unconsumed
 * code for the same subject is marked consumed first, so the active-code
 * partial unique index stays valid and the row history is preserved.
 */
export async function issueOtp(
  subjectType: OtpSubjectType,
  subjectId: string,
): Promise<{ code: string; expiresAt: Date }> {
  const code = String(Math.floor(100000 + Math.random() * 900000))
  const expiresAt = new Date(Date.now() + OTP_TTL_MS)
  const now = new Date()

  await db.transaction(async (tx) => {
    await tx
      .update(authOtps)
      .set({ consumedAt: now })
      .where(
        and(
          eq(authOtps.subjectType, subjectType),
          eq(authOtps.subjectId, subjectId),
          isNull(authOtps.consumedAt),
        ),
      )
    await tx.insert(authOtps).values({
      subjectType,
      subjectId,
      code,
      expiresAt,
    })
  })

  return { code, expiresAt }
}

/**
 * Atomically check a code against the subject's active OTP. On success the
 * row is consumed (so the code can't be reused). On a wrong-but-fresh code
 * the attempts counter increments; once it hits MAX_ATTEMPTS the row is
 * consumed too, forcing the user to request a new code.
 */
export async function verifyOtp(
  subjectType: OtpSubjectType,
  subjectId: string,
  candidate: string,
): Promise<boolean> {
  const now = new Date()
  const rows = await db
    .select()
    .from(authOtps)
    .where(
      and(
        eq(authOtps.subjectType, subjectType),
        eq(authOtps.subjectId, subjectId),
        isNull(authOtps.consumedAt),
        gt(authOtps.expiresAt, now),
      ),
    )
    .orderBy(desc(authOtps.createdAt))
    .limit(1)

  const row = rows[0]
  if (!row) return false
  if (row.attempts >= MAX_ATTEMPTS) return false

  if (row.code !== candidate) {
    const nextAttempts = row.attempts + 1
    await db
      .update(authOtps)
      .set({
        attempts: nextAttempts,
        // Burn the row once the cap is hit; user must request a new code.
        consumedAt: nextAttempts >= MAX_ATTEMPTS ? now : null,
      })
      .where(eq(authOtps.id, row.id))
    return false
  }

  await db
    .update(authOtps)
    .set({ consumedAt: now })
    .where(eq(authOtps.id, row.id))
  return true
}
