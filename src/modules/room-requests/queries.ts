import "server-only"

import { asc, eq } from "drizzle-orm"
import { roomRequests } from "@/db/schema"
import { withTenant } from "@/lib/rls"
import { ok, err, type ActionResult } from "@/lib/result"
import type { RoomRequestRow } from "./types"

export type { RoomRequestRow } from "./types"

/**
 * Every active room request, alphabetised. usageCount is always 0 until the
 * booking assignment table lands - swap in a leftJoin then. Admin-only.
 */
export async function listRoomRequests(): Promise<
  ActionResult<RoomRequestRow[]>
> {
  return withTenant(async (tx, ctx) => {
    if (ctx.role !== "admin") {
      return err("FORBIDDEN", "Only an admin can manage room requests.")
    }
    const rows = await tx
      .select({
        id: roomRequests.id,
        name: roomRequests.name,
        code: roomRequests.code,
        createdAt: roomRequests.createdAt,
        updatedAt: roomRequests.updatedAt,
      })
      .from(roomRequests)
      .where(eq(roomRequests.isDeleted, false))
      .orderBy(asc(roomRequests.name))

    return ok(rows.map((r) => ({ ...r, usageCount: 0 })))
  })
}
