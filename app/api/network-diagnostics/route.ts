import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

const consentVersion = "network-diagnostics-2026-10-v1";
const sessionCookieName = "network-diagnostics-session";
const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const supportedConnectionTypes = new Set(["slow-2g", "2g", "3g", "4g", "unknown"]);

function bucketDownlink(value: number) {
  if (value < 1) return "under-1";
  if (value < 5) return "1-5";
  if (value < 10) return "5-10";
  if (value < 25) return "10-25";
  return "25-plus";
}

export async function POST(request: NextRequest) {
  const origin = request.headers.get("origin");
  if ((origin && origin !== request.nextUrl.origin) || request.headers.get("sec-fetch-site") === "cross-site") {
    return NextResponse.json({ error: "Same-origin request required." }, { status: 403 });
  }

  const length = Number(request.headers.get("content-length") ?? 0);
  if (length > 2048) return NextResponse.json({ error: "Request too large." }, { status: 413 });

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  if (!body || typeof body !== "object") {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const input = body as Record<string, unknown>;
  if (input.consent !== true || input.consentVersion !== consentVersion) {
    return NextResponse.json({ error: "Explicit consent is required." }, { status: 400 });
  }
  if (typeof input.downlinkMbps !== "number" || !Number.isFinite(input.downlinkMbps) || input.downlinkMbps <= 0 || input.downlinkMbps > 10000) {
    return NextResponse.json({ error: "Invalid connection estimate." }, { status: 400 });
  }

  const effectiveType = typeof input.effectiveType === "string" && supportedConnectionTypes.has(input.effectiveType)
    ? input.effectiveType
    : "unknown";
  const countryHeader = request.headers.get("x-vercel-ip-country")?.trim().toUpperCase() ?? "";
  const regionHeader = request.headers.get("x-vercel-ip-country-region")?.trim().toUpperCase() ?? "";
  const countryCode = /^[A-Z]{2}$/.test(countryHeader) ? countryHeader : null;
  const regionCode = /^[A-Z]{2}(?:-[A-Z0-9]{1,3})?$/.test(regionHeader) ? regionHeader : null;

  const supabase = await createClient();
  if (!supabase) return NextResponse.json({ error: "Database is not configured." }, { status: 503 });

  const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
  if (sessionError) {
    return NextResponse.json({ error: "Could not read the current account session." }, { status: 401 });
  }

  let userId: string | null = null;
  if (sessionData.session) {
    const { data: authData, error: authError } = await supabase.auth.getUser();
    if (authError || !authData.user) {
      return NextResponse.json({ error: "Could not verify the current account." }, { status: 401 });
    }
    userId = authData.user.id;
  }

  const currentSessionCookie = request.cookies.get(sessionCookieName)?.value;
  const ownerPrefix = userId ? "user:" + userId + ":" : "guest:";
  const currentCookieSessionId = currentSessionCookie?.startsWith(ownerPrefix)
    ? currentSessionCookie.slice(ownerPrefix.length)
    : null;
  const sessionId = currentCookieSessionId && uuidPattern.test(currentCookieSessionId)
    ? currentCookieSessionId
    : crypto.randomUUID();
  const nextSessionCookie = ownerPrefix + sessionId;

  const { error } = await supabase.from("network_diagnostic_sessions").insert({
    session_id: sessionId,
    user_id: userId,
    country_code: countryCode,
    region_code: regionCode,
    effective_type: effectiveType,
    downlink_bucket: bucketDownlink(input.downlinkMbps),
    consent_version: consentVersion,
  });

  if (error && error.code !== "23505") {
    return NextResponse.json({ error: "Could not save connection diagnostics." }, { status: 500 });
  }

  const response = NextResponse.json({ saved: true, alreadySaved: error?.code === "23505" });
  if (currentSessionCookie !== nextSessionCookie) {
    response.cookies.set(sessionCookieName, nextSessionCookie, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      path: "/",
      maxAge: 12 * 60 * 60,
    });
  }
  response.headers.set("Cache-Control", "private, no-store, max-age=0");
  response.headers.set("X-Content-Type-Options", "nosniff");
  return response;
}
