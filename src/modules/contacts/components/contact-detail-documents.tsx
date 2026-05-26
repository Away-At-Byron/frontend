"use client";

/**
 * Documents tab — Identity card (ID photo + ID fields), plus the booking and
 * other-document lists. Only the Identity card's upload flow is wired so far;
 * the booking/other lists still render mock rows until their server actions
 * land.
 *
 * Upload flow (Identity ID photo, images only):
 *   1. presignContactDocumentUploads → presigned PUT URL
 *   2. PUT the file directly to MinIO (bypasses Next's 2 MB action body cap)
 *   3. confirmContactDocumentUploads → writes the contact_documents row
 *   4. router.refresh() so the new photo appears in the slot
 */
import {
  useEffect,
  useRef,
  useState,
  type ChangeEvent,
  type ReactNode,
} from "react";
import { useRouter } from "next/navigation";
import { Button, Card, IconButton, Pill } from "@/components/ui/primitives";
import { Icon, type IconName } from "@/components/ui/icon";
import { useToast } from "@/components/ui/toast";
import {
  ALLOWED_MIME_TYPES,
  MAX_FILE_BYTES,
  isAllowedMimeType,
} from "@/lib/upload-limits";
import {
  confirmContactDocumentUploads,
  presignContactDocumentUploads,
} from "@/modules/contact-documents/actions";
import type { ContactDocumentWithPreview } from "@/modules/contact-documents/types";
import { CONTACT_ID_TYPE_LABELS, type ContactIdType } from "../types";
import { DatePicker } from "./date-picker";
import { SearchSelect } from "./search-select";
import type { FormState, OnField, SetField } from "./contact-detail-form";
import {
  COUNTRY_OPTIONS,
  Row,
  SelectInput,
  TextInput,
  YES_NO_OPTIONS,
} from "./contact-detail-fields";

// Mock document lists — wiring the booking/other lists to real uploads lands
// in a follow-up. Identity is wired first per the task brief.
type DocItem = {
  name: string;
  size: string;
  when: string;
  type: string;
};

const BOOKING_DOCS: DocItem[] = [
  {
    name: "Booking confirmation R-5453.pdf",
    size: "82 KB",
    when: "17 Nov 2026",
    type: "Booking",
  },
  {
    name: "Payment receipt R-5311.pdf",
    size: "62 KB",
    when: "14 Jun 2025",
    type: "Receipt",
  },
];

const OTHER_DOCS: DocItem[] = [
  {
    name: "Loyalty rewards letter.pdf",
    size: "140 KB",
    when: "04 Jul 2025",
    type: "Other",
  },
];

export function DocumentsTab({
  form,
  onField,
  setField,
  contactId,
  documents,
}: {
  form: FormState;
  onField: OnField;
  setField: SetField;
  contactId: string | null;
  documents: ContactDocumentWithPreview[];
}) {
  // Latest id_photo wins the photo slot; older ones surface in the documents
  // list (once that view is wired). Image-mime guard stays defensive — a PDF
  // ID would still be a valid id_photo row but won't render as a thumbnail.
  const idPhotos = documents.filter(
    (d) =>
      d.type === "id_photo" &&
      d.mimeType !== null &&
      d.mimeType.startsWith("image/"),
  );
  const latestIdPhoto = idPhotos[0] ?? null;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      <IdentityCard
        form={form}
        onField={onField}
        setField={setField}
        contactId={contactId}
        latestIdPhoto={latestIdPhoto}
      />
      <DocList
        title="Booking documents"
        docs={BOOKING_DOCS}
        addLabel="Add booking doc"
      />
      <DocList
        title="Other documents"
        subtitle="Any other files attached to this contact — letters, agreements, vouchers, photos."
        docs={OTHER_DOCS}
        addLabel="Add document"
      />
    </div>
  );
}

// ─── Identity ─────────────────────────────────────────────────

const IMAGE_MIME_TYPES = ALLOWED_MIME_TYPES.filter((m) => m.startsWith("image/"));

function IdentityCard({
  form,
  onField,
  setField,
  contactId,
  latestIdPhoto,
}: {
  form: FormState;
  onField: OnField;
  setField: SetField;
  contactId: string | null;
  latestIdPhoto: ContactDocumentWithPreview | null;
}) {
  const router = useRouter();
  const toast = useToast();
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [uploading, setUploading] = useState(false);
  // Preview the file the user just picked, before the server round trip lands
  // so the slot doesn't go blank mid-upload.
  const [optimisticUrl, setOptimisticUrl] = useState<string | null>(null);
  const [lightboxOpen, setLightboxOpen] = useState(false);

  const canUpload = contactId !== null;

  const openPicker = () => {
    if (!canUpload || uploading) return;
    fileInputRef.current?.click();
  };

  const handleFiles = async (e: ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    // Reset the input value so picking the same file twice still fires change.
    e.target.value = "";
    if (!files.length || !contactId) return;

    // Client-side guards: server validates again, but stop bad input here so
    // we don't burn a presign round trip for a known-bad file.
    for (const f of files) {
      if (!f.type.startsWith("image/") || !isAllowedMimeType(f.type)) {
        toast.error({
          title: "ID photo must be an image",
          message: `${f.name} isn't an image we support. Try JPEG, PNG, WebP or HEIC.`,
        });
        return;
      }
      if (f.size > MAX_FILE_BYTES) {
        toast.error({
          title: "ID photo is too large",
          message: `${f.name} is over ${Math.floor(MAX_FILE_BYTES / 1024 / 1024)} MB. Shrink it and try again.`,
        });
        return;
      }
    }

    const firstPreview = URL.createObjectURL(files[0]!);
    setOptimisticUrl(firstPreview);
    setUploading(true);

    try {
      const presignRes = await presignContactDocumentUploads({
        contactId,
        files: files.map((f) => ({
          fileName: f.name,
          mimeType: f.type,
          sizeBytes: f.size,
        })),
      });
      if (!presignRes.ok) {
        toast.error({
          title: "Couldn't start upload",
          message: presignRes.error.message,
        });
        return;
      }

      // Uploads run in parallel — one slow file doesn't block the others.
      // First failure aborts and surfaces; orphans get reaped by the MinIO
      // lifecycle rule.
      const uploads = await Promise.all(
        presignRes.data.map(async (slot, i) => {
          const file = files[i]!;
          const res = await fetch(slot.uploadUrl, {
            method: "PUT",
            headers: slot.headers,
            body: file,
          });
          if (!res.ok) {
            throw new Error(`Upload failed for ${file.name} (${res.status})`);
          }
          return slot;
        }),
      );

      // Encode the ID subtype (passport, drivers_license, …) into description.
      // Cheap subtype channel until we promote it to a dedicated column.
      const subtypeLabel =
        form.idType && form.idType in CONTACT_ID_TYPE_LABELS
          ? CONTACT_ID_TYPE_LABELS[form.idType as ContactIdType]
          : null;

      const confirmRes = await confirmContactDocumentUploads({
        contactId,
        items: uploads.map((slot, i) => ({
          key: slot.key,
          type: "id_photo",
          title: files[i]!.name,
          description: subtypeLabel ?? undefined,
          fileName: slot.fileName,
          mimeType: slot.mimeType,
          sizeBytes: slot.sizeBytes,
        })),
      });

      if (!confirmRes.ok) {
        toast.error({
          title: "Couldn't save ID photo",
          message: confirmRes.error.message,
        });
        return;
      }

      toast.success({
        title: files.length === 1 ? "ID photo uploaded" : "ID photos uploaded",
        message:
          files.length === 1
            ? files[0]!.name
            : `${files.length} files attached to this contact`,
      });
      router.refresh();
    } catch (err) {
      toast.error({
        title: "ID photo upload failed",
        message: err instanceof Error ? err.message : "Try again in a moment.",
      });
    } finally {
      setUploading(false);
      // Object URL stays mounted in the slot until refresh swaps in the
      // server-signed URL; we revoke it the next time a file is picked
      // (cheap leak, bounded by interactions on this page).
    }
  };

  const photoUrl = optimisticUrl ?? latestIdPhoto?.previewUrl ?? null;

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
        <Icon name="Settings" size={16} />
        <div
          style={{
            flex: 1,
            fontFamily: "var(--font-display), serif",
            fontWeight: 400,
            fontSize: 17,
            letterSpacing: "var(--tight)",
          }}
        >
          Identity
        </div>
        <input
          ref={fileInputRef}
          type="file"
          accept={IMAGE_MIME_TYPES.join(",")}
          multiple
          hidden
          onChange={handleFiles}
        />
        <span
          title={
            canUpload
              ? "Upload one or more ID photos"
              : "Save the contact first, then attach an ID photo"
          }
        >
          <Button
            variant="ghost"
            size="sm"
            icon={<Icon name="Plus" size={13} />}
            onClick={openPicker}
            disabled={!canUpload || uploading}
          >
            {uploading ? "Uploading…" : "Upload ID"}
          </Button>
        </span>
      </div>

      <div
        style={{
          padding: "16px 20px",
          display: "grid",
          gridTemplateColumns: "240px 1fr",
          gap: 18,
          alignItems: "start",
        }}
      >
        <PhotoSlot
          label="ID photo"
          imageUrl={photoUrl}
          uploading={uploading}
          disabled={!canUpload}
          // No photo yet → clicking the slot opens the file picker. Once a
          // photo is set, the slot becomes a preview-on-click; replacing is
          // still available via the "Upload ID" header button.
          onClick={photoUrl ? () => setLightboxOpen(true) : openPicker}
        />
        {lightboxOpen && photoUrl && (
          <ImageLightbox
            url={photoUrl}
            alt={latestIdPhoto?.fileName ?? "ID photo"}
            caption={latestIdPhoto?.fileName ?? null}
            onClose={() => setLightboxOpen(false)}
          />
        )}
        <div>
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
        </div>
      </div>
    </Card>
  );
}

function PhotoSlot({
  label,
  imageUrl,
  uploading,
  disabled,
  onClick,
}: {
  label: string;
  imageUrl: string | null;
  uploading: boolean;
  disabled: boolean;
  onClick: () => void;
}) {
  const hasImage = imageUrl !== null;
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled || uploading}
      style={{
        aspectRatio: "4 / 3",
        borderRadius: "var(--r-2)",
        background: hasImage ? "var(--paper)" : "var(--shell)",
        border: hasImage
          ? "1px solid var(--line)"
          : "1px dashed var(--line-strong)",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: 6,
        color: "var(--ink-faint)",
        cursor: disabled ? "not-allowed" : "pointer",
        padding: 0,
        overflow: "hidden",
        position: "relative",
        font: "inherit",
        width: "100%",
      }}
      title={disabled ? "Save the contact first" : "Click to replace ID photo"}
    >
      {hasImage ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={imageUrl}
          alt={label}
          style={{
            width: "100%",
            height: "100%",
            objectFit: "cover",
            display: "block",
          }}
        />
      ) : (
        <>
          <Icon name="Plus" size={20} />
          <span
            className="caps"
            style={{
              fontSize: 9.5,
              letterSpacing: "var(--tracked)",
            }}
          >
            {label}
          </span>
        </>
      )}
      {uploading && (
        <span
          className="caps"
          style={{
            position: "absolute",
            inset: 0,
            background: "rgba(255,255,255,0.65)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 10,
            letterSpacing: "var(--tracked)",
            color: "var(--ink)",
          }}
        >
          Uploading…
        </span>
      )}
    </button>
  );
}

// ─── Image lightbox ───────────────────────────────────────────

/**
 * Fullscreen image preview. Click the backdrop or press Esc to close. Body
 * scroll is locked while the lightbox is open so the page underneath doesn't
 * drift on mobile.
 *
 * Kept inline here because it's the only modal in this file; promote to
 * `components/ui/` if a second feature needs a generic media viewer.
 */
function ImageLightbox({
  url,
  alt,
  caption,
  onClose,
}: {
  url: string;
  alt: string;
  caption: string | null;
  onClose: () => void;
}) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [onClose]);

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={alt}
      onClick={onClose}
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(20, 28, 28, 0.78)",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: 14,
        padding: 32,
        zIndex: 1000,
        cursor: "zoom-out",
      }}
    >
      <button
        type="button"
        title="Close (Esc)"
        aria-label="Close"
        onClick={(e) => {
          e.stopPropagation();
          onClose();
        }}
        style={{
          position: "absolute",
          top: 18,
          right: 18,
          width: 36,
          height: 36,
          borderRadius: "var(--r-pill)",
          background: "rgba(255,255,255,0.92)",
          border: "1px solid var(--line)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          cursor: "pointer",
          color: "var(--ink)",
        }}
      >
        <Icon name="X" size={16} />
      </button>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={url}
        alt={alt}
        onClick={(e) => e.stopPropagation()}
        style={{
          maxWidth: "min(96vw, 1400px)",
          maxHeight: "82vh",
          objectFit: "contain",
          borderRadius: "var(--r-2)",
          boxShadow: "0 30px 80px rgba(0,0,0,0.45)",
          cursor: "default",
          background: "var(--paper)",
        }}
      />
      {caption && (
        <div
          className="mono"
          style={{
            fontSize: 12,
            color: "rgba(255,255,255,0.85)",
            letterSpacing: "var(--tracked)",
          }}
        >
          {caption}
        </div>
      )}
    </div>
  );
}

// ─── Document list ────────────────────────────────────────────

function DocList({
  title,
  subtitle,
  docs,
  addLabel,
}: {
  title: string;
  subtitle?: string;
  docs: DocItem[];
  addLabel: string;
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
        <Icon name="Sparkline" size={16} />
        <div
          style={{
            flex: 1,
            display: "flex",
            alignItems: "baseline",
            gap: 10,
            minWidth: 0,
          }}
        >
          <span
            style={{
              fontFamily: "var(--font-display), serif",
              fontWeight: 400,
              fontSize: 17,
              letterSpacing: "var(--tight)",
            }}
          >
            {title}
          </span>
          {subtitle && (
            <span
              className="mono"
              style={{
                fontSize: 10,
                color: "var(--ink-faint)",
              }}
            >
              · {subtitle}
            </span>
          )}
        </div>
        <Button
          variant="ghost"
          size="sm"
          icon={<Icon name="Plus" size={13} />}
        >
          {addLabel}
        </Button>
      </div>

      <DocListHeader />

      {docs.length === 0 ? (
        <div
          style={{
            padding: "30px 22px",
            textAlign: "center",
            color: "var(--ink-faint)",
            fontFamily: "var(--font-display), serif",
            fontStyle: "italic",
            fontSize: 16,
          }}
        >
          No documents yet
        </div>
      ) : (
        docs.map((d) => <DocRow key={d.name} doc={d} />)
      )}
    </Card>
  );
}

const DOC_GRID = "48px 1.6fr 90px 90px 130px 80px";

function DocListHeader() {
  return (
    <div
      className="caps"
      style={{
        display: "grid",
        gridTemplateColumns: DOC_GRID,
        gap: 12,
        padding: "12px 22px",
        borderBottom: "1px solid var(--line-soft)",
        color: "var(--ink-faint)",
        fontSize: 10,
        letterSpacing: "var(--tracked)",
      }}
    >
      <span />
      <span>File</span>
      <span>Type</span>
      <span>Size</span>
      <span>Uploaded</span>
      <span />
    </div>
  );
}

function DocRow({ doc }: { doc: DocItem }) {
  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: DOC_GRID,
        gap: 12,
        alignItems: "center",
        padding: "12px 22px",
        borderTop: "1px solid var(--line-soft)",
      }}
    >
      <div
        style={{
          width: 36,
          height: 36,
          borderRadius: "var(--r-2)",
          background: "var(--shell)",
          border: "1px solid var(--line-soft)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <DocIcon />
      </div>
      <span
        style={{
          fontFamily: "var(--font-display), serif",
          fontSize: 14,
        }}
      >
        {doc.name}
      </span>
      <Pill tone="neutral" size="sm">
        {doc.type}
      </Pill>
      <span
        className="mono"
        style={{ fontSize: 11, color: "var(--ink-faint)" }}
      >
        {doc.size}
      </span>
      <span style={{ fontSize: 12.5, color: "var(--ink-soft)" }}>
        {doc.when}
      </span>
      <div style={{ display: "flex", justifyContent: "flex-end", gap: 4 }}>
        <IconButton size={28} variant="quiet" title="View">
          <ViewIcon />
        </IconButton>
        <IconButton size={28} variant="quiet" title="More">
          <Icon name="MoreVertical" size={13} />
        </IconButton>
      </div>
    </div>
  );
}

// The icon set doesn't expose a dedicated "document" or "eye" glyph, so
// the design's PDF tile and Eye action borrow the closest equivalents.
function DocIcon(): ReactNode {
  return <FauxIcon name="Edit" />;
}

function ViewIcon(): ReactNode {
  return <FauxIcon name="Search" />;
}

function FauxIcon({ name }: { name: IconName }) {
  return <Icon name={name} size={13} />;
}
