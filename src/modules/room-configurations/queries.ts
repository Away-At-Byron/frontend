import "server-only"

import { asc, eq } from "drizzle-orm"
import { roomConfigurations } from "@/db/schema"
import { withTenant } from "@/lib/rls"
import { ok, err, type ActionResult } from "@/lib/result"
import type { RoomConfigurationRow } from "./types"

export type { RoomConfigurationRow } from "./types"

/**
 * Every active room configuration. roomCount is always 0 until the rooms
 * table (module 6) lands - swap in a leftJoin then. Admin-only.
 */
export async function listRoomConfigurations(): Promise<
  ActionResult<RoomConfigurationRow[]>
> {
  return withTenant(async (tx, ctx) => {
    if (ctx.role !== "admin") {
      return err("FORBIDDEN", "Only an admin can manage room configurations.")
    }
    const rows = await tx
      .select({
        id: roomConfigurations.id,
        name: roomConfigurations.name,
        defaultMaxOccupancy: roomConfigurations.defaultMaxOccupancy,
        createdAt: roomConfigurations.createdAt,
        updatedAt: roomConfigurations.updatedAt,
      })
      .from(roomConfigurations)
      .where(eq(roomConfigurations.isDeleted, false))
      .orderBy(asc(roomConfigurations.name))

    return ok(rows.map((r) => ({ ...r, roomCount: 0 })))
  })
}
