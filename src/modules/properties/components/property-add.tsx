"use client"

import { useMemo, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/primitives"
import { Icon } from "@/components/ui/icon"
import { useToast } from "@/components/ui/toast"
import { COUNTRIES } from "@/lib/countries"
import { AUSTRALIAN_STATES } from "@/lib/australian-states"
import { SearchSelect } from "@/modules/contacts/components/search-select"
import { SuburbAutocomplete } from "@/modules/contacts/components/suburb-autocomplete"
import { createProperty } from "../actions"
import {
  Row,
  SectionCard,
  TextInput,
} from "./property-edit-fields"

const COUNTRY_OPTIONS = COUNTRIES.map((c) => ({
  value: c.code,
  label: c.name,
}))
const STATE_OPTIONS = AUSTRALIAN_STATES.map((s) => ({
  value: s.code,
  label: s.name,
}))

type AddFormState = {
  name: string
  addressStreet: string
  addressSuburb: string
  addressCity: string
  addressState: string
  addressPostcode: string
  addressCountry: string
}

function initialState(): AddFormState {
  return {
    name: "",
    addressStreet: "",
    addressSuburb: "",
    addressCity: "",
    addressState: "",
    addressPostcode: "",
    addressCountry: "AU",
  }
}

const nullIfBlank = (s: string): string | null =>
  s.trim() === "" ? null : s.trim()

export function PropertyAdd() {
  const router = useRouter()
  const toast = useToast()
  const [form, setForm] = useState<AddFormState>(initialState)
  const [saving, setSaving] = useState(false)

  const setField = <K extends keyof AddFormState>(
    key: K,
    value: AddFormState[K],
  ) => setForm((f) => ({ ...f, [key]: value }))

  const isAustralia = form.addressCountry === "AU"

  const canSave = useMemo(() => form.name.trim().length > 0, [form.name])

  const handleSave = async () => {
    if (!canSave) {
      toast.error({
        title: "Property name required",
        message: "Give the property a name before saving.",
      })
      return
    }
    setSaving(true)
    const res = await createProperty({
      name: form.name.trim(),
      addressStreet: nullIfBlank(form.addressStreet),
      addressSuburb: nullIfBlank(form.addressSuburb),
      addressCity: nullIfBlank(form.addressCity),
      addressState: nullIfBlank(form.addressState),
      addressPostcode: nullIfBlank(form.addressPostcode),
      addressCountry: form.addressCountry.trim() || "AU",
      status: "active",
      propertyColour: null,
    })
    setSaving(false)
    if (!res.ok) {
      toast.error({
        title: "Couldn't create property",
        message: res.error.message,
      })
      return
    }
    toast.success({
      title: "Property added",
      message: form.name.trim(),
    })
    // Hard navigation - guarantees a fresh server render so the new card
    // shows in the register without relying on router.refresh() racing
    // against router.push() (which can swallow the push).
    window.location.assign("/properties")
  }

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
        Add <em style={{ fontStyle: "italic" }}>Property</em>
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
            marginTop: 6,
          }}
        >
          <Icon
            name="ChevronDown"
            size={14}
            style={{ transform: "rotate(90deg)" }}
          />
          Properties
        </Link>

        <div style={{ flex: 1, minWidth: 0 }} />

        <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
          <Button variant="paper" onClick={() => router.push("/properties")}>
            Cancel
          </Button>
          <Button
            variant="primary"
            iconRight={<Icon name="Check" size={15} />}
            onClick={handleSave}
            disabled={saving || !canSave}
          >
            {saving ? "Creating…" : "Create property"}
          </Button>
        </div>
      </div>

      <div style={{ maxWidth: 640 }}>
        <SectionCard icon="Pin" title="Address">
          <Row label="Property name">
            <TextInput
              value={form.name}
              onChange={(e) => setField("name", e.target.value)}
              placeholder="e.g. Away Guesthouse"
            />
          </Row>
          <Row label="Street">
            <TextInput
              value={form.addressStreet}
              onChange={(e) => setField("addressStreet", e.target.value)}
            />
          </Row>
          <Row label="Suburb">
            {isAustralia ? (
              <SuburbAutocomplete
                value={form.addressSuburb}
                onChange={(v) => setField("addressSuburb", v)}
                onPick={(s) => {
                  setField("addressState", s.state)
                  setField("addressPostcode", s.postcode)
                }}
              />
            ) : (
              <TextInput
                value={form.addressSuburb}
                onChange={(e) => setField("addressSuburb", e.target.value)}
              />
            )}
          </Row>
          <Row label="State">
            {isAustralia ? (
              <SearchSelect
                value={form.addressState}
                onChange={(v) => setField("addressState", v)}
                options={STATE_OPTIONS}
                placeholder="Select state"
                clearLabel="Clear state"
                emptyLabel="No matching state"
              />
            ) : (
              <TextInput
                value={form.addressState}
                onChange={(e) => setField("addressState", e.target.value)}
                placeholder="State or region"
              />
            )}
          </Row>
          <Row label="City">
            <TextInput
              value={form.addressCity}
              onChange={(e) => setField("addressCity", e.target.value)}
            />
          </Row>
          <Row label="Post code">
            <TextInput
              value={form.addressPostcode}
              onChange={(e) => setField("addressPostcode", e.target.value)}
              mono
            />
          </Row>
          <Row label="Country">
            <SearchSelect
              value={form.addressCountry}
              onChange={(v) => setField("addressCountry", v || "AU")}
              options={COUNTRY_OPTIONS}
              placeholder="Select country"
              clearLabel="Clear country"
              emptyLabel="No matching country"
            />
          </Row>
        </SectionCard>

        <div
          style={{
            marginTop: 14,
            padding: "12px 14px",
            background: "var(--linen-soft)",
            borderRadius: "var(--r-2)",
            border: "1px solid var(--line-soft)",
            fontSize: 12.5,
            color: "var(--ink-soft)",
            display: "flex",
            gap: 10,
            alignItems: "flex-start",
          }}
        >
          <Icon name="Alert" size={14} />
          <span>
            Add the rest - manager, owners, amenities, images - on the Edit
            screen after you create the property.
          </span>
        </div>
      </div>
    </div>
  )
}
