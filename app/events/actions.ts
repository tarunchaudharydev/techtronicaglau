"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { safeSlug, validId } from "@/lib/manage/server";

export async function registerForEvent(formData: FormData) {
  const eventId = read(formData, "event_id");
  const slug = read(formData, "slug");
  if (!validId(eventId) || !safeSlug(slug)) redirect("/events?registration=error");
  const destination = `/events/${slug}`;
  const supabase = await createClient();
  if (!supabase) redirect(`${destination}?registration=error`);
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) redirect(`/auth/sign-in?next=${encodeURIComponent(destination)}`);
  const { data, error } = await supabase.from("event_registrations").insert({ event_id: eventId, user_id: auth.user.id }).select("status").maybeSingle();
  revalidatePath(destination);
  revalidatePath("/account");
  if (error?.code === "23505") redirect(`${destination}?registration=duplicate`);
  if (error) redirect(`${destination}?registration=error`);
  redirect(`${destination}?registration=${data?.status === "waitlisted" ? "waitlisted" : "registered"}`);
}

export async function cancelEventRegistration(formData: FormData) {
  const registrationId = read(formData, "registration_id");
  const slug = read(formData, "slug");
  if (!validId(registrationId) || !safeSlug(slug)) redirect("/events?registration=error");
  const destination = `/events/${slug}`;
  const supabase = await createClient();
  if (!supabase) redirect(`${destination}?registration=error`);
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) redirect(`/auth/sign-in?next=${encodeURIComponent(destination)}`);
  const { data, error } = await supabase.from("event_registrations").delete().eq("id", registrationId).eq("user_id", auth.user.id).in("status", ["registered", "waitlisted"]).select("id").maybeSingle();
  revalidatePath(destination);
  revalidatePath("/account");
  redirect(`${destination}?registration=${error || !data ? "error" : "cancelled"}`);
}

function read(formData: FormData, name: string) { const value = formData.get(name); return typeof value === "string" && value.length <= 120 ? value : ""; }
