"use client"

import { useEffect } from "react"
import { useForm, useWatch } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { Button } from "@/components/ui/primitives"
import type { ActionResult } from "@/lib/result"
import {
  createCostCategorySchema,
  updateCostCategorySchema,
  BASIS_LABEL,
  type CreateCostCategoryInput,
  type UpdateCostCategoryInput,
} from "../schemas"
import type { CostCategoryRow, CostTypeOption, CostBasis } from "../types"
import { Modal, Field, inputStyle } from "./modal"

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

type FormValues = {
  name: string
  costTypeId: string
  basis: CostBasis
  amount: number | string
  isOverridden: boolean
  isActive: boolean
}

const EMPTY: FormValues = {
  name: "",
  costTypeId: "",
  basis: "flat",
  amount: "",
  isOverridden: false,
  isActive: true,
}

function CostCategoryForm({
  mode,
  initialValues,
  costTypeOptions,
  submitLabel,
  onSubmit,
  onCancel,
}: {
  mode: "create" | "edit"
  initialValues: FormValues
  costTypeOptions: CostTypeOption[]
  submitLabel: string
  onSubmit: (values: FormValues) => Promise<{
    ok: boolean
    fieldErrors?: Record<string, string[] | undefined>
    rootError?: string
  }>
  onCancel: () => void
}) {
  const schema =
    mode === "create" ? createCostCategorySchema : updateCostCategorySchema
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

  useEffect(() => {
    reset(initialValues)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialValues])

  const watchedBasis = useWatch({ control, name: "basis" })
  const watchedOverride = useWatch({ control, name: "isOverridden" })
  const watchedCostTypeId = useWatch({ control, name: "costTypeId" })

  // When the admin picks (or changes) a cost type, prefill the Amount with
  // that type's default rate. `dirtyFields.costTypeId` is true only after
  // the user has actively changed the dropdown - this skips the initial
  // mount in edit mode so the row's stored amount is preserved.
  useEffect(() => {
    if (!dirtyFields.costTypeId) return
    if (!watchedCostTypeId) return
    const opt = costTypeOptions.find((o) => o.id === watchedCostTypeId)
    if (!opt) return
    setValue("amount", opt.defaultRateCents / 100, { shouldDirty: true })
  }, [watchedCostTypeId, dirtyFields.costTypeId, costTypeOptions, setValue])

  // When the admin turns Is overridden OFF, snap the Amount back to the
  // cost type's default so it visibly reflects what will actually apply.
  // (When toggled ON, leave the amount as-is so the admin can edit from
  // wherever it was prefilled.)
  useEffect(() => {
    if (watchedOverride) return
    if (!watchedCostTypeId) return
    const opt = costTypeOptions.find((o) => o.id === watchedCostTypeId)
    if (!opt) return
    setValue("amount", opt.defaultRateCents / 100, { shouldDirty: false })
  }, [watchedOverride, watchedCostTypeId, costTypeOptions, setValue])
  const amountLabel =
    watchedBasis === "percentage" ? "Amount (%)" : "Amount (A$)"
  const amountPlaceholder =
    watchedBasis === "percentage" ? "15" : "50.00"
  const inheritedFrom = costTypeOptions.find(
    (o) => o.id === watchedCostTypeId,
  )?.name

  const submit = handleSubmit(async (values) => {
    const res = await onSubmit(values)
    if (res.ok) return
    const fields = res.fieldErrors ?? {}
    const first = Object.keys(fields).find((k) => fields[k]?.[0]) as
      | keyof FormValues
      | undefined
    if (first) setError(first as never, { message: fields[first]![0] })
    else setError("root", { message: res.rootError ?? "Could not save." })
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
          {mode === "create" ? "New cost category" : "Edit cost category"}
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

        <Field label="Name" error={errors.name?.message}>
          <input
            style={inputStyle}
            autoFocus
            placeholder="e.g. Standard"
            {...register("name")}
          />
        </Field>

        <Field label="Cost type" error={errors.costTypeId?.message}>
          <select style={inputStyle} {...register("costTypeId")}>
            <option value="">Select…</option>
            {costTypeOptions.map((o) => (
              <option key={o.id} value={o.id}>
                {o.name}
              </option>
            ))}
          </select>
        </Field>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
          <Field label="Basis" error={errors.basis?.message}>
            <select style={inputStyle} {...register("basis")}>
              {(
                [
                  "flat",
                  "per_night",
                  "per_person",
                  "per_room",
                  "percentage",
                ] as CostBasis[]
              ).map((b) => (
                <option key={b} value={b}>
                  {BASIS_LABEL[b]}
                </option>
              ))}
            </select>
          </Field>
          <Field
            label={amountLabel}
            hint={
              !watchedOverride
                ? `Will use ${inheritedFrom ?? "the cost type"}'s default rate. Toggle "Is overridden" to set a custom amount.`
                : undefined
            }
            error={errors.amount?.message as string | undefined}
          >
            <input
              type="number"
              inputMode="decimal"
              min={0}
              max={watchedBasis === "percentage" ? 100 : undefined}
              step="0.01"
              disabled={!watchedOverride}
              style={{
                ...inputStyle,
                opacity: watchedOverride ? 1 : 0.5,
                cursor: watchedOverride ? "text" : "not-allowed",
              }}
              placeholder={amountPlaceholder}
              {...register("amount")}
            />
          </Field>
        </div>

        <label style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <input type="checkbox" {...register("isOverridden")} />
          <span style={{ fontSize: 13.5, color: "var(--ink)" }}>
            Is overridden - use a custom amount instead of the cost type
            default rate.
          </span>
        </label>
        <label style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <input type="checkbox" {...register("isActive")} />
          <span style={{ fontSize: 13.5, color: "var(--ink)" }}>
            Active - available for selection on bookings.
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

export function NewCostCategoryModal({
  isOpen,
  onClose,
  onSave,
  costTypeOptions,
}: {
  isOpen: boolean
  onClose: () => void
  onSave: (
    values: CreateCostCategoryInput,
  ) => Promise<ActionResult<CostCategoryRow>>
  costTypeOptions: CostTypeOption[]
}) {
  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <CostCategoryForm
        mode="create"
        initialValues={EMPTY}
        costTypeOptions={costTypeOptions}
        submitLabel="Add cost category"
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

export function EditCostCategoryModal({
  isOpen,
  onClose,
  category,
  onSave,
  costTypeOptions,
}: {
  isOpen: boolean
  onClose: () => void
  category: CostCategoryRow | null
  onSave: (
    id: string,
    values: UpdateCostCategoryInput,
  ) => Promise<ActionResult<CostCategoryRow>>
  costTypeOptions: CostTypeOption[]
}) {
  if (!category) return null
  // When not overridden, the stored amountInt is 0 - show the inherited
  // cost type default in the form so the admin can see what will apply.
  // The field stays disabled until they toggle Is overridden on.
  const initialAmount = category.isOverridden
    ? category.amountInt / 100
    : category.costTypeDefaultRateCents / 100
  const initial: FormValues = {
    name: category.name,
    costTypeId: category.costTypeId,
    basis: category.basis,
    amount: initialAmount,
    isOverridden: category.isOverridden,
    isActive: category.isActive,
  }
  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <CostCategoryForm
        mode="edit"
        initialValues={initial}
        costTypeOptions={costTypeOptions}
        submitLabel="Save changes"
        onCancel={onClose}
        onSubmit={async (values) => {
          const res = await onSave(category.id, values as never)
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
