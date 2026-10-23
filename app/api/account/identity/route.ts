import { NextResponse } from "next/server";
import { getCurrentAppUser } from "@/lib/auth/current-user";
import { getMyPermissionKeys } from "@/lib/auth/permissions";
import { createClient } from "@/lib/supabase/server";

const managementPermissionKeys = [
  "admin.manage", "members.manage", "team.manage", "alumni.manage", "clubs.manage",
  "positions.manage", "events.manage", "registrations.manage", "attendance.manage", "contacts.manage", "content.manage",
] as const;

export const dynamic = "force-dynamic";

export async function GET() {
  const user = await getCurrentAppUser();
  if (!user) {
    return NextResponse.json({ error: "Sign in to continue." }, {
      status: 401,
      headers: { "Cache-Control": "no-store" },
    });
  }

  let canManage = false;
  try {
    const supabase = await createClient();
    if (supabase) {
      const access = await getMyPermissionKeys(supabase, user.id);
      canManage = !access.error && managementPermissionKeys.some((permission) => access.permissionKeys.has(permission));
    }
  } catch {
    // Permission discovery is only for showing navigation; fail closed if it is unavailable.
  }

  return NextResponse.json({
    id: user.id,
    fullName: user.fullName,
    avatarUrl: user.avatarUrl,
    canManage,
  }, {
    headers: { "Cache-Control": "no-store" },
  });
}
