import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { readJsonBodyLimited } from "@/lib/security/read-json-body.mjs";

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const slugPattern = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const maxBodyBytes = 12_000;

export async function POST(request: NextRequest) {
  const origin = request.headers.get("origin");
  if (
    (origin && origin !== request.nextUrl.origin) ||
    request.headers.get("sec-fetch-site") === "cross-site"
  ) {
    return NextResponse.json({ error: "Invalid request origin." }, { status: 403 });
  }

  const parsed = await readJsonBodyLimited(request, maxBodyBytes);
  if (!parsed.ok) {
    if (parsed.reason === "too_large") {
      return NextResponse.json({ error: "The message is too large." }, { status: 413 });
    }
    return NextResponse.json({ error: "Submit a valid contact form." }, { status: 400 });
  }

  const body = parsed.value;
  if (!body || typeof body !== "object" || Array.isArray(body)) {
    return NextResponse.json({ error: "Submit a valid contact form." }, { status: 400 });
  }

  const input = body as Record<string, unknown>;
  if (typeof input.website === "string" && input.website.trim()) {
    return NextResponse.json({ ok: true }, { status: 201 });
  }

  const name = boundedString(input.name, 120);
  const email = boundedString(input.email, 254)?.toLowerCase();
  const topic = boundedString(input.topic, 160) ?? "";
  const message = boundedString(input.message, 5000);
  const clubSlug = input.clubSlug === undefined ? null : boundedString(input.clubSlug, 100);

  if (!name || !email || !emailPattern.test(email) || !message ||
      (input.topic !== undefined && topic === null) ||
      (input.clubSlug !== undefined && (!clubSlug || !slugPattern.test(clubSlug)))) {
    return NextResponse.json({ error: "Check the name, email, and message fields." }, { status: 400 });
  }

  const supabase = await createClient();
  if (!supabase) {
    return NextResponse.json({ error: "Contact forms are temporarily unavailable." }, { status: 503 });
  }

  try {
    let clubId: string | null = null;
    if (clubSlug) {
      const { data: club, error: clubError } = await supabase
        .from("clubs")
        .select("id")
        .eq("slug", clubSlug)
        .eq("is_active", true)
        .maybeSingle();
      if (clubError) return NextResponse.json({ error: "Contact forms are temporarily unavailable." }, { status: 503 });
      if (!club) return NextResponse.json({ error: "This club is not accepting messages." }, { status: 400 });
      clubId = club.id;
    }

    const { error } = await supabase.from("contact_submissions").insert({
      name,
      email,
      topic,
      message,
      club_id: clubId,
    });
    if (error) return NextResponse.json({ error: "Contact forms are temporarily unavailable." }, { status: 503 });
    return NextResponse.json({ ok: true }, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Contact forms are temporarily unavailable." }, { status: 503 });
  }
}

function boundedString(value: unknown, maxLength: number): string | null {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed.length <= maxLength ? trimmed : null;
}
