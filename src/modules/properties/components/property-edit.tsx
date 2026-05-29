"use client"

import { useCallback, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Button, Card, Pill } from "@/components/ui/primitives"
import { Icon } from "@/components/ui/icon"
import { useToast } from "@/components/ui/toast"
import type {
  ManagerOption,
  OwnerOption,
  PropertyDetail,
} from "../types"
import type { AmenityCatalogueRow } from "./property-amenities-panel"
import type { PropertyImageRow } from "@/modules/property-images/types"
import type { PropertyDocumentRow } from "@/modules/property-documents/types"
import {
  setPropertyAmenities,
  updateProperty,
} from "../actions"
import {
  initialForm,
  toPayload,
  type FormState,
} from "./property-edit-form"
import { PropertyDetailsTab } from "./property-details-tab"
import { PropertyImagesTab } from "./property-images-tab"

type TabId = "details" | "images"

const TABS: { id: TabId; label: string }[] = [
  { id: "details", label: "Property details" },
  { id: "images", label: "Images & attachments" },
]

export function PropertyEdit({
  property,
  managerOptions,
  ownerOptions,
  amenityCatalogue,
  initialAmenityIds,
  images,
  documents,
}: {
  property: PropertyDetail
  managerOptions: ManagerOption[]
  ownerOptions: OwnerOption[]
  amenityCatalogue: AmenityCatalogueRow[]
  initialAmenityIds: string[]
  images: PropertyImageRow[]
  documents: PropertyDocumentRow[]
}) {
  const router = useRouter()
  const toast = useToast()
  const [tab, setTab] = useState<TabId>("details")
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState<FormState>(() => initialForm(property))
  const [selectedAmenityIds, setSelectedAmenityIds] = useState<Set<string>>(
    () => new Set(initialAmenityIds),
  )

  const setField = <K extends keyof FormState>(key: K, value: FormState[K]) =>
    setForm((f) => ({ ...f, [key]: value }))

  const toggleAmenity = useCallback((id: string) => {
    setSelectedAmenityIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }, [])
  const clearAmenities = useCallback(() => {
    setSelectedAmenityIds(new Set())
  }, [])

  const handleSave = async () => {
    setSaving(true)
    // Details and amenities are independent rows - run both in parallel so a
    // slow amenity diff doesn't hold up the property field save. The catch is
    // we can't roll back one if the other fails, but the user can re-save.
    const [detailsRes, amenitiesRes] = await Promise.all([
      updateProperty(property.id, toPayload(form)),
      setPropertyAmenities(property.id, {
        amenityIds: Array.from(selectedAmenityIds),
      }),
    ])
    setSaving(false)

    if (!detailsRes.ok) {
      toast.error({
        title: "Couldn't save property",
        message: detailsRes.error.message,
      })
      return
    }
    if (!amenitiesRes.ok) {
      // Details landed but amenities didn't - surface the partial state so
      // the user knows what's still pending.
      toast.error({
        title: "Amenities didn't save",
        message: amenitiesRes.error.message,
      })
      router.refresh()
      return
    }

    toast.success({
      title: "Property saved",
      message: `${detailsRes.data.name} updated.`,
    })
    router.refresh()
  }

  const addressLine = [
    form.addressStreet,
    form.addressSuburb,
    form.addressCity,
    form.addressPostcode,
  ]
    .filter((p) => p.trim())
    .join(", ")

  const shortId = property.id.slice(0, 8).toUpperCase()
  const colorSwatch = form.propertyColour || "var(--teal)"

  return (
    <div
      style={{
        padding: "24px 32px 48px",
        display: "flex",
        flexDirection: "column",
        gap: 20,
      }}
    >
      <h1
        style={{
          fontFamily: "var(--font-display), serif",
          fontWeight: 300,
          fontSize: 32,
          letterSpacing: "var(--tight)",
          margin: 0,
        }}
      >
        Add / Edit <em style={{ fontStyle: "italic" }}>Property</em>
      </h1>

      <div
        style={{
          display: "flex",
          alignItems: "flex-start",
          gap: 16,
          flexWrap: "wrap",
        }}
      >
        <Link
          href="/properties"
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 6,
            padding: "8px 14px 8px 10px",
            borderRadius: "var(--r-pill)",
            background: "var(--paper)",
            border: "1px solid var(--line)",
            color: "var(--ink)",
            fontSize: 13,
            textDecoration: "none",
            marginTop: 18,
          }}
        >
          <Icon
            name="ChevronDown"
            size={14}
            style={{ transform: "rotate(90deg)" }}
          />
          Properties
        </Link>

        <div style={{ flex: 1, minWidth: 0, marginTop: 4 }} />

        <div
          style={{
            display: "flex",
            gap: 10,
            alignItems: "center",
            marginTop: 18,
          }}
        >
          <Button variant="paper" onClick={() => router.push("/properties")}>
            Cancel
          </Button>
          <Button
            variant="primary"
            iconRight={<Icon name="Check" size={15} />}
            onClick={handleSave}
            disabled={saving}
          >
            {saving ? "Saving…" : "Save"}
          </Button>
        </div>
      </div>

      {/* Header card — the property the user is editing */}
      <Card pad={0}>
        <div
          style={{
            padding: "22px 26px",
            display: "grid",
            gridTemplateColumns: "auto 1fr auto",
            gap: 20,
            alignItems: "center",
          }}
        >
          <div
            style={{
              width: 72,
              height: 72,
              borderRadius: "var(--r-3)",
              overflow: "hidden",
              background: "var(--linen)",
              border: "1px solid var(--line)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "var(--ink-faint)",
            }}
          >
            <Icon name="House" size={28} />
          </div>
          <div style={{ minWidth: 0 }}>
            <div
              style={{
                fontFamily: "var(--font-display), serif",
                fontWeight: 300,
                fontSize: 34,
                lineHeight: 1.02,
                letterSpacing: "var(--tight)",
                whiteSpace: "nowrap",
                overflow: "hidden",
                textOverflow: "ellipsis",
              }}
            >
              {form.name || property.name}
            </div>
            <div
              className="mono"
              style={{
                fontSize: 11,
                color: "var(--ink-faint)",
                letterSpacing: "var(--tracked)",
                marginTop: 8,
              }}
            >
              {shortId}
              {addressLine ? ` · ${addressLine}` : ""}
            </div>
            <div style={{ display: "flex", gap: 6, marginTop: 10 }}>
              <Pill tone={form.status === "active" ? "ok" : "warn"} size="sm">
                {form.status}
              </Pill>
              <Pill tone="paper" size="sm">
                <span
                  style={{
                    width: 8,
                    height: 8,
                    borderRadius: "50%",
                    background: colorSwatch,
                    display: "inline-block",
                    marginRight: 4,
                  }}
                />
                {form.propertyColour || "No colour set"}
              </Pill>
              <Pill tone="paper" size="sm">
                <Icon name="Bed" size={11} /> {property.numberOfRooms} rooms
              </Pill>
            </div>
          </div>
        </div>
      </Card>

      {/* Tab nav */}
      <div
        style={{
          display: "flex",
          gap: 28,
          borderBottom: "1px solid var(--line-soft)",
        }}
        role="tablist"
      >
        {TABS.map((t) => {
          const on = tab === t.id
          return (
            <button
              key={t.id}
              type="button"
              role="tab"
              aria-selected={on}
              onClick={() => setTab(t.id)}
              style={{
                background: "transparent",
                border: "none",
                cursor: "pointer",
                padding: "12px 2px",
                font: "inherit",
                fontSize: 14,
                fontWeight: on ? 600 : 500,
                color: on ? "var(--ink)" : "var(--ink-soft)",
                borderBottom: on
                  ? "2px solid var(--ink)"
                  : "2px solid transparent",
                marginBottom: -1,
              }}
            >
              {t.label}
            </button>
          )
        })}
      </div>

      {tab === "details" && (
        <PropertyDetailsTab
          form={form}
          setField={setField}
          managerOptions={managerOptions}
          ownerOptions={ownerOptions}
          numberOfRooms={property.numberOfRooms}
          amenityCatalogue={amenityCatalogue}
          selectedAmenityIds={selectedAmenityIds}
          onAmenityToggle={toggleAmenity}
          onAmenityClearAll={clearAmenities}
        />
      )}
      {tab === "images" && (
        <PropertyImagesTab
          propertyId={property.id}
          images={images}
          documents={documents}
        />
      )}
    </div>
  )
}
