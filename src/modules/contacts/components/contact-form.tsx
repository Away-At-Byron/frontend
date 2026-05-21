"use client"

import type { ReactNode } from "react"
import type { UseFormRegister, FieldErrors } from "react-hook-form"
import { Field, inputStyle } from "@/modules/users/components/modal"
import type { CreateContactInput } from "../schemas"
import type { PropertyOption } from "../types"

function TwoCol({ children }: { children: ReactNode }) {
  return (
    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>{children}</div>
  )
}

export function ContactFormFields({
  register,
  errors,
  properties,
  showProperty,
}: {
  register: UseFormRegister<CreateContactInput>
  errors: FieldErrors<CreateContactInput>
  properties: PropertyOption[]
  showProperty: boolean
}) {
  return (
    <>
      {showProperty && (
        <Field label="Property" error={errors.propertyId?.message}>
          <select
            {...register("propertyId")}
            style={{ ...inputStyle, width: "100%" }}
          >
            <option value="">Select property</option>
            {properties.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
        </Field>
      )}

      <Field label="Contact type" error={errors.contactType?.message}>
        <select {...register("contactType")} style={{ ...inputStyle, width: "100%" }}>
          <option value="guest">Guest</option>
          <option value="housekeeper">Housekeeper</option>
          <option value="contractor">Contractor</option>
        </select>
      </Field>

      <TwoCol>
        <Field label="First name" error={errors.firstName?.message}>
          <input {...register("firstName")} style={inputStyle} autoComplete="given-name" />
        </Field>
        <Field label="Last name" error={errors.lastName?.message}>
          <input {...register("lastName")} style={inputStyle} autoComplete="family-name" />
        </Field>
      </TwoCol>

      <Field label="Email" error={errors.email?.message}>
        <input {...register("email")} type="email" style={inputStyle} autoComplete="email" />
      </Field>

      <Field label="Phone" error={errors.phone?.message}>
        <input {...register("phone")} type="tel" style={inputStyle} autoComplete="tel" />
      </Field>

      <Field label="Birthday" error={errors.birthday?.message}>
        <input {...register("birthday")} type="date" style={inputStyle} />
      </Field>

      <Field label="Communication preference" error={errors.communicationPreference?.message}>
        <select
          {...register("communicationPreference")}
          style={{ ...inputStyle, width: "100%" }}
        >
          <option value="email">Email</option>
          <option value="sms">SMS</option>
        </select>
      </Field>

      <label style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13.5 }}>
        <input type="checkbox" {...register("marketingOptIn")} />
        Marketing opt in
      </label>

      <label style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13.5 }}>
        <input type="checkbox" {...register("returningGuest")} />
        Returning guest
      </label>

      <label style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13.5 }}>
        <input type="checkbox" {...register("isVip")} />
        VIP
      </label>

      <label style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13.5 }}>
        <input type="checkbox" {...register("portalEnabled")} />
        Allow portal login
      </label>

      <Field label="Group name" error={errors.groupName?.message}>
        <input {...register("groupName")} style={inputStyle} />
      </Field>

      <Field label="Street" error={errors.addressStreet?.message}>
        <input {...register("addressStreet")} style={inputStyle} autoComplete="street-address" />
      </Field>

      <TwoCol>
        <Field label="Suburb" error={errors.addressSuburb?.message}>
          <input {...register("addressSuburb")} style={inputStyle} />
        </Field>
        <Field label="City" error={errors.addressCity?.message}>
          <input {...register("addressCity")} style={inputStyle} />
        </Field>
      </TwoCol>

      <TwoCol>
        <Field label="Postcode" error={errors.addressPostcode?.message}>
          <input {...register("addressPostcode")} style={inputStyle} />
        </Field>
        <Field label="Country" error={errors.addressCountry?.message}>
          <input {...register("addressCountry")} style={inputStyle} maxLength={2} placeholder="AU" />
        </Field>
      </TwoCol>

      <Field label="Notes" error={errors.notes?.message}>
        <textarea
          {...register("notes")}
          rows={3}
          style={{ ...inputStyle, height: "auto", padding: "10px 12px", resize: "vertical" }}
        />
      </Field>
    </>
  )
}
