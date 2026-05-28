"use client"

import { Button } from "@/components/ui/primitives"
import { Icon } from "@/components/ui/icon"
import { SectionCard } from "./property-edit-fields"

/**
 * Images & attachments tab for the Edit Property page. Three sections:
 *   1. Property brand logo (square, used in topbar, invoices, emails)
 *   2. Property image gallery (hero + 4-col grid)
 *   3. Documents & attachments (file table)
 *
 * The tab is currently UI-only. Wiring uploads up needs:
 *   - new `property_images` and `property_documents` tables + migration
 *   - server actions that presign MinIO PUT URLs (see `src/lib/storage.ts`
 *     and the contact-documents module for the existing pattern)
 *   - a client uploader that POSTs the file then writes a metadata row
 */
export function PropertyImagesTab({ propertyId }: { propertyId: string }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      <BrandLogoCard propertyId={propertyId} />
      <GalleryCard propertyId={propertyId} />
      <DocumentsCard propertyId={propertyId} />
    </div>
  )
}

function StubNote() {
  return (
    <div
      style={{
        fontFamily: "var(--font-mono), monospace",
        fontSize: 10,
        color: "var(--ink-faint)",
        letterSpacing: ".06em",
        textTransform: "uppercase",
      }}
    >
      Uploads not wired yet
    </div>
  )
}

function ImageSlot({
  label,
  aspect = "1/1",
  radius = "var(--r-3)",
  rounded = true,
}: {
  label: string
  aspect?: string
  radius?: string
  rounded?: boolean
}) {
  return (
    <div
      style={{
        aspectRatio: aspect,
        borderRadius: rounded ? radius : 0,
        overflow: "hidden",
        background: "var(--linen)",
        border: "1px solid var(--line)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        color: "var(--ink-faint)",
        flexDirection: "column",
        gap: 6,
        padding: 12,
        textAlign: "center",
        position: "relative",
      }}
    >
      <Icon name="House" size={20} />
      <div style={{ fontSize: 11.5 }}>{label}</div>
    </div>
  )
}

function BrandLogoCard({ propertyId }: { propertyId: string }) {
  return (
    <SectionCard
      icon="Sparkles"
      title="Property brand logo"
      headerAction={
        <Button size="sm" variant="ghost" icon={<Icon name="Plus" size={13} />}>
          Replace
        </Button>
      }
    >
      <div
        style={{
          padding: "20px 22px",
          display: "grid",
          gridTemplateColumns: "220px 1fr",
          gap: 24,
          alignItems: "center",
        }}
      >
        <ImageSlot label="Drop logo" />
        <div>
          <div
            className="caps"
            style={{
              color: "var(--ink-faint)",
              fontSize: 10,
              letterSpacing: "var(--tracked)",
            }}
          >
            Property logo · {propertyId.slice(0, 8).toUpperCase()}
          </div>
          <div
            style={{
              fontSize: 13,
              color: "var(--ink-soft)",
              marginTop: 8,
              lineHeight: 1.55,
              maxWidth: 480,
            }}
          >
            The brand logo appears in topbar overlays, invoices, guest emails,
            and external channel listings. PNG or SVG with transparent
            background, minimum 512×512.
          </div>
          <div style={{ marginTop: 10 }}>
            <StubNote />
          </div>
        </div>
      </div>
    </SectionCard>
  )
}

function GalleryCard({ propertyId }: { propertyId: string }) {
  const placeholders = [
    "exterior",
    "lounge",
    "room 1",
    "room 2",
    "kitchen",
    "bathroom",
    "garden",
    "street",
  ]
  return (
    <SectionCard
      icon="Layout"
      title="Property image gallery"
      headerAction={
        <Button size="sm" variant="ghost" icon={<Icon name="Plus" size={13} />}>
          Add image
        </Button>
      }
    >
      <div style={{ padding: "18px 22px" }}>
        <div style={{ marginBottom: 14 }}>
          <div
            className="caps"
            style={{
              color: "var(--ink-faint)",
              fontSize: 10,
              letterSpacing: "var(--tracked)",
              marginBottom: 8,
            }}
          >
            Hero · header image
          </div>
          <div style={{ maxWidth: 840 }}>
            <ImageSlot
              label={`Drop the hero image for this property`}
              aspect="16/7"
              radius="var(--r-2)"
            />
          </div>
        </div>

        <div
          className="caps"
          style={{
            color: "var(--ink-faint)",
            fontSize: 10,
            letterSpacing: "var(--tracked)",
            marginBottom: 8,
          }}
        >
          Gallery · {placeholders.length} slots
        </div>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(4, 1fr)",
            gap: 10,
          }}
        >
          {placeholders.map((id, i) => (
            <ImageSlot
              key={`${propertyId}-${id}`}
              label={`Photo ${i + 1} · ${id}`}
              aspect="4/3"
              radius="var(--r-2)"
            />
          ))}
        </div>
        <div style={{ marginTop: 14 }}>
          <StubNote />
        </div>
      </div>
    </SectionCard>
  )
}

function DocumentsCard({ propertyId: _propertyId }: { propertyId: string }) {
  // Static row preview matching the design. Real rows come from the
  // property_documents table once it lands.
  const rows: {
    name: string
    type: string
    size: string
    when: string
  }[] = []

  const GRID = "48px 1.6fr 90px 90px 130px 80px"

  return (
    <SectionCard
      icon="File"
      title="Documents & attachments"
      headerAction={
        <Button size="sm" variant="ghost" icon={<Icon name="Plus" size={13} />}>
          Upload file
        </Button>
      }
    >
      <div>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: GRID,
            gap: 12,
            padding: "12px 22px",
            borderBottom: "1px solid var(--line-soft)",
            fontFamily: "var(--font-mono), monospace",
            fontSize: 10,
            textTransform: "uppercase",
            letterSpacing: "var(--tracked)",
            color: "var(--ink-faint)",
            fontWeight: 500,
          }}
        >
          <span />
          <span>File</span>
          <span>Type</span>
          <span>Size</span>
          <span>Uploaded</span>
          <span />
        </div>
        {rows.length === 0 ? (
          <div
            style={{
              padding: "32px 22px",
              textAlign: "center",
              color: "var(--ink-soft)",
              fontSize: 13.5,
            }}
          >
            No documents uploaded yet.
          </div>
        ) : (
          rows.map((d) => (
            <div
              key={d.name}
              style={{
                display: "grid",
                gridTemplateColumns: GRID,
                gap: 12,
                alignItems: "center",
                padding: "12px 22px",
                borderBottom: "1px solid var(--line-soft)",
              }}
            >
              <div
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: "var(--r-2)",
                  background: "var(--linen)",
                  border: "1px solid var(--line-soft)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Icon name="File" size={15} />
              </div>
              <span style={{ fontFamily: "var(--font-display), serif", fontSize: 14 }}>
                {d.name}
              </span>
              <span style={{ fontSize: 12.5, color: "var(--ink-soft)" }}>
                {d.type}
              </span>
              <span
                className="mono"
                style={{ fontSize: 11, color: "var(--ink-faint)" }}
              >
                {d.size}
              </span>
              <span style={{ fontSize: 12.5, color: "var(--ink-soft)" }}>
                {d.when}
              </span>
              <div style={{ justifySelf: "end" }} />
            </div>
          ))
        )}
        <div
          style={{
            padding: "12px 22px",
            borderTop: rows.length > 0 ? "1px solid var(--line-soft)" : "none",
          }}
        >
          <StubNote />
        </div>
      </div>
    </SectionCard>
  )
}
