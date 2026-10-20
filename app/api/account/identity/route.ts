import { NextResponse } from "next/server";
import { getCurrentAppUser } from "@/lib/auth/current-user";

export const dynamic = "force-dynamic";

export async function GET() {
  const user = await getCurrentAppUser();
  if (!user) {
    return NextResponse.json({ error: "Sign in to continue." }, {
      status: 401,
      headers: { "Cache-Control": "no-store" },
    });
  }

  return NextResponse.json({
    id: user.id,
    fullName: user.fullName,
    avatarUrl: user.avatarUrl,
  }, {
    headers: { "Cache-Control": "no-store" },
  });
}
