"use client"

import { useEffect } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { Button } from "@/components/ui/primitives"
import type { ActionResult } from "@/lib/result"
import {
  createRoomTypeSchema,
  updateRoomTypeSchema,
  type CreateRoomTypeInput,
  type UpdateRoomTypeInput,
} from "../schemas"
import type { RoomTypeRow } from "../types"
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

export function NewRoomTypeModal({
  isOpen,
  onClose,
  onSave,
}: {
  isOpen: boolean
  onClose: () => void
  onSave: (
    values: CreateRoomTypeInput,
  ) => Promise<ActionResult<RoomTypeRow>>
}) {
  const {
    register,
    handleSubmit,
    reset,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<CreateRoomTypeInput>({
    resolver: zodResolver(createRoomTypeSchema),
    defaultValues: { name: "", defaultMaxOccupancy: null },
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
    if (fields?.name?.[0]) {
      setError("name", { message: fields.name[0] })
    } else if (fields?.defaultMaxOccupancy?.[0]) {
      setError("defaultMaxOccupancy", { message: fields.defaultMaxOccupancy[0] })
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
            New room type
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
              placeholder="e.g. Garden Suite"
              {...register("name")}
            />
          </Field>
          <Field
            label="Default max occupancy"
            hint="Optional. Pre-fills room capacity on the booking form."
            error={errors.defaultMaxOccupancy?.message}
          >
            <input
              type="number"
              inputMode="numeric"
              min={1}
              max={32}
              style={inputStyle}
              placeholder="Leave blank if no default"
              {...register("defaultMaxOccupancy")}
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
            {isSubmitting ? "Saving..." : "Add room type"}
          </Button>
        </div>
      </form>
    </Modal>
  )
}

export function EditRoomTypeModal({
  isOpen,
  onClose,
  roomType,
  onSave,
}: {
  isOpen: boolean
  onClose: () => void
  roomType: RoomTypeRow | null
  onSave: (
    id: string,
    values: UpdateRoomTypeInput,
  ) => Promise<ActionResult<RoomTypeRow>>
}) {
  const {
    register,
    handleSubmit,
    reset,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<UpdateRoomTypeInput>({
    resolver: zodResolver(updateRoomTypeSchema),
  })

  useEffect(() => {
    if (roomType) {
      reset({
        name: roomType.name,
        defaultMaxOccupancy: roomType.defaultMaxOccupancy,
      })
    }
  }, [roomType, reset])

  if (!roomType) return null

  const close = () => {
    if (isSubmitting) return
    onClose()
  }

  const submit = handleSubmit(async (values) => {
    const res = await onSave(roomType.id, values)
    if (res.ok) {
      onClose()
      return
    }
    const fields = res.error.fields
    if (fields?.name?.[0]) {
      setError("name", { message: fields.name[0] })
    } else if (fields?.defaultMaxOccupancy?.[0]) {
      setError("defaultMaxOccupancy", { message: fields.defaultMaxOccupancy[0] })
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
            Edit room type
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
            label="Default max occupancy"
            hint="Optional. Pre-fills room capacity on the booking form."
            error={errors.defaultMaxOccupancy?.message}
          >
            <input
              type="number"
              inputMode="numeric"
              min={1}
              max={32}
              style={inputStyle}
              placeholder="Leave blank if no default"
              {...register("defaultMaxOccupancy")}
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
