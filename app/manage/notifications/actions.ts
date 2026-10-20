"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { formString, requireManager } from "@/lib/manage/server";

const route = "/manage/notifications";
const kinds = new Set(["deployment", "release", "announcement"]);

export async function publishNotification(formData: FormData) {
  const { supabase, user } = await requireManager("content.manage");
  const kind = formString(formData, "kind", 20);
  const title = formString(formData, "title", 160);
  const message = formString(formData, "message", 1200);
  const href = formString(formData, "href", 2048);
  if (!kind || !kinds.has(kind) || !title || !message || !href || !isInternalPath(href)) {
    return redirect(`${route}?result=invalid`);
  }

  const { error } = await supabase.from("notifications").insert({
    kind,
    title,
    message,
    href,
    // Manual updates are limited to society members by the database policy.
    audience: "society_members",
    created_by: user.id,
  });
  if (error) return redirect(`${route}?result=error`);

  revalidatePath(route);
  revalidatePath("/");
  return redirect(`${route}?result=saved`);
}

function isInternalPath(value: string) {
  return value.startsWith("/") && !value.startsWith("//") && !/[\r\n]/.test(value);
}
