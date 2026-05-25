"use client";

/** Communication tab → Notes & Preferences card. */
import { DatePicker } from "./date-picker";
import type { FormState, OnField, SetField } from "./contact-detail-form";
import {
  Row,
  SectionCard,
  Textarea,
} from "./contact-detail-fields";

export function CommunicationTab({
  form,
  onField,
  setField,
}: {
  form: FormState;
  onField: OnField;
  setField: SetField;
}) {
  const onText =
    (key: keyof FormState) => (e: React.ChangeEvent<HTMLTextAreaElement>) =>
      onField(key)({
        target: { value: e.target.value },
      } as React.ChangeEvent<HTMLInputElement>);

  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(420px, 1fr))",
        gap: 20,
      }}
    >
      <SectionCard icon="Message" title="Notes & Preferences">
        <Row label="Notes">
          <Textarea value={form.notes} onChange={onText("notes")} rows={3} />
        </Row>
        <Row label="First booking">
          <DatePicker
            value={form.firstBookingDate}
            onChange={(v) => setField("firstBookingDate", v)}
          />
        </Row>
        <Row label="Special requests">
          <Textarea
            value={form.specialRequests}
            onChange={onText("specialRequests")}
            rows={3}
          />
        </Row>
        <Row label="Accessibility">
          <Textarea
            value={form.accessibilityRequirements}
            onChange={onText("accessibilityRequirements")}
            rows={3}
          />
        </Row>
      </SectionCard>
    </div>
  );
}
