import "server-only"

import { asc, eq } from "drizzle-orm"
import { roomAmenities } from "@/db/schema"
import { withTenant } from "@/lib/rls"
import { ok, err, type ActionResult } from "@/lib/result"
import type { RoomAmenityRow } from "./types"

export type { RoomAmenityRow } from "./types"

/**
 * Every active room amenity. usageCount is always 0 until the room amenity
 * assignment table lands - swap in a leftJoin then. Admin-only.
 */
export async function listRoomAmenities(): Promise<
  ActionResult<RoomAmenityRow[]>
> {
  return withTenant(async (tx, ctx) => {
    if (ctx.role !== "admin") {
      return err("FORBIDDEN", "Only an admin can manage room amenities.")
    }
    const rows = await tx
      .select({
        id: roomAmenities.id,
        name: roomAmenities.name,
        createdAt: roomAmenities.createdAt,
        updatedAt: roomAmenities.updatedAt,
      })
      .from(roomAmenities)
      .where(eq(roomAmenities.isDeleted, false))
      .orderBy(asc(roomAmenities.name))

    return ok(rows.map((r) => ({ ...r, usageCount: 0 })))
  })
}
