"use client";

import { useCallback, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Button, Pill } from "@/components/ui/primitives";
import { Icon } from "@/components/ui/icon";
import { useConfirm } from "@/components/ui/dialog";
import { useToast } from "@/components/ui/toast";
import { MAX_FILE_BYTES } from "@/lib/upload-limits";
import {
  commitPropertyImage,
  deletePropertyImage,
  presignPropertyImageUpload,
  reorderPropertyImage,
} from "@/modules/property-images/actions";
import {
  confirmPropertyDocumentUploads,
  deletePropertyDocument,
  presignPropertyDocumentUploads,
} from "@/modules/property-documents/actions";
import type {
  PropertyImageRole,
  PropertyImageRow,
} from "@/modules/property-images/types";
import type { PropertyDocumentRow } from "@/modules/property-documents/types";
import { SectionCard } from "./property-edit-fields";

const IMAGE_MIME_ACCEPT =
  "image/png,image/jpeg,image/webp,image/gif,image/heic,image/heif";
const DOC_MIME_ACCEPT =
  "application/pdf,image/png,image/jpeg,image/webp,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,text/plain,text/csv";

export function PropertyImagesTab({
  propertyId,
  images,
  documents,
}: {
  propertyId: string;
  images: PropertyImageRow[];
  documents: PropertyDocumentRow[];
}) {
  const logo = images.find((i) => i.role === "logo") ?? null;
  const hero = images.find((i) => i.role === "hero") ?? null;
  const gallery = images
    .filter((i) => i.role === "gallery")
    .sort((a, b) => a.sortOrder - b.sortOrder);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      <BrandLogoCard propertyId={propertyId} image={logo} />
      <GalleryCard propertyId={propertyId} hero={hero} gallery={gallery} />
      <DocumentsCard propertyId={propertyId} rows={documents} />
    </div>
  );
}

// ─── upload helper ─────────────────────────────────────────────

async function uploadOneImage(
  propertyId: string,
  role: PropertyImageRole,
  file: File,
): Promise<{ ok: true } | { ok: false; message: string }> {
  if (file.size > MAX_FILE_BYTES) {
    return {
      ok: false,
      message: `${file.name} is over ${Math.floor(
        MAX_FILE_BYTES / 1024 / 1024,
      )} MB. Shrink it and try again.`,
    };
  }
  const presign = await presignPropertyImageUpload({
    propertyId,
    role,
    fileName: file.name,
    mimeType: file.type,
    sizeBytes: file.size,
  });
  if (!presign.ok) return { ok: false, message: presign.error.message };

  const put = await fetch(presign.data.uploadUrl, {
    method: "PUT",
    headers: presign.data.headers,
    body: file,
  });
  if (!put.ok) {
    return {
      ok: false,
      message: `Upload failed (HTTP ${put.status}). Try again.`,
    };
  }

  const commit = await commitPropertyImage({
    propertyId,
    role,
    key: presign.data.key,
    fileName: file.name,
    mimeType: file.type,
    sizeBytes: file.size,
  });
  if (!commit.ok) return { ok: false, message: commit.error.message };
  return { ok: true };
}

// ─── Brand logo ─────────────────────────────────────────────────

function BrandLogoCard({
  propertyId,
  image,
}: {
  propertyId: string;
  image: PropertyImageRow | null;
}) {
  const router = useRouter();
  const toast = useToast();
  const confirm = useConfirm();
  const inputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);

  const uploadLogo = async (file: File) => {
    setBusy(true);
    const res = await uploadOneImage(propertyId, "logo", file);
    setBusy(false);
    if (!res.ok) {
      toast.error({ title: "Couldn't upload logo", message: res.message });
      return;
    }
    toast.success({ title: "Logo updated", message: file.name });
    router.refresh();
  };

  const onPick = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (file) await uploadLogo(file);
  };

  const onDelete = async () => {
    if (!image) return;
    const okConfirm = await confirm({
      tone: "danger",
      title: "Remove brand logo?",
      message: "The current logo will be removed from this property.",
      confirmLabel: "Remove logo",
      cancelLabel: "Cancel",
    });
    if (!okConfirm) return;
    setBusy(true);
    const res = await deletePropertyImage(image.id);
    setBusy(false);
    if (!res.ok) {
      toast.error({
        title: "Couldn't remove logo",
        message: res.error.message,
      });
      return;
    }
    toast.success({ title: "Logo removed" });
    router.refresh();
  };

  return (
    <SectionCard
      icon="Sparkles"
      title="Property brand logo"
      headerAction={
        <div style={{ display: "flex", gap: 6 }}>
          {image && (
            <Button
              size="sm"
              variant="ghost"
              onClick={onDelete}
              disabled={busy}
            >
              Remove
            </Button>
          )}
          <Button
            size="sm"
            variant="ghost"
            icon={<Icon name="Plus" size={13} />}
            onClick={() => inputRef.current?.click()}
            disabled={busy}
          >
            {image ? "Replace" : "Upload"}
          </Button>
          <input
            ref={inputRef}
            type="file"
            accept={IMAGE_MIME_ACCEPT}
            style={{ display: "none" }}
            onChange={onPick}
          />
        </div>
      }
    >
      <div
        style={{
          padding: "20px 22px",
          display: "grid",
          gridTemplateColumns: "220px 1fr",
          gap: 24,
          alignItems: "center",
        }}
      >
        <ImageSlot
          src={image?.downloadUrl ?? null}
          alt="Property logo"
          aspect="1/1"
          radius="var(--r-3)"
          placeholder="Drop logo"
          busy={busy}
          onPickFile={(f) => void uploadLogo(f)}
        />
        <div>
          <div
            className="caps"
            style={{
              color: "var(--ink-faint)",
              fontSize: 10,
              letterSpacing: "var(--tracked)",
            }}
          >
            Property logo · {propertyId.slice(0, 8).toUpperCase()}
          </div>
          <div
            style={{
              fontSize: 13,
              color: "var(--ink-soft)",
              marginTop: 8,
              lineHeight: 1.55,
              maxWidth: 480,
            }}
          >
            Upload Property Logo Here
          </div>
        </div>
      </div>
    </SectionCard>
  );
}

// ─── Gallery (hero + grid) ─────────────────────────────────────

function GalleryCard({
  propertyId,
  hero,
  gallery,
}: {
  propertyId: string;
  hero: PropertyImageRow | null;
  gallery: PropertyImageRow[];
}) {
  const router = useRouter();
  const toast = useToast();
  const confirm = useConfirm();
  const heroInputRef = useRef<HTMLInputElement>(null);
  const galleryInputRef = useRef<HTMLInputElement>(null);
  const [heroBusy, setHeroBusy] = useState(false);
  const [galleryBusy, setGalleryBusy] = useState(false);
  const [movingId, setMovingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const uploadHero = async (file: File) => {
    setHeroBusy(true);
    const res = await uploadOneImage(propertyId, "hero", file);
    setHeroBusy(false);
    if (!res.ok) {
      toast.error({ title: "Couldn't upload hero", message: res.message });
      return;
    }
    toast.success({ title: "Hero image updated", message: file.name });
    router.refresh();
  };

  const onHeroPick = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (file) await uploadHero(file);
  };

  const onGalleryPick = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    e.target.value = "";
    if (files.length === 0) return;
    setGalleryBusy(true);
    let successCount = 0;
    for (const file of files) {
      const res = await uploadOneImage(propertyId, "gallery", file);
      if (res.ok) successCount++;
      else
        toast.error({
          title: `Couldn't upload ${file.name}`,
          message: res.message,
        });
    }
    setGalleryBusy(false);
    if (successCount > 0) {
      toast.success({
        title:
          successCount === 1 ? "Photo added" : `${successCount} photos added`,
        message: "Gallery updated.",
      });
      router.refresh();
    }
  };

  const onHeroDelete = async () => {
    if (!hero) return;
    const ok = await confirm({
      tone: "danger",
      title: "Remove hero image?",
      message: "The current hero image will be removed from this property.",
      confirmLabel: "Remove hero",
      cancelLabel: "Cancel",
    });
    if (!ok) return;
    setHeroBusy(true);
    const res = await deletePropertyImage(hero.id);
    setHeroBusy(false);
    if (!res.ok) {
      toast.error({
        title: "Couldn't remove hero",
        message: res.error.message,
      });
      return;
    }
    toast.success({ title: "Hero image removed" });
    router.refresh();
  };

  const onGalleryDelete = async (img: PropertyImageRow) => {
    const ok = await confirm({
      tone: "danger",
      title: "Remove this photo?",
      message: "It will be removed from the gallery.",
      confirmLabel: "Remove photo",
      cancelLabel: "Cancel",
    });
    if (!ok) return;
    setDeletingId(img.id);
    const res = await deletePropertyImage(img.id);
    setDeletingId(null);
    if (!res.ok) {
      toast.error({
        title: "Couldn't remove photo",
        message: res.error.message,
      });
      return;
    }
    toast.success({ title: "Photo removed" });
    router.refresh();
  };

  const onMove = async (img: PropertyImageRow, direction: "up" | "down") => {
    setMovingId(img.id);
    const res = await reorderPropertyImage(img.id, direction);
    setMovingId(null);
    if (!res.ok) {
      toast.error({ title: "Couldn't reorder", message: res.error.message });
      return;
    }
    router.refresh();
  };

  return (
    <SectionCard
      icon="Layout"
      title="Property image gallery"
      headerAction={
        <Button
          size="sm"
          variant="ghost"
          icon={<Icon name="Plus" size={13} />}
          onClick={() => galleryInputRef.current?.click()}
          disabled={galleryBusy}
        >
          {galleryBusy ? "Uploading…" : "Add image"}
        </Button>
      }
    >
      <input
        ref={galleryInputRef}
        type="file"
        accept={IMAGE_MIME_ACCEPT}
        multiple
        style={{ display: "none" }}
        onChange={onGalleryPick}
      />

      <div style={{ padding: "18px 22px" }}>
        {/* Hero */}
        <div style={{ marginBottom: 14 }}>
          <div
            style={{
              display: "flex",
              alignItems: "baseline",
              gap: 10,
              marginBottom: 8,
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
              Hero · header image
            </div>
            <span style={{ flex: 1 }} />
            {hero && (
              <button
                type="button"
                onClick={onHeroDelete}
                disabled={heroBusy}
                style={{
                  background: "transparent",
                  border: "none",
                  cursor: heroBusy ? "wait" : "pointer",
                  color: "var(--ink-soft)",
                  fontSize: 12,
                  font: "inherit",
                  padding: "2px 6px",
                }}
              >
                Remove
              </button>
            )}
            <button
              type="button"
              onClick={() => heroInputRef.current?.click()}
              disabled={heroBusy}
              style={{
                background: "transparent",
                border: "none",
                cursor: heroBusy ? "wait" : "pointer",
                color: "var(--ink)",
                fontSize: 12,
                font: "inherit",
                padding: "2px 6px",
                fontWeight: 600,
              }}
            >
              {hero ? "Replace" : "Upload"}
            </button>
            <input
              ref={heroInputRef}
              type="file"
              accept={IMAGE_MIME_ACCEPT}
              style={{ display: "none" }}
              onChange={onHeroPick}
            />
          </div>
          <div style={{ maxWidth: 840, position: "relative" }}>
            <ImageSlot
              src={hero?.downloadUrl ?? null}
              alt="Property hero image"
              aspect="16/7"
              radius="var(--r-2)"
              placeholder="Drop the hero image for this property"
              busy={heroBusy}
              onPickFile={(f) => void uploadHero(f)}
            />
            {hero && (
              <span style={{ position: "absolute", top: 10, left: 10 }}>
                <Pill tone="ink" size="sm">
                  Hero
                </Pill>
              </span>
            )}
          </div>
        </div>

        {/* Gallery */}
        <div
          className="caps"
          style={{
            color: "var(--ink-faint)",
            fontSize: 10,
            letterSpacing: "var(--tracked)",
            marginBottom: 8,
          }}
        >
          Gallery · {gallery.length} photo{gallery.length === 1 ? "" : "s"}
        </div>
        {gallery.length === 0 ? (
          <div
            style={{
              padding: "32px 12px",
              textAlign: "center",
              color: "var(--ink-soft)",
              fontSize: 13.5,
              background: "var(--linen-soft)",
              border: "1px dashed var(--line-strong)",
              borderRadius: "var(--r-2)",
            }}
          >
            No gallery photos yet. Click &ldquo;Add image&rdquo; above.
          </div>
        ) : (
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(4, 1fr)",
              gap: 10,
            }}
          >
            {gallery.map((img, i) => {
              const isFirst = i === 0;
              const isLast = i === gallery.length - 1;
              const isMoving = movingId === img.id;
              const isDeleting = deletingId === img.id;
              return (
                <div
                  key={img.id}
                  style={{
                    aspectRatio: "4/3",
                    borderRadius: "var(--r-2)",
                    overflow: "hidden",
                    position: "relative",
                    background: "var(--linen)",
                    border: "1px solid var(--line)",
                  }}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={img.downloadUrl}
                    alt={img.caption ?? `Gallery photo ${i + 1}`}
                    style={{
                      width: "100%",
                      height: "100%",
                      objectFit: "cover",
                      display: "block",
                    }}
                  />
                  <div
                    style={{
                      position: "absolute",
                      inset: 0,
                      background:
                        "linear-gradient(180deg, transparent 50%, rgba(0,0,0,.45) 100%)",
                      pointerEvents: "none",
                    }}
                  />
                  <div
                    style={{
                      position: "absolute",
                      top: 8,
                      right: 8,
                      display: "flex",
                      gap: 4,
                    }}
                  >
                    <IconBtn
                      title="Move left"
                      disabled={isFirst || isMoving}
                      onClick={() => onMove(img, "up")}
                    >
                      <Icon name="ChevronUp" size={13} />
                    </IconBtn>
                    <IconBtn
                      title="Move right"
                      disabled={isLast || isMoving}
                      onClick={() => onMove(img, "down")}
                    >
                      <Icon name="ChevronDown" size={13} />
                    </IconBtn>
                    <IconBtn
                      title="Remove"
                      disabled={isDeleting}
                      onClick={() => onGalleryDelete(img)}
                    >
                      <Icon name="Trash" size={13} />
                    </IconBtn>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </SectionCard>
  );
}

function IconBtn({
  children,
  onClick,
  title,
  disabled,
}: {
  children: React.ReactNode;
  onClick: () => void;
  title: string;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      title={title}
      onClick={onClick}
      disabled={disabled}
      style={{
        width: 24,
        height: 24,
        borderRadius: "50%",
        border: "none",
        background: "rgba(20,18,16,.65)",
        color: "var(--linen)",
        cursor: disabled ? "not-allowed" : "pointer",
        opacity: disabled ? 0.4 : 1,
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      {children}
    </button>
  );
}

// ─── Documents table ───────────────────────────────────────────

function DocumentsCard({
  propertyId,
  rows,
}: {
  propertyId: string;
  rows: PropertyDocumentRow[];
}) {
  const router = useRouter();
  const toast = useToast();
  const confirm = useConfirm();
  const inputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const onPick = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = Array.from(e.target.files ?? []);
      e.target.value = "";
      if (files.length === 0) return;

      for (const f of files) {
        if (f.size > MAX_FILE_BYTES) {
          toast.error({
            title: "File too large",
            message: `${f.name} is over ${Math.floor(
              MAX_FILE_BYTES / 1024 / 1024,
            )} MB.`,
          });
          return;
        }
      }

      setBusy(true);
      try {
        const presign = await presignPropertyDocumentUploads({
          propertyId,
          files: files.map((f) => ({
            fileName: f.name,
            mimeType: f.type,
            sizeBytes: f.size,
          })),
        });
        if (!presign.ok) {
          toast.error({
            title: "Couldn't start upload",
            message: presign.error.message,
          });
          return;
        }

        const uploads = await Promise.all(
          presign.data.map(async (slot, i) => {
            const file = files[i]!;
            const res = await fetch(slot.uploadUrl, {
              method: "PUT",
              headers: slot.headers,
              body: file,
            });
            if (!res.ok) {
              throw new Error(
                `Upload failed for ${file.name} (HTTP ${res.status})`,
              );
            }
            return slot;
          }),
        );

        const confirmRes = await confirmPropertyDocumentUploads({
          propertyId,
          items: uploads.map((slot, i) => ({
            key: slot.key,
            title: files[i]!.name,
            fileName: slot.fileName,
            mimeType: slot.mimeType,
            sizeBytes: slot.sizeBytes,
          })),
        });
        if (!confirmRes.ok) {
          toast.error({
            title: "Couldn't save document",
            message: confirmRes.error.message,
          });
          return;
        }

        toast.success({
          title:
            files.length === 1 ? "Document uploaded" : "Documents uploaded",
          message:
            files.length === 1
              ? files[0]!.name
              : `${files.length} files attached.`,
        });
        router.refresh();
      } catch (err) {
        toast.error({
          title: "Upload failed",
          message: err instanceof Error ? err.message : "Try again.",
        });
      } finally {
        setBusy(false);
      }
    },
    [propertyId, router, toast],
  );

  const onDelete = async (doc: PropertyDocumentRow) => {
    const ok = await confirm({
      tone: "danger",
      title: `Delete ${doc.title}?`,
      message: "The file will be removed from this property.",
      confirmLabel: "Delete document",
      cancelLabel: "Cancel",
    });
    if (!ok) return;
    setDeletingId(doc.id);
    const res = await deletePropertyDocument(doc.id);
    setDeletingId(null);
    if (!res.ok) {
      toast.error({ title: "Couldn't delete", message: res.error.message });
      return;
    }
    toast.success({ title: "Document deleted" });
    router.refresh();
  };

  const GRID = "48px 1.6fr 90px 90px 130px 80px";

  return (
    <SectionCard
      icon="File"
      title="Documents & attachments"
      headerAction={
        <Button
          size="sm"
          variant="ghost"
          icon={<Icon name="Plus" size={13} />}
          onClick={() => inputRef.current?.click()}
          disabled={busy}
        >
          {busy ? "Uploading…" : "Upload file"}
        </Button>
      }
    >
      <input
        ref={inputRef}
        type="file"
        accept={DOC_MIME_ACCEPT}
        multiple
        style={{ display: "none" }}
        onChange={onPick}
      />
      <div>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: GRID,
            gap: 12,
            padding: "12px 22px",
            borderBottom: "1px solid var(--line-soft)",
            fontFamily: "var(--font-mono), monospace",
            fontSize: 10,
            textTransform: "uppercase",
            letterSpacing: "var(--tracked)",
            color: "var(--ink-faint)",
            fontWeight: 500,
          }}
        >
          <span />
          <span>File</span>
          <span>Type</span>
          <span>Size</span>
          <span>Uploaded</span>
          <span />
        </div>
        {rows.length === 0 ? (
          <div
            style={{
              padding: "32px 22px",
              textAlign: "center",
              color: "var(--ink-soft)",
              fontSize: 13.5,
            }}
          >
            No documents uploaded yet.
          </div>
        ) : (
          rows.map((d) => (
            <div
              key={d.id}
              style={{
                display: "grid",
                gridTemplateColumns: GRID,
                gap: 12,
                alignItems: "center",
                padding: "12px 22px",
                borderBottom: "1px solid var(--line-soft)",
              }}
            >
              <div
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: "var(--r-2)",
                  background: "var(--linen)",
                  border: "1px solid var(--line-soft)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Icon name="File" size={15} />
              </div>
              <a
                href={d.downloadUrl}
                target="_blank"
                rel="noreferrer"
                style={{
                  fontFamily: "var(--font-display), serif",
                  fontSize: 14,
                  color: "var(--ink)",
                  textDecoration: "none",
                }}
              >
                {d.title || d.fileName}
              </a>
              <span style={{ fontSize: 12, color: "var(--ink-soft)" }}>
                {prettyMimeLabel(d.mimeType)}
              </span>
              <span
                className="mono"
                style={{ fontSize: 11, color: "var(--ink-faint)" }}
              >
                {prettySize(d.sizeBytes)}
              </span>
              <span style={{ fontSize: 12.5, color: "var(--ink-soft)" }}>
                {formatDate(d.uploadedAt)}
              </span>
              <div
                style={{ display: "flex", gap: 4, justifyContent: "flex-end" }}
              >
                <a
                  href={d.downloadUrl}
                  target="_blank"
                  rel="noreferrer"
                  title="Open"
                  style={{
                    width: 28,
                    height: 28,
                    borderRadius: "50%",
                    display: "inline-flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: "var(--ink-soft)",
                    background: "transparent",
                    border: "none",
                  }}
                >
                  <Icon name="ArrowRight" size={13} />
                </a>
                <button
                  type="button"
                  title="Delete"
                  onClick={() => onDelete(d)}
                  disabled={deletingId === d.id}
                  style={{
                    width: 28,
                    height: 28,
                    borderRadius: "50%",
                    border: "none",
                    background: "transparent",
                    cursor: deletingId === d.id ? "wait" : "pointer",
                    color: "var(--ink-soft)",
                  }}
                >
                  <Icon name="Trash" size={13} />
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </SectionCard>
  );
}

// ─── shared primitives ─────────────────────────────────────────

function ImageSlot({
  src,
  alt,
  aspect = "1/1",
  radius = "var(--r-3)",
  placeholder,
  busy,
  onPickFile,
  accept = IMAGE_MIME_ACCEPT,
}: {
  src: string | null;
  alt: string;
  aspect?: string;
  radius?: string;
  placeholder: string;
  busy?: boolean;
  /** When provided, the slot becomes a click + drop zone for a single file. */
  onPickFile?: (file: File) => void;
  accept?: string;
}) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = useState(false);
  const interactive = Boolean(onPickFile) && !busy;

  const handleFile = (file: File | null | undefined) => {
    if (!file || !onPickFile) return;
    if (!file.type.startsWith("image/")) return;
    onPickFile(file);
  };

  return (
    <div
      role={interactive ? "button" : undefined}
      tabIndex={interactive ? 0 : undefined}
      onClick={interactive ? () => fileInputRef.current?.click() : undefined}
      onKeyDown={
        interactive
          ? (e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                fileInputRef.current?.click();
              }
            }
          : undefined
      }
      onDragOver={
        interactive
          ? (e) => {
              e.preventDefault();
              setDragOver(true);
            }
          : undefined
      }
      onDragLeave={interactive ? () => setDragOver(false) : undefined}
      onDrop={
        interactive
          ? (e) => {
              e.preventDefault();
              setDragOver(false);
              handleFile(e.dataTransfer.files?.[0]);
            }
          : undefined
      }
      style={{
        aspectRatio: aspect,
        borderRadius: radius,
        overflow: "hidden",
        background: dragOver ? "var(--linen-soft)" : "var(--linen)",
        border: src
          ? "1px solid var(--line)"
          : dragOver
            ? "1px dashed var(--ink)"
            : "1px dashed var(--line-strong)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        color: "var(--ink-faint)",
        flexDirection: "column",
        gap: 6,
        padding: 12,
        textAlign: "center",
        position: "relative",
        cursor: interactive ? "pointer" : "default",
        transition: "background .12s, border-color .12s",
      }}
    >
      {src ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={src}
          alt={alt}
          style={{
            position: "absolute",
            inset: 0,
            width: "100%",
            height: "100%",
            objectFit: "cover",
          }}
        />
      ) : (
        <>
          <Icon name="House" size={20} />
          <div style={{ fontSize: 11.5 }}>{placeholder}</div>
          {interactive && (
            <div
              className="mono"
              style={{
                fontSize: 9.5,
                color: "var(--ink-faint)",
                letterSpacing: ".06em",
                textTransform: "uppercase",
                marginTop: 2,
              }}
            >
              Click or drop
            </div>
          )}
        </>
      )}
      {busy && (
        <div
          style={{
            position: "absolute",
            inset: 0,
            background: "rgba(251,248,243,.55)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 12,
            color: "var(--ink-soft)",
          }}
        >
          Uploading…
        </div>
      )}
      {interactive && (
        <input
          ref={fileInputRef}
          type="file"
          accept={accept}
          style={{ display: "none" }}
          onChange={(e) => {
            const file = e.target.files?.[0];
            e.target.value = "";
            handleFile(file);
          }}
        />
      )}
    </div>
  );
}

function prettySize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

function prettyMimeLabel(mime: string): string {
  if (mime === "application/pdf") return "PDF";
  if (mime.startsWith("image/"))
    return mime.replace("image/", "").toUpperCase();
  if (mime.includes("word")) return "DOC";
  if (mime.includes("excel") || mime.includes("spreadsheet")) return "XLS";
  if (mime === "text/csv") return "CSV";
  if (mime === "text/plain") return "TXT";
  return mime.split("/").pop()?.toUpperCase() ?? "FILE";
}

function formatDate(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleDateString("en-AU", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}
