"use client"

import { useEffect } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { Button } from "@/components/ui/primitives"
import type { ActionResult } from "@/lib/result"
import {
  createRoomRequestSchema,
  updateRoomRequestSchema,
  type CreateRoomRequestInput,
  type UpdateRoomRequestInput,
} from "../schemas"
import type { RoomRequestRow } from "../types"
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
}

export function NewRoomRequestModal({
  isOpen,
  onClose,
  onSave,
}: {
  isOpen: boolean
  onClose: () => void
  onSave: (
    values: CreateRoomRequestInput,
  ) => Promise<ActionResult<RoomRequestRow>>
}) {
  const {
    register,
    handleSubmit,
    reset,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(createRoomRequestSchema) as never,
    defaultValues: { name: "", code: "" },
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
    if (fields?.name?.[0]) {
      setError("name", { message: fields.name[0] })
    } else if (fields?.code?.[0]) {
      setError("code", { message: fields.code[0] })
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
            New room request
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
          <Field label="Requirement" error={errors.name?.message}>
            <input
              style={inputStyle}
              autoFocus
              placeholder="e.g. Late Arrival"
              {...register("name")}
            />
          </Field>
          <Field
            label="Code"
            hint="Optional shortcode. Uppercase letters and digits only."
            error={errors.code?.message}
          >
            <input
              style={{
                ...inputStyle,
                fontFamily: "var(--font-mono), monospace",
                letterSpacing: 0.5,
              }}
              placeholder="e.g. LATE"
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
            {isSubmitting ? "Saving..." : "Add room request"}
          </Button>
        </div>
      </form>
    </Modal>
  )
}

export function EditRoomRequestModal({
  isOpen,
  onClose,
  request,
  onSave,
}: {
  isOpen: boolean
  onClose: () => void
  request: RoomRequestRow | null
  onSave: (
    id: string,
    values: UpdateRoomRequestInput,
  ) => Promise<ActionResult<RoomRequestRow>>
}) {
  const {
    register,
    handleSubmit,
    reset,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(updateRoomRequestSchema) as never,
  })

  useEffect(() => {
    if (request) reset({ name: request.name, code: request.code ?? "" })
  }, [request, reset])

  if (!request) return null

  const close = () => {
    if (isSubmitting) return
    onClose()
  }

  const submit = handleSubmit(async (values) => {
    const res = await onSave(request.id, values as never)
    if (res.ok) {
      onClose()
      return
    }
    const fields = res.error.fields
    if (fields?.name?.[0]) {
      setError("name", { message: fields.name[0] })
    } else if (fields?.code?.[0]) {
      setError("code", { message: fields.code[0] })
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
            Edit room request
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
          <Field label="Requirement" error={errors.name?.message}>
            <input style={inputStyle} autoFocus {...register("name")} />
          </Field>
          <Field
            label="Code"
            hint="Optional shortcode. Uppercase letters and digits only. Leave blank to clear."
            error={errors.code?.message}
          >
            <input
              style={{
                ...inputStyle,
                fontFamily: "var(--font-mono), monospace",
                letterSpacing: 0.5,
              }}
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
