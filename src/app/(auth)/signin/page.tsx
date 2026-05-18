"use client"

import { Suspense, useEffect, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { signIn } from "next-auth/react"
import { Button } from "@/components/ui/primitives"
import { Icon } from "@/components/ui/icon"
import { RoomArt } from "@/components/ui/room-art"

export default function SignInPage() {
  return (
    <Suspense fallback={<div style={{ minHeight: "100vh", background: "var(--linen)" }} />}>
      <SignInForm />
    </Suspense>
  )
}

function SignInForm() {
  const router = useRouter()
  const params = useSearchParams()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  // Render the form client-only. Server + first client paint emit the same
  // placeholder, so password-manager extensions (Keeper etc.) that inject
  // DOM into the inputs after load can't cause a hydration mismatch.
  const [mounted, setMounted] = useState(false)
  useEffect(() => setMounted(true), [])
  if (!mounted) {
    return <div style={{ minHeight: "100vh", background: "var(--linen)" }} />
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    setBusy(true)
    setError(null)
    const res = await signIn("credentials", {
      email: email.trim().toLowerCase(),
      password,
      redirect: false,
    })
    setBusy(false)
    if (res?.error) {
      setError("That email and password don't match. Try again.")
      return
    }
    router.push(params.get("callbackUrl") ?? "/home")
    router.refresh()
  }

  return (
    <div style={{ display: "flex", minHeight: "100vh", background: "var(--linen)" }}>
      {/* Editorial brand panel */}
      <div
        style={{
          flex: "1 1 50%", position: "relative", display: "flex",
          flexDirection: "column", justifyContent: "space-between", padding: 48,
          background: "var(--shell)", overflow: "hidden",
        }}
        className="auth-brand"
      >
        <div style={{ position: "absolute", inset: 0, opacity: 0.5 }}>
          <RoomArt palette="warm" />
        </div>
        <div style={{ position: "relative", display: "flex", alignItems: "center", gap: 12 }}>
          <div
            style={{
              width: 40, height: 40, borderRadius: "50%", background: "var(--ink)",
              color: "var(--linen)", display: "flex", alignItems: "center",
              justifyContent: "center", fontFamily: "var(--font-display), serif",
              fontStyle: "italic", fontSize: 19,
            }}
          >
            a
          </div>
          <div className="caps" style={{ color: "var(--ink-soft)" }}>Away at Byron Bay</div>
        </div>
        <div style={{ position: "relative" }}>
          <div className="caps" style={{ color: "var(--ink-faint)", marginBottom: 12 }}>Property management</div>
          <h1
            style={{
              fontFamily: "var(--font-display), serif", fontWeight: 300, fontSize: 48,
              lineHeight: 1.05, letterSpacing: "var(--tight)", maxWidth: 460, margin: 0,
            }}
          >
            One calm place to run <em style={{ fontStyle: "italic" }}>every</em> guesthouse.
          </h1>
          <p style={{ marginTop: 16, fontSize: 14.5, color: "var(--ink-soft)", maxWidth: 420, lineHeight: 1.6 }}>
            Bookings, housekeeping, and the night audit, for Byron Bay, Shirley Lane and
            Unwind, in a single sign-in.
          </p>
        </div>
      </div>

      {/* Form */}
      <div style={{ flex: "1 1 50%", display: "flex", alignItems: "center", justifyContent: "center", padding: 32 }}>
        <form onSubmit={onSubmit} style={{ width: "100%", maxWidth: 380 }}>
          <div className="caps" style={{ color: "var(--ink-faint)" }}>Welcome back</div>
          <h2
            style={{
              fontFamily: "var(--font-display), serif", fontWeight: 300, fontSize: 32,
              letterSpacing: "var(--tight)", margin: "8px 0 28px",
            }}
          >
            Sign in
          </h2>

          {error && (
            <div
              role="alert"
              style={{
                background: "var(--bad-bg)", color: "var(--bad-fg)",
                border: "1px solid rgba(168,98,75,.2)", borderRadius: "var(--r-2)",
                padding: "10px 14px", fontSize: 13, marginBottom: 18,
                display: "flex", alignItems: "center", gap: 8,
              }}
            >
              <Icon name="Alert" size={15} />
              {error}
            </div>
          )}

          <Field label="Email">
            <input
              type="email"
              required
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@awayatbyron.com"
              style={inputStyle}
              suppressHydrationWarning
            />
          </Field>
          <Field label="Password">
            <input
              type="password"
              required
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              style={inputStyle}
              suppressHydrationWarning
            />
          </Field>

          <Button type="submit" variant="primary" size="lg" disabled={busy} style={{ width: "100%", marginTop: 8 }}>
            {busy ? "Signing in…" : "Sign in"}
          </Button>

          <p style={{ marginTop: 18, fontSize: 12.5, color: "var(--ink-faint)", textAlign: "center" }}>
            Trouble signing in? Ask an admin to reset your access.
          </p>
        </form>
      </div>

      <style>{`@media (max-width: 880px){ .auth-brand{ display:none !important } }`}</style>
    </div>
  )
}

const inputStyle: React.CSSProperties = {
  width: "100%", height: 46, padding: "0 14px", fontSize: 14,
  border: "1px solid var(--line-strong)", borderRadius: "var(--r-2)",
  background: "var(--paper)", color: "var(--ink)", outline: "none",
  fontFamily: "var(--font-sans), sans-serif",
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label style={{ display: "block", marginBottom: 16 }} suppressHydrationWarning>
      <span className="caps" style={{ color: "var(--ink-soft)", display: "block", marginBottom: 7 }}>{label}</span>
      {children}
    </label>
  )
}
