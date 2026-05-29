"use client"

import { useCallback, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Button, Card, Pill } from "@/components/ui/primitives"
import { Icon } from "@/components/ui/icon"
import { useToast } from "@/components/ui/toast"
import {
  createInventoryItem,
  updateInventoryItem,
} from "../actions"
import type {
  InventoryItemRow,
  InventoryItemStatus,
  InventoryItemType,
  StorageAllocation,
  SupplierOption,
} from "../types"
import { TYPE_LABEL, STATUS_LABEL } from "../types"
import type { StorageLocationOption } from "@/modules/storage-locations/types"
import { PhotoUploader } from "./photo-uploader"

type FormState = {
  name: string
  type: InventoryItemType
  category: string
  status: InventoryItemStatus
  description: string
  photoKey: string | null
  quantityOnHand: string

  // asset
  warrantyExpiry: string
  expectedUsefulLife: string

  // inventory
  minimumThreshold: string
  replacementCost: string

  // consumable
  reorderLevel: string
  unitCost: string
  supplierContactId: string
  lastRestockedDate: string

  // inventory + consumable
  minimumReorderQty: string

  storageAllocations: StorageAllocation[]
}

function initialForm(
  item: InventoryItemRow | null,
  allocations: StorageAllocation[],
  defaultType: InventoryItemType,
): FormState {
  if (!item) {
    return {
      name: "",
      type: defaultType,
      category: "",
      status: "in_service",
      description: "",
      photoKey: null,
      quantityOnHand: "0",
      warrantyExpiry: "",
      expectedUsefulLife: "",
      minimumThreshold: defaultType === "inventory" ? "0" : "",
      replacementCost: "",
      reorderLevel: defaultType === "consumable" ? "0" : "",
      unitCost: "",
      supplierContactId: "",
      lastRestockedDate: "",
      minimumReorderQty: defaultType === "asset" ? "" : "0",
      storageAllocations: [],
    }
  }
  return {
    name: item.name,
    type: item.type,
    category: item.category ?? "",
    status: item.status,
    description: item.description ?? "",
    photoKey: item.photoKey,
    quantityOnHand: String(item.quantityOnHand),
    warrantyExpiry: item.warrantyExpiry ?? "",
    expectedUsefulLife: item.expectedUsefulLife ?? "",
    minimumThreshold:
      item.minimumThreshold == null ? "" : String(item.minimumThreshold),
    replacementCost:
      item.replacementCostCents == null
        ? ""
        : (item.replacementCostCents / 100).toString(),
    reorderLevel:
      item.reorderLevel == null ? "" : String(item.reorderLevel),
    unitCost:
      item.unitCostCents == null
        ? ""
        : (item.unitCostCents / 100).toString(),
    supplierContactId: item.supplierContactId ?? "",
    lastRestockedDate: item.lastRestockedDate ?? "",
    minimumReorderQty:
      item.minimumReorderQty == null ? "" : String(item.minimumReorderQty),
    storageAllocations: allocations,
  }
}

function toPayload(form: FormState) {
  // For type-incompatible fields the schema accepts null/empty and the action
  // forces them to null based on type — but we still send "" so the schema
  // can coerce, never an unrelated number.
  const isAsset = form.type === "asset"
  return {
    name: form.name,
    type: form.type,
    category: form.category || undefined,
    status: form.status,
    description: form.description || undefined,
    photoKey: form.photoKey || undefined,
    quantityOnHand: form.quantityOnHand,

    warrantyExpiry: isAsset ? form.warrantyExpiry : "",
    expectedUsefulLife: isAsset ? form.expectedUsefulLife : "",

    minimumThreshold: form.type === "inventory" ? form.minimumThreshold : "",
    replacementCost: form.type === "inventory" ? form.replacementCost : "",

    reorderLevel: form.type === "consumable" ? form.reorderLevel : "",
    unitCost: form.type === "consumable" ? form.unitCost : "",
    supplierContactId:
      form.type === "consumable" ? form.supplierContactId || null : null,
    lastRestockedDate:
      form.type === "consumable" ? form.lastRestockedDate : "",

    minimumReorderQty: isAsset ? "" : form.minimumReorderQty,

    storageAllocations: form.storageAllocations.map((a) => ({
      storageLocationId: a.storageLocationId,
      qty: a.qty,
    })),
  }
}

export function InventoryEdit({
  item,
  suppliers,
  storageLocations,
  storageAllocations = [],
  defaultType = "asset",
  initialPhotoUrl,
}: {
  item: InventoryItemRow | null
  suppliers: SupplierOption[]
  storageLocations: StorageLocationOption[]
  storageAllocations?: StorageAllocation[]
  defaultType?: InventoryItemType
  initialPhotoUrl?: string | null
}) {
  const router = useRouter()
  const toast = useToast()
  const [form, setForm] = useState<FormState>(() =>
    initialForm(item, storageAllocations, defaultType),
  )
  const [saving, setSaving] = useState(false)
  const [fieldErrors, setFieldErrors] = useState<
    Record<string, string[] | undefined>
  >({})

  const isNew = item === null
  const isAsset = form.type === "asset"
  const isInventory = form.type === "inventory"
  const isConsumable = form.type === "consumable"

  const setField = useCallback(
    <K extends keyof FormState>(key: K, value: FormState[K]) => {
      setForm((f) => ({ ...f, [key]: value }))
    },
    [],
  )

  const handleSave = async () => {
    setSaving(true)
    setFieldErrors({})
    const payload = toPayload(form)
    const res = isNew
      ? await createInventoryItem(
          payload as Parameters<typeof createInventoryItem>[0],
        )
      : await updateInventoryItem(
          item!.id,
          payload as Parameters<typeof updateInventoryItem>[1],
        )
    setSaving(false)

    if (!res.ok) {
      toast.error({
        title: isNew ? "Couldn't create item" : "Couldn't save item",
        message: res.error.message,
      })
      if (res.error.fields) setFieldErrors(res.error.fields)
      return
    }

    toast.success({
      title: isNew ? "Item created" : "Item saved",
      message: `${res.data.name} ${isNew ? "added" : "updated"}.`,
    })
    if (isNew) router.push("/inventory")
    else router.refresh()
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
        {isNew ? "Add" : "Edit"}{" "}
        <em style={{ fontStyle: "italic" }}>{TYPE_LABEL[form.type]}</em>
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
          href="/inventory"
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
          Inventory
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
          <Button variant="paper" onClick={() => router.push("/inventory")}>
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

      {/* Header card */}
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
            <Icon name="Sparkles" size={28} />
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
              {form.name || (isNew ? "Untitled item" : item!.name)}
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
              {isNew ? "NEW" : item!.id.slice(0, 8).toUpperCase()}
            </div>
            <div style={{ display: "flex", gap: 6, marginTop: 10 }}>
              <Pill
                tone={form.status === "in_service" ? "ok" : "warn"}
                size="sm"
              >
                {STATUS_LABEL[form.status]}
              </Pill>
              <Pill tone="paper" size="sm">
                {TYPE_LABEL[form.type]}
              </Pill>
            </div>
          </div>
        </div>
      </Card>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
          gap: 14,
        }}
      >
        {/* Identification */}
        <FormCard title="Identification">
          <FieldRow label="Name" error={fieldErrors.name}>
            <TextInput
              value={form.name}
              onChange={(v) => setField("name", v)}
              placeholder="Item name…"
            />
          </FieldRow>
          <FieldRow label="Category" error={fieldErrors.category}>
            <TextInput
              value={form.category}
              onChange={(v) => setField("category", v)}
              placeholder="Furniture, Linen, Toiletries…"
            />
          </FieldRow>
          <FieldRow label="Status" error={fieldErrors.status}>
            <Select
              value={form.status}
              onChange={(v) => setField("status", v as InventoryItemStatus)}
            >
              <option value="in_service">In service</option>
              <option value="unavailable">Unavailable</option>
              <option value="retired">Retired</option>
            </Select>
          </FieldRow>
          {!isNew && (
            <>
              {/* Property — read-only, derived from assigned rooms. Hidden on Add. */}
              <FieldRow label="Property">
                <ReadOnlyBox text="Auto-listed from assigned rooms · TBD until the assigned-rooms module lands" />
              </FieldRow>
              {/* Used in rooms — read-only, derived from property + storage. Hidden on Add. */}
              <FieldRow label="Used in rooms">
                <ReadOnlyBox text="Auto-counted from assigned rooms + storage · TBD until the assigned-rooms module lands" />
              </FieldRow>
            </>
          )}
        </FormCard>

        {/* Stock & cost — fields differ per type */}
        <FormCard title="Stock & cost">
          <FieldRow
            label="Quantity on hand"
            error={fieldErrors.quantityOnHand}
            hint={
              isAsset
                ? "Total count across all locations."
                : "Auto-summed from storage allocations below. Adjust separately if needed."
            }
          >
            <TextInput
              value={form.quantityOnHand}
              onChange={(v) => setField("quantityOnHand", v)}
              type="number"
              step={1}
              min={0}
            />
          </FieldRow>

          {isAsset && (
            <>
              <FieldRow
                label="Warranty expiry"
                error={fieldErrors.warrantyExpiry}
              >
                <TextInput
                  value={form.warrantyExpiry}
                  onChange={(v) => setField("warrantyExpiry", v)}
                  type="date"
                />
              </FieldRow>
              <FieldRow
                label="Expected useful life"
                error={fieldErrors.expectedUsefulLife}
              >
                <TextInput
                  value={form.expectedUsefulLife}
                  onChange={(v) => setField("expectedUsefulLife", v)}
                  placeholder="e.g. 10 years"
                />
              </FieldRow>
            </>
          )}

          {isInventory && (
            <>
              <FieldRow
                label="Minimum threshold"
                error={fieldErrors.minimumThreshold}
              >
                <TextInput
                  value={form.minimumThreshold}
                  onChange={(v) => setField("minimumThreshold", v)}
                  type="number"
                  step={1}
                  min={0}
                  suffix="units"
                />
              </FieldRow>
              <FieldRow
                label="Replacement cost"
                error={fieldErrors.replacementCost}
              >
                <TextInput
                  value={form.replacementCost}
                  onChange={(v) => setField("replacementCost", v)}
                  type="number"
                  step={0.01}
                  min={0}
                  prefix="$"
                  mono
                />
              </FieldRow>
              <FieldRow
                label="Minimum reorder qty"
                error={fieldErrors.minimumReorderQty}
              >
                <TextInput
                  value={form.minimumReorderQty}
                  onChange={(v) => setField("minimumReorderQty", v)}
                  type="number"
                  step={1}
                  min={0}
                  suffix="units"
                />
              </FieldRow>
            </>
          )}

          {isConsumable && (
            <>
              <FieldRow
                label="Reorder level"
                error={fieldErrors.reorderLevel}
              >
                <TextInput
                  value={form.reorderLevel}
                  onChange={(v) => setField("reorderLevel", v)}
                  type="number"
                  step={1}
                  min={0}
                  suffix="units"
                />
              </FieldRow>
              <FieldRow label="Unit cost" error={fieldErrors.unitCost}>
                <TextInput
                  value={form.unitCost}
                  onChange={(v) => setField("unitCost", v)}
                  type="number"
                  step={0.01}
                  min={0}
                  prefix="$"
                  mono
                />
              </FieldRow>
              <FieldRow
                label="Supplier"
                error={fieldErrors.supplierContactId}
                hint={
                  suppliers.length === 0
                    ? "Add a contact with the Supplier type first."
                    : undefined
                }
              >
                <Select
                  value={form.supplierContactId}
                  onChange={(v) => setField("supplierContactId", v)}
                >
                  <option value="">— None —</option>
                  {suppliers.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name}
                    </option>
                  ))}
                </Select>
              </FieldRow>
              <FieldRow
                label="Last restocked"
                hint="Set automatically when stock is added via Purchase records."
              >
                <TextInput
                  value={form.lastRestockedDate}
                  onChange={() => undefined}
                  type="date"
                  disabled
                />
              </FieldRow>
              <FieldRow
                label="Minimum reorder qty"
                error={fieldErrors.minimumReorderQty}
              >
                <TextInput
                  value={form.minimumReorderQty}
                  onChange={(v) => setField("minimumReorderQty", v)}
                  type="number"
                  step={1}
                  min={0}
                  suffix="units"
                />
              </FieldRow>
            </>
          )}

          {/* Storage locations editor — only shown on Edit. Add creates the
              item first; allocations are managed afterwards. */}
          {!isNew && (
            <StorageAllocationEditor
              allocations={form.storageAllocations}
              options={storageLocations}
              onChange={(next) => setField("storageAllocations", next)}
              error={fieldErrors.storageAllocations}
            />
          )}
        </FormCard>

        {/* Description */}
        <FormCard title="Description">
          <div
            style={{
              padding: "14px 18px",
              borderTop: "1px solid var(--line-soft)",
            }}
          >
            <textarea
              value={form.description}
              onChange={(e) => setField("description", e.target.value)}
              placeholder="Notes about the item — model, dimensions, finish…"
              rows={5}
              style={{
                width: "100%",
                background: "var(--paper)",
                border: "1px solid var(--line-strong)",
                borderRadius: "var(--r-2)",
                padding: "12px 14px",
                fontSize: 13,
                lineHeight: 1.5,
                color: "var(--ink)",
                font: "inherit",
                resize: "vertical",
                outline: "none",
              }}
            />
          </div>
        </FormCard>

        {/* Photo */}
        <FormCard title="Photo">
          <div
            style={{
              padding: "16px 18px",
              borderTop: "1px solid var(--line-soft)",
            }}
          >
            <PhotoUploader
              photoKey={form.photoKey}
              initialUrl={initialPhotoUrl ?? null}
              onChange={(key) => setField("photoKey", key)}
            />
          </div>
        </FormCard>
      </div>
    </div>
  )
}

function StorageAllocationEditor({
  allocations,
  options,
  onChange,
  error,
}: {
  allocations: StorageAllocation[]
  options: StorageLocationOption[]
  onChange: (next: StorageAllocation[]) => void
  error?: string[]
}) {
  const used = new Set(allocations.map((a) => a.storageLocationId))
  const available = options.filter((o) => !used.has(o.id))

  const addRow = () => {
    if (available.length === 0) return
    const first = available[0]!
    onChange([
      ...allocations,
      {
        storageLocationId: first.id,
        storageLocationName: first.name,
        qty: 0,
      },
    ])
  }

  const removeRow = (i: number) => {
    onChange(allocations.filter((_, idx) => idx !== i))
  }

  const updateRow = (i: number, patch: Partial<StorageAllocation>) => {
    onChange(
      allocations.map((a, idx) => (idx === i ? { ...a, ...patch } : a)),
    )
  }

  return (
    <div
      style={{
        padding: "14px 18px",
        borderTop: "1px solid var(--line-soft)",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "baseline",
          justifyContent: "space-between",
          marginBottom: 10,
        }}
      >
        <div className="caps" style={{ color: "var(--ink-faint)" }}>
          Storage locations
        </div>
        <Button
          size="sm"
          variant="ghost"
          icon={<Icon name="Plus" size={13} />}
          disabled={available.length === 0}
          onClick={addRow}
        >
          Add location
        </Button>
      </div>

      {options.length === 0 ? (
        <div style={{ fontSize: 12, color: "var(--ink-soft)" }}>
          No storage locations yet. Add some under{" "}
          <Link
            href="/settings/storage-locations"
            style={{ color: "var(--ink)", fontWeight: 600 }}
          >
            Settings → Storage Locations
          </Link>
          .
        </div>
      ) : allocations.length === 0 ? (
        <div style={{ fontSize: 12, color: "var(--ink-soft)" }}>
          No allocations yet. Click <strong>Add location</strong> above to
          assign qty to a storage location.
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {allocations.map((a, i) => {
            const dropdownOptions = options.filter(
              (o) =>
                o.id === a.storageLocationId ||
                !used.has(o.id),
            )
            return (
              <div
                key={i}
                style={{
                  display: "grid",
                  gridTemplateColumns: "minmax(0, 1fr) 110px 36px",
                  gap: 8,
                  alignItems: "center",
                }}
              >
                <Select
                  value={a.storageLocationId}
                  onChange={(v) => {
                    const opt = options.find((o) => o.id === v)
                    updateRow(i, {
                      storageLocationId: v,
                      storageLocationName: opt?.name ?? "",
                    })
                  }}
                >
                  {dropdownOptions.map((o) => (
                    <option key={o.id} value={o.id}>
                      {o.name}
                    </option>
                  ))}
                </Select>
                <TextInput
                  value={String(a.qty)}
                  onChange={(v) => updateRow(i, { qty: Number(v) || 0 })}
                  type="number"
                  step={1}
                  min={0}
                  suffix="units"
                />
                <button
                  type="button"
                  aria-label="Remove location"
                  onClick={() => removeRow(i)}
                  style={{
                    width: 32,
                    height: 32,
                    borderRadius: "var(--r-2)",
                    background: "transparent",
                    border: "1px solid var(--line)",
                    color: "var(--ink-soft)",
                    cursor: "pointer",
                    display: "inline-flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <Icon name="X" size={13} />
                </button>
              </div>
            )
          })}
        </div>
      )}

      {error && error.length > 0 && (
        <div
          style={{
            marginTop: 8,
            fontSize: 11.5,
            color: "var(--bad-fg)",
          }}
        >
          {error[0]}
        </div>
      )}
    </div>
  )
}

function FormCard({
  title,
  children,
}: {
  title: string
  children: React.ReactNode
}) {
  return (
    <Card pad={0}>
      <div
        style={{
          padding: "14px 18px",
          fontFamily: "var(--font-display), serif",
          fontSize: 17,
          fontWeight: 400,
        }}
      >
        {title}
      </div>
      {children}
    </Card>
  )
}

function FieldRow({
  label,
  children,
  error,
  hint,
}: {
  label: string
  children: React.ReactNode
  error?: string[]
  hint?: string
}) {
  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "160px 1fr",
        gap: 16,
        alignItems: "center",
        padding: "10px 18px",
        borderTop: "1px solid var(--line-soft)",
      }}
    >
      <label
        style={{
          fontSize: 12.5,
          color: "var(--ink-soft)",
        }}
      >
        {label}
      </label>
      <div>
        {children}
        {error && error.length > 0 && (
          <div
            style={{
              marginTop: 6,
              fontSize: 11.5,
              color: "var(--bad-fg)",
            }}
          >
            {error[0]}
          </div>
        )}
        {!error && hint && (
          <div
            style={{
              marginTop: 6,
              fontSize: 11.5,
              color: "var(--ink-faint)",
            }}
          >
            {hint}
          </div>
        )}
      </div>
    </div>
  )
}

function TextInput({
  value,
  onChange,
  placeholder,
  type,
  step,
  min,
  prefix,
  suffix,
  mono,
  disabled,
}: {
  value: string
  onChange: (v: string) => void
  placeholder?: string
  type?: "text" | "number" | "date"
  step?: number
  min?: number
  prefix?: string
  suffix?: string
  mono?: boolean
  disabled?: boolean
}) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        background: disabled ? "var(--linen-soft)" : "var(--paper)",
        border: "1px solid var(--line)",
        borderRadius: "var(--r-2)",
        padding: "8px 12px",
        gap: 6,
        opacity: disabled ? 0.7 : 1,
      }}
    >
      {prefix && (
        <span style={{ fontSize: 13, color: "var(--ink-faint)" }}>
          {prefix}
        </span>
      )}
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        type={type}
        step={step}
        min={min}
        disabled={disabled}
        style={{
          flex: 1,
          minWidth: 0,
          border: "none",
          outline: "none",
          background: "transparent",
          font: "inherit",
          fontFamily: mono
            ? "var(--font-mono), monospace"
            : "var(--font-sans), sans-serif",
          fontSize: 13.5,
          color: disabled ? "var(--ink-soft)" : "var(--ink)",
          cursor: disabled ? "not-allowed" : "text",
        }}
      />
      {suffix && (
        <span
          className="mono"
          style={{
            fontSize: 10,
            color: "var(--ink-faint)",
            letterSpacing: ".06em",
            textTransform: "uppercase",
          }}
        >
          {suffix}
        </span>
      )}
    </div>
  )
}

function Select({
  value,
  onChange,
  children,
}: {
  value: string
  onChange: (v: string) => void
  children: React.ReactNode
}) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      style={{
        width: "100%",
        background: "var(--paper)",
        border: "1px solid var(--line)",
        borderRadius: "var(--r-2)",
        padding: "8px 12px",
        font: "inherit",
        fontSize: 13.5,
        color: "var(--ink)",
        outline: "none",
      }}
    >
      {children}
    </select>
  )
}

function ReadOnlyBox({ text }: { text: string }) {
  return (
    <div
      style={{
        background: "var(--linen-soft)",
        border: "1px solid var(--line-soft)",
        borderRadius: "var(--r-2)",
        padding: "8px 12px",
        fontSize: 12,
        color: "var(--ink-faint)",
        fontStyle: "italic",
      }}
    >
      {text}
    </div>
  )
}
