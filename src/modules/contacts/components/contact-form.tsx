"use client"

import type { ReactNode } from "react"
import { Controller, type Control, type UseFormRegister, type FieldErrors } from "react-hook-form"
import { Field, inputStyle } from "@/modules/users/components/modal"
import { BirthdayPicker } from "./birthday-picker"
import type { CreateContactInput } from "../schemas"
import {
  COMMUNICATION_PREFERENCES,
  COMMUNICATION_PREFERENCE_LABELS,
  CONTACT_ID_TYPES,
  CONTACT_ID_TYPE_LABELS,
  CONTACT_TIERS,
  CONTACT_TIER_LABELS,
  CONTACT_SOURCES,
  CONTACT_SOURCE_LABELS,
  GUEST_TYPES,
  GUEST_TYPE_LABELS,
  type ContactTypeOption,
} from "../types"

function TwoCol({ children }: { children: ReactNode }) {
  return (
    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>{children}</div>
  )
}

function SectionLabel({ children }: { children: ReactNode }) {
  return (
    <div
      className="caps"
      style={{ color: "var(--ink-faint)", marginTop: 6, paddingTop: 10, borderTop: "1px solid var(--line-soft)" }}
    >
      {children}
    </div>
  )
}

function Check({
  register,
  field,
  label,
}: {
  register: UseFormRegister<CreateContactInput>
  field: keyof CreateContactInput
  label: string
}) {
  return (
    <label style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13.5 }}>
      <input type="checkbox" {...register(field)} />
      {label}
    </label>
  )
}

export function ContactFormFields({
  register,
  control,
  errors,
  contactTypes,
}: {
  register: UseFormRegister<CreateContactInput>
  control: Control<CreateContactInput>
  errors: FieldErrors<CreateContactInput>
  contactTypes: ContactTypeOption[]
}) {
  return (
    <>
      <Field label="Contact type" error={errors.contactTypeId?.message}>
        <select {...register("contactTypeId")} style={{ ...inputStyle, width: "100%" }}>
          <option value="">Select type</option>
          {contactTypes.map((t) => (
            <option key={t.id} value={t.id}>
              {t.name}
            </option>
          ))}
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
        <Controller
          control={control}
          name="birthday"
          render={({ field }) => (
            <BirthdayPicker value={field.value ?? ""} onChange={field.onChange} />
          )}
        />
      </Field>

      <TwoCol>
        <Field label="Communication preference" error={errors.communicationPreference?.message}>
          <select {...register("communicationPreference")} style={{ ...inputStyle, width: "100%" }}>
            {COMMUNICATION_PREFERENCES.map((v) => (
              <option key={v} value={v}>
                {COMMUNICATION_PREFERENCE_LABELS[v]}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Guest type" error={errors.guestType?.message}>
          <select {...register("guestType")} style={{ ...inputStyle, width: "100%" }}>
            <option value="">—</option>
            {GUEST_TYPES.map((v) => (
              <option key={v} value={v}>
                {GUEST_TYPE_LABELS[v]}
              </option>
            ))}
          </select>
        </Field>
      </TwoCol>

      <TwoCol>
        <Field label="Tier" error={errors.tier?.message}>
          <select {...register("tier")} style={{ ...inputStyle, width: "100%" }}>
            <option value="">—</option>
            {CONTACT_TIERS.map((v) => (
              <option key={v} value={v}>
                {CONTACT_TIER_LABELS[v]}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Source" error={errors.source?.message}>
          <select {...register("source")} style={{ ...inputStyle, width: "100%" }}>
            <option value="">—</option>
            {CONTACT_SOURCES.map((v) => (
              <option key={v} value={v}>
                {CONTACT_SOURCE_LABELS[v]}
              </option>
            ))}
          </select>
        </Field>
      </TwoCol>

      <div style={{ display: "flex", flexWrap: "wrap", gap: "8px 20px" }}>
        <Check register={register} field="marketingOptIn" label="Marketing opt in" />
        <Check register={register} field="returningGuest" label="Returning guest" />
        <Check register={register} field="otaUser" label="OTA user" />
        <Check register={register} field="directBookingGuest" label="Direct booking guest" />
        <Check register={register} field="corporateGuest" label="Corporate guest" />
        <Check register={register} field="doNotRebook" label="Do not rebook" />
        <Check register={register} field="portalEnabled" label="Allow portal login" />
      </div>

      <SectionLabel>Identity (guests only)</SectionLabel>
      <TwoCol>
        <Field label="ID type" error={errors.idType?.message}>
          <select {...register("idType")} style={{ ...inputStyle, width: "100%" }}>
            <option value="">—</option>
            {CONTACT_ID_TYPES.map((v) => (
              <option key={v} value={v}>
                {CONTACT_ID_TYPE_LABELS[v]}
              </option>
            ))}
          </select>
        </Field>
        <Field label="ID country" error={errors.idCountry?.message}>
          <input {...register("idCountry")} style={inputStyle} />
        </Field>
      </TwoCol>
      <Field label="ID number" error={errors.idNumber?.message}>
        <input {...register("idNumber")} style={inputStyle} />
      </Field>
      <TwoCol>
        <Field label="ID verification date" error={errors.idVerificationDate?.message}>
          <input {...register("idVerificationDate")} type="date" style={inputStyle} />
        </Field>
        <div style={{ display: "flex", alignItems: "flex-end", paddingBottom: 8 }}>
          <Check register={register} field="idVerified" label="ID verified" />
        </div>
      </TwoCol>

      <SectionLabel>Booking profile</SectionLabel>
      <TwoCol>
        <Field label="First booking date" error={errors.firstBookingDate?.message}>
          <input {...register("firstBookingDate")} type="date" style={inputStyle} />
        </Field>
        <Field label="Last contact date" error={errors.lastContactDate?.message}>
          <input {...register("lastContactDate")} type="date" style={inputStyle} />
        </Field>
      </TwoCol>
      <Field label="Preferred booking channel" error={errors.preferredBookingChannel?.message}>
        <input {...register("preferredBookingChannel")} style={inputStyle} />
      </Field>
      <Field label="Special requests / preferences" error={errors.specialRequests?.message}>
        <textarea
          {...register("specialRequests")}
          rows={2}
          style={{ ...inputStyle, height: "auto", padding: "10px 12px", resize: "vertical" }}
        />
      </Field>
      <Field label="Accessibility requirements" error={errors.accessibilityRequirements?.message}>
        <textarea
          {...register("accessibilityRequirements")}
          rows={2}
          style={{ ...inputStyle, height: "auto", padding: "10px 12px", resize: "vertical" }}
        />
      </Field>

      <SectionLabel>Address</SectionLabel>
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
        <Field label="State" error={errors.addressState?.message}>
          <input {...register("addressState")} style={inputStyle} />
        </Field>
        <Field label="Postcode" error={errors.addressPostcode?.message}>
          <input {...register("addressPostcode")} style={inputStyle} />
        </Field>
      </TwoCol>
      <Field label="Country" error={errors.addressCountry?.message}>
        <input {...register("addressCountry")} style={inputStyle} maxLength={2} placeholder="AU" />
      </Field>

      <SectionLabel>Notes</SectionLabel>
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
