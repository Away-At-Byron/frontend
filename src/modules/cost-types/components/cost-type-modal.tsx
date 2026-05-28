"use client";

import { useEffect } from "react";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/primitives";
import type { ActionResult } from "@/lib/result";
import {
  createCostTypeSchema,
  updateCostTypeSchema,
  BASIS_LABEL,
  type CreateCostTypeInput,
  type UpdateCostTypeInput,
} from "../schemas";
import type { CostTypeRow, CostBasis, Option } from "../types";
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
  costCategoryId: string;
  basis: CostBasis;
  defaultValue: number | string;
  canBeOverridden: boolean;
  isActive: "active" | "inactive";
};

const EMPTY: FormValues = {
  name: "",
  costCategoryId: "",
  basis: "flat",
  defaultValue: "",
  canBeOverridden: true,
  isActive: "active",
};

function CheckRow({
  label,
  hint,
  ...rest
}: {
  label: string;
  hint?: string;
} & React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <label
      style={{
        display: "flex",
        alignItems: "flex-start",
        gap: 10,
        padding: "4px 0",
      }}
    >
      <input type="checkbox" style={{ marginTop: 2 }} {...rest} />
      <span style={{ display: "flex", flexDirection: "column", gap: 2 }}>
        <span style={{ fontSize: 13.5, color: "var(--ink)" }}>{label}</span>
        {hint && (
          <span style={{ fontSize: 12, color: "var(--ink-soft)" }}>{hint}</span>
        )}
      </span>
    </label>
  );
}

function CostTypeForm({
  mode,
  initialValues,
  costCategoryOptions,
  submitLabel,
  onSubmit,
  onCancel,
}: {
  mode: "create" | "edit";
  initialValues: FormValues;
  costCategoryOptions: Option[];
  submitLabel: string;
  onSubmit: (values: FormValues) => Promise<{
    ok: boolean;
    fieldErrors?: Record<string, string[] | undefined>;
    rootError?: string;
  }>;
  onCancel: () => void;
}) {
  const schema =
    mode === "create" ? createCostTypeSchema : updateCostTypeSchema;
  const {
    register,
    handleSubmit,
    reset,
    setError,
    control,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(schema) as never,
    defaultValues: initialValues,
  });

  useEffect(() => {
    reset(initialValues);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialValues]);

  const watchedBasis = useWatch({ control, name: "basis" });
  const defaultValueLabel =
    watchedBasis === "percentage" ? "Default value (%)" : "Default value (A$)";
  const defaultValuePlaceholder =
    watchedBasis === "percentage" ? "15" : "50.00";

  const submit = handleSubmit(async (values) => {
    const res = await onSubmit(values);
    if (res.ok) return;
    const fields = res.fieldErrors ?? {};
    const first = Object.keys(fields).find((k) => fields[k]?.[0]) as
      | keyof FormValues
      | undefined;
    if (first) setError(first as never, { message: fields[first]![0] });
    else setError("root", { message: res.rootError ?? "Could not save." });
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
          {mode === "create" ? "New cost type" : "Edit cost type"}
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

        <Field label="Name" error={errors.name?.message}>
          <input
            style={inputStyle}
            autoFocus
            placeholder="e.g. Standard linen change"
            {...register("name")}
          />
        </Field>

        <Field label="Cost category" error={errors.costCategoryId?.message}>
          <select style={inputStyle} {...register("costCategoryId")}>
            <option value="">Select…</option>
            {costCategoryOptions.map((o) => (
              <option key={o.id} value={o.id}>
                {o.name}
              </option>
            ))}
          </select>
        </Field>

        <div
          style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}
        >
          <Field label="Basis" error={errors.basis?.message}>
            <select style={inputStyle} {...register("basis")}>
              {(
                [
                  "flat",
                  "per_night",
                  "per_person",
                  "per_room",
                  "percentage",
                ] as CostBasis[]
              ).map((b) => (
                <option key={b} value={b}>
                  {BASIS_LABEL[b]}
                </option>
              ))}
            </select>
          </Field>
          <Field
            label={defaultValueLabel}
            error={errors.defaultValue?.message as string | undefined}
          >
            <input
              type="number"
              inputMode="decimal"
              min={0}
              max={watchedBasis === "percentage" ? 100 : undefined}
              step="0.01"
              style={inputStyle}
              placeholder={defaultValuePlaceholder}
              {...register("defaultValue")}
            />
          </Field>
        </div>

        <Field
          label="Status"
          error={errors.isActive?.message as string | undefined}
        >
          <select style={inputStyle} {...register("isActive")}>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
        </Field>

        <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
          <CheckRow
            label="Can be overridden"
            hint="Rooms may set their own value instead of using the default."
            {...register("canBeOverridden")}
          />
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

export function NewCostTypeModal({
  isOpen,
  onClose,
  onSave,
  costCategoryOptions,
}: {
  isOpen: boolean;
  onClose: () => void;
  onSave: (values: CreateCostTypeInput) => Promise<ActionResult<CostTypeRow>>;
  costCategoryOptions: Option[];
}) {
  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <CostTypeForm
        mode="create"
        initialValues={EMPTY}
        costCategoryOptions={costCategoryOptions}
        submitLabel="Add cost type"
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

export function EditCostTypeModal({
  isOpen,
  onClose,
  costType,
  onSave,
  costCategoryOptions,
}: {
  isOpen: boolean;
  onClose: () => void;
  costType: CostTypeRow | null;
  onSave: (
    id: string,
    values: UpdateCostTypeInput,
  ) => Promise<ActionResult<CostTypeRow>>;
  costCategoryOptions: Option[];
}) {
  if (!costType) return null;
  const initial: FormValues = {
    name: costType.name,
    costCategoryId: costType.costCategoryId,
    basis: costType.basis,
    defaultValue: costType.defaultValueInt / 100,
    canBeOverridden: costType.canBeOverridden,
    isActive: costType.isActive ? "active" : "inactive",
  };
  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <CostTypeForm
        mode="edit"
        initialValues={initial}
        costCategoryOptions={costCategoryOptions}
        submitLabel="Save changes"
        onCancel={onClose}
        onSubmit={async (values) => {
          const res = await onSave(costType.id, values as never);
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
