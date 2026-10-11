"use server";

import { revalidatePath } from "next/cache";
import { redirectResult, formString, validId, requireManager } from "@/lib/manage/server";

const route = "/manage/positions";

export async function createPosition(formData: FormData) {
  const { supabase } = await requireManager("positions.manage");
  const name = formString(formData, "name", 100);
  const description = formString(formData, "description", 500);
  const clubValue = formString(formData, "club_id", 36);
  const roleId = formString(formData, "role_id", 36);
  const clubId = clubValue || null;
  const orderValue = formString(formData, "display_order", 5) || "0";
  const displayOrder = Number(orderValue);
  if (!name || name.length < 2 || !roleId || !validId(roleId) || (clubId && !validId(clubId)) || !Number.isInteger(displayOrder) || Math.abs(displayOrder) > 9999) {
    return redirectResult(route, "invalid");
  }
  const { data: role } = await supabase.from("roles").select("id, scope").eq("id", roleId).maybeSingle();
  if (!role || (role.scope === "society") !== (clubId === null)) return redirectResult(route, "invalid");
  const { error } = await supabase.from("positions").insert({ name, description: description || null, club_id: clubId, role_id: roleId, display_order: displayOrder });
  revalidatePath(route);
  revalidatePath("/manage");
  return redirectResult(route, error ? error.code === "23505" ? "conflict" : "error" : "saved");
}

export async function updatePosition(formData: FormData) {
  const { supabase } = await requireManager("positions.manage");
  const id = formString(formData, "id", 36);
  const name = formString(formData, "name", 100);
  const description = formString(formData, "description", 500);
  const clubValue = formString(formData, "club_id", 36);
  const roleId = formString(formData, "role_id", 36);
  const clubId = clubValue || null;
  const displayOrder = Number(formString(formData, "display_order", 5) || "0");
  const isActive = formData.get("is_active") === "on";
  if (!validId(id) || !name || name.length < 2 || !validId(roleId) || (clubId && !validId(clubId)) || !Number.isInteger(displayOrder) || Math.abs(displayOrder) > 9999) return redirectResult(route, "invalid");
  const { data: role } = await supabase.from("roles").select("id, scope").eq("id", roleId).maybeSingle();
  if (!role || (role.scope === "society") !== (clubId === null)) return redirectResult(route, "invalid");
  const { data, error } = await supabase.from("positions").update({ name, description: description || null, club_id: clubId, role_id: roleId, display_order: displayOrder, is_active: isActive }).eq("id", id).select("id").maybeSingle();
  revalidatePath(route);
  revalidatePath("/manage");
  return redirectResult(route, error ? error.code === "23505" ? "conflict" : "error" : data ? "saved" : "error");
}

export async function deletePosition(formData: FormData) {
  const { supabase } = await requireManager("positions.manage");
  const id = formString(formData, "id", 36);
  if (!validId(id)) return redirectResult(route, "invalid");
  const { data, error } = await supabase.from("positions").delete().eq("id", id).select("id").maybeSingle();
  revalidatePath(route);
  return redirectResult(route, error ? "error" : data ? "saved" : "error");
}
