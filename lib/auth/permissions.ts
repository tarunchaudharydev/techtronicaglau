import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";

/**
 * UI capability discovery only. Every mutation remains protected by Postgres RLS
 * and permission checks; this helper must never be treated as authorization.
 */
export async function getMyPermissionKeys(
  supabase: SupabaseClient<Database>,
  userId: string,
) {
  const [assignmentResult, membershipResult] = await Promise.all([
    supabase
      .from("user_role_assignments")
      .select("role_id")
      .eq("user_id", userId)
      .limit(100),
    supabase
      .from("memberships")
      .select("position_id")
      .eq("user_id", userId)
      .eq("status", "active")
      .not("position_id", "is", null)
      .limit(25),
  ]);

  if (assignmentResult.error || membershipResult.error) {
    return { permissionKeys: new Set<string>(), error: true };
  }

  const positionIds = (membershipResult.data ?? [])
    .flatMap(({ position_id }) => position_id ? [position_id] : []);
  const positionResult = positionIds.length
    ? await supabase
        .from("positions")
        .select("role_id")
        .in("id", positionIds)
        .eq("is_active", true)
        .limit(25)
    : { data: [], error: null };

  if (positionResult.error) {
    return { permissionKeys: new Set<string>(), error: true };
  }

  const roleIds = [...new Set([
    ...(assignmentResult.data ?? []).map(({ role_id }) => role_id),
    ...(positionResult.data ?? []).map(({ role_id }) => role_id),
  ])];

  if (roleIds.length === 0) {
    return { permissionKeys: new Set<string>(), error: false };
  }

  const permissionsResult = await supabase
    .from("role_permissions")
    .select("permission_key")
    .in("role_id", roleIds)
    .limit(500);

  if (permissionsResult.error) {
    return { permissionKeys: new Set<string>(), error: true };
  }

  return {
    permissionKeys: new Set((permissionsResult.data ?? []).map(({ permission_key }) => permission_key)),
    error: false,
  };
}
