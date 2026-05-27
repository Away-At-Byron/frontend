"use client"

import { useEffect } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { Button } from "@/components/ui/primitives"
import type { ActionResult } from "@/lib/result"
import {
  createCostTypeSchema,
  updateCostTypeSchema,
  type CreateCostTypeInput,
  type UpdateCostTypeInput,
} from "../schemas"
import type { CostTypeRow } from "../types"
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
  defaultRate: number | string
  canOverridden: boolean
  isDeduction: boolean
  isAddition: boolean
}

function CheckRow({
  label,
  hint,
  ...rest
}: { label: string; hint?: string } & React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <label
      style={{
        display: "flex",
        alignItems: "flex-start",
        gap: 10,
        padding: "4px 0",
      }}
    >
      <input type="checkbox" style={{ marginTop: 2 }} {...rest} />
      <span style={{ display: "flex", flexDirection: "column", gap: 2 }}>
        <span style={{ fontSize: 13.5, color: "var(--ink)" }}>{label}</span>
        {hint && (
          <span style={{ fontSize: 12, color: "var(--ink-soft)" }}>{hint}</span>
        )}
      </span>
    </label>
  )
}

export function NewCostTypeModal({
  isOpen,
  onClose,
  onSave,
}: {
  isOpen: boolean
  onClose: () => void
  onSave: (
    values: CreateCostTypeInput,
  ) => Promise<ActionResult<CostTypeRow>>
}) {
  const {
    register,
    handleSubmit,
    reset,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(createCostTypeSchema) as never,
    defaultValues: {
      name: "",
      defaultRate: "",
      canOverridden: true,
      isDeduction: false,
      isAddition: true,
    },
  })

  const close = () => {
    if (isSubmitting) return
    reset()
    onClose()
  }

  const submit = handleSubmit(async (values) => {
    const res = await onSave(values as never)
    if (res.ok) {
      reset()
      onClose()
      return
    }
    const fields = res.error.fields
    const first = Object.keys(fields ?? {}).find((k) => fields![k]?.[0]) as
      | keyof FormValues
      | undefined
    if (first) setError(first as never, { message: fields![first]![0] })
    else setError("root", { message: res.error.message })
  })

  return (
    <Modal isOpen={isOpen} onClose={close}>
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
            New cost type
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
              placeholder="e.g. OTA Commission"
              {...register("name")}
            />
          </Field>
          <Field
            label="Default rate (A$)"
            hint="The amount that pre-fills when this cost is added. 0 means no default."
            error={errors.defaultRate?.message as string | undefined}
          >
            <input
              type="number"
              inputMode="decimal"
              min={0}
              step="0.01"
              style={inputStyle}
              placeholder="0.00"
              {...register("defaultRate")}
            />
          </Field>
          <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
            <CheckRow
              label="Can be overridden"
              hint="Staff can change the rate when applying this cost to a booking."
              {...register("canOverridden")}
            />
            <CheckRow
              label="Addition"
              hint="Adds to the booking total."
              {...register("isAddition")}
            />
            <CheckRow
              label="Deduction"
              hint="Reduces the booking total or payout."
              {...register("isDeduction")}
            />
          </div>
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
          <Button variant="ghost" onClick={close} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button type="submit" variant="primary" disabled={isSubmitting}>
            {isSubmitting ? "Saving..." : "Add cost type"}
          </Button>
        </div>
      </form>
    </Modal>
  )
}

export function EditCostTypeModal({
  isOpen,
  onClose,
  costType,
  onSave,
}: {
  isOpen: boolean
  onClose: () => void
  costType: CostTypeRow | null
  onSave: (
    id: string,
    values: UpdateCostTypeInput,
  ) => Promise<ActionResult<CostTypeRow>>
}) {
  const {
    register,
    handleSubmit,
    reset,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(updateCostTypeSchema) as never,
  })

  useEffect(() => {
    if (costType) {
      reset({
        name: costType.name,
        defaultRate: costType.defaultRateCents / 100,
        canOverridden: costType.canOverridden,
        isDeduction: costType.isDeduction,
        isAddition: costType.isAddition,
      })
    }
  }, [costType, reset])

  if (!costType) return null

  const close = () => {
    if (isSubmitting) return
    onClose()
  }

  const submit = handleSubmit(async (values) => {
    const res = await onSave(costType.id, values as never)
    if (res.ok) {
      onClose()
      return
    }
    const fields = res.error.fields
    const first = Object.keys(fields ?? {}).find((k) => fields![k]?.[0]) as
      | keyof FormValues
      | undefined
    if (first) setError(first as never, { message: fields![first]![0] })
    else setError("root", { message: res.error.message })
  })

  return (
    <Modal isOpen={isOpen} onClose={close}>
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
            Edit cost type
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
            <input style={inputStyle} autoFocus {...register("name")} />
          </Field>
          <Field
            label="Default rate (A$)"
            hint="0 means no default."
            error={errors.defaultRate?.message as string | undefined}
          >
            <input
              type="number"
              inputMode="decimal"
              min={0}
              step="0.01"
              style={inputStyle}
              {...register("defaultRate")}
            />
          </Field>
          <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
            <CheckRow
              label="Can be overridden"
              hint="Staff can change the rate when applying this cost to a booking."
              {...register("canOverridden")}
            />
            <CheckRow
              label="Addition"
              hint="Adds to the booking total."
              {...register("isAddition")}
            />
            <CheckRow
              label="Deduction"
              hint="Reduces the booking total or payout."
              {...register("isDeduction")}
            />
          </div>
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
          <Button variant="ghost" onClick={close} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button type="submit" variant="primary" disabled={isSubmitting}>
            {isSubmitting ? "Saving..." : "Save changes"}
          </Button>
        </div>
      </form>
    </Modal>
  )
}
