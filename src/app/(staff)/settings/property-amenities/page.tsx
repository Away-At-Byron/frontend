/**
 * Settings > Property Amenities - admin-managed amenity catalogue.
 * Global single table per ADR-009. Category is a text column; the UI
 * offers a combobox of distinct existing values.
 */
import { assertAdmin } from "@/lib/access"
import {
  listPropertyAmenities,
  listAmenityCategories,
} from "@/modules/property-amenities/queries"
import { PropertyAmenityManagement } from "@/modules/property-amenities/components/property-amenity-management"

export default async function PropertyAmenitiesPage() {
  await assertAdmin()

  const [amenities, categories] = await Promise.all([
    listPropertyAmenities(),
    listAmenityCategories(),
  ])

  if (!amenities.ok) {
    return (
      <div style={{ padding: "40px 32px", color: "var(--ink-soft)" }}>
        Could not load amenities. {amenities.error.message}
      </div>
    )
  }
  if (!categories.ok) {
    return (
      <div style={{ padding: "40px 32px", color: "var(--ink-soft)" }}>
        Could not load amenity categories. {categories.error.message}
      </div>
    )
  }

  return (
    <PropertyAmenityManagement
      initialAmenities={amenities.data}
      initialCategories={categories.data}
    />
  )
}
