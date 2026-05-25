"use client";

/**
 * Shared field primitives + section layout used across the contact-detail
 * tabs. Pill-style inputs, caps row labels, and the SectionCard wrapper that
 * frames each form group. Kept inside the contacts module so the styling
 * stays decoupled from the global UI primitives.
 */
import type { CSSProperties, ReactNode } from "react";
import { Card } from "@/components/ui/primitives";
import { Icon, type IconName } from "@/components/ui/icon";
import { COUNTRIES } from "@/lib/countries";
import { AUSTRALIAN_STATES } from "@/lib/australian-states";

export const COUNTRY_OPTIONS = COUNTRIES.map((c) => ({
  value: c.code,
  label: c.name,
}));

export const STATE_OPTIONS = AUSTRALIAN_STATES.map((s) => ({
  value: s.code,
  label: s.name,
}));

export const YES_NO_OPTIONS = [
  { value: "yes", label: "Yes" },
  { value: "no", label: "No" },
];

export function SectionCard({
  icon,
  title,
  children,
}: {
  icon: IconName;
  title: string;
  children: ReactNode;
}) {
  return (
    <Card pad={0}>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 10,
          padding: "18px 22px",
          borderBottom: "1px solid var(--line-soft)",
        }}
      >
        <Icon name={icon} size={16} />
        <div
          style={{
            fontFamily: "var(--font-display), serif",
            fontWeight: 400,
            fontSize: 17,
            letterSpacing: "var(--tight)",
          }}
        >
          {title}
        </div>
      </div>
      <div style={{ padding: 0 }}>{children}</div>
    </Card>
  );
}

export function Row({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "140px 1fr",
        gap: 16,
        alignItems: "center",
        padding: "10px 22px",
        borderTop: "1px solid var(--line-soft)",
      }}
    >
      <div
        className="caps"
        style={{
          color: "var(--ink-faint)",
          fontSize: 10,
          letterSpacing: "var(--tracked)",
        }}
      >
        {label}
      </div>
      <div>{children}</div>
    </div>
  );
}

export const fieldStyle: CSSProperties = {
  width: "100%",
  height: 36,
  padding: "0 12px",
  borderRadius: "var(--r-pill)",
  border: "1px solid var(--line)",
  background: "var(--paper)",
  font: "inherit",
  fontSize: 13.5,
  color: "var(--ink)",
  outline: "none",
};

export function TextInput({
  value,
  onChange,
  placeholder,
  disabled,
}: {
  value: string;
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
  placeholder?: string;
  disabled?: boolean;
}) {
  return (
    <input
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      disabled={disabled}
      style={{
        ...fieldStyle,
        opacity: disabled ? 0.7 : 1,
        cursor: disabled ? "not-allowed" : "text",
      }}
    />
  );
}

export function Textarea({
  value,
  onChange,
  placeholder,
  rows = 3,
}: {
  value: string;
  onChange?: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
  placeholder?: string;
  rows?: number;
}) {
  return (
    <textarea
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      rows={rows}
      style={{
        ...fieldStyle,
        height: "auto",
        padding: "10px 12px",
        borderRadius: "var(--r-2)",
        resize: "vertical",
        fontFamily: "inherit",
        lineHeight: 1.45,
      }}
    />
  );
}

export function SelectInput({
  value,
  onChange,
  options,
}: {
  value: string;
  onChange?: (e: React.ChangeEvent<HTMLSelectElement>) => void;
  options: { value: string; label: string }[];
}) {
  return (
    <select
      value={value}
      onChange={onChange}
      style={{ ...fieldStyle, appearance: "auto" }}
    >
      {options.map((o) => (
        <option key={o.value} value={o.value}>
          {o.label}
        </option>
      ))}
    </select>
  );
}
