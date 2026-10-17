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
  const names = formData.getAll("member_name");
  const emails = formData.getAll("member_email");
  const years = formData.getAll("member_year");
  const branches = formData.getAll("member_branch");
  const sections = formData.getAll("member_section");
  const count = names.length;
  if (!count || count > 50 || [emails, years, branches, sections].some((values) => values.length !== count)) redirect(`${destination}?registration=team_size`);
  const members = names.map((name, index) => ({
    full_name: fieldValue(name, 120),
    email: fieldValue(emails[index], 254),
    year_of_study: fieldValue(years[index], 2),
    branch: fieldValue(branches[index], 100),
    section: fieldValue(sections[index], 50),
  }));
  if (members.some((member) => !member.full_name || !member.email || !member.year_of_study || !member.branch || !member.section)) redirect(`${destination}?registration=team_size`);
  const uniqueEmails = new Set(members.map((member) => member.email.toLowerCase()));
  if (uniqueEmails.size !== members.length) redirect(`${destination}?registration=team_size`);
  const { data, error } = await supabase.rpc("register_event_with_team", { p_event_id: eventId, p_members: members });
  revalidatePath(destination);
  revalidatePath("/account");
  if (error?.code === "23505") redirect(`${destination}?registration=duplicate`);
  if (error?.message?.toLowerCase().includes("closed")) redirect(`${destination}?registration=closed`);
  if (error?.message?.toLowerCase().includes("team size")) redirect(`${destination}?registration=team_size`);
  if (error) redirect(`${destination}?registration=error`);
  redirect(`${destination}?registration=${data === "waitlisted" ? "waitlisted" : "registered"}`);
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
function fieldValue(value: FormDataEntryValue | undefined, maxLength: number) {
  return typeof value === "string" && value.trim().length <= maxLength ? value.trim() : "";
}
