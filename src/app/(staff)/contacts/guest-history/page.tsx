/**
 * Contacts > Guest History. Lists every contact alongside their booking
 * history, totals and preferences. Mock data until the Booking module
 * (FRS §6.5) lands. Design ref: docs/design-reference/guest-history.jsx.
 */
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { assertModuleAccess } from "@/lib/access";
import { listContacts } from "@/modules/contacts/queries";
import { GuestHistory } from "@/modules/contacts/components/guest-history";

export default async function GuestHistoryPage() {
  await assertModuleAccess("contacts");
  const session = await auth();
  if (!session?.user) redirect("/signin");

  const res = await listContacts();
  if (!res.ok) {
    return (
      <div style={{ padding: "40px 32px", color: "var(--ink-soft)" }}>
        Could not load contacts. {res.error.message}
      </div>
    );
  }

  return <GuestHistory contacts={res.data} />;
}
