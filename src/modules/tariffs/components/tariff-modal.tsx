"use client"

import { useEffect } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { Button } from "@/components/ui/primitives"
import type { ActionResult } from "@/lib/result"
import {
  TARIFF_TRAFFIC_LABEL,
  createTariffSchema,
  tariffTrafficValues,
  updateTariffSchema,
  type CreateTariffInput,
  type UpdateTariffInput,
} from "../schemas"
import type { TariffRow } from "../types"
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

export function NewTariffModal({
  isOpen,
  onClose,
  onSave,
}: {
  isOpen: boolean
  onClose: () => void
  onSave: (values: CreateTariffInput) => Promise<ActionResult<TariffRow>>
}) {
  const {
    register,
    handleSubmit,
    reset,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<CreateTariffInput>({
    resolver: zodResolver(createTariffSchema),
    defaultValues: { name: "", traffic: "direct" },
  })

  const close = () => {
    if (isSubmitting) return
    reset()
    onClose()
  }

  const submit = handleSubmit(async (values) => {
    const res = await onSave(values)
    if (res.ok) {
      reset()
      onClose()
      return
    }
    const fields = res.error.fields
    if (fields?.name?.[0]) setError("name", { message: fields.name[0] })
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
            New tariff
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
              placeholder="e.g. Weekend Escape"
              {...register("name")}
            />
          </Field>
          <Field label="Traffic" error={errors.traffic?.message}>
            <select style={inputStyle} {...register("traffic")}>
              {tariffTrafficValues.map((t) => (
                <option key={t} value={t}>
                  {TARIFF_TRAFFIC_LABEL[t]}
                </option>
              ))}
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
          <Button variant="ghost" onClick={close} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button type="submit" variant="primary" disabled={isSubmitting}>
            {isSubmitting ? "Saving..." : "Add tariff"}
          </Button>
        </div>
      </form>
    </Modal>
  )
}

export function EditTariffModal({
  isOpen,
  onClose,
  tariff,
  onSave,
}: {
  isOpen: boolean
  onClose: () => void
  tariff: TariffRow | null
  onSave: (
    id: string,
    values: UpdateTariffInput,
  ) => Promise<ActionResult<TariffRow>>
}) {
  const {
    register,
    handleSubmit,
    reset,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<UpdateTariffInput>({
    resolver: zodResolver(updateTariffSchema),
  })

  useEffect(() => {
    if (tariff) reset({ name: tariff.name, traffic: tariff.traffic })
  }, [tariff, reset])

  if (!tariff) return null

  const close = () => {
    if (isSubmitting) return
    onClose()
  }

  const submit = handleSubmit(async (values) => {
    const res = await onSave(tariff.id, values)
    if (res.ok) {
      onClose()
      return
    }
    const fields = res.error.fields
    if (fields?.name?.[0]) setError("name", { message: fields.name[0] })
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
            Edit tariff
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
          <Field label="Traffic" error={errors.traffic?.message}>
            <select style={inputStyle} {...register("traffic")}>
              {tariffTrafficValues.map((t) => (
                <option key={t} value={t}>
                  {TARIFF_TRAFFIC_LABEL[t]}
                </option>
              ))}
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
