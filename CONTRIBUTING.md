# Contributing

## Development

1. Clone https://github.com/tarunchaudharydev/techtronicaglau.
2. Install with npm ci.
3. Configure local public Supabase URL/key and site URL in .env.local.
4. Create a feature branch and keep changes scoped to the behavior being updated.
5. Make database changes in the backend repository as a forward-only Supabase migration; update frontend generated types after schema changes.
6. Update the relevant documentation when a route, permission, environment variable, or operational procedure changes.

## Review expectations

- Keep authorization checks in Postgres RLS and database permission functions. UI gating is for usability only.
- Validate untrusted input at the server boundary and rely on database constraints as a second line of defense.
- Keep private/membership-dependent responses out of shared public caches.
- Never commit secrets, personal member data, build output, or local Supabase credentials.
- Prefer bounded queries and keyset pagination for growing administrative lists.
- Preserve history by deactivating records when a hard delete is unnecessary.
- Keep the public brand's Geist typography and sky/indigo/violet palette consistent with existing page components.

## Before requesting review

~~~sh
npm run lint
npx tsc --noEmit
npm run build
~~~

Describe visible behavior, database/schema requirements, setup changes, and checks in the pull request.
