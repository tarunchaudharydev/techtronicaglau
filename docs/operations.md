# Operations and deployment

## Environments and credentials

- Clerk owns identity and account sessions; Supabase project `erivblclxwtonwysgdle` owns app data and RLS.
- Local development uses `.env.local` (ignored by Git).
- Vercel uses encrypted variables configured per environment.
- Clerk's secret key is server-only. The Supabase publishable key and Clerk publishable key are intended for browser use.

The frontend uses these variables:

~~~dotenv
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/auth/sign-in
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/auth/sign-up
NEXT_PUBLIC_SUPABASE_URL=https://your-project-ref.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=your-supabase-publishable-key
NEXT_PUBLIC_SITE_URL=http://localhost:3000
~~~

Never expose a Clerk secret key or Supabase secret/service-role key with the `NEXT_PUBLIC_` prefix. The frontend does not require a Supabase service-role key.

## Local workflow

~~~sh
npm ci
cp .env.example .env.local
npm run dev
~~~

Before review, run the checks available in `package.json`:

~~~sh
npm run lint
npx tsc --noEmit
npm run build
~~~

There is no `npm test` script currently. Do not commit local environment files, `.next` output, or production data.

## Identity and database setup

1. Configure Clerk sign-in, sign-up, email verification, recovery, redirect paths, and allowed origins.
2. Add Clerk's session-token claims `role: "authenticated"` and `userId: "{{user.external_id}}"`.
3. Configure Supabase Third-Party Auth to trust the matching Clerk issuer.
4. Set Clerk publishable/secret keys and Supabase URL/publishable key in local and Vercel environments.
5. Review the frontend Clerk migration and coordinate the database migration with the backend owner. This frontend does not apply database migrations.
6. Import existing accounts into Clerk with `external_id` set to the matching `profiles.id` UUID; verify mappings before production cutover.
7. Assign the first Society Admin using the guarded bootstrap procedure in the backend repository.
8. Verify visitor, new account, existing member, club manager, and Society Admin access in staging.

## Deployment checklist

1. Open a focused pull request. Coordinate frontend changes with backend migrations when required.
2. Review migration scope and confirm the target Supabase project history is compatible.
3. Set environment variables for the intended Vercel environment, including its correct `NEXT_PUBLIC_SITE_URL`.
4. Confirm Clerk permits the deployed origin and callback paths, and Supabase Third-Party Auth trusts the Clerk issuer.
5. Review available PR checks and the Vercel build. Do not treat a preview deployment as a production release.
6. Verify public/private visibility and representative allowed and denied role scopes.
7. Promote only after review and required database changes are ready.
8. Review Vercel runtime logs, Clerk logs, and Supabase Postgres logs after release.

A frontend deployment does not apply database migrations. Apply backend migrations through the reviewed backend process.

## Recovery notes

- Missing Supabase URL/key disables data-backed features; it must never enable privileged fallback.
- Clerk redirects fail if the site URL or allowed origins do not match; Supabase requests fail if the Clerk issuer or session claims are misconfigured.
- A rejected write is usually an RLS, scope, validation, or constraint failure; inspect the actor and row scope before changing a policy.
- Registration capacity and status transitions are database-owned. Do not hand-edit status values without understanding triggers and waitlist behavior.
- Prefer deactivation or a non-public status change over deletion when history matters.
- Use the recovery procedure in the backend repository before attempting a production restore.

## Release checklist

- Target Vercel Clerk/Supabase environment variables and Clerk redirects are correct.
- Required schema changes are applied and frontend generated types match.
- The available lint, type, and production build checks pass.
- No private keys, contact message contents, phone numbers, student IDs, or member photos are included in the change.
- Public and private paths are checked as a visitor, non-member, and active member.
- Admin tasks are checked with allowed and denied scopes.
- A rollback owner and database backup/recovery path are known.


## Realtime operations

The backend migration publishes the supported application tables. Use the [backend Realtime runbook](https://github.com/tarunchaudharydev/techtronica-backend/blob/main/docs/realtime.md) when adding a table or verifying publication membership. Do not toggle publication membership manually as a production fix; make reviewed, forward-only migrations.

When a page is stale, check both the Realtime channel and the server cache. A successful database write should invalidate any Next.js tags or paths used by cached public content. The browser retries its channel after errors and refreshes on reconnect or when a hidden tab becomes visible. See [Live database updates](realtime.md) for the data scope and troubleshooting steps.
