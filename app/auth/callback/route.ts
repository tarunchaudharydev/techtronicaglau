import { NextResponse, type NextRequest } from "next/server";
import { safeRedirectPath } from "@/lib/auth/redirect";

export async function GET(request: NextRequest) {
  const destination = safeRedirectPath(new URL(request.url).searchParams.get("next"));
  return NextResponse.redirect(new URL(destination, request.url));
}
