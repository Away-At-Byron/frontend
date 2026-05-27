import "server-only"

import { asc, eq } from "drizzle-orm"
import { roomTypes } from "@/db/schema"
import { withTenant } from "@/lib/rls"
import { ok, err, type ActionResult } from "@/lib/result"
import type { RoomTypeRow } from "./types"

export type { RoomTypeRow } from "./types"

/**
 * Every active room type. roomCount is always 0 until the rooms table (module
 * 6) lands - swap in a leftJoin then. Admin-only.
 */
export async function listRoomTypes(): Promise<ActionResult<RoomTypeRow[]>> {
  return withTenant(async (tx, ctx) => {
    if (ctx.role !== "admin") {
      return err("FORBIDDEN", "Only an admin can manage room types.")
    }
    const rows = await tx
      .select({
        id: roomTypes.id,
        name: roomTypes.name,
        defaultMaxOccupancy: roomTypes.defaultMaxOccupancy,
        createdAt: roomTypes.createdAt,
        updatedAt: roomTypes.updatedAt,
      })
      .from(roomTypes)
      .where(eq(roomTypes.isDeleted, false))
      .orderBy(asc(roomTypes.name))

    return ok(rows.map((r) => ({ ...r, roomCount: 0 })))
  })
}
