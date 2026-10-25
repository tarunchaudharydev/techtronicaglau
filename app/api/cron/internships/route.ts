import { createAdminClient } from "@/lib/supabase/admin";
import { isAuthorizedCronRequest, runInternshipAdapters } from "@/lib/internships/core.mjs";
import {
  authorizedInternshipAdapters,
  internshipDescription,
  internshipSourceCompanies,
} from "@/lib/internships/sources";

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
      results: {
        mode: authorizedInternshipAdapters.length ? "verification_expiry_and_provider_ingestion" : "verification_and_expiry_only",
        adapters_configured: authorizedInternshipAdapters.length,
      },
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

    // Keep the daily provider request budget predictable: one request per
    // company per run, with the next scheduled run serving as the retry.
    const adapterResult = await runInternshipAdapters(authorizedInternshipAdapters, { maxAttempts: 1 });
    const companyRows = authorizedInternshipAdapters.length
      ? await supabase.from("internship_companies").select("id, slug").eq("is_active", true)
        .in("slug", internshipSourceCompanies.map((company) => company.slug))
      : { data: [], error: null };
    if (companyRows.error) throw new Error(`Could not load internship companies (${companyRows.error.code})`);
    const companyIds = new Map((companyRows.data ?? []).map((company) => [company.slug, company.id]));

    const adapters = await Promise.all(adapterResult.outcomes.map(async (outcome) => {
      if (outcome.status !== "completed") {
        return { source: outcome.source, status: outcome.status, error: outcome.error };
      }

      const imported = await Promise.all(outcome.result.listings.map(async (listing) => {
        const companyId = companyIds.get(listing.companySlug);
        if (!companyId) return { status: "skipped" as const };

        const { data, error } = await supabase.rpc("import_internship_source_listing", {
          p_company_id: companyId,
          p_title: listing.title,
          p_description: internshipDescription,
          p_country_code: listing.countryCode,
          p_city: listing.city,
          p_location_label: listing.locationLabel,
          p_work_arrangement: listing.workArrangement,
          p_application_url: listing.applicationUrl,
          p_official_source_url: listing.officialSourceUrl,
          p_source_name: listing.sourceName,
          p_source_identifier: listing.sourceIdentifier,
          p_source_url: listing.sourceUrl,
          p_source_updated_at: listing.sourceUpdatedAt,
          p_normalized_hash: listing.normalizedHash,
          p_provenance: listing.provenance,
        });
        if (error || !data?.[0]) return { status: "failed" as const, code: error?.code ?? "missing_result" };
        return { status: data[0].inserted ? "inserted" as const : "existing" as const };
      }));

      const insertedCount = imported.filter((item) => item.status === "inserted").length;
      const existingCount = imported.filter((item) => item.status === "existing").length;
      const importErrorCount = imported.filter((item) => item.status === "failed").length;
      const skippedCount = imported.filter((item) => item.status === "skipped").length;
      return {
        source: outcome.source,
        status: importErrorCount ? "partial" as const : "completed" as const,
        attempt: outcome.attempt,
        provider_results: outcome.result.providerResultCount,
        rejected_non_official_or_non_internship: outcome.result.rejectedCount,
        imported_as_pending_drafts: insertedCount,
        already_seen: existingCount,
        skipped: skippedCount,
        import_errors: importErrorCount,
      };
    }));
    const hasAdapterFailures = adapters.some((adapter) => adapter.status !== "completed");
    const hasCompletedAdapter = adapters.some((adapter) => adapter.status === "completed" || adapter.status === "partial");
    const status = hasAdapterFailures
      ? hasCompletedAdapter ? "partial" : "failed"
      : "completed";
    const results = {
      mode: authorizedInternshipAdapters.length ? "verification_expiry_and_provider_ingestion" : "verification_and_expiry_only",
      provider: authorizedInternshipAdapters.length ? "Google Jobs via SerpApi" : "not_configured",
      import_visibility: "unverified_pending_admin_review",
      auto_published_count: 0,
      expired_count: expired.count ?? 0,
      stale_count: stale.count ?? 0,
      adapters,
    };
    const duration = Date.now() - startedAt;
    const updated = await supabase.from("internship_ingestion_runs").update({
      status,
      finished_at: new Date().toISOString(),
      duration_ms: duration,
      results,
      error_summary: status === "failed" || status === "partial" ? "One or more internship provider searches or draft imports failed." : null,
    }).eq("id", runId);
    if (updated.error) throw new Error(`Could not finish run record (${updated.error.code})`);

    console.info("Internship scheduled check completed", { status, expired: results.expired_count, stale: results.stale_count, adapters: results.adapters.length });
    const importedCount = adapters.reduce((total, adapter) => total + ("imported_as_pending_drafts" in adapter ? adapter.imported_as_pending_drafts ?? 0 : 0), 0);
    response = Response.json({ status, expired: results.expired_count, stale: results.stale_count, adapters: results.adapters.length, imported: importedCount });
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
