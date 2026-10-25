# Internship directory

The public directory lives at `/internships`. Society Admins manage records at `/manage/internships` through the database-backed `internships.manage` permission. The frontend repository owns the page and scheduled route; the backend repository owns the canonical migration, schema, RLS, and generated database types.

## Listing lifecycle

1. A Society Admin can add an opportunity manually using its official source, structured technical areas, skills, location, work arrangement, degree requirements, eligible years, posting date, deadline, and HTTPS application/source links.
2. Manual rows start as `listing_status = unverified` and `verification_status = pending`. They stay hidden from the public site until a Society Admin opens the links, checks the posting, and confirms publication.
3. The daily importer discovers internship results through Google Jobs via SerpApi for Google, NVIDIA, Microsoft, Amazon, and Netflix. It accepts a result only when the company name matches an approved alias, the title says internship, and the application URL is a job-specific HTTPS page on that employer's exact allowlisted careers domain.
4. Accepted imported rows are published automatically as `listing_status = open` and `verification_status = verified`. The public listing contains a short directory note rather than copied employer text and links directly to the official employer page. It does not infer degree requirements, eligible years, or a deadline; members must confirm those details on the employer's page.
5. Each successful daily match refreshes the imported title, location, application link, and last-check timestamp, and sets a 72-hour verification deadline. If a provider run fails, an active listing remains available until that deadline; after it passes, the cron hides the listing as stale. A later successful match can reopen a stale auto-imported listing.
6. Editing an imported listing through the admin form changes it to a manual listing and requires another review. The importer never reopens a listing an admin closed or rejected, and it never overwrites manual edits.
7. A daily scheduled check closes rows whose explicit deadline has passed. Closing or rejecting keeps history and is never undone by a later feed result.

The public policy returns only rows that are open, verified, have a verification timestamp, and do not have an expired deadline. The detail page explains whether the row passed an automatic source check or a Society Admin review. Description text is rendered as plain text; imported HTML and provider descriptions are never trusted.

## Search, filters, and pagination

Search uses the database's generated `tsvector` and GIN index. Category, degree, and eligible-year filters use structured arrays and GIN indexes; company and city use indexed identifiers/normalized values. Filters are validated on the server and serialized in the query string. Pages use a validated, sort-bound cursor instead of downloading the full table. Supported orderings are deadline, posting date, and verification date.

The public page queries through the anonymous RLS-scoped Supabase client. It selects only listing fields needed for the directory. Private source identifiers, normalized source hashes, raw provenance, and adapter data live in the backend's private schema.

## Career-source status

The scheduled importer uses [SerpApi's Google Jobs API](https://serpapi.com/google-jobs-api) as a discovery provider for Google, NVIDIA, Microsoft, Amazon, and Netflix in India. Google Jobs is a third-party index, not an employer feed; Techtronica does not crawl employer websites or copy provider job descriptions. Every published application link is a direct, job-specific URL on the matching employer's allowlisted careers domain.

The provider is optional. Set `SERPAPI_API_KEY` as a server-only environment variable to enable five searches per daily run (one per employer). Check [SerpApi's current plan limits and pricing](https://serpapi.com/pricing) before enabling it because limits and terms can change.

Discovery results are accepted only when the employer name matches and the application link is a job-specific page on an exact allowlisted company career host. Aggregator, search-result, and generic career landing links are rejected. The importer stores a short generic directory note and structured title/location only. Automated rows publish immediately after these checks, then are refreshed daily and hidden after 72 hours without a successful check. A Society Admin can still add/edit manual listings; those stay unpublished until reviewed. Closed, rejected, and manually edited records are not reopened or overwritten by the importer.

## Scheduled checks and configuration

`vercel.json` schedules `GET /api/cron/internships` once per day for 02:30 UTC (08:00 India Standard Time). Vercel Cron uses UTC and invokes routes only for production deployments. On Vercel Hobby, the request may arrive at any time during the selected 02:00–02:59 UTC hour (07:30–08:29 IST); cleanup is idempotent and the provider search budget remains one request per company per run. The route:

- Requires `Authorization: Bearer $CRON_SECRET` and rejects missing/short secrets.
- Uses `SUPABASE_SECRET_KEY` (or the legacy `SUPABASE_SERVICE_ROLE_KEY`) only in server-side code.
- Uses optional `SERPAPI_API_KEY` only on the server for five daily Google Jobs searches.
- Claims a five-minute database lease before it starts so duplicate or overlapping requests do not process concurrently.
- Closes explicitly expired listings, refreshes and publishes valid official employer links, and hides auto-imported rows when their 72-hour verification window expires.
- Preserves records an admin closed, rejected, or edited, and writes each run's counts and duration to `internship_ingestion_runs`.

Configure these server-only Vercel variables for the Production environment:

```dotenv
SUPABASE_SECRET_KEY=<server-only Supabase secret key>
CRON_SECRET=<random value with at least 16 characters>
SERPAPI_API_KEY=<SerpApi key for internship discovery>
```

Use matching development-project credentials locally. Do not use `NEXT_PUBLIC_` prefixes, commit these values, or share them in issues. Vercel reports job invocations under Cron Jobs and runtime logs. Cron is not exercised by preview deployments; run it only against an isolated development database with a development secret and provider key.

## Database deployment order

1. Merge the backend change to `develop` and run it against the backend repository's isolated local/test Supabase stack.
2. Verify that anonymous and ordinary authenticated sessions can read only verified/open public rows, only the `internships.manage` role can create, edit, review, and close listings, and the ingestion RPC is executable only by `service_role`.
3. Configure Vercel Preview with non-production Supabase credentials if you want to exercise draft management. Configure Production secrets only after the backend schema is approved and deployed.
4. Deploy the website change. Its preview does not schedule the Cron job; production activation happens after the production branch deployment.

Do not apply this migration directly to the production project from the frontend repository.
