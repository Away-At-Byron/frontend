"use client";

import { Suspense, useState, useSyncExternalStore } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { signIn } from "next-auth/react";
import { Button } from "@/components/ui/primitives";
import { Icon } from "@/components/ui/icon";
import { RoomArt } from "@/components/ui/room-art";
import { requestOtp } from "./actions";

export default function SignInPage() {
  return (
    <Suspense
      fallback={
        <div style={{ minHeight: "100vh", background: "var(--linen)" }} />
      }
    >
      <SignInForm />
    </Suspense>
  );
}

type Step = "credentials" | "otp";

function SignInForm() {
  const router = useRouter();
  const params = useSearchParams();
  const [step, setStep] = useState<Step>("credentials");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(false);
  const [otp, setOtp] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const mounted = useSyncExternalStore(subscribeNoop, getTrue, getFalse);

  if (!mounted) {
    return <div style={{ minHeight: "100vh", background: "var(--linen)" }} />;
  }

  async function onSubmitCredentials(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    const res = await requestOtp({
      email: email.trim().toLowerCase(),
      password,
    });
    setBusy(false);
    if (!res.ok) {
      setError(res.error.message);
      return;
    }
    setStep("otp");
  }

  async function onSubmitOtp(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    const res = await signIn("credentials", {
      email: email.trim().toLowerCase(),
      password,
      otp: otp.trim(),
      rememberMe: rememberMe ? "true" : "false",
      redirect: false,
    });
    setBusy(false);
    if (res?.error) {
      setError("That code didn't work. Try again or request a new one.");
      return;
    }
    router.push(params.get("callbackUrl") ?? "/home");
    router.refresh();
  }

  async function onResend() {
    setBusy(true);
    setError(null);
    const res = await requestOtp({
      email: email.trim().toLowerCase(),
      password,
    });
    setBusy(false);
    if (!res.ok) {
      setError(res.error.message);
      return;
    }
    setOtp("");
  }

  function onBack() {
    setStep("credentials");
    setOtp("");
    setError(null);
  }

  return (
    <div
      style={{
        display: "flex",
        minHeight: "100vh",
        background: "var(--linen)",
      }}
    >
      {/* Editorial brand panel */}
      <div
        style={{
          flex: "1 1 50%",
          position: "relative",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: 48,
          background: "var(--shell)",
          overflow: "hidden",
        }}
        className="auth-brand"
      >
        <div style={{ position: "absolute", inset: 0, opacity: 0.5 }}>
          <RoomArt palette="warm" />
        </div>
        <div
          style={{
            position: "relative",
            display: "flex",
            alignItems: "center",
            gap: 12,
          }}
        >
          <div
            style={{
              width: 40,
              height: 40,
              borderRadius: "50%",
              background: "var(--ink)",
              color: "var(--linen)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontFamily: "var(--font-display), serif",
              fontStyle: "italic",
              fontSize: 19,
            }}
          >
            a
          </div>
          <div className="caps" style={{ color: "var(--ink-soft)" }}>
            Away at Byron Bay
          </div>
        </div>
        <div style={{ position: "relative" }}>
          <div
            className="caps"
            style={{ color: "var(--ink-faint)", marginBottom: 12 }}
          >
            Property management
          </div>
          <h1
            style={{
              fontFamily: "var(--font-display), serif",
              fontWeight: 300,
              fontSize: 48,
              lineHeight: 1.05,
              letterSpacing: "var(--tight)",
              maxWidth: 460,
              margin: 0,
            }}
          >
            One calm place to run <em style={{ fontStyle: "italic" }}>every</em>{" "}
            guesthouse.
          </h1>
          <p
            style={{
              marginTop: 16,
              fontSize: 14.5,
              color: "var(--ink-soft)",
              maxWidth: 420,
              lineHeight: 1.6,
            }}
          >
            Bookings, housekeeping, and the night audit, for Byron Bay, Shirley
            Lane and Unwind, in a single sign-in.
          </p>
        </div>
      </div>

      {/* Form */}
      <div
        style={{
          flex: "1 1 50%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: 32,
        }}
      >
        {step === "credentials" ? (
          <form
            onSubmit={onSubmitCredentials}
            style={{ width: "100%", maxWidth: 380 }}
          >
            <div className="caps" style={{ color: "var(--ink-faint)" }}>
              Welcome back
            </div>
            <h2
              style={{
                fontFamily: "var(--font-display), serif",
                fontWeight: 300,
                fontSize: 32,
                letterSpacing: "var(--tight)",
                margin: "8px 0 28px",
              }}
            >
              Sign in
            </h2>

            {error && <ErrorBanner message={error} />}

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

            <label
              style={{
                display: "flex",
                alignItems: "center",
                gap: 9,
                marginBottom: 18,
                fontSize: 13,
                color: "var(--ink-soft)",
                cursor: "pointer",
                userSelect: "none",
              }}
            >
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                style={{ width: 15, height: 15, accentColor: "var(--ink)" }}
              />
              Keep me signed in for 30 days
            </label>

            <Button
              type="submit"
              variant="primary"
              size="lg"
              disabled={busy}
              style={{ width: "100%", marginTop: 8 }}
            >
              {busy ? "Checking…" : "Continue"}
            </Button>

            <p
              style={{
                marginTop: 18,
                fontSize: 12.5,
                color: "var(--ink-faint)",
                textAlign: "center",
              }}
            >
              Trouble signing in? Ask an admin to reset your access.
            </p>
          </form>
        ) : (
          <form onSubmit={onSubmitOtp} style={{ width: "100%", maxWidth: 380 }}>
            <div className="caps" style={{ color: "var(--ink-faint)" }}>
              Two-step sign in
            </div>
            <h2
              style={{
                fontFamily: "var(--font-display), serif",
                fontWeight: 300,
                fontSize: 32,
                letterSpacing: "var(--tight)",
                margin: "8px 0 16px",
              }}
            >
              Enter your code
            </h2>
            <p
              style={{
                fontSize: 13.5,
                color: "var(--ink-soft)",
                margin: "0 0 22px",
                lineHeight: 1.55,
              }}
            >
              We emailed a 6-digit code to{" "}
              <strong style={{ color: "var(--ink)" }}>{email}</strong>. It
              expires in 10 minutes.
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
                style={{
                  ...inputStyle,
                  letterSpacing: 6,
                  fontSize: 18,
                  textAlign: "center",
                }}
                suppressHydrationWarning
                autoFocus
              />
            </Field>

            <Button
              type="submit"
              variant="primary"
              size="lg"
              disabled={busy || otp.length !== 6}
              style={{ width: "100%", marginTop: 8 }}
            >
              {busy ? "Signing in…" : "Sign in"}
            </Button>

            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                marginTop: 16,
                fontSize: 12.5,
              }}
            >
              <button
                type="button"
                onClick={onBack}
                disabled={busy}
                style={linkButtonStyle}
              >
                Back
              </button>
              <button
                type="button"
                onClick={onResend}
                disabled={busy}
                style={linkButtonStyle}
              >
                Resend code
              </button>
            </div>
          </form>
        )}
      </div>

      <style>{`@media (max-width: 880px){ .auth-brand{ display:none !important } }`}</style>
    </div>
  );
}

function ErrorBanner({ message }: { message: string }) {
  return (
    <div
      role="alert"
      style={{
        background: "var(--bad-bg)",
        color: "var(--bad-fg)",
        border: "1px solid rgba(168,98,75,.2)",
        borderRadius: "var(--r-2)",
        padding: "10px 14px",
        fontSize: 13,
        marginBottom: 18,
        display: "flex",
        alignItems: "center",
        gap: 8,
      }}
    >
      <Icon name="Alert" size={15} />
      {message}
    </div>
  );
}

// Stable references for useSyncExternalStore — keeping them at module scope
// avoids the "snapshot is not the same after re-render" warning React fires
// when these come from useCallback inside the component.
const subscribeNoop = () => () => {};
const getTrue = () => true;
const getFalse = () => false;

const inputStyle: React.CSSProperties = {
  width: "100%",
  height: 46,
  padding: "0 14px",
  fontSize: 14,
  border: "1px solid var(--line-strong)",
  borderRadius: "var(--r-2)",
  background: "var(--paper)",
  color: "var(--ink)",
  outline: "none",
  fontFamily: "var(--font-sans), sans-serif",
};

const linkButtonStyle: React.CSSProperties = {
  background: "none",
  border: "none",
  padding: 0,
  cursor: "pointer",
  color: "var(--ink-soft)",
  textDecoration: "underline",
  fontFamily: "var(--font-sans), sans-serif",
  fontSize: 12.5,
};

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label
      style={{ display: "block", marginBottom: 16 }}
      suppressHydrationWarning
    >
      <span
        className="caps"
        style={{ color: "var(--ink-soft)", display: "block", marginBottom: 7 }}
      >
        {label}
      </span>
      {children}
    </label>
  );
}
