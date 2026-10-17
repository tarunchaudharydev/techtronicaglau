"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { formString, requireManager, validId } from "@/lib/manage/server";

const route = "/manage/registrations";
const allowedTransitions: Record<string, string[]> = {
  registered: ["cancelled", "attended", "no_show"],
  waitlisted: ["cancelled"],
};

export async function updateRegistrationStatus(formData: FormData) {
  const { supabase } = await requireManager("registrations.manage");
  const id = formString(formData, "id", 36);
  const currentStatus = formString(formData, "current_status", 20);
  const nextStatus = formString(formData, "status", 20);
  const selectedEvent = formString(formData, "event_id", 36);
  const eventId = validId(selectedEvent) ? selectedEvent : null;
  if (!validId(id) || !currentStatus || !nextStatus || !allowedTransitions[currentStatus]?.includes(nextStatus)) {
    return redirectToList("invalid", eventId);
  }

  const { data, error } = await supabase
    .from("event_registrations")
    .update({ status: nextStatus })
    .eq("id", id)
    .eq("status", currentStatus)
    .select("id")
    .maybeSingle();

  revalidatePath(route);
  revalidatePath("/events");
  return redirectToList(error ? "error" : data ? "saved" : "conflict", eventId);
}

function redirectToList(result: "saved" | "error" | "invalid" | "conflict", eventId: string | null): never {
  const params = new URLSearchParams({ result });
  if (eventId) params.set("event", eventId);
  redirect(`${route}?${params.toString()}`);
}
