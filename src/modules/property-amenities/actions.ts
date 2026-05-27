"use server"

import { and, asc, eq, ne, sql } from "drizzle-orm"
import { propertyAmenities } from "@/db/schema"
import { withTenant, type TenantContext } from "@/lib/rls"
import { writeAudit } from "@/lib/audit"
import { ok, err, type ActionResult, type ActionErr } from "@/lib/result"
import {
  createPropertyAmenitySchema,
  updatePropertyAmenitySchema,
  type CreatePropertyAmenityInput,
  type UpdatePropertyAmenityInput,
} from "./schemas"
import type { PropertyAmenityRow } from "./types"

type Tx = Parameters<Parameters<typeof withTenant>[0]>[0]

function adminOnly(ctx: TenantContext): ActionErr | null {
  if (ctx.role !== "admin") {
    return err("FORBIDDEN", "Only an admin can manage property amenities.")
  }
  return null
}

async function pairTaken(
  tx: Tx,
  category: string,
  name: string,
  exceptId?: string,
): Promise<boolean> {
  const dupes = await tx
    .select({ id: propertyAmenities.id })
    .from(propertyAmenities)
    .where(
      and(
        eq(propertyAmenities.isDeleted, false),
        sql`lower(${propertyAmenities.category}) = lower(${category})`,
        sql`lower(${propertyAmenities.name}) = lower(${name})`,
        exceptId ? ne(propertyAmenities.id, exceptId) : undefined,
      ),
    )
    .limit(1)
  return dupes.length > 0
}

/**
 * Rewrite sort_order to 0..N-1 across the active rows in a category,
 * preserving current order (sort_order asc, then lower(name)). Keeps the
 * values tight after any insert/update/delete/reorder.
 */
async function renormaliseCategory(tx: Tx, category: string): Promise<void> {
  await tx.execute(sql`
    WITH ordered AS (
      SELECT id, row_number() OVER (
        ORDER BY sort_order ASC, lower(name) ASC
      ) - 1 AS new_sort
      FROM property_amenities
      WHERE category = ${category} AND is_deleted = false
    )
    UPDATE property_amenities pa
    SET sort_order = ordered.new_sort
    FROM ordered
    WHERE pa.id = ordered.id AND pa.sort_order IS DISTINCT FROM ordered.new_sort
  `)
}

async function fetchRow(
  tx: Tx,
  id: string,
): Promise<PropertyAmenityRow | null> {
  const rows = await tx
    .select({
      id: propertyAmenities.id,
      category: propertyAmenities.category,
      name: propertyAmenities.name,
      sortOrder: propertyAmenities.sortOrder,
      createdAt: propertyAmenities.createdAt,
      updatedAt: propertyAmenities.updatedAt,
    })
    .from(propertyAmenities)
    .where(eq(propertyAmenities.id, id))
    .limit(1)
  const r = rows[0]
  return r ? { ...r, usageCount: 0 } : null
}

export async function createPropertyAmenity(
  input: CreatePropertyAmenityInput,
): Promise<ActionResult<PropertyAmenityRow>> {
  return withTenant(async (tx, ctx) => {
    const gate = adminOnly(ctx)
    if (gate) return gate

    const parsed = createPropertyAmenitySchema.safeParse(input)
    if (!parsed.success) {
      return err(
        "VALIDATION",
        "Check the highlighted fields.",
        parsed.error.flatten().fieldErrors,
      )
    }
    const { category, name } = parsed.data

    if (await pairTaken(tx, category, name)) {
      return err(
        "CONFLICT",
        "An amenity with that category and name already exists.",
        { name: ["That name is already in use in this category"] },
      )
    }

    // New row goes to end of category. Renormalise immediately so the value
    // stays tight against the existing 0..N-1 range.
    const maxRow = await tx
      .select({ max: sql<number | null>`max(${propertyAmenities.sortOrder})` })
      .from(propertyAmenities)
      .where(
        and(
          eq(propertyAmenities.isDeleted, false),
          eq(propertyAmenities.category, category),
        ),
      )
    const nextSort = (maxRow[0]?.max ?? -1) + 1

    const inserted = await tx
      .insert(propertyAmenities)
      .values({ category, name, sortOrder: nextSort, createdBy: ctx.userId })
      .returning({ id: propertyAmenities.id })

    const id = inserted[0]!.id
    await renormaliseCategory(tx, category)

    const row = await fetchRow(tx, id)
    if (!row) return err("INTERNAL", "Could not load the new amenity.")

    await writeAudit({
      ctx,
      entityType: "property_amenity",
      entityId: id,
      action: "create",
      newValue: { category, name, sortOrder: row.sortOrder },
    })

    return ok(row)
  })
}

export async function updatePropertyAmenity(
  id: string,
  input: UpdatePropertyAmenityInput,
): Promise<ActionResult<PropertyAmenityRow>> {
  return withTenant(async (tx, ctx) => {
    const gate = adminOnly(ctx)
    if (gate) return gate

    const parsed = updatePropertyAmenitySchema.safeParse(input)
    if (!parsed.success) {
      return err(
        "VALIDATION",
        "Check the highlighted fields.",
        parsed.error.flatten().fieldErrors,
      )
    }
    const { category, name } = parsed.data

    const existing = await tx
      .select({
        id: propertyAmenities.id,
        category: propertyAmenities.category,
        name: propertyAmenities.name,
        sortOrder: propertyAmenities.sortOrder,
      })
      .from(propertyAmenities)
      .where(
        and(eq(propertyAmenities.id, id), eq(propertyAmenities.isDeleted, false)),
      )
      .limit(1)
    if (!existing[0]) {
      return err("NOT_FOUND", "That amenity no longer exists.")
    }

    if (await pairTaken(tx, category, name, id)) {
      return err(
        "CONFLICT",
        "An amenity with that category and name already exists.",
        { name: ["That name is already in use in this category"] },
      )
    }

    const oldCategory = existing[0].category
    const movingCategory = oldCategory !== category

    if (movingCategory) {
      // Send the row to the end of the new category, then renormalise both.
      const maxRow = await tx
        .select({ max: sql<number | null>`max(${propertyAmenities.sortOrder})` })
        .from(propertyAmenities)
        .where(
          and(
            eq(propertyAmenities.isDeleted, false),
            eq(propertyAmenities.category, category),
            ne(propertyAmenities.id, id),
          ),
        )
      const nextSort = (maxRow[0]?.max ?? -1) + 1
      await tx
        .update(propertyAmenities)
        .set({ category, name, sortOrder: nextSort, updatedAt: new Date() })
        .where(eq(propertyAmenities.id, id))
      await renormaliseCategory(tx, oldCategory)
      await renormaliseCategory(tx, category)
    } else {
      await tx
        .update(propertyAmenities)
        .set({ name, updatedAt: new Date() })
        .where(eq(propertyAmenities.id, id))
    }

    const row = await fetchRow(tx, id)
    if (!row) return err("NOT_FOUND", "That amenity no longer exists.")

    await writeAudit({
      ctx,
      entityType: "property_amenity",
      entityId: id,
      action: "update",
      oldValue: {
        category: existing[0].category,
        name: existing[0].name,
      },
      newValue: { category, name },
    })

    return ok(row)
  })
}

/**
 * Move a row one position up or down within its category. No-op if already
 * at the boundary. Swaps sort_order with the neighbour and renormalises.
 */
export async function reorderPropertyAmenity(
  id: string,
  direction: "up" | "down",
): Promise<ActionResult<PropertyAmenityRow>> {
  return withTenant(async (tx, ctx) => {
    const gate = adminOnly(ctx)
    if (gate) return gate

    const current = await tx
      .select({
        id: propertyAmenities.id,
        category: propertyAmenities.category,
        sortOrder: propertyAmenities.sortOrder,
      })
      .from(propertyAmenities)
      .where(
        and(eq(propertyAmenities.id, id), eq(propertyAmenities.isDeleted, false)),
      )
      .limit(1)
    if (!current[0]) {
      return err("NOT_FOUND", "That amenity no longer exists.")
    }
    const { category, sortOrder } = current[0]

    const peer = await tx
      .select({
        id: propertyAmenities.id,
        sortOrder: propertyAmenities.sortOrder,
      })
      .from(propertyAmenities)
      .where(
        and(
          eq(propertyAmenities.isDeleted, false),
          eq(propertyAmenities.category, category),
          direction === "up"
            ? sql`${propertyAmenities.sortOrder} < ${sortOrder}`
            : sql`${propertyAmenities.sortOrder} > ${sortOrder}`,
        ),
      )
      .orderBy(
        direction === "up"
          ? sql`${propertyAmenities.sortOrder} DESC`
          : asc(propertyAmenities.sortOrder),
      )
      .limit(1)

    if (!peer[0]) {
      // Already at the boundary - return the row unchanged.
      const row = await fetchRow(tx, id)
      if (!row) return err("NOT_FOUND", "That amenity no longer exists.")
      return ok(row)
    }

    // Swap sort_order with the peer. Use a temporary out-of-range value to
    // avoid colliding with the (category, sort_order) clash mid-swap if a
    // unique constraint is added later.
    await tx
      .update(propertyAmenities)
      .set({ sortOrder: -1 })
      .where(eq(propertyAmenities.id, id))
    await tx
      .update(propertyAmenities)
      .set({ sortOrder: sortOrder })
      .where(eq(propertyAmenities.id, peer[0].id))
    await tx
      .update(propertyAmenities)
      .set({ sortOrder: peer[0].sortOrder, updatedAt: new Date() })
      .where(eq(propertyAmenities.id, id))

    await renormaliseCategory(tx, category)

    const row = await fetchRow(tx, id)
    if (!row) return err("NOT_FOUND", "That amenity no longer exists.")
    return ok(row)
  })
}

export async function deletePropertyAmenity(
  id: string,
): Promise<ActionResult<{ id: string }>> {
  return withTenant(async (tx, ctx) => {
    const gate = adminOnly(ctx)
    if (gate) return gate

    const existing = await tx
      .select({
        id: propertyAmenities.id,
        category: propertyAmenities.category,
        name: propertyAmenities.name,
      })
      .from(propertyAmenities)
      .where(
        and(eq(propertyAmenities.id, id), eq(propertyAmenities.isDeleted, false)),
      )
      .limit(1)
    if (!existing[0]) {
      return err("NOT_FOUND", "That amenity no longer exists.")
    }

    await tx
      .update(propertyAmenities)
      .set({ isDeleted: true, updatedAt: new Date() })
      .where(eq(propertyAmenities.id, id))

    await renormaliseCategory(tx, existing[0].category)

    await writeAudit({
      ctx,
      entityType: "property_amenity",
      entityId: id,
      action: "delete",
      oldValue: { category: existing[0].category, name: existing[0].name },
    })

    return ok({ id })
  })
}
