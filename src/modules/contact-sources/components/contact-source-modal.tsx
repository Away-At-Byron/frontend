"use client"

import { useEffect } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { Button } from "@/components/ui/primitives"
import type { ActionResult } from "@/lib/result"
import {
  createContactSourceSchema,
  updateContactSourceSchema,
  type CreateContactSourceInput,
  type UpdateContactSourceInput,
} from "../schemas"
import type { ContactSourceRow } from "../types"
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

export function NewContactSourceModal({
  isOpen,
  onClose,
  onSave,
}: {
  isOpen: boolean
  onClose: () => void
  onSave: (
    values: CreateContactSourceInput,
  ) => Promise<ActionResult<ContactSourceRow>>
}) {
  const {
    register,
    handleSubmit,
    reset,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<CreateContactSourceInput>({
    resolver: zodResolver(createContactSourceSchema),
    defaultValues: { name: "" },
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
            New contact source
          </h2>
          <p style={{ marginTop: 6, fontSize: 13, color: "var(--ink-soft)" }}>
            Add a way a contact may have first reached the business, like
            Referral or Travel Agent.
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
          <Field label="Name" error={errors.name?.message}>
            <input
              style={inputStyle}
              autoFocus
              placeholder="e.g. Referral"
              {...register("name")}
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
            {isSubmitting ? "Saving..." : "Add contact source"}
          </Button>
        </div>
      </form>
    </Modal>
  )
}

export function EditContactSourceModal({
  isOpen,
  onClose,
  contactSource,
  onSave,
}: {
  isOpen: boolean
  onClose: () => void
  contactSource: ContactSourceRow | null
  onSave: (
    id: string,
    values: UpdateContactSourceInput,
  ) => Promise<ActionResult<ContactSourceRow>>
}) {
  const {
    register,
    handleSubmit,
    reset,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<UpdateContactSourceInput>({
    resolver: zodResolver(updateContactSourceSchema),
  })

  // Re-sync the form whenever the selected source changes.
  useEffect(() => {
    if (contactSource) reset({ name: contactSource.name })
  }, [contactSource, reset])

  if (!contactSource) return null

  const close = () => {
    if (isSubmitting) return
    onClose()
  }

  const submit = handleSubmit(async (values) => {
    const res = await onSave(contactSource.id, values)
    if (res.ok) {
      onClose()
      return
    }
    const fields = res.error.fields
    if (fields?.name?.[0]) {
      setError("name", { message: fields.name[0] })
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
            Edit contact source
          </h2>
          <p style={{ marginTop: 6, fontSize: 13, color: "var(--ink-soft)" }}>
            {contactSource.contactCount === 0
              ? "No contacts use this source yet."
              : `Used by ${contactSource.contactCount} contact${
                  contactSource.contactCount === 1 ? "" : "s"
                }. Renaming updates them all.`}
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
          <Field label="Name" error={errors.name?.message}>
            <input style={inputStyle} autoFocus {...register("name")} />
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
