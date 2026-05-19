"use client"

import { useEffect } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { Avatar, Button } from "@/components/ui/primitives"
import { updateUserSchema, type UpdateUserInput } from "../schemas"
import type { RoleOption, UserRow } from "../queries"
import type { ActionResult } from "@/lib/result"
import { Modal, Field, inputStyle } from "./modal"
import { labelFor } from "./new-user-modal"

export function EditUserModal({
  isOpen,
  onClose,
  roles,
  user,
  onSave,
}: {
  isOpen: boolean
  onClose: () => void
  roles: RoleOption[]
  user: UserRow | null
  onSave: (
    id: string,
    values: UpdateUserInput,
  ) => Promise<ActionResult<UserRow>>
}) {
  const {
    register,
    handleSubmit,
    reset,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<UpdateUserInput>({
    resolver: zodResolver(updateUserSchema),
  })

  // Re-sync the form whenever the selected user changes (old app behaviour).
  useEffect(() => {
    if (user) {
      reset({
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        phone: user.phone ?? "",
        roleId: user.roleId,
        status: user.status,
      })
    }
  }, [user, reset])

  if (!user) return null

  const close = () => {
    if (isSubmitting) return
    onClose()
  }

  const submit = handleSubmit(async (values) => {
    const res = await onSave(user.id, values)
    if (res.ok) {
      onClose()
      return
    }
    const fields = res.error.fields
    if (fields) {
      for (const [k, msgs] of Object.entries(fields)) {
        if (msgs?.[0]) setError(k as keyof UpdateUserInput, { message: msgs[0] })
      }
    } else {
      setError("root", { message: res.error.message })
    }
  })

  return (
    <Modal isOpen={isOpen} onClose={close}>
      <form onSubmit={submit}>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 14,
            padding: "22px 24px 16px",
          }}
        >
          <Avatar name={`${user.firstName} ${user.lastName}`} size={44} tint="teal" />
          <div>
            <h2
              style={{
                fontFamily: "var(--font-display), serif",
                fontWeight: 300,
                fontSize: 22,
                letterSpacing: "var(--tight)",
                margin: 0,
              }}
            >
              Edit user
            </h2>
            <p style={{ marginTop: 2, fontSize: 12.5, color: "var(--ink-soft)" }}>
              {user.email}
            </p>
          </div>
        </div>

        <div style={{ padding: "4px 24px 16px", display: "flex", flexDirection: "column", gap: 14 }}>
          {errors.root && (
            <div
              style={{
                padding: "10px 12px",
                borderRadius: "var(--r-2)",
                background: "var(--bad-bg)",
                color: "var(--bad-fg)",
                fontSize: 13,
              }}
            >
              {errors.root.message}
            </div>
          )}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <Field label="First name" error={errors.firstName?.message}>
              <input style={inputStyle} {...register("firstName")} />
            </Field>
            <Field label="Last name" error={errors.lastName?.message}>
              <input style={inputStyle} {...register("lastName")} />
            </Field>
          </div>
          <Field label="Email" error={errors.email?.message}>
            <input type="email" style={inputStyle} {...register("email")} />
          </Field>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <Field label="Phone (optional)" error={errors.phone?.message}>
              <input style={inputStyle} {...register("phone")} />
            </Field>
            <Field label="Role" error={errors.roleId?.message}>
              <select style={inputStyle} {...register("roleId")}>
                {roles.map((r) => (
                  <option key={r.id} value={r.id}>
                    {labelFor(r.name)}
                  </option>
                ))}
              </select>
            </Field>
          </div>
          <Field label="Status" error={errors.status?.message}>
            <select style={inputStyle} {...register("status")}>
              <option value="active">Active</option>
              <option value="locked">Locked</option>
              <option value="disabled">Disabled</option>
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
