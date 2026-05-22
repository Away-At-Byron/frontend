import { Suspense } from "react";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { SignInForm } from "./signin-form";

export default async function SignInPage() {
  // Already signed in? Send them to the right home rather than the form.
  // Staff land on the dashboard; contacts on the portal dashboard.
  const session = await auth();
  if (session?.user) {
    redirect(
      session.user.subjectType === "contact" ? "/portal/dashboard" : "/home",
    );
  }

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
