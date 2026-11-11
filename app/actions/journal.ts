"use server";

import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/auth/session";
import { createJournalEntry, deleteJournalEntry } from "@/lib/services/journal";

export async function saveJournalAction(formData: FormData): Promise<void> {
  const user = await requireUser();
  await createJournalEntry(user.id, {
    logDate: formData.get("logDate"),
    kind: formData.get("kind"),
    title: formData.get("title") ?? "",
    body: formData.get("body"),
  });
  revalidatePath("/journal");
  revalidatePath("/dashboard");
}

export async function deleteJournalAction(formData: FormData): Promise<void> {
  const user = await requireUser();
  await deleteJournalEntry(user.id, String(formData.get("entryId") ?? ""));
  revalidatePath("/journal");
  revalidatePath("/dashboard");
}
