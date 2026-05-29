"use client"

import { useRef, useState } from "react"
import { Button } from "@/components/ui/primitives"
import { Icon } from "@/components/ui/icon"
import { useToast } from "@/components/ui/toast"
import {
  commitInventoryPhotoUpload,
  presignInventoryPhotoUpload,
} from "../photo-actions"

const ACCEPT = "image/png,image/jpeg,image/webp,image/heic,image/heif,image/gif"
const MAX_BYTES = 10 * 1024 * 1024

export function PhotoUploader({
  photoKey,
  initialUrl,
  onChange,
}: {
  photoKey: string | null
  initialUrl: string | null
  onChange: (key: string | null) => void
}) {
  const fileRef = useRef<HTMLInputElement>(null)
  const toast = useToast()
  const [uploadedUrl, setUploadedUrl] = useState<string | null>(null)
  const [uploading, setUploading] = useState(false)
  const [dragOver, setDragOver] = useState(false)
  // Show the freshly uploaded URL if we have one; otherwise the row's URL
  // when there is still a key, otherwise nothing.
  const url = uploadedUrl ?? (photoKey ? initialUrl : null)

  const onPick = async (file: File) => {
    if (file.size > MAX_BYTES) {
      toast.error({
        title: "File too large",
        message: `Max ${Math.round(MAX_BYTES / 1024 / 1024)}MB per photo.`,
      })
      return
    }
    setUploading(true)
    try {
      const presigned = await presignInventoryPhotoUpload({
        fileName: file.name,
        mimeType: file.type,
        sizeBytes: file.size,
      })
      if (!presigned.ok) {
        toast.error({
          title: "Could not start upload",
          message: presigned.error.message,
        })
        return
      }
      const put = await fetch(presigned.data.uploadUrl, {
        method: "PUT",
        headers: presigned.data.headers,
        body: file,
      })
      if (!put.ok) {
        toast.error({
          title: "Upload failed",
          message: `Storage returned ${put.status}.`,
        })
        return
      }
      const commit = await commitInventoryPhotoUpload({
        key: presigned.data.key,
        sizeBytes: file.size,
      })
      if (!commit.ok) {
        toast.error({
          title: "Upload commit failed",
          message: commit.error.message,
        })
        return
      }
      setUploadedUrl(commit.data.downloadUrl)
      onChange(commit.data.key)
    } finally {
      setUploading(false)
      if (fileRef.current) fileRef.current.value = ""
    }
  }

  const openPicker = () => {
    if (!uploading) fileRef.current?.click()
  }

  return (
    <div>
      <button
        type="button"
        onClick={openPicker}
        onDragEnter={(e) => {
          e.preventDefault()
          setDragOver(true)
        }}
        onDragOver={(e) => {
          e.preventDefault()
          setDragOver(true)
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => {
          e.preventDefault()
          setDragOver(false)
          const f = e.dataTransfer.files?.[0]
          if (f) onPick(f)
        }}
        aria-label={url ? "Replace photo" : "Upload photo"}
        disabled={uploading}
        style={{
          width: "100%",
          padding: 0,
          aspectRatio: "4/3",
          borderRadius: "var(--r-2)",
          overflow: "hidden",
          background: dragOver ? "var(--shell)" : "var(--linen)",
          border: dragOver
            ? "1.5px dashed var(--ink)"
            : "1.5px dashed var(--line-strong)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: "var(--ink-faint)",
          cursor: uploading ? "wait" : "pointer",
          position: "relative",
          font: "inherit",
        }}
      >
        {url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={url}
            alt="Item photo"
            style={{
              width: "100%",
              height: "100%",
              objectFit: "cover",
            }}
          />
        ) : (
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              textAlign: "center",
              padding: 20,
              pointerEvents: "none",
            }}
          >
            <Icon name="Plus" size={24} />
            <div style={{ marginTop: 8, fontSize: 12.5 }}>
              {uploading
                ? "Uploading…"
                : "Click or drag to drop a photo of the item"}
            </div>
          </div>
        )}
      </button>
      <div
        style={{
          marginTop: 12,
          display: "flex",
          alignItems: "center",
          gap: 10,
        }}
      >
        <span style={{ fontSize: 12, color: "var(--ink-soft)" }}>
          PNG, JPG, WEBP — max 10 MB
        </span>
        <span style={{ flex: 1 }} />
        {photoKey && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setUploadedUrl(null)
              onChange(null)
            }}
          >
            Remove
          </Button>
        )}
      </div>
      <input
        ref={fileRef}
        type="file"
        accept={ACCEPT}
        style={{ display: "none" }}
        onChange={(e) => {
          const f = e.target.files?.[0]
          if (f) onPick(f)
        }}
      />
    </div>
  )
}
