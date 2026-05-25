"use client"

/**
 * Client-side providers mounted at the root. Keeps the server layout clean
 * while giving every page access to useToast() and useConfirm().
 */
import type { ReactNode } from "react"
import { ToastProvider } from "./toast"
import { ConfirmDialogProvider } from "./dialog"

export function AppProviders({ children }: { children: ReactNode }) {
  return (
    <ToastProvider>
      <ConfirmDialogProvider>{children}</ConfirmDialogProvider>
    </ToastProvider>
  )
}
