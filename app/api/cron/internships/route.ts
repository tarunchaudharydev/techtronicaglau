import { createAdminClient } from "@/lib/supabase/admin";
import { isAuthorizedCronRequest, runInternshipAdapters } from "@/lib/internships/core.mjs";
import { authorizedInternshipAdapters } from "@/lib/internships/sources";

export const runtime = "nodejs";
export const maxDuration = 60;

const releasedLockTime = "1970-01-01T00:00:00.000Z";

export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET;
  if (!isAuthorizedCronRequest(request.headers.get("authorization"), secret)) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = createAdminClient();
  if (!supabase) return Response.json({ error: "Scheduled database credentials are not configured" }, { status: 503 });

  const startedAt = Date.now();
  const now = new Date(startedAt);
  const lockToken = crypto.randomUUID();
  const { data: lock, error: lockError } = await supabase
    .from("internship_ingestion_locks")
    .update({ lock_token: lockToken, locked_until: new Date(startedAt + 5 * 60_000).toISOString() })
    .eq("id", 1)
    .lt("locked_until", now.toISOString())
    .select("id")
    .maybeSingle();

  if (lockError) {
    console.error("Internship cron lock failed", { code: lockError.code });
    return Response.json({ error: "Could not claim scheduled run" }, { status: 500 });
  }
  if (!lock) return Response.json({ status: "already_running" }, { status: 409 });

  let runId: string | null = null;
  let response: Response;
  try {
    const created = await supabase.from("internship_ingestion_runs").insert({
      status: "running",
      results: { mode: "verification_and_expiry", adapters_configured: authorizedInternshipAdapters.length },
    }).select("id").single();
    if (created.error || !created.data) throw new Error(`Could not create run record (${created.error?.code ?? "missing row"})`);
    runId = created.data.id;

    const expired = await supabase.from("internships")
      .update({ listing_status: "closed" }, { count: "exact" })
      .in("listing_status", ["open", "stale", "unverified"])
      .not("deadline", "is", null)
      .lte("deadline", now.toISOString());
    if (expired.error) throw new Error(`Could not close expired listings (${expired.error.code})`);

    const stale = await supabase.from("internships")
      .update({ listing_status: "stale", verification_status: "stale" }, { count: "exact" })
      .eq("listing_status", "open")
      .eq("verification_status", "verified")
      .not("verification_due_at", "is", null)
      .lte("verification_due_at", now.toISOString());
    if (stale.error) throw new Error(`Could not mark stale listings (${stale.error.code})`);

    const adapterResult = await runInternshipAdapters(authorizedInternshipAdapters, { maxAttempts: 2 });
    const results = {
      mode: authorizedInternshipAdapters.length ? "verification_expiry_and_authorized_sources" : "verification_and_expiry_only",
      expired_count: expired.count ?? 0,
      stale_count: stale.count ?? 0,
      adapters: adapterResult.outcomes.map((outcome) => ({
        source: outcome.source,
        status: outcome.status,
        ...(outcome.status === "completed" ? { attempt: outcome.attempt } : { error: outcome.error }),
      })),
      sources_needing_authorization: ["Google", "NVIDIA", "Microsoft", "Amazon", "Netflix"],
    };
    const status = adapterResult.status === "partial" ? "partial" : adapterResult.status === "failed" ? "failed" : "completed";
    const duration = Date.now() - startedAt;
    const updated = await supabase.from("internship_ingestion_runs").update({
      status,
      finished_at: new Date().toISOString(),
      duration_ms: duration,
      results,
      error_summary: status === "failed" || status === "partial" ? "One or more authorized source adapters failed." : null,
    }).eq("id", runId);
    if (updated.error) throw new Error(`Could not finish run record (${updated.error.code})`);

    console.info("Internship scheduled check completed", { status, expired: results.expired_count, stale: results.stale_count, adapters: results.adapters.length });
    response = Response.json({ status, expired: results.expired_count, stale: results.stale_count, adapters: results.adapters.length });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Scheduled check failed";
    if (runId) {
      const duration = Date.now() - startedAt;
      const update = await supabase.from("internship_ingestion_runs").update({
        status: "failed", finished_at: new Date().toISOString(), duration_ms: duration,
        error_summary: message.slice(0, 500),
      }).eq("id", runId);
      if (update.error) console.error("Internship cron failure log could not be saved", { code: update.error.code });
    }
    console.error("Internship scheduled check failed", { message: message.slice(0, 200) });
    response = Response.json({ error: "Scheduled internship check failed" }, { status: 500 });
  } finally {
    const released = await supabase.from("internship_ingestion_locks")
      .update({ lock_token: null, locked_until: releasedLockTime })
      .eq("id", 1)
      .eq("lock_token", lockToken);
    if (released.error) console.error("Internship cron lock release failed", { code: released.error.code });
  }

  return response;
}
