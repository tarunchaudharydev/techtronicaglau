# Internship directory

The public directory lives at `/internships`. Society Admins manage records at `/manage/internships` through the database-backed `internships.manage` permission. The frontend repository owns the page and scheduled route; the backend repository owns the canonical migration, schema, RLS, and generated database types.

## Listing lifecycle

1. A Society Admin adds an opportunity from its official source. The page accepts structured technical areas, skills, country/city, work arrangement, degree requirements, eligible years, posting date, deadline, application URL, and source URL.
2. New rows start as `listing_status = unverified` and `verification_status = pending`. They are hidden from the public site by RLS.
3. A Society Admin checks that the source and application links are official and confirms both links in the review form. Publishing records `verified_at`, sets a seven-day `verification_due_at`, and makes the listing public.
4. Editing any listing removes it from public search and requires another review. Closing removes it from public search without deleting its history.
5. A daily scheduled check closes rows whose explicit deadline has passed and marks overdue verification as stale. A temporary feed or network failure must not close a listing.

The public policy returns only rows that are published, open, verified, have a verification timestamp, and do not have an expired deadline. The detail page repeats the verification date and links to both the source posting and application page. Description text is rendered as plain text; imported HTML is never trusted.

## Search, filters, and pagination

Search uses the database's generated `tsvector` and GIN index. Category, degree, and eligible-year filters use structured arrays and GIN indexes; company and city use indexed identifiers/normalized values. Filters are validated on the server and serialized in the query string. Pages use a validated, sort-bound cursor instead of downloading the full table. Supported orderings are deadline, posting date, and verification date.

The public page queries through the anonymous RLS-scoped Supabase client. It selects only listing fields needed for the directory. Private source identifiers, normalized source hashes, raw provenance, and adapter data live in the backend's private schema.

## Career-source status

The scheduled importer uses [SerpApi's Google Jobs API](https://serpapi.com/google-jobs-api) as a third-party discovery provider for Google, NVIDIA, Microsoft, Amazon, and Netflix. Google Jobs is a discovery index, not a feed provided by those employers. The importer does not crawl company career pages.

The provider is optional. Set `SERPAPI_API_KEY` as a server-only environment variable to enable five searches per daily run (one per employer). If it is unset, the cron still performs expiry and freshness checks. SerpApi currently lists 250 monthly searches on its free plan; five daily searches use at most about 150 in a 30-day month. Check [current plan limits and pricing](https://serpapi.com/pricing) before enabling it because provider pricing and terms can change.

Discovery results are accepted only when the employer name matches and the application link is a job-specific page on an exact allowlisted company career host. Aggregator, search-result, and generic career landing links are rejected. The app stores a short generic review note rather than copying a provider's job description, requirements, or other posting text. Source identifiers and provenance stay in the backend's private schema. Every imported listing is an unpublished `unverified` draft, and existing records are never overwritten or reopened by a later feed result. A Society Admin must open the official links, confirm the opportunity is current, complete eligibility details, and publish it. The public directory links directly to the employer's official posting/application page.

## Scheduled checks and configuration

`vercel.json` schedules `GET /api/cron/internships` once per day for 02:30 UTC (08:00 India Standard Time). Vercel Cron uses UTC and invokes routes only for production deployments. On Vercel Hobby, the request may arrive at any time during the selected 02:00–02:59 UTC hour (07:30–08:29 IST); the cleanup is idempotent, so it does not depend on the exact minute. The route:

- Requires `Authorization: Bearer $CRON_SECRET` and rejects missing/short secrets.
- Uses `SUPABASE_SECRET_KEY` (or the legacy `SUPABASE_SERVICE_ROLE_KEY`) only in server-side code.
- Uses optional `SERPAPI_API_KEY` only on the server for the five daily Google Jobs searches.
- Claims a five-minute database lease before it starts so duplicate or overlapping requests do not process concurrently.
- Closes explicitly expired listings, marks overdue checks stale, imports only verified employer-domain links as pending drafts, and writes a run summary and duration to `internship_ingestion_runs`.
- Isolates provider failures by employer and leaves existing listing content and status unchanged when a search fails or a duplicate posting is seen.

Set the following Vercel variables for the Production environment after reviewing the backend migration:

```dotenv
SUPABASE_SECRET_KEY=<server-only Supabase secret key>
CRON_SECRET=<random value with at least 16 characters>
SERPAPI_API_KEY=<optional SerpApi key for internship discovery>
```

Use the matching development-project key locally. Do not use `NEXT_PUBLIC_` prefixes, commit these values, or share them in issues. Vercel reports job invocations under Cron Jobs and runtime logs. Cron is not exercised by preview deployments; run it only against an isolated development database with a development secret and provider key.

## Database deployment order

1. Merge the backend change to `develop` and run it against the backend repository's isolated local/test Supabase stack.
2. Verify that anonymous and ordinary authenticated sessions can read only verified/open public rows, only the `internships.manage` role can create, edit, review, and close listings, and the ingestion RPC is executable only by `service_role`.
3. Configure Vercel Preview with non-production Supabase credentials if you want to exercise draft management. Configure Production secrets only after the backend schema is approved and deployed.
4. Deploy the website change. Its preview does not schedule the Cron job; production activation happens after the production branch deployment.

Do not apply this migration directly to the production project from the frontend repository.
