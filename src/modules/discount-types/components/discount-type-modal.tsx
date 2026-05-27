"use client"

import { useEffect, useRef } from "react"
import { useForm, useWatch } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { Button } from "@/components/ui/primitives"
import type { ActionResult } from "@/lib/result"
import {
  createDiscountTypeSchema,
  updateDiscountTypeSchema,
  deriveCode,
  type CreateDiscountTypeInput,
  type UpdateDiscountTypeInput,
} from "../schemas"
import type { DiscountTypeRow } from "../types"
import { Modal, Field, inputStyle, textareaStyle } from "./modal"

function ErrorBanner({ message }: { message?: string }) {
  if (!message) return null
  return (
    <div
      style={{
        padding: "10px 12px",
        borderRadius: "var(--r-2)",
        background: "var(--bad-bg)",
        color: "var(--bad-fg)",
        fontSize: 13,
      }}
    >
      {message}
    </div>
  )
}

const TYPE_LABEL: Record<"percentage" | "flat" | "cashback", string> = {
  percentage: "Percentage",
  flat: "Flat",
  cashback: "Cashback",
}

type FormValues = {
  name: string
  code: string
  description: string | null | ""
  type: "percentage" | "flat" | "cashback"
  value: number | string
  maxDiscount: number | string | null | ""
  durationStart: string | null | ""
  durationEnd: string | null | ""
  activationMode: "duration" | "manual"
  minAmount: number | string | null | ""
  minNights: number | string | null | ""
  stackable: boolean
}

function DiscountForm({
  mode,
  initialValues,
  submitLabel,
  onSubmit,
  onCancel,
}: {
  mode: "create" | "edit"
  initialValues: FormValues
  submitLabel: string
  onSubmit: (values: FormValues) => Promise<{
    ok: boolean
    fieldErrors?: Record<string, string[] | undefined>
    rootError?: string
  }>
  onCancel: () => void
}) {
  const schema =
    mode === "create" ? createDiscountTypeSchema : updateDiscountTypeSchema
  const {
    register,
    handleSubmit,
    reset,
    setValue,
    setError,
    control,
    formState: { errors, isSubmitting, dirtyFields },
  } = useForm<FormValues>({
    resolver: zodResolver(schema) as never,
    defaultValues: initialValues,
  })

  // Re-sync defaults whenever the modal opens for a different row.
  const initialSig = useRef<FormValues | null>(null)
  if (initialSig.current !== initialValues) {
    initialSig.current = initialValues
    reset(initialValues)
  }

  // Auto-derive code from name unless the user has touched the code field.
  const watchedName = useWatch({ control, name: "name" })
  useEffect(() => {
    if (dirtyFields.code) return
    setValue("code", deriveCode(watchedName ?? ""), { shouldDirty: false })
  }, [watchedName, dirtyFields.code, setValue])

  const watchedType = useWatch({ control, name: "type" })
  const watchedMode = useWatch({ control, name: "activationMode" })

  const submit = handleSubmit(async (values) => {
    const res = await onSubmit(values)
    if (res.ok) return
    const fields = res.fieldErrors ?? {}
    const firstField = Object.keys(fields).find((k) => fields[k]?.[0]) as
      | keyof FormValues
      | undefined
    if (firstField) {
      setError(firstField as never, { message: fields[firstField]![0] })
    } else {
      setError("root", { message: res.rootError ?? "Could not save." })
    }
  })

  return (
    <form onSubmit={submit}>
      <div style={{ padding: "22px 24px 6px" }}>
        <h2
          style={{
            fontFamily: "var(--font-display), serif",
            fontWeight: 300,
            fontSize: 24,
            letterSpacing: "var(--tight)",
            margin: 0,
          }}
        >
          {mode === "create" ? "New discount" : "Edit discount"}
        </h2>
      </div>

      <div
        style={{
          padding: "16px 24px",
          display: "flex",
          flexDirection: "column",
          gap: 14,
        }}
      >
        <ErrorBanner message={errors.root?.message} />

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
          <Field label="Name" error={errors.name?.message}>
            <input
              style={inputStyle}
              autoFocus
              placeholder="e.g. Summer 2026"
              {...register("name")}
            />
          </Field>
          <Field
            label="Code"
            hint="Auto-fills from the name. Uppercase letters and digits only."
            error={errors.code?.message}
          >
            <input
              style={{ ...inputStyle, fontFamily: "var(--font-mono), monospace", letterSpacing: 0.5 }}
              placeholder="e.g. SUMMER2026"
              {...register("code", {
                onChange: (e) => {
                  // Strip disallowed chars live so the field always matches the regex.
                  const v = e.target.value
                  const clean = v.replace(/[^A-Za-z0-9]/g, "").toUpperCase()
                  if (clean !== v) e.target.value = clean
                },
              })}
            />
          </Field>
        </div>

        <Field label="Description" error={errors.description?.message as string | undefined}>
          <textarea
            style={textareaStyle}
            placeholder="Internal note (optional)"
            {...register("description")}
          />
        </Field>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
          <Field label="Type" error={errors.type?.message}>
            <select style={inputStyle} {...register("type")}>
              {(["percentage", "flat", "cashback"] as const).map((t) => (
                <option key={t} value={t}>
                  {TYPE_LABEL[t]}
                </option>
              ))}
            </select>
          </Field>
          <Field
            label={watchedType === "percentage" ? "Value (%)" : "Value (A$)"}
            error={errors.value?.message as string | undefined}
          >
            <input
              type="number"
              inputMode="decimal"
              min={0}
              max={watchedType === "percentage" ? 100 : undefined}
              step="0.01"
              style={inputStyle}
              placeholder={watchedType === "percentage" ? "25" : "50.00"}
              {...register("value")}
            />
          </Field>
        </div>

        {watchedType === "percentage" && (
          <Field
            label="Max discount cap (A$)"
            hint="Optional. Caps the percentage discount on long stays."
            error={errors.maxDiscount?.message as string | undefined}
          >
            <input
              type="number"
              inputMode="decimal"
              min={0}
              step="0.01"
              style={inputStyle}
              placeholder="Leave blank for no cap"
              {...register("maxDiscount")}
            />
          </Field>
        )}

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
          <Field label="Activation mode" error={errors.activationMode?.message}>
            <select style={inputStyle} {...register("activationMode")}>
              <option value="duration">Duration (auto by dates)</option>
              <option value="manual">Manual (always on)</option>
            </select>
          </Field>
          <div />
        </div>

        {watchedMode === "duration" && (
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
            <Field
              label="Duration start"
              hint="Leave blank for no start bound."
              error={errors.durationStart?.message as string | undefined}
            >
              <input type="date" style={inputStyle} {...register("durationStart")} />
            </Field>
            <Field
              label="Duration end"
              hint="Leave blank for no end bound."
              error={errors.durationEnd?.message as string | undefined}
            >
              <input type="date" style={inputStyle} {...register("durationEnd")} />
            </Field>
          </div>
        )}

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
          <Field
            label="Min booking amount (A$)"
            hint="Optional."
            error={errors.minAmount?.message as string | undefined}
          >
            <input
              type="number"
              inputMode="decimal"
              min={0}
              step="0.01"
              style={inputStyle}
              placeholder="No minimum"
              {...register("minAmount")}
            />
          </Field>
          <Field
            label="Min nights"
            hint="Optional. Leave blank or 0 for no minimum."
            error={errors.minNights?.message as string | undefined}
          >
            <input
              type="number"
              inputMode="numeric"
              min={0}
              style={inputStyle}
              placeholder="No minimum"
              {...register("minNights")}
            />
          </Field>
        </div>

        <label style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <input type="checkbox" {...register("stackable")} />
          <span style={{ fontSize: 13.5, color: "var(--ink)" }}>
            Stackable - can combine with other active discounts on one booking
          </span>
        </label>
      </div>

      <div
        style={{
          display: "flex",
          justifyContent: "flex-end",
          gap: 10,
          padding: "16px 24px 22px",
          borderTop: "1px solid var(--line-soft)",
        }}
      >
        <Button variant="ghost" onClick={onCancel} disabled={isSubmitting}>
          Cancel
        </Button>
        <Button type="submit" variant="primary" disabled={isSubmitting}>
          {isSubmitting ? "Saving..." : submitLabel}
        </Button>
      </div>
    </form>
  )
}

const EMPTY_DEFAULTS: FormValues = {
  name: "",
  code: "",
  description: "",
  type: "percentage",
  value: "",
  maxDiscount: "",
  durationStart: "",
  durationEnd: "",
  activationMode: "duration",
  minAmount: "",
  minNights: "",
  stackable: false,
}

export function NewDiscountTypeModal({
  isOpen,
  onClose,
  onSave,
}: {
  isOpen: boolean
  onClose: () => void
  onSave: (
    values: CreateDiscountTypeInput,
  ) => Promise<ActionResult<DiscountTypeRow>>
}) {
  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <DiscountForm
        mode="create"
        initialValues={EMPTY_DEFAULTS}
        submitLabel="Add discount"
        onCancel={onClose}
        onSubmit={async (values) => {
          const res = await onSave(values as never)
          if (res.ok) {
            onClose()
            return { ok: true }
          }
          return {
            ok: false,
            fieldErrors: res.error.fields,
            rootError: res.error.message,
          }
        }}
      />
    </Modal>
  )
}

export function EditDiscountTypeModal({
  isOpen,
  onClose,
  discount,
  onSave,
}: {
  isOpen: boolean
  onClose: () => void
  discount: DiscountTypeRow | null
  onSave: (
    id: string,
    values: UpdateDiscountTypeInput,
  ) => Promise<ActionResult<DiscountTypeRow>>
}) {
  if (!discount) return null
  const initial: FormValues = {
    name: discount.name,
    code: discount.code,
    description: discount.description ?? "",
    type: discount.type,
    // value_int is stored in the integer scale; the form expects the
    // decimal. Divide by 100 to recover the human number.
    value: discount.valueInt / 100,
    maxDiscount:
      discount.maxDiscountCents === null ? "" : discount.maxDiscountCents / 100,
    durationStart: discount.durationStart ?? "",
    durationEnd: discount.durationEnd ?? "",
    activationMode: discount.activationMode,
    minAmount:
      discount.minAmountCents === null ? "" : discount.minAmountCents / 100,
    minNights: discount.minNights ?? "",
    stackable: discount.stackable,
  }
  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <DiscountForm
        mode="edit"
        initialValues={initial}
        submitLabel="Save changes"
        onCancel={onClose}
        onSubmit={async (values) => {
          const res = await onSave(discount.id, values as never)
          if (res.ok) {
            onClose()
            return { ok: true }
          }
          return {
            ok: false,
            fieldErrors: res.error.fields,
            rootError: res.error.message,
          }
        }}
      />
    </Modal>
  )
}
