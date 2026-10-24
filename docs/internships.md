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

The repository seeds official career landing pages for Google, NVIDIA, Microsoft, Amazon, and Netflix so reviewers can use a consistent company directory. No authorized public internship feed/API was identified for these sources during implementation. Therefore, no adapter is active and the system does not scrape career pages, create sample jobs, or claim that source data is synchronized automatically. Admins can add/review official postings manually.

The backend schema reserves a private source-record table with a unique `(source_name, source_identifier)` key and provenance fields for a future authorized adapter. Add an adapter only after confirming that the company offers a documented feed/API and its terms allow this use. It must validate and normalize records, use that stable key for upserts, isolate failures by source, respect rate limits, and leave existing verified records intact during outages.

## Scheduled checks and configuration

`vercel.json` schedules `GET /api/cron/internships` once per day for 02:30 UTC (08:00 India Standard Time). Vercel Cron uses UTC and invokes routes only for production deployments. On Vercel Hobby, the request may arrive at any time during the selected 02:00–02:59 UTC hour (07:30–08:29 IST); the cleanup is idempotent, so it does not depend on the exact minute. The route:

- Requires `Authorization: Bearer $CRON_SECRET` and rejects missing/short secrets.
- Uses `SUPABASE_SECRET_KEY` (or the legacy `SUPABASE_SERVICE_ROLE_KEY`) only in server-side code.
- Claims a five-minute database lease before it starts so duplicate or overlapping requests do not process concurrently.
- Closes explicitly expired listings, marks overdue checks stale, and writes a run summary and duration to `internship_ingestion_runs`.
- Runs only registered authorized adapters. The registry is empty until a source is approved, so today it performs expiry and staleness checks only.

Set the following Vercel variables for the Production environment after reviewing the backend migration:

```dotenv
SUPABASE_SECRET_KEY=<server-only Supabase secret key>
CRON_SECRET=<random value with at least 16 characters>
```

Use the matching development-project key locally. Do not use `NEXT_PUBLIC_` prefixes, commit either value, or share them in issues. Vercel reports job invocations under Cron Jobs and runtime logs. Cron is not exercised by preview deployments; test the route directly against an isolated development database with a development secret.

## Database deployment order

1. Merge the backend change to `develop` and run it against the backend repository's isolated local/test Supabase stack.
2. Verify that anonymous and ordinary authenticated sessions can read only verified/open public rows, while only the `internships.manage` role can create, edit, review, and close listings.
3. Configure Vercel Preview with non-production Supabase credentials if you want to exercise draft management. Configure Production secrets only after the backend schema is approved and deployed.
4. Deploy the website change. Its preview does not schedule the Cron job; production activation happens after the production branch deployment.

Do not apply this migration directly to the production project from the frontend repository.
