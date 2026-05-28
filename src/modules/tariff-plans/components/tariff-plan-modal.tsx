"use client"

import { useEffect } from "react"
import { useForm, useWatch } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { Button } from "@/components/ui/primitives"
import type { ActionResult } from "@/lib/result"
import {
  createTariffPlanSchema,
  updateTariffPlanSchema,
  deriveCode,
  type CreateTariffPlanInput,
  type UpdateTariffPlanInput,
} from "../schemas"
import type { Option, TariffPlanRow } from "../types"
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
  code: string
  tariffBeginningPriceId: string
  propertyId: string
  roomTypeId: string
  status: "active" | "inactive"
}

const EMPTY: FormValues = {
  name: "",
  code: "",
  tariffBeginningPriceId: "",
  propertyId: "",
  roomTypeId: "",
  status: "active",
}

function TariffPlanForm({
  mode,
  initialValues,
  tariffOptions,
  propertyOptions,
  roomTypeOptions,
  submitLabel,
  onSubmit,
  onCancel,
}: {
  mode: "create" | "edit"
  initialValues: FormValues
  tariffOptions: Option[]
  propertyOptions: Option[]
  roomTypeOptions: Option[]
  submitLabel: string
  onSubmit: (values: FormValues) => Promise<{
    ok: boolean
    fieldErrors?: Record<string, string[] | undefined>
    rootError?: string
  }>
  onCancel: () => void
}) {
  const schema =
    mode === "create" ? createTariffPlanSchema : updateTariffPlanSchema
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

  // Re-sync defaults when the modal opens for a different row.
  useEffect(() => {
    reset(initialValues)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialValues])

  // Auto-derive code from name until the user touches it.
  const watchedName = useWatch({ control, name: "name" })
  useEffect(() => {
    if (dirtyFields.code) return
    setValue("code", deriveCode(watchedName ?? ""), { shouldDirty: false })
  }, [watchedName, dirtyFields.code, setValue])

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
          {mode === "create" ? "New tariff" : "Edit tariff"}
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
              placeholder="e.g. Cottage Weekday"
              {...register("name")}
            />
          </Field>
          <Field
            label="Code"
            hint="Auto-fills from the name."
            error={errors.code?.message}
          >
            <input
              style={{ ...inputStyle, fontFamily: "var(--font-mono), monospace", letterSpacing: 0.5 }}
              placeholder="e.g. COTTAGEWEEKDAY"
              {...register("code", {
                onChange: (e) => {
                  const v = e.target.value
                  const clean = v.replace(/[^A-Za-z0-9]/g, "").toUpperCase()
                  if (clean !== v) e.target.value = clean
                },
              })}
            />
          </Field>
        </div>

        <Field
          label="Tariff Type"
          error={errors.tariffBeginningPriceId?.message}
        >
          <select style={inputStyle} {...register("tariffBeginningPriceId")}>
            <option value="">Select…</option>
            {tariffOptions.map((o) => (
              <option key={o.id} value={o.id}>
                {o.name}
              </option>
            ))}
          </select>
        </Field>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
          <Field label="Property" error={errors.propertyId?.message}>
            <select style={inputStyle} {...register("propertyId")}>
              <option value="">Select…</option>
              {propertyOptions.map((o) => (
                <option key={o.id} value={o.id}>
                  {o.name}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Room Type" error={errors.roomTypeId?.message}>
            <select style={inputStyle} {...register("roomTypeId")}>
              <option value="">Select…</option>
              {roomTypeOptions.map((o) => (
                <option key={o.id} value={o.id}>
                  {o.name}
                </option>
              ))}
            </select>
          </Field>
        </div>

        <Field label="Status" error={errors.status?.message}>
          <select style={inputStyle} {...register("status")}>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
        </Field>
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

export function NewTariffPlanModal({
  isOpen,
  onClose,
  onSave,
  tariffOptions,
  propertyOptions,
  roomTypeOptions,
}: {
  isOpen: boolean
  onClose: () => void
  onSave: (
    values: CreateTariffPlanInput,
  ) => Promise<ActionResult<TariffPlanRow>>
  tariffOptions: Option[]
  propertyOptions: Option[]
  roomTypeOptions: Option[]
}) {
  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <TariffPlanForm
        mode="create"
        initialValues={EMPTY}
        tariffOptions={tariffOptions}
        propertyOptions={propertyOptions}
        roomTypeOptions={roomTypeOptions}
        submitLabel="Add tariff"
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

export function EditTariffPlanModal({
  isOpen,
  onClose,
  plan,
  onSave,
  tariffOptions,
  propertyOptions,
  roomTypeOptions,
}: {
  isOpen: boolean
  onClose: () => void
  plan: TariffPlanRow | null
  onSave: (
    id: string,
    values: UpdateTariffPlanInput,
  ) => Promise<ActionResult<TariffPlanRow>>
  tariffOptions: Option[]
  propertyOptions: Option[]
  roomTypeOptions: Option[]
}) {
  if (!plan) return null
  const initial: FormValues = {
    name: plan.name,
    code: plan.code,
    tariffBeginningPriceId: plan.tariffBeginningPriceId,
    propertyId: plan.propertyId,
    roomTypeId: plan.roomTypeId,
    status: plan.status,
  }
  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <TariffPlanForm
        mode="edit"
        initialValues={initial}
        tariffOptions={tariffOptions}
        propertyOptions={propertyOptions}
        roomTypeOptions={roomTypeOptions}
        submitLabel="Save changes"
        onCancel={onClose}
        onSubmit={async (values) => {
          const res = await onSave(plan.id, values as never)
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
