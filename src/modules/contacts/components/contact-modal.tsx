"use client"

import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { Button } from "@/components/ui/primitives"
import { Modal } from "@/modules/users/components/modal"
import {
  createContactSchema,
  updateContactSchema,
  type CreateContactInput,
  type UpdateContactInput,
} from "../schemas"
import type { ContactRow, PropertyOption } from "../types"
import type { ActionResult } from "@/lib/result"
import { ContactFormFields } from "./contact-form"

const defaults: CreateContactInput = {
  contactType: "guest",
  firstName: "",
  lastName: "",
  email: "",
  phone: "",
  birthday: "",
  communicationPreference: "email",
  marketingOptIn: false,
  returningGuest: false,
  isVip: false,
  portalEnabled: false,
  groupName: "",
  addressStreet: "",
  addressSuburb: "",
  addressCity: "",
  addressPostcode: "",
  addressCountry: "AU",
  notes: "",
  propertyId: "",
}

export function NewContactModal({
  isOpen,
  onClose,
  properties,
  showProperty,
  onSave,
}: {
  isOpen: boolean
  onClose: () => void
  properties: PropertyOption[]
  showProperty: boolean
  onSave: (values: CreateContactInput) => Promise<ActionResult<ContactRow>>
}) {
  const {
    register,
    handleSubmit,
    reset,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<CreateContactInput>({
    resolver: zodResolver(createContactSchema),
    defaultValues: defaults,
  })

  const close = () => {
    if (isSubmitting) return
    reset(defaults)
    onClose()
  }

  const submit = handleSubmit(async (values) => {
    const res = await onSave(values)
    if (res.ok) {
      reset(defaults)
      onClose()
      return
    }
    const fields = res.error.fields
    if (fields) {
      for (const [k, msgs] of Object.entries(fields)) {
        if (msgs?.[0]) setError(k as keyof CreateContactInput, { message: msgs[0] })
      }
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
            New contact
          </h2>
        </div>
        <div style={{ padding: "16px 24px", display: "flex", flexDirection: "column", gap: 14, maxHeight: "60vh", overflowY: "auto" }}>
          {errors.root && (
            <div style={{ padding: "10px 12px", borderRadius: "var(--r-2)", background: "var(--bad-bg)", color: "var(--bad-fg)", fontSize: 13 }}>
              {errors.root.message}
            </div>
          )}
          <ContactFormFields
            register={register}
            errors={errors}
            properties={properties}
            showProperty={showProperty}
          />
        </div>
        <div style={{ padding: "14px 24px 22px", display: "flex", justifyContent: "flex-end", gap: 10, borderTop: "1px solid var(--line-soft)" }}>
          <Button variant="ghost" type="button" onClick={close} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button variant="primary" type="submit" disabled={isSubmitting}>
            {isSubmitting ? "Saving…" : "Save contact"}
          </Button>
        </div>
      </form>
    </Modal>
  )
}

export function EditContactModal({
  isOpen,
  onClose,
  contact,
  properties,
  showProperty,
  onSave,
}: {
  isOpen: boolean
  onClose: () => void
  contact: ContactRow | null
  properties: PropertyOption[]
  showProperty: boolean
  onSave: (id: string, values: UpdateContactInput) => Promise<ActionResult<ContactRow>>
}) {
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<UpdateContactInput>({
    resolver: zodResolver(updateContactSchema),
    values: contact
      ? {
          contactType: contact.contactType,
          firstName: contact.firstName,
          lastName: contact.lastName,
          email: contact.email ?? "",
          phone: contact.phone ?? "",
          birthday: "",
          communicationPreference: contact.communicationPreference,
          marketingOptIn: contact.marketingOptIn,
          returningGuest: contact.returningGuest,
          isVip: contact.isVip,
          portalEnabled: contact.portalEnabled,
          groupName: contact.groupName ?? "",
          addressStreet: contact.addressStreet ?? "",
          addressSuburb: contact.addressSuburb ?? "",
          addressCity: contact.addressCity ?? "",
          addressPostcode: contact.addressPostcode ?? "",
          addressCountry: contact.addressCountry ?? "AU",
          notes: contact.notes ?? "",
        }
      : undefined,
  })

  const close = () => {
    if (isSubmitting) return
    onClose()
  }

  const submit = handleSubmit(async (values) => {
    if (!contact) return
    const res = await onSave(contact.id, values)
    if (res.ok) {
      onClose()
      return
    }
    const fields = res.error.fields
    if (fields) {
      for (const [k, msgs] of Object.entries(fields)) {
        if (msgs?.[0]) setError(k as keyof UpdateContactInput, { message: msgs[0] })
      }
    } else {
      setError("root", { message: res.error.message })
    }
  })

  if (!contact) return null

  return (
    <Modal isOpen={isOpen} onClose={close}>
      <form onSubmit={submit}>
        <div style={{ padding: "22px 24px 6px" }}>
          <h2 style={{ fontFamily: "var(--font-display), serif", fontWeight: 300, fontSize: 24, margin: 0 }}>
            Edit {contact.firstName} {contact.lastName}
          </h2>
          <p style={{ marginTop: 6, fontSize: 13, color: "var(--ink-soft)" }}>{contact.clientNumber}</p>
        </div>
        <div style={{ padding: "16px 24px", display: "flex", flexDirection: "column", gap: 14, maxHeight: "60vh", overflowY: "auto" }}>
          {errors.root && (
            <div style={{ padding: "10px 12px", borderRadius: "var(--r-2)", background: "var(--bad-bg)", color: "var(--bad-fg)", fontSize: 13 }}>
              {errors.root.message}
            </div>
          )}
          <ContactFormFields
            register={register}
            errors={errors}
            properties={properties}
            showProperty={showProperty}
          />
        </div>
        <div style={{ padding: "14px 24px 22px", display: "flex", justifyContent: "flex-end", gap: 10, borderTop: "1px solid var(--line-soft)" }}>
          <Button variant="ghost" type="button" onClick={close} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button variant="primary" type="submit" disabled={isSubmitting}>
            {isSubmitting ? "Saving…" : "Save changes"}
          </Button>
        </div>
      </form>
    </Modal>
  )
}
