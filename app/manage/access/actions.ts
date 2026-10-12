"use server";

import { revalidatePath } from "next/cache";
import { formString, redirectResult, requireManager, validId } from "@/lib/manage/server";

const route = "/manage/access";
const scopes = new Set(["society", "club"]);

function selectedPermissions(formData: FormData) {
  return formData.getAll("permission_keys").filter((value): value is string => typeof value === "string" && value.length <= 100).slice(0, 100);
}

export async function createRole(formData: FormData) {
  const { supabase } = await requireManager("admin.manage");
  const name = formString(formData, "name", 80);
  const scope = formString(formData, "scope", 10);
  const description = formString(formData, "description", 500) || "";
  const permissionKeys = selectedPermissions(formData);
  if (!name || name.length < 2 || !scope || !scopes.has(scope)) return redirectResult(route, "invalid");
  const { error } = await supabase.rpc("admin_create_role", { p_name: name, p_scope: scope, p_description: description, p_permission_keys: permissionKeys });
  revalidatePath(route);
  revalidatePath("/manage");
  return redirectResult(route, error ? error.code === "23505" ? "conflict" : "error" : "saved");
}

export async function updateRole(formData: FormData) {
  const { supabase } = await requireManager("admin.manage");
  const id = formString(formData, "id", 36);
  const name = formString(formData, "name", 80);
  const description = formString(formData, "description", 500) || "";
  const permissionKeys = selectedPermissions(formData);
  if (!validId(id) || !name || name.length < 2) return redirectResult(route, "invalid");
  const { data: role } = await supabase.from("roles").select("id, is_system").eq("id", id).maybeSingle();
  if (!role) return redirectResult(route, "error");
  if (!role.is_system) {
    const { error } = await supabase.from("roles").update({ name, description: description || null }).eq("id", id);
    if (error) return redirectResult(route, error.code === "23505" ? "conflict" : "error");
  }
  const { error } = await supabase.rpc("admin_replace_role_permissions", { p_role_id: id, p_permission_keys: permissionKeys });
  revalidatePath(route);
  revalidatePath("/manage");
  return redirectResult(route, error ? "error" : "saved");
}

export async function deleteRole(formData: FormData) {
  const { supabase } = await requireManager("admin.manage");
  const id = formString(formData, "id", 36);
  if (!validId(id)) return redirectResult(route, "invalid");
  const { error } = await supabase.rpc("admin_delete_role", { p_role_id: id });
  revalidatePath(route);
  revalidatePath("/manage");
  return redirectResult(route, error ? "conflict" : "saved");
}

export async function assignRole(formData: FormData) {
  const { supabase, user } = await requireManager("admin.manage");
  const targetUserId = formString(formData, "user_id", 36);
  const roleId = formString(formData, "role_id", 36);
  const clubValue = formString(formData, "club_id", 36);
  const clubId = clubValue || null;
  if (!validId(targetUserId) || !validId(roleId) || (clubId && !validId(clubId))) return redirectResult(route, "invalid");
  const [{ data: role }, { data: profile }] = await Promise.all([
    supabase.from("roles").select("id, scope").eq("id", roleId).maybeSingle(),
    supabase.from("profiles").select("id").eq("id", targetUserId).maybeSingle(),
  ]);
  if (!role || !profile) return redirectResult(route, "invalid");
  if ((role.scope === "society") !== (clubId === null)) return redirectResult(route, "scope_mismatch");
  const { error } = await supabase.from("user_role_assignments").insert({ user_id: targetUserId, role_id: roleId, club_id: clubId, granted_by: user.id });
  revalidatePath(route);
  revalidatePath("/manage");
  return redirectResult(route, error ? error.code === "23505" ? "conflict" : "error" : "saved");
}

export async function revokeRole(formData: FormData) {
  const { supabase } = await requireManager("admin.manage");
  const id = formString(formData, "id", 36);
  if (!validId(id)) return redirectResult(route, "invalid");
  const { data, error } = await supabase.from("user_role_assignments").delete().eq("id", id).select("id").maybeSingle();
  revalidatePath(route);
  revalidatePath("/manage");
  return redirectResult(route, error ? "error" : data ? "saved" : "error");
}

export async function inviteUser(formData: FormData) {
  const { supabase } = await requireManager("admin.manage");
  const email = formString(formData, "email", 254)?.toLowerCase();
  const fullName = formString(formData, "full_name", 120) || "";
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return redirectResult(route, "invalid");
  const { error } = await supabase.functions.invoke("admin-invite-user", { body: { email, fullName } });
  if (error) return redirectResult(route, "error");
  revalidatePath(route);
  return redirectResult(route, "invited");
}
