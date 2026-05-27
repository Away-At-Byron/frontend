"use client"

import { useEffect } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { Button } from "@/components/ui/primitives"
import type { ActionResult } from "@/lib/result"
import {
  createPropertyAmenitySchema,
  updatePropertyAmenitySchema,
  type CreatePropertyAmenityInput,
  type UpdatePropertyAmenityInput,
} from "../schemas"
import type { PropertyAmenityRow } from "../types"
import { Modal, Field, inputStyle } from "./modal"

function ErrorBanner({ message }: { message?: string }) {
  if (!message) return null
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
  )
}

/** Native datalist combobox - type a new value or pick an existing category. */
function CategoryInput({
  id,
  categories,
  ...props
}: {
  id: string
  categories: string[]
} & React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <>
      <input
        list={id}
        style={inputStyle}
        placeholder="e.g. Connectivity"
        {...props}
      />
      <datalist id={id}>
        {categories.map((c) => (
          <option key={c} value={c} />
        ))}
      </datalist>
    </>
  )
}

export function NewPropertyAmenityModal({
  isOpen,
  onClose,
  onSave,
  categories,
  defaultCategory,
}: {
  isOpen: boolean
  onClose: () => void
  onSave: (
    values: CreatePropertyAmenityInput,
  ) => Promise<ActionResult<PropertyAmenityRow>>
  categories: string[]
  defaultCategory?: string
}) {
  const {
    register,
    handleSubmit,
    reset,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<CreatePropertyAmenityInput>({
    resolver: zodResolver(createPropertyAmenitySchema),
    defaultValues: { category: defaultCategory ?? "", name: "" },
  })

  useEffect(() => {
    if (isOpen) {
      reset({ category: defaultCategory ?? "", name: "" })
    }
  }, [isOpen, defaultCategory, reset])

  const close = () => {
    if (isSubmitting) return
    reset()
    onClose()
  }

  const submit = handleSubmit(async (values) => {
    const res = await onSave(values)
    if (res.ok) {
      reset()
      onClose()
      return
    }
    const fields = res.error.fields
    if (fields?.category?.[0]) {
      setError("category", { message: fields.category[0] })
    } else if (fields?.name?.[0]) {
      setError("name", { message: fields.name[0] })
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
            New amenity
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
          <Field
            label="Category"
            hint="Pick an existing category or type a new one."
            error={errors.category?.message}
          >
            <CategoryInput
              id="new-amenity-category-list"
              categories={categories}
              autoFocus
              {...register("category")}
            />
          </Field>
          <Field label="Name" error={errors.name?.message}>
            <input
              style={inputStyle}
              placeholder="e.g. Smart TV"
              {...register("name")}
            />
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
            {isSubmitting ? "Saving..." : "Add amenity"}
          </Button>
        </div>
      </form>
    </Modal>
  )
}

export function EditPropertyAmenityModal({
  isOpen,
  onClose,
  amenity,
  onSave,
  categories,
}: {
  isOpen: boolean
  onClose: () => void
  amenity: PropertyAmenityRow | null
  onSave: (
    id: string,
    values: UpdatePropertyAmenityInput,
  ) => Promise<ActionResult<PropertyAmenityRow>>
  categories: string[]
}) {
  const {
    register,
    handleSubmit,
    reset,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<UpdatePropertyAmenityInput>({
    resolver: zodResolver(updatePropertyAmenitySchema),
  })

  useEffect(() => {
    if (amenity) {
      reset({ category: amenity.category, name: amenity.name })
    }
  }, [amenity, reset])

  if (!amenity) return null

  const close = () => {
    if (isSubmitting) return
    onClose()
  }

  const submit = handleSubmit(async (values) => {
    const res = await onSave(amenity.id, values)
    if (res.ok) {
      onClose()
      return
    }
    const fields = res.error.fields
    if (fields?.category?.[0]) {
      setError("category", { message: fields.category[0] })
    } else if (fields?.name?.[0]) {
      setError("name", { message: fields.name[0] })
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
            Edit amenity
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
          <Field
            label="Category"
            hint="Changing category moves this amenity to the end of the new one."
            error={errors.category?.message}
          >
            <CategoryInput
              id="edit-amenity-category-list"
              categories={categories}
              autoFocus
              {...register("category")}
            />
          </Field>
          <Field label="Name" error={errors.name?.message}>
            <input style={inputStyle} {...register("name")} />
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
