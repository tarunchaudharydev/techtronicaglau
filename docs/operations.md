# Operations and deployment

## Environments and credentials

- Supabase project: `erivblclxwtonwysgdle`.
- Local development: `.env.local` (ignored by Git).
- Vercel: encrypted environment variables per environment.
- Supabase Edge Function: invitation credentials configured as Supabase secrets.

The frontend uses these variables:

~~~dotenv
NEXT_PUBLIC_SUPABASE_URL=https://your-project-ref.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=your-public-publishable-key
NEXT_PUBLIC_SITE_URL=http://localhost:3000
~~~

The publishable key is designed for browser use and does not grant database access by itself. Never expose a secret/service-role key with the `NEXT_PUBLIC_` prefix. The frontend does not need a service-role key.

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

## Supabase setup

1. Review the backend repository's setup guide and migration history.
2. Configure Auth site URL, callback allowlist, email confirmation, sender, and templates.
3. Set the public Supabase URL and publishable key in local/Vercel environments.
4. Create and confirm the intended administrator account.
5. Assign the first Society Admin using the guarded bootstrap procedure in the backend repository.
6. Configure the invitation Edge Function and exact allowed origins.
7. Verify public, signed-in non-member, society member, club manager, and Society Admin access.

## Deployment checklist

1. Open a focused pull request. Coordinate frontend changes with backend migrations when required.
2. Review migration scope and confirm the target Supabase project history is compatible.
3. Set environment variables for the intended Vercel environment, including its correct `NEXT_PUBLIC_SITE_URL`.
4. Confirm Supabase Auth permits the deployed origin and callback/reset paths.
5. Review available PR checks and the Vercel build. Do not treat a preview deployment as a production release.
6. Verify public/private visibility and representative allowed and denied role scopes.
7. Promote only after review and required database changes are ready.
8. Review Vercel runtime logs and Supabase Auth/Postgres logs after release.

A frontend deployment does not apply database migrations. Apply backend migrations through the reviewed backend process.

## Recovery notes

- Missing Supabase URL/key disables data-backed features; it must never enable privileged fallback.
- Auth redirects fail if the site URL or callback allowlist does not match.
- A rejected write is usually an RLS, scope, validation, or constraint failure; inspect the actor and row scope before changing a policy.
- Registration capacity and status transitions are database-owned. Do not hand-edit status values without understanding triggers and waitlist behavior.
- Prefer deactivation or a non-public status change over deletion when history matters.
- Use the recovery procedure in the backend repository before attempting a production restore.

## Release checklist

- Target Vercel environment variables and Auth redirects are correct.
- Required schema changes are applied and frontend generated types match.
- The available lint, type, and production build checks pass.
- No private keys, contact message contents, phone numbers, student IDs, or member photos are included in the change.
- Public and private paths are checked as a visitor, non-member, and active member.
- Admin tasks are checked with allowed and denied scopes.
- A rollback owner and database backup/recovery path are known.
