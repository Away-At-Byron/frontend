/**
 * Local form state for the contact detail page + mappers to/from the
 * persisted ContactRow / server-action payload. Kept in its own file so the
 * tab components stay focused on UI.
 *
 * The `title` and `phoneAlt` fields exist on the UI mockup but not in the
 * contact schema — see the commented entries.
 */
import type { ContactRow } from "../types";

export type FormState = {
  // title: string; // commented — not in the contact schema
  firstName: string;
  lastName: string;
  birthday: string;
  clientNumber: string;
  tier: string;
  guestType: string;
  returningGuest: string;
  portalEnabled: string;
  doNotRebook: string;
  preferredBookingChannel: string;
  email: string;
  phone: string;
  // phoneAlt: string; // commented — not in the contact schema
  communicationPreference: string;
  marketingOptIn: string;
  contactTypeId: string;
  contactSourceId: string;
  groupId: string;
  addressStreet: string;
  addressCity: string;
  addressSuburb: string;
  addressState: string;
  addressPostcode: string;
  addressCountry: string;
  notes: string;
  firstBookingDate: string;
  specialRequests: string;
  accessibilityRequirements: string;
  idType: string;
  idNumber: string;
  idCountry: string;
  idVerified: string;
  idVerificationDate: string;
};

export function initialForm(c: ContactRow | null): FormState {
  return {
    firstName: c?.firstName ?? "",
    lastName: c?.lastName ?? "",
    birthday: c?.birthday ?? "",
    clientNumber: c ? `G-${c.id.slice(0, 4).toUpperCase()}` : "",
    tier: c?.tier ?? "",
    guestType: c?.guestType ?? "",
    returningGuest: c?.returningGuest ? "yes" : "no",
    portalEnabled: c?.portalEnabled ? "yes" : "no",
    doNotRebook: c?.doNotRebook ? "yes" : "no",
    preferredBookingChannel: c?.preferredBookingChannel ?? "",
    email: c?.email ?? "",
    phone: c?.phone ?? "",
    communicationPreference: c?.communicationPreference ?? "email",
    marketingOptIn: c?.marketingOptIn ? "yes" : "no",
    contactTypeId: c?.contactTypeId ?? "",
    contactSourceId: c?.contactSourceId ?? "",
    groupId: c?.groupId ?? "",
    addressStreet: c?.addressStreet ?? "",
    addressCity: c?.addressCity ?? "",
    addressSuburb: c?.addressSuburb ?? "",
    addressState: c?.addressState ?? "",
    addressPostcode: c?.addressPostcode ?? "",
    addressCountry: c?.addressCountry ?? "AU",
    notes: c?.notes ?? "",
    firstBookingDate: c?.firstBookingDate ?? "",
    specialRequests: c?.specialRequests ?? "",
    accessibilityRequirements: c?.accessibilityRequirements ?? "",
    idType: c?.idType ?? "",
    idNumber: c?.idNumber ?? "",
    idCountry: c?.idCountry ?? "",
    idVerified: c?.idVerified ? "yes" : "no",
    idVerificationDate: c?.idVerificationDate ?? "",
  };
}

export function toPayload(f: FormState) {
  return {
    contactTypeId: f.contactTypeId || undefined,
    firstName: f.firstName,
    lastName: f.lastName,
    email: f.email || undefined,
    phone: f.phone || undefined,
    addressStreet: f.addressStreet || undefined,
    addressCity: f.addressCity || undefined,
    addressSuburb: f.addressSuburb || undefined,
    addressState: f.addressState || undefined,
    addressPostcode: f.addressPostcode || undefined,
    addressCountry: f.addressCountry || undefined,
    birthday: f.birthday || undefined,
    communicationPreference:
      (f.communicationPreference as
        | "email"
        | "sms"
        | "both"
        | "none"
        | "unsubscribed") || "email",
    marketingOptIn: f.marketingOptIn === "yes",
    returningGuest: f.returningGuest === "yes",
    portalEnabled: f.portalEnabled === "yes",
    idVerified: f.idVerified === "yes",
    doNotRebook: f.doNotRebook === "yes",
    tier: (f.tier as "bronze" | "silver" | "gold" | "vip") || undefined,
    guestType:
      (f.guestType as
        | "leisure"
        | "corporate"
        | "family"
        | "couple"
        | "group"
        | "vip"
        | "event_guest") || undefined,
    preferredBookingChannel: f.preferredBookingChannel || undefined,
    firstBookingDate: f.firstBookingDate || undefined,
    notes: f.notes || undefined,
    specialRequests: f.specialRequests || undefined,
    accessibilityRequirements: f.accessibilityRequirements || undefined,
    contactSourceId: f.contactSourceId || undefined,
    groupId: f.groupId || undefined,
    idType:
      (f.idType as "passport" | "drivers_license" | "national_id" | "other") ||
      undefined,
    idNumber: f.idNumber || undefined,
    idCountry: f.idCountry || undefined,
    idVerificationDate: f.idVerificationDate || undefined,
  };
}

/** Function passed down to children that need direct (non-event) writes. */
export type SetField = <K extends keyof FormState>(
  key: K,
  value: FormState[K],
) => void;

/** Curried event-handler factory used by plain inputs/selects. */
export type OnField = <K extends keyof FormState>(
  key: K,
) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => void;
