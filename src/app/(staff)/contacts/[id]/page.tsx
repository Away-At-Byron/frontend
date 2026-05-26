/**
 * Contact detail (FRS §6.4) — single-record edit page. `/contacts/new`
 * opens the page in add mode; otherwise the segment is treated as a
 * contact id and the record is fetched.
 */
import { notFound, redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { assertModuleAccess } from "@/lib/access";
import {
  getContact,
  listContactOptions,
  listContactSources,
  listContactTypes,
  listGroupMembers,
  listGroupOptions,
} from "@/modules/contacts/queries";
import { listContactDocuments } from "@/modules/contact-documents/queries";
import {
  getConversationByContact,
  listMessages,
} from "@/modules/communications/queries";
import { presignDownload } from "@/lib/storage";
import { ContactDetail } from "@/modules/contacts/components/contact-detail";

export default async function ContactDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await assertModuleAccess("contacts");
  const session = await auth();
  if (!session?.user) redirect("/signin");

  const { id } = await params;
  const isNew = id === "new";

  const [contactRes, typesRes, sourcesRes, groupsRes, optionsRes] = await Promise.all([
    isNew ? Promise.resolve({ ok: true as const, data: null }) : getContact(id),
    listContactTypes(),
    listContactSources(),
    listGroupOptions(),
    listContactOptions(),
  ]);

  if (
    !typesRes.ok ||
    !sourcesRes.ok ||
    !groupsRes.ok ||
    !contactRes.ok ||
    !optionsRes.ok
  ) {
    const message = !contactRes.ok
      ? contactRes.error.message
      : !typesRes.ok
        ? typesRes.error.message
        : !sourcesRes.ok
          ? sourcesRes.error.message
          : !groupsRes.ok
            ? groupsRes.error.message
            : !optionsRes.ok
              ? optionsRes.error.message
              : "";
    return (
      <div style={{ padding: "40px 32px", color: "var(--ink-soft)" }}>
        Could not load contact. {message}
      </div>
    );
  }

  if (!isNew && contactRes.data === null) notFound();

  const groupId = contactRes.data?.groupId ?? null;
  const membersRes = groupId ? await listGroupMembers(groupId) : null;
  const groupMembers = membersRes && membersRes.ok ? membersRes.data : [];

  // Documents are only meaningful for an existing contact — skip the query in
  // add mode (we have no contact id yet) and fall back to an empty list if the
  // query fails so the rest of the page still renders.
  const documentsRes = isNew ? null : await listContactDocuments(contactRes.data!.id);
  const baseDocs = documentsRes && documentsRes.ok ? documentsRes.data : [];

  // Eager-sign GET URLs for image rows so the Identity card can render the ID
  // photo without a client-side round trip. URLs expire in 5 minutes; a stale
  // page reload re-signs them. Non-image rows get presigned on click.
  const documents = await Promise.all(
    baseDocs.map(async (d) => {
      if (d.fileKey && d.mimeType && d.mimeType.startsWith("image/")) {
        return { ...d, previewUrl: await presignDownload(d.fileKey) };
      }
      return { ...d, previewUrl: null };
    }),
  );

  // Conversation + message history for the Communication tab. Both calls fail
  // soft so a comms outage doesn't blank the whole contact page.
  const convoRes = isNew ? null : await getConversationByContact(contactRes.data!.id);
  const conversation = convoRes && convoRes.ok ? convoRes.data : null;
  const messagesRes = conversation ? await listMessages(conversation.id) : null;
  const messages = messagesRes && messagesRes.ok ? messagesRes.data : [];

  // Exclude self from the related-contact picker to stop a contact pointing
  // at itself.
  const contactOptions = optionsRes.data.filter(
    (o) => o.id !== contactRes.data?.id,
  );

  return (
    <ContactDetail
      contact={contactRes.data}
      mode={isNew ? "new" : "edit"}
      contactTypes={typesRes.data}
      contactSources={sourcesRes.data}
      groups={groupsRes.data}
      groupMembers={groupMembers}
      contactOptions={contactOptions}
      documents={documents}
      messages={messages}
    />
  );
}
