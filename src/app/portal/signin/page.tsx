"use client"

import { Suspense, useEffect, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { signIn } from "next-auth/react"
import { Button } from "@/components/ui/primitives"
import { Icon } from "@/components/ui/icon"
import { requestContactOtp } from "./actions"

export default function PortalSignInPage() {
  return (
    <Suspense fallback={<div style={{ minHeight: "100vh", background: "var(--linen)" }} />}>
      <PortalSignInForm />
    </Suspense>
  )
}

type Step = "email" | "otp"

function PortalSignInForm() {
  const router = useRouter()
  const params = useSearchParams()
  const [step, setStep] = useState<Step>("email")
  const [email, setEmail] = useState("")
  const [otp, setOtp] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  const [mounted, setMounted] = useState(false)
  useEffect(() => setMounted(true), [])
  if (!mounted) {
    return <div style={{ minHeight: "100vh", background: "var(--linen)" }} />
  }

  async function onSubmitEmail(e: React.FormEvent) {
    e.preventDefault()
    setBusy(true)
    setError(null)
    const res = await requestContactOtp({ email: email.trim().toLowerCase() })
    setBusy(false)
    if (!res.ok) {
      setError(res.error.message)
      return
    }
    setStep("otp")
  }

  async function onSubmitOtp(e: React.FormEvent) {
    e.preventDefault()
    setBusy(true)
    setError(null)
    const res = await signIn("contact-otp", {
      email: email.trim().toLowerCase(),
      otp: otp.trim(),
      redirect: false,
    })
    setBusy(false)
    if (res?.error) {
      setError("That code didn't work. Try again or request a new one.")
      return
    }
    router.push(params.get("callbackUrl") ?? "/portal/dashboard")
    router.refresh()
  }

  async function onResend() {
    setBusy(true)
    setError(null)
    const res = await requestContactOtp({ email: email.trim().toLowerCase() })
    setBusy(false)
    if (!res.ok) {
      setError(res.error.message)
      return
    }
    setOtp("")
  }

  function onBack() {
    setStep("email")
    setOtp("")
    setError(null)
  }

  return (
    <div
      style={{
        display: "flex",
        minHeight: "100vh",
        background: "var(--linen)",
        alignItems: "center",
        justifyContent: "center",
        padding: 32,
      }}
    >
      <div style={{ width: "100%", maxWidth: 420 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 32 }}>
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

        {step === "email" ? (
          <form onSubmit={onSubmitEmail}>
            <div className="caps" style={{ color: "var(--ink-faint)" }}>Portal</div>
            <h2
              style={{
                fontFamily: "var(--font-display), serif", fontWeight: 300, fontSize: 32,
                letterSpacing: "var(--tight)", margin: "8px 0 16px",
              }}
            >
              Sign in
            </h2>
            <p style={{ color: "var(--ink-soft)", fontSize: 13.5, lineHeight: 1.55, margin: "0 0 22px" }}>
              Enter the email your contact is registered under. We'll email a
              6-digit code to sign you in.
            </p>

            {error && <ErrorBanner message={error} />}

            <Field label="Email">
              <input
                type="email"
                required
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                style={inputStyle}
                suppressHydrationWarning
              />
            </Field>

            <Button type="submit" variant="primary" size="lg" disabled={busy} style={{ width: "100%", marginTop: 8 }}>
              {busy ? "Sending…" : "Send me a code"}
            </Button>
          </form>
        ) : (
          <form onSubmit={onSubmitOtp}>
            <div className="caps" style={{ color: "var(--ink-faint)" }}>Portal</div>
            <h2
              style={{
                fontFamily: "var(--font-display), serif", fontWeight: 300, fontSize: 32,
                letterSpacing: "var(--tight)", margin: "8px 0 16px",
              }}
            >
              Enter your code
            </h2>
            <p style={{ fontSize: 13.5, color: "var(--ink-soft)", margin: "0 0 22px", lineHeight: 1.55 }}>
              If <strong style={{ color: "var(--ink)" }}>{email}</strong> is in our system, we just
              emailed a 6-digit code. It expires in 10 minutes.
            </p>

            {error && <ErrorBanner message={error} />}

            <Field label="Sign-in code">
              <input
                type="text"
                inputMode="numeric"
                pattern="\d{6}"
                maxLength={6}
                required
                autoComplete="one-time-code"
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))}
                placeholder="123456"
                style={{ ...inputStyle, letterSpacing: 6, fontSize: 18, textAlign: "center" }}
                suppressHydrationWarning
                autoFocus
              />
            </Field>

            <Button type="submit" variant="primary" size="lg" disabled={busy || otp.length !== 6} style={{ width: "100%", marginTop: 8 }}>
              {busy ? "Signing in…" : "Sign in"}
            </Button>

            <div style={{ display: "flex", justifyContent: "space-between", marginTop: 16, fontSize: 12.5 }}>
              <button type="button" onClick={onBack} disabled={busy} style={linkButtonStyle}>
                Back
              </button>
              <button type="button" onClick={onResend} disabled={busy} style={linkButtonStyle}>
                Resend code
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  )
}

function ErrorBanner({ message }: { message: string }) {
  return (
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
      {message}
    </div>
  )
}

const inputStyle: React.CSSProperties = {
  width: "100%", height: 46, padding: "0 14px", fontSize: 14,
  border: "1px solid var(--line-strong)", borderRadius: "var(--r-2)",
  background: "var(--paper)", color: "var(--ink)", outline: "none",
  fontFamily: "var(--font-sans), sans-serif",
}

const linkButtonStyle: React.CSSProperties = {
  background: "none", border: "none", padding: 0, cursor: "pointer",
  color: "var(--ink-soft)", textDecoration: "underline",
  fontFamily: "var(--font-sans), sans-serif", fontSize: 12.5,
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label style={{ display: "block", marginBottom: 16 }} suppressHydrationWarning>
      <span className="caps" style={{ color: "var(--ink-soft)", display: "block", marginBottom: 7 }}>{label}</span>
      {children}
    </label>
  )
}
