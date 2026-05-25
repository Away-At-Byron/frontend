"use client";

/** Documents tab → Identity & verification card. */
import { CONTACT_ID_TYPE_LABELS } from "../types";
import { DatePicker } from "./date-picker";
import { SearchSelect } from "./search-select";
import type { FormState, OnField, SetField } from "./contact-detail-form";
import {
  COUNTRY_OPTIONS,
  Row,
  SectionCard,
  SelectInput,
  TextInput,
  YES_NO_OPTIONS,
} from "./contact-detail-fields";

export function DocumentsTab({
  form,
  onField,
  setField,
}: {
  form: FormState;
  onField: OnField;
  setField: SetField;
}) {
  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(420px, 1fr))",
        gap: 20,
      }}
    >
      <SectionCard icon="Settings" title="Identity & verification">
        <Row label="ID type">
          <SelectInput
            value={form.idType}
            onChange={onField("idType")}
            options={[
              { value: "", label: "—" },
              ...Object.entries(CONTACT_ID_TYPE_LABELS).map(([v, l]) => ({
                value: v,
                label: l,
              })),
            ]}
          />
        </Row>
        <Row label="ID number">
          <TextInput value={form.idNumber} onChange={onField("idNumber")} />
        </Row>
        <Row label="ID country">
          <SearchSelect
            value={form.idCountry}
            onChange={(v) => setField("idCountry", v)}
            options={COUNTRY_OPTIONS}
            placeholder="Select country"
            clearLabel="Clear country"
            emptyLabel="No matching country"
          />
        </Row>
        <Row label="ID verified">
          <SelectInput
            value={form.idVerified}
            onChange={onField("idVerified")}
            options={YES_NO_OPTIONS}
          />
        </Row>
        <Row label="Verified on">
          <DatePicker
            value={form.idVerificationDate}
            onChange={(v) => setField("idVerificationDate", v)}
            placeholder="Select date"
          />
        </Row>
      </SectionCard>
    </div>
  );
}
