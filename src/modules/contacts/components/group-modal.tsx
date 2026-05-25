"use client"

import { useEffect } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { Button } from "@/components/ui/primitives"
import { Modal, Field, inputStyle } from "@/modules/users/components/modal"
import type { ActionResult } from "@/lib/result"
import {
  createGroupSchema,
  updateGroupSchema,
  type CreateGroupInput,
  type UpdateGroupInput,
} from "../schemas"
import type { GroupRow } from "../types"

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

const textareaStyle: React.CSSProperties = {
  ...inputStyle,
  height: 80,
  padding: "10px 12px",
  resize: "vertical",
}

function Body({
  register,
  errors,
  rootMessage,
}: {
  // RHF's register/errors are loosely typed at this boundary; the form
  // useForm() above narrows them per modal.
  register: ReturnType<typeof useForm<CreateGroupInput>>["register"]
  errors: ReturnType<typeof useForm<CreateGroupInput>>["formState"]["errors"]
  rootMessage?: string
}) {
  return (
    <div
      style={{
        padding: "16px 24px",
        display: "flex",
        flexDirection: "column",
        gap: 14,
      }}
    >
      <ErrorBanner message={rootMessage} />
      <Field label="Group name" error={errors.groupName?.message}>
        <input
          style={inputStyle}
          autoFocus
          placeholder="e.g. The Smith family"
          {...register("groupName")}
        />
      </Field>
      <Field label="Relationships" error={errors.relationships?.message}>
        <textarea
          style={textareaStyle}
          placeholder="How are these guests related?"
          {...register("relationships")}
        />
      </Field>
      <div
        style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}
      >
        <Field label="Company" error={errors.companyName?.message}>
          <input style={inputStyle} {...register("companyName")} />
        </Field>
        <Field label="Tax / ABN" error={errors.taxAbn?.message}>
          <input style={inputStyle} {...register("taxAbn")} />
        </Field>
        <Field
          label="Corporate account"
          error={errors.corporateAccountId?.message}
        >
          <input style={inputStyle} {...register("corporateAccountId")} />
        </Field>
        <Field label="Travel agent" error={errors.travelAgentId?.message}>
          <input style={inputStyle} {...register("travelAgentId")} />
        </Field>
      </div>
      <Field
        label="Billing preference"
        error={errors.billingPreference?.message}
      >
        <input
          style={inputStyle}
          placeholder="e.g. Master account, split per room"
          {...register("billingPreference")}
        />
      </Field>
      <label
        style={{
          display: "flex",
          alignItems: "center",
          gap: 8,
          fontSize: 13.5,
          color: "var(--ink)",
        }}
      >
        <input type="checkbox" {...register("groupBookerFlag")} />
        Group booker can book on behalf of members
      </label>
    </div>
  )
}

export function NewGroupModal({
  isOpen,
  onClose,
  onSave,
}: {
  isOpen: boolean
  onClose: () => void
  onSave: (values: CreateGroupInput) => Promise<ActionResult<GroupRow>>
}) {
  const form = useForm<CreateGroupInput>({
    resolver: zodResolver(createGroupSchema),
    defaultValues: {
      groupName: "",
      relationships: "",
      companyName: "",
      corporateAccountId: "",
      travelAgentId: "",
      groupBookerFlag: false,
      billingPreference: "",
      taxAbn: "",
    },
  })
  const {
    register,
    handleSubmit,
    reset,
    setError,
    formState: { errors, isSubmitting },
  } = form

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
    if (fields?.groupName?.[0]) {
      setError("groupName", { message: fields.groupName[0] })
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
            New group
          </h2>
          <p style={{ marginTop: 6, fontSize: 13, color: "var(--ink-soft)" }}>
            A group ties a primary contact to the related guests sharing a
            booking.
          </p>
        </div>

        <Body
          register={register}
          errors={errors}
          rootMessage={errors.root?.message}
        />

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
            {isSubmitting ? "Saving..." : "Add group"}
          </Button>
        </div>
      </form>
    </Modal>
  )
}

export function EditGroupModal({
  isOpen,
  onClose,
  group,
  onSave,
}: {
  isOpen: boolean
  onClose: () => void
  group: GroupRow | null
  onSave: (
    id: string,
    values: UpdateGroupInput,
  ) => Promise<ActionResult<GroupRow>>
}) {
  const form = useForm<UpdateGroupInput>({
    resolver: zodResolver(updateGroupSchema),
  })
  const {
    register,
    handleSubmit,
    reset,
    setError,
    formState: { errors, isSubmitting },
  } = form

  useEffect(() => {
    if (!group) return
    reset({
      groupName: group.groupName,
      relationships: group.relationships ?? "",
      companyName: group.companyName ?? "",
      corporateAccountId: group.corporateAccountId ?? "",
      travelAgentId: group.travelAgentId ?? "",
      groupBookerFlag: group.groupBookerFlag,
      billingPreference: group.billingPreference ?? "",
      taxAbn: group.taxAbn ?? "",
    })
  }, [group, reset])

  if (!group) return null

  const close = () => {
    if (isSubmitting) return
    onClose()
  }

  const submit = handleSubmit(async (values) => {
    const res = await onSave(group.id, values)
    if (res.ok) {
      onClose()
      return
    }
    const fields = res.error.fields
    if (fields?.groupName?.[0]) {
      setError("groupName", { message: fields.groupName[0] })
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
            Edit group
          </h2>
          <p style={{ marginTop: 6, fontSize: 13, color: "var(--ink-soft)" }}>
            {group.memberCount === 0
              ? "No members linked to this group yet."
              : `${group.memberCount} member${
                  group.memberCount === 1 ? "" : "s"
                } linked. Changes apply to the group record only.`}
          </p>
        </div>

        <Body
          register={register as ReturnType<typeof useForm<CreateGroupInput>>["register"]}
          errors={errors}
          rootMessage={errors.root?.message}
        />

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
