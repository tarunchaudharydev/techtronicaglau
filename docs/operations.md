# Operations and deployment

## Environments and secrets

- Supabase project: erivblclxwtonwysgdle.
- Local development: .env.local (ignored by Git).
- Vercel: encrypted environment variables per deployment environment.
- Supabase Edge Function: invite-function secrets configured in Supabase.

Required frontend variables:

~~~dotenv
NEXT_PUBLIC_SUPABASE_URL=https://erivblclxwtonwysgdle.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=your-public-publishable-key
NEXT_PUBLIC_SITE_URL=http://localhost:3000
~~~

Never expose a service-role/secret key with the NEXT_PUBLIC_ prefix. The website does not need one.

## Local workflow

~~~sh
npm ci
cp .env.example .env.local
npm run dev
~~~

Before review, use the repository's lint, TypeScript, and production build commands. Do not commit local environment files or generated .next artifacts.

## Supabase setup

1. Review the backend repository documentation and migration history.
2. Configure Auth site URL, allowed redirects, email confirmation, sender, and templates.
3. Configure the public URL and publishable key in local/Vercel environments.
4. Create and confirm the intended administrator account.
5. Assign the first Society Admin using the backend repository's guarded bootstrap script.
6. Configure the invitation Edge Function URL/redirect and exact allowed CORS origins.
7. Verify representative public, member, club manager, and Society Admin flows.

## Deployment

1. Create a pull request with code, schema type changes, and docs together.
2. Review database migration scope and ensure the target Supabase project history matches.
3. Configure production environment variables in Vercel, including production NEXT_PUBLIC_SITE_URL.
4. Confirm Supabase Auth allows the production callback and password reset URLs.
5. Deploy after CI/review and verify public pages and sign-in.
6. Verify each role sees only its permitted management areas and private content.
7. Observe Supabase Auth/Postgres logs and Vercel runtime logs after release.

A frontend deployment does not migrate database schema. Apply backend migrations through the reviewed backend process.

## Recovery notes

- A missing publishable URL/key disables data-backed queries; it must never enable privileged fallback.
- Auth redirects fail if the site URL/callback allowlist does not match.
- A rejected write is usually an RLS/scope/constraint failure; inspect the role and row scope before changing policy.
- Event registration status and waitlist promotion are database-owned. Avoid hand-editing registration status via SQL without understanding the trigger behavior.
- To hide a record without losing history, prefer deactivation or a non-public/status change over deletion.

## Release checklist

- Environment variables exist in the target Vercel environment.
- Supabase Auth redirect URLs include the deployed origin.
- All schema changes are applied and generated type files match.
- No private keys, member phone numbers, or student IDs are present in the PR.
- Public/private visibility is checked as visitor, non-member, and active member.
- Admin tasks are checked with both allowed and denied roles.
- Rollback/recovery owner and Supabase backups are known.
