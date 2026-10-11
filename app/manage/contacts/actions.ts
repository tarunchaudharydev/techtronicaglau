"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireManager, validId } from "@/lib/manage/server";

const statuses = new Set(["new", "in_progress", "resolved", "spam"]);

export async function updateContactStatus(formData: FormData) {
  const { supabase, user } = await requireManager("contacts.manage");
  const idValue = formData.get("id");
  const currentValue = formData.get("current_status");
  const nextValue = formData.get("status");
  const id = typeof idValue === "string" ? idValue : "";
  const currentStatus = typeof currentValue === "string" ? currentValue : "";
  const status = typeof nextValue === "string" ? nextValue : "";

  if (!validId(id) || !statuses.has(currentStatus) || !statuses.has(status)) {
    redirect("/manage/contacts?result=invalid");
  }

  const { data, error } = await supabase
    .from("contact_submissions")
    .update({
      status,
      handled_by: status === "new" ? null : user.id,
      handled_at: status === "new" ? null : new Date().toISOString(),
    })
    .eq("id", id)
    .eq("status", currentStatus)
    .select("id")
    .maybeSingle();

  revalidatePath("/manage/contacts");
  redirect(`/manage/contacts?result=${error || !data ? "error" : "saved"}`);
}
