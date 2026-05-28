"use client"

import { useEffect } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { Button } from "@/components/ui/primitives"
import type { ActionResult } from "@/lib/result"
import {
  createTariffPeriodSchema,
  updateTariffPeriodSchema,
  type CreateTariffPeriodInput,
  type UpdateTariffPeriodInput,
} from "../schemas"
import type { TariffPeriodRow } from "../types"
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
  code: string
  description: string
  fromDate: string
  toDate: string
}

const EMPTY: FormValues = {
  code: "",
  description: "",
  fromDate: "",
  toDate: "",
}

export function NewTariffPeriodModal({
  isOpen,
  onClose,
  onSave,
}: {
  isOpen: boolean
  onClose: () => void
  onSave: (
    values: CreateTariffPeriodInput,
  ) => Promise<ActionResult<TariffPeriodRow>>
}) {
  const {
    register,
    handleSubmit,
    reset,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(createTariffPeriodSchema) as never,
    defaultValues: EMPTY,
  })

  const close = () => {
    if (isSubmitting) return
    reset(EMPTY)
    onClose()
  }

  const submit = handleSubmit(async (values) => {
    const res = await onSave(values as never)
    if (res.ok) {
      reset(EMPTY)
      onClose()
      return
    }
    const fields = res.error.fields
    const first = (["code", "description", "fromDate", "toDate"] as const).find(
      (k) => fields?.[k]?.[0],
    )
    if (first) {
      setError(first, { message: fields![first]![0] })
    } else {
      setError("root", { message: res.error.message })
    }
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
            New tariff period
          </h2>
          <p style={{ marginTop: 6, fontSize: 13, color: "var(--ink-soft)" }}>
            Add a labelled date range like Peak 2026 or Winter Off-Peak.
          </p>
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
          <Field label="Code" error={errors.code?.message}>
            <input
              style={inputStyle}
              autoFocus
              placeholder="e.g. PEAK26"
              {...register("code")}
            />
          </Field>
          <Field label="Description" error={errors.description?.message}>
            <input
              style={inputStyle}
              placeholder="e.g. Peak summer rates 2026"
              {...register("description")}
            />
          </Field>
          <div
            style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}
          >
            <Field label="From" error={errors.fromDate?.message}>
              <input
                type="date"
                style={inputStyle}
                {...register("fromDate")}
              />
            </Field>
            <Field label="To" error={errors.toDate?.message}>
              <input type="date" style={inputStyle} {...register("toDate")} />
            </Field>
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
            {isSubmitting ? "Saving..." : "Add tariff period"}
          </Button>
        </div>
      </form>
    </Modal>
  )
}

export function EditTariffPeriodModal({
  isOpen,
  onClose,
  period,
  onSave,
}: {
  isOpen: boolean
  onClose: () => void
  period: TariffPeriodRow | null
  onSave: (
    id: string,
    values: UpdateTariffPeriodInput,
  ) => Promise<ActionResult<TariffPeriodRow>>
}) {
  const {
    register,
    handleSubmit,
    reset,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(updateTariffPeriodSchema) as never,
  })

  useEffect(() => {
    if (period) {
      reset({
        code: period.code,
        description: period.description ?? "",
        fromDate: period.fromDate,
        toDate: period.toDate,
      })
    }
  }, [period, reset])

  if (!period) return null

  const close = () => {
    if (isSubmitting) return
    onClose()
  }

  const submit = handleSubmit(async (values) => {
    const res = await onSave(period.id, values as never)
    if (res.ok) {
      onClose()
      return
    }
    const fields = res.error.fields
    const first = (["code", "description", "fromDate", "toDate"] as const).find(
      (k) => fields?.[k]?.[0],
    )
    if (first) {
      setError(first, { message: fields![first]![0] })
    } else {
      setError("root", { message: res.error.message })
    }
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
            Edit tariff period
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
          <Field label="Code" error={errors.code?.message}>
            <input style={inputStyle} autoFocus {...register("code")} />
          </Field>
          <Field label="Description" error={errors.description?.message}>
            <input style={inputStyle} {...register("description")} />
          </Field>
          <div
            style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}
          >
            <Field label="From" error={errors.fromDate?.message}>
              <input
                type="date"
                style={inputStyle}
                {...register("fromDate")}
              />
            </Field>
            <Field label="To" error={errors.toDate?.message}>
              <input type="date" style={inputStyle} {...register("toDate")} />
            </Field>
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
