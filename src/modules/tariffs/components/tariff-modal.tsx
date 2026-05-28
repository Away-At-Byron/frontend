"use client";

import { useEffect } from "react";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/primitives";
import type { ActionResult } from "@/lib/result";
import {
  TARIFF_BASIS_LABEL,
  TARIFF_TRAFFIC_LABEL,
  createTariffSchema,
  deriveCode,
  tariffBasisValues,
  tariffTrafficValues,
  updateTariffSchema,
  type CreateTariffInput,
  type UpdateTariffInput,
} from "../schemas";
import type { Option, TariffRow } from "../types";
import { Modal, Field, inputStyle } from "./modal";

function ErrorBanner({ message }: { message?: string }) {
  if (!message) return null;
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
  );
}

type FormValues = {
  name: string;
  code: string;
  tariffBasis: (typeof tariffBasisValues)[number];
  refundable: boolean;
  breakfastIncluded: boolean;
  traffic: (typeof tariffTrafficValues)[number];
  status: "active" | "inactive";
  propertyId: string | null;
  roomId: string | null;
  tariffPeriodId: string | null;
};

const EMPTY: FormValues = {
  name: "",
  code: "",
  tariffBasis: "per_night",
  refundable: true,
  breakfastIncluded: false,
  traffic: "direct",
  status: "active",
  propertyId: null,
  roomId: null,
  tariffPeriodId: null,
};

function TariffForm({
  mode,
  initialValues,
  propertyOptions,
  tariffPeriodOptions,
  submitLabel,
  onSubmit,
  onCancel,
}: {
  mode: "create" | "edit";
  initialValues: FormValues;
  propertyOptions: Option[];
  tariffPeriodOptions: Option[];
  submitLabel: string;
  onSubmit: (values: FormValues) => Promise<{
    ok: boolean;
    fieldErrors?: Record<string, string[] | undefined>;
    rootError?: string;
  }>;
  onCancel: () => void;
}) {
  const schema = mode === "create" ? createTariffSchema : updateTariffSchema;
  const {
    register,
    handleSubmit,
    reset,
    setValue,
    setError,
    control,
    formState: { errors, isSubmitting, dirtyFields },
  } = useForm<FormValues>({
    resolver: zodResolver(schema) as never,
    defaultValues: initialValues,
  });

  useEffect(() => {
    reset(initialValues);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialValues]);

  // Auto-derive code from name until the user touches it.
  const watchedName = useWatch({ control, name: "name" });
  useEffect(() => {
    if (dirtyFields.code) return;
    setValue("code", deriveCode(watchedName ?? ""), { shouldDirty: false });
  }, [watchedName, dirtyFields.code, setValue]);

  const submit = handleSubmit(async (values) => {
    const normalised: FormValues = {
      ...values,
      propertyId: values.propertyId ? values.propertyId : null,
      roomId: values.roomId ? values.roomId : null,
      tariffPeriodId: values.tariffPeriodId ? values.tariffPeriodId : null,
    };
    const res = await onSubmit(normalised);
    if (res.ok) return;
    const fields = res.fieldErrors ?? {};
    const firstField = Object.keys(fields).find((k) => fields[k]?.[0]) as
      | keyof FormValues
      | undefined;
    if (firstField) {
      setError(firstField as never, { message: fields[firstField]![0] });
    } else {
      setError("root", { message: res.rootError ?? "Could not save." });
    }
  });

  return (
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
          {mode === "create" ? "New tariff type" : "Edit tariff type"}
        </h2>
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

        <div
          style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}
        >
          <Field label="Name" error={errors.name?.message}>
            <input
              style={inputStyle}
              autoFocus
              placeholder="e.g. Weekend Escape"
              {...register("name")}
            />
          </Field>
          <Field
            label="Code"
            hint="Auto-fills from the name."
            error={errors.code?.message}
          >
            <input
              style={{
                ...inputStyle,
                fontFamily: "var(--font-mono), monospace",
                letterSpacing: 0.5,
              }}
              placeholder="e.g. WEEKENDESCAPE"
              {...register("code", {
                onChange: (e) => {
                  const v = e.target.value;
                  const clean = v.replace(/[^A-Za-z0-9]/g, "").toUpperCase();
                  if (clean !== v) e.target.value = clean;
                },
              })}
            />
          </Field>
        </div>

        <div
          style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}
        >
          <Field label="Tariff Basis" error={errors.tariffBasis?.message}>
            <select style={inputStyle} {...register("tariffBasis")}>
              {tariffBasisValues.map((b) => (
                <option key={b} value={b}>
                  {TARIFF_BASIS_LABEL[b]}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Traffic" error={errors.traffic?.message}>
            <select style={inputStyle} {...register("traffic")}>
              {tariffTrafficValues.map((t) => (
                <option key={t} value={t}>
                  {TARIFF_TRAFFIC_LABEL[t]}
                </option>
              ))}
            </select>
          </Field>
        </div>

        <div
          style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}
        >
          <Field
            label="Property"
            hint="Leave as All properties for a catalogue-wide tariff."
            error={errors.propertyId?.message}
          >
            <select
              style={inputStyle}
              {...register("propertyId", {
                setValueAs: (v) => (v === "" ? null : v),
              })}
            >
              <option value="">All properties</option>
              {propertyOptions.map((o) => (
                <option key={o.id} value={o.id}>
                  {o.name}
                </option>
              ))}
            </select>
          </Field>
          <Field
            label="Room"
            hint="Optional. Paste a room id when this tariff applies to one room."
            error={errors.roomId?.message}
          >
            <input
              style={{
                ...inputStyle,
                fontFamily: "var(--font-mono), monospace",
                letterSpacing: 0.5,
              }}
              placeholder="Room uuid (optional)"
              {...register("roomId", {
                setValueAs: (v) =>
                  typeof v === "string" && v.trim() === "" ? null : v,
              })}
            />
          </Field>
        </div>

        <div
          style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}
        >
          <Field label="Refundable" error={errors.refundable?.message}>
            <select
              style={inputStyle}
              {...register("refundable", {
                setValueAs: (v) => v === "true" || v === true,
              })}
            >
              <option value="true">Yes</option>
              <option value="false">No</option>
            </select>
          </Field>
          <Field
            label="Breakfast Included"
            error={errors.breakfastIncluded?.message}
          >
            <select
              style={inputStyle}
              {...register("breakfastIncluded", {
                setValueAs: (v) => v === "true" || v === true,
              })}
            >
              <option value="true">Yes</option>
              <option value="false">No</option>
            </select>
          </Field>
        </div>

        <div
          style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}
        >
          <Field label="Tariff Period" error={errors.tariffPeriodId?.message}>
            <select
              style={inputStyle}
              {...register("tariffPeriodId", {
                setValueAs: (v) => (v === "" ? null : v),
              })}
            >
              <option value="">None</option>
              {tariffPeriodOptions.map((o) => (
                <option key={o.id} value={o.id}>
                  {o.name}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Status" error={errors.status?.message}>
            <select style={inputStyle} {...register("status")}>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </Field>
        </div>
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
        <Button variant="ghost" onClick={onCancel} disabled={isSubmitting}>
          Cancel
        </Button>
        <Button type="submit" variant="primary" disabled={isSubmitting}>
          {isSubmitting ? "Saving..." : submitLabel}
        </Button>
      </div>
    </form>
  );
}

export function NewTariffModal({
  isOpen,
  onClose,
  onSave,
  propertyOptions,
  tariffPeriodOptions,
}: {
  isOpen: boolean;
  onClose: () => void;
  onSave: (values: CreateTariffInput) => Promise<ActionResult<TariffRow>>;
  propertyOptions: Option[];
  tariffPeriodOptions: Option[];
}) {
  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <TariffForm
        mode="create"
        initialValues={EMPTY}
        propertyOptions={propertyOptions}
        tariffPeriodOptions={tariffPeriodOptions}
        submitLabel="Add tariff"
        onCancel={onClose}
        onSubmit={async (values) => {
          const res = await onSave(values as never);
          if (res.ok) {
            onClose();
            return { ok: true };
          }
          return {
            ok: false,
            fieldErrors: res.error.fields,
            rootError: res.error.message,
          };
        }}
      />
    </Modal>
  );
}

export function EditTariffModal({
  isOpen,
  onClose,
  tariff,
  onSave,
  propertyOptions,
  tariffPeriodOptions,
}: {
  isOpen: boolean;
  onClose: () => void;
  tariff: TariffRow | null;
  onSave: (
    id: string,
    values: UpdateTariffInput,
  ) => Promise<ActionResult<TariffRow>>;
  propertyOptions: Option[];
  tariffPeriodOptions: Option[];
}) {
  if (!tariff) return null;
  const initial: FormValues = {
    name: tariff.name,
    code: tariff.code,
    tariffBasis: tariff.tariffBasis,
    refundable: tariff.refundable,
    breakfastIncluded: tariff.breakfastIncluded,
    traffic: tariff.traffic,
    status: tariff.status,
    propertyId: tariff.propertyId,
    roomId: tariff.roomId,
    tariffPeriodId: tariff.tariffPeriodId,
  };
  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <TariffForm
        mode="edit"
        initialValues={initial}
        propertyOptions={propertyOptions}
        tariffPeriodOptions={tariffPeriodOptions}
        submitLabel="Save changes"
        onCancel={onClose}
        onSubmit={async (values) => {
          const res = await onSave(tariff.id, values as never);
          if (res.ok) {
            onClose();
            return { ok: true };
          }
          return {
            ok: false,
            fieldErrors: res.error.fields,
            rootError: res.error.message,
          };
        }}
      />
    </Modal>
  );
}
