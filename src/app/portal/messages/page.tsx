/**
 * Contact portal — Messages. The contact's view of their own thread with
 * staff. Staff side lives on the contact detail page (Communication tab);
 * both render against the same `conversations` / `messages` tables.
 */
import { redirect } from "next/navigation"
import { auth } from "@/lib/auth"
import { getMyConversationWithMessages } from "@/modules/communications/queries"
import { PortalMessages } from "./portal-messages"

export default async function PortalMessagesPage() {
  const session = await auth()
  if (!session?.user || session.user.subjectType !== "contact") {
    redirect("/portal/signin")
  }

  const res = await getMyConversationWithMessages()
  const messages = res.ok ? res.data.messages : []

  return (
    <PortalMessages
      messages={messages}
      contactName={session.user.name ?? null}
      errorMessage={res.ok ? null : res.error.message}
    />
  )
}
