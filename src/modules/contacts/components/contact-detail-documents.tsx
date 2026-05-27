"use client";

/**
 * Documents tab — Identity card (ID photo), Booking documents (real upload),
 * and Other documents (still mock until its own task lands).
 *
 * Upload flow (used by Identity + Booking):
 *   1. presignContactDocumentUploads → presigned PUT URL
 *   2. PUT the file directly to MinIO (bypasses Next's 2 MB action body cap)
 *   3. confirmContactDocumentUploads → writes the contact_documents row
 *   4. router.refresh() so the new row appears in the list
 */
import {
  useEffect,
  useRef,
  useState,
  type ChangeEvent,
  type ReactNode,
} from "react";
import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";
import { Button, Card, IconButton } from "@/components/ui/primitives";
import { Icon, type IconName } from "@/components/ui/icon";
import { useToast } from "@/components/ui/toast";
import { useConfirm } from "@/components/ui/dialog";
import {
  ALLOWED_MIME_TYPES,
  MAX_BULK_FILES,
  MAX_FILE_BYTES,
  isAllowedMimeType,
} from "@/lib/upload-limits";
import {
  confirmContactDocumentUploads,
  deleteContactDocument,
  getContactDocumentDownloadUrlAction,
  presignContactDocumentUploads,
} from "@/modules/contact-documents/actions";
import type {
  ContactDocumentType,
  ContactDocumentWithPreview,
} from "@/modules/contact-documents/types";
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

  // Single "Documents" card lists both legacy booking_documents and the
  // current other_documents type so historical uploads stay visible. New
  // uploads from this card are saved as other_documents.
  const docs = documents.filter(
    (d) => d.type === "booking_documents" || d.type === "other_documents",
  );

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      <IdentityCard
        form={form}
        onField={onField}
        setField={setField}
        contactId={contactId}
        latestIdPhoto={latestIdPhoto}
      />
      <DocumentsCard
        title="Documents"
        addLabel="Add document"
        dialogTitle="Add document"
        docType="other_documents"
        contactId={contactId}
        documents={docs}
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
  const confirm = useConfirm();
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [uploading, setUploading] = useState(false);
  const [deleting, setDeleting] = useState(false);
  // Preview the file the user just picked, before the server round trip lands
  // so the slot doesn't go blank mid-upload.
  const [optimisticUrl, setOptimisticUrl] = useState<string | null>(null);
  const [lightboxOpen, setLightboxOpen] = useState(false);

  const canUpload = contactId !== null;
  const hasPhoto = latestIdPhoto !== null;

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

  const handleDelete = async () => {
    if (!latestIdPhoto) return;
    const label = latestIdPhoto.fileName ?? latestIdPhoto.title;
    const ok = await confirm({
      tone: "danger",
      title: "Delete ID photo?",
      message: `${label} will be removed from this contact. The original file is kept and can be restored by an admin.`,
      confirmLabel: "Delete ID photo",
      cancelLabel: "Cancel",
    });
    if (!ok) return;
    setDeleting(true);
    const res = await deleteContactDocument(latestIdPhoto.id);
    setDeleting(false);
    if (!res.ok) {
      toast.error({
        title: "Couldn't delete ID photo",
        message: res.error.message,
      });
      return;
    }
    // Clear any stale optimistic preview so the slot doesn't show the file the
    // user just removed once the server round trip lands.
    setOptimisticUrl(null);
    setLightboxOpen(false);
    toast.success({ title: "ID photo deleted", message: label });
    router.refresh();
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
        {hasPhoto && (
          <Button
            variant="ghost"
            size="sm"
            icon={<Icon name="Trash" size={13} />}
            onClick={handleDelete}
            disabled={!canUpload || uploading || deleting}
          >
            {deleting ? "Deleting…" : "Delete ID"}
          </Button>
        )}
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

// ─── Wired document card (booking docs, and other wired sections) ────

/**
 * Real document section backed by `contact_documents` rows. Renders the list
 * for a single `docType` and opens `UploadDocumentDialog` for the multi-file
 * upload flow. Subtype is free text and persisted into `description` per the
 * subtype-in-description convention (see contact-documents schema).
 */
function DocumentsCard({
  title,
  addLabel,
  dialogTitle,
  docType,
  contactId,
  documents,
}: {
  title: string;
  addLabel: string;
  dialogTitle: string;
  docType: ContactDocumentType;
  contactId: string | null;
  documents: ContactDocumentWithPreview[];
}) {
  const [dialogOpen, setDialogOpen] = useState(false);
  const canUpload = contactId !== null;

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
        <Icon name="File" size={16} />
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
        </div>
        <span
          title={
            canUpload
              ? `Upload one or more ${title.toLowerCase()}`
              : "Save the contact first, then attach a document"
          }
        >
          <Button
            variant="ghost"
            size="sm"
            icon={<Icon name="Plus" size={13} />}
            disabled={!canUpload}
            onClick={() => setDialogOpen(true)}
          >
            {addLabel}
          </Button>
        </span>
      </div>

      <DocListHeader />

      {documents.length === 0 ? (
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
        documents.map((d) => <WiredDocRow key={d.id} doc={d} />)
      )}

      {dialogOpen && canUpload && (
        <UploadDocumentDialog
          title={dialogTitle}
          docType={docType}
          contactId={contactId!}
          onClose={() => setDialogOpen(false)}
        />
      )}
    </Card>
  );
}

function WiredDocRow({ doc }: { doc: ContactDocumentWithPreview }) {
  const router = useRouter();
  const toast = useToast();
  const confirm = useConfirm();
  const [opening, setOpening] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const openFile = async () => {
    // Eager-signed URL exists for images; non-images get a fresh GET URL on
    // click. Keeps signing calls bounded to actual user intent.
    if (doc.previewUrl) {
      window.open(doc.previewUrl, "_blank", "noopener");
      return;
    }
    setOpening(true);
    const res = await getContactDocumentDownloadUrlAction(doc.id);
    setOpening(false);
    if (!res.ok) {
      toast.error({
        title: "Couldn't open document",
        message: res.error.message,
      });
      return;
    }
    window.open(res.data.url, "_blank", "noopener");
  };

  const handleDelete = async () => {
    const label = doc.fileName ?? doc.title;
    const ok = await confirm({
      tone: "danger",
      title: "Delete document?",
      message: `${label} will be removed from this contact's documents. The original file is kept and can be restored by an admin.`,
      confirmLabel: "Delete document",
      cancelLabel: "Cancel",
    });
    if (!ok) return;
    setDeleting(true);
    const res = await deleteContactDocument(doc.id);
    setDeleting(false);
    if (!res.ok) {
      toast.error({
        title: "Couldn't delete document",
        message: res.error.message,
      });
      return;
    }
    toast.success({
      title: "Document deleted",
      message: label,
    });
    router.refresh();
  };

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
      <button
        type="button"
        onClick={openFile}
        disabled={opening}
        style={{
          textAlign: "left",
          background: "transparent",
          border: "none",
          padding: 0,
          cursor: opening ? "wait" : "pointer",
          fontFamily: "var(--font-display), serif",
          fontSize: 14,
          color: "var(--ink)",
          minWidth: 0,
          overflow: "hidden",
          textOverflow: "ellipsis",
          whiteSpace: "nowrap",
        }}
        title={doc.fileName ?? doc.title}
      >
        {doc.fileName ?? doc.title}
      </button>
      <span className="mono" style={{ fontSize: 11, color: "var(--ink-faint)" }}>
        {formatBytes(doc.sizeBytes)}
      </span>
      <span style={{ fontSize: 12.5, color: "var(--ink-soft)" }}>
        {formatUploadedAt(doc.createdAt)}
      </span>
      <div style={{ display: "flex", justifyContent: "flex-end", gap: 4 }}>
        <IconButton size={28} variant="quiet" title="View" onClick={openFile}>
          <ViewIcon />
        </IconButton>
        <IconButton
          size={28}
          variant="quiet"
          title={deleting ? "Deleting…" : "Delete"}
          onClick={handleDelete}
        >
          <Icon name="Trash" size={13} />
        </IconButton>
      </div>
    </div>
  );
}

function formatBytes(bytes: number | null): string {
  if (bytes === null || bytes <= 0) return "—";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

function formatUploadedAt(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString("en-AU", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

// ─── Upload dialog ────────────────────────────────────────────

/**
 * Multi-file upload modal. Lets staff pick N files and tag the whole batch
 * with an optional free-text subtype that's stored in `description`. Same
 * presign → PUT → confirm pattern as the Identity card.
 */
function UploadDocumentDialog({
  title,
  docType,
  contactId,
  onClose,
}: {
  title: string;
  docType: ContactDocumentType;
  contactId: string;
  onClose: () => void;
}) {
  const router = useRouter();
  const toast = useToast();
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [files, setFiles] = useState<File[]>([]);
  const [uploading, setUploading] = useState(false);

  // Esc to close + body scroll lock.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !uploading) onClose();
    };
    document.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [onClose, uploading]);

  const onPickFiles = (e: ChangeEvent<HTMLInputElement>) => {
    const picked = Array.from(e.target.files ?? []);
    e.target.value = "";
    if (!picked.length) return;

    // Merge with current selection so a user can pick from multiple folders.
    // De-dupe by name+size — simple and good enough.
    const merged = [...files];
    for (const f of picked) {
      if (!merged.some((m) => m.name === f.name && m.size === f.size)) {
        merged.push(f);
      }
    }
    if (merged.length > MAX_BULK_FILES) {
      toast.warn({
        title: "Too many files",
        message: `Pick up to ${MAX_BULK_FILES} files at a time.`,
      });
      return;
    }
    setFiles(merged);
  };

  const removeFile = (idx: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== idx));
  };

  const submit = async () => {
    if (!files.length) return;

    for (const f of files) {
      if (!isAllowedMimeType(f.type)) {
        toast.error({
          title: "File type not supported",
          message: `${f.name} isn't a file type we accept. Allowed: PDF, images, Word, Excel, text.`,
        });
        return;
      }
      if (f.size > MAX_FILE_BYTES) {
        toast.error({
          title: "File too large",
          message: `${f.name} is over ${Math.floor(MAX_FILE_BYTES / 1024 / 1024)} MB.`,
        });
        return;
      }
    }

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

      const confirmRes = await confirmContactDocumentUploads({
        contactId,
        items: uploads.map((slot) => ({
          key: slot.key,
          type: docType,
          title: slot.fileName,
          fileName: slot.fileName,
          mimeType: slot.mimeType,
          sizeBytes: slot.sizeBytes,
        })),
      });

      if (!confirmRes.ok) {
        toast.error({
          title: "Couldn't save documents",
          message: confirmRes.error.message,
        });
        return;
      }

      toast.success({
        title: files.length === 1 ? "Document uploaded" : "Documents uploaded",
        message:
          files.length === 1
            ? files[0]!.name
            : `${files.length} files attached to this contact`,
      });
      router.refresh();
      onClose();
    } catch (err) {
      toast.error({
        title: "Upload failed",
        message: err instanceof Error ? err.message : "Try again in a moment.",
      });
    } finally {
      setUploading(false);
    }
  };

  // This component is mounted only after a click in a "use client" tree, so
  // `document` is guaranteed; the SSR guard is belt-and-braces.
  if (typeof document === "undefined") return null;

  return createPortal(
    <div
      role="dialog"
      aria-modal="true"
      aria-label={title}
      onClick={(e) => {
        if (e.target === e.currentTarget && !uploading) onClose();
      }}
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 10000,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "rgba(31,42,42,.78)",
        backdropFilter: "blur(8px)",
        WebkitBackdropFilter: "blur(8px)",
        padding: 16,
      }}
    >
      <div
        style={{
          background: "#FFFFFF",
          borderRadius: 18,
          width: 540,
          maxWidth: "100%",
          maxHeight: "90vh",
          display: "flex",
          flexDirection: "column",
          boxShadow:
            "0 1px 0 rgba(255,255,255,.5) inset, 0 28px 60px -20px rgba(31,42,42,.4), 0 0 0 1px rgba(31,42,42,.05)",
          fontFamily: "var(--font-sans), sans-serif",
        }}
      >
        <div
          style={{
            padding: "20px 24px 14px",
            borderBottom: "1px solid var(--line-soft)",
            fontFamily: "var(--font-display), serif",
            fontWeight: 400,
            fontSize: 21,
            letterSpacing: "-.01em",
            color: "var(--ink)",
          }}
        >
          {title}
        </div>

        <div
          style={{
            padding: 24,
            display: "flex",
            flexDirection: "column",
            gap: 18,
            overflow: "auto",
          }}
        >
          {/* File picker */}
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept={ALLOWED_MIME_TYPES.join(",")}
            onChange={onPickFiles}
            hidden
          />
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            style={{
              padding: "20px",
              borderRadius: "var(--r-2)",
              background: "var(--shell)",
              border: "1px dashed var(--line-strong)",
              cursor: uploading ? "not-allowed" : "pointer",
              color: "var(--ink-soft)",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: 6,
              font: "inherit",
            }}
          >
            <Icon name="Plus" size={20} />
            <span style={{ fontSize: 13 }}>Click to choose files</span>
            <span
              className="mono"
              style={{ fontSize: 10.5, color: "var(--ink-faint)" }}
            >
              Up to {MAX_BULK_FILES} files, {Math.floor(MAX_FILE_BYTES / 1024 / 1024)} MB each
            </span>
          </button>

          {/* Picked file list */}
          {files.length > 0 && (
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: 6,
                maxHeight: 180,
                overflowY: "auto",
                padding: "4px 0",
              }}
            >
              {files.map((f, i) => (
                <div
                  key={`${f.name}-${i}`}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 10,
                    padding: "8px 10px",
                    borderRadius: "var(--r-1)",
                    border: "1px solid var(--line-soft)",
                    background: "var(--paper)",
                  }}
                >
                  <span
                    style={{
                      flex: 1,
                      fontSize: 13,
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                    }}
                    title={f.name}
                  >
                    {f.name}
                  </span>
                  <span
                    className="mono"
                    style={{ fontSize: 11, color: "var(--ink-faint)" }}
                  >
                    {formatBytes(f.size)}
                  </span>
                  <IconButton
                    size={24}
                    variant="quiet"
                    title="Remove"
                    onClick={() => removeFile(i)}
                  >
                    <Icon name="X" size={12} />
                  </IconButton>
                </div>
              ))}
            </div>
          )}

        </div>

        <div
          style={{
            padding: "14px 20px",
            borderTop: "1px solid var(--line-soft)",
            display: "flex",
            justifyContent: "flex-end",
            gap: 8,
          }}
        >
          <Button variant="paper" onClick={onClose} disabled={uploading}>
            Cancel
          </Button>
          <Button
            variant="primary"
            onClick={submit}
            disabled={uploading || files.length === 0}
          >
            {uploading
              ? "Uploading…"
              : files.length > 1
                ? `Upload ${files.length} files`
                : "Upload"}
          </Button>
        </div>
      </div>
    </div>,
    document.body,
  );
}

const DOC_GRID = "48px 1.6fr 90px 130px 80px";

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
      <span>Size</span>
      <span>Uploaded</span>
      <span />
    </div>
  );
}

// The icon set doesn't expose a dedicated "eye" glyph, so the Eye action
// borrows the closest equivalent.
function DocIcon(): ReactNode {
  return <FauxIcon name="File" />;
}

function ViewIcon(): ReactNode {
  return <FauxIcon name="Search" />;
}

function FauxIcon({ name }: { name: IconName }) {
  return <Icon name={name} size={13} />;
}
