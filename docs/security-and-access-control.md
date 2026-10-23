# Security and access control

## Trust boundaries

- Supabase publishable key: identifies the project; it is public and safe for browser use.
- Clerk session: establishes identity. Supabase Third-Party Auth validates the Clerk-signed token before Postgres uses it.
- Application profile and permission records: Supabase stores the stable UUID, society/club roles, and scope. These database records are the authority for management access.
- Service credentials: Clerk's secret key is server-only and used for invitations/session administration. The frontend does not use a Supabase service-role key.

The website uses request-scoped server and browser clients. Authenticated database requests carry the current Clerk session token and remain limited by RLS.

## Defense in depth

1. Server actions validate form shape, lengths, IDs, dates, URLs, slugs, and allowed status transitions.
2. UI areas are hidden when the current user lacks a capability.
3. Every read/write is independently checked by Supabase RLS, scoped permission functions, constraints, and triggers.
4. Public data caching is limited to anonymous reads; member-specific results never enter shared public caches.

Hiding an admin control does not authorize a database request. A policy-filtered query may return no rows without an error, so explain missing scope access in the UI.

## Request and browser protections

- The contact and opt-in network diagnostics endpoints reject cross-origin browser requests.
- Both endpoints parse JSON with the shared streaming byte limiter. Contact bodies are capped at 12 KB and diagnostics bodies at 2 KB even when `Content-Length` is missing or inaccurate.
- The Next.js configuration sends `X-Content-Type-Options`, `X-Frame-Options`, `Referrer-Policy`, `Permissions-Policy`, and HSTS headers.
- The contact endpoint is intentionally public and writes only to the private submissions table. Apply a Vercel Firewall rate limit to `POST /api/contact` in production; request-size and origin controls do not cap request frequency.

Run `npm run audit` before release to check direct and transitive packages. CI runs the same audit and blocks on moderate or higher advisories.

## Private content rules

Events and team profiles default to public. Anonymous users can read only records permitted by the public policy (active public team profiles and published public events). An authenticated active member of the society or any club can also read private team profiles and private published events. Pending/rejected memberships do not qualify. A manager with the matching content permission can read/manage rows in the allowed scope.

Contact form submissions are private. Anonymous callers can insert bounded messages but cannot read them. The `contacts.manage` permission scopes inbox access to a society or club; Society Admin can manage all scopes.

Alumni entries are public active directory records in the current schema. The model does not include a private alumni visibility flag.

Phones and student IDs are kept in private_profiles and are not included in public directory queries. Avoid logging these values or placing them in analytics.

## Capability map

| Capability | Purpose |
| --- | --- |
| admin.manage | Manage permission bundles, invitations, direct assignments, and administrative profile access |
| clubs.manage | Manage club details and activation |
| positions.manage | Manage scoped position definitions |
| members.manage | Review society/club membership applications |
| events.manage | Manage events and audience visibility |
| registrations.manage | Review attendance and update event registration state |
| team.manage | Manage team profiles |
| alumni.manage | Manage alumni profiles |

Roles can grant only existing permission keys. Adding a new key requires a backend migration. Society and club role scopes must match the position or direct assignment scope. An active membership can inherit the role of its active position.

## High-risk operations and retention

- Clerk invitation and account administration are called only from server actions protected by the database-backed admin.manage permission. Never expose the Clerk secret key to the browser.
- Role creation, permission replacement, and deletion use admin-only database functions that enforce uniqueness and prevent removal of system or assigned roles.
- Event registration capacity, waitlist assignment, and promotion are database-owned to handle concurrent sign-ups.
- Cancelling an active registration may promote a waitlisted user. Stale manager actions are rejected by checking the previous status.
- Prefer deactivation for clubs, positions, team, and alumni when history matters. Deleting an event cascades to its registrations in the current schema.

The Supabase Auth leaked-password advisor applies to Supabase Auth password accounts. This application uses Clerk for sign-in; changing the Supabase Auth password setting does not harden Clerk accounts. Keep identity-provider password controls configured in Clerk if password sign-in is enabled.

## Security review checklist

For a new table or capability, review:

- RLS is enabled on every exposed table and policies cover intended operations.
- SQL grants are no broader than necessary for anon/authenticated.
- Inserts and updates derive ownership from the verified token through private.current_profile_id() and prevent client-selected privilege/status escalation.
- Scope checks cover reads and writes, and database constraints protect valid relationships.
- SECURITY DEFINER functions use a constrained search_path, qualified references, and minimal execute grants.
- Authenticated/private queries do not enter a shared anonymous cache.
- Sensitive user data is not added to public tables, logs, or analytics.
- Forward-only migrations are reviewed and tested against a development database before production.

See the backend [security and access-control guide](https://github.com/tarunchaudharydev/techtronica-backend/blob/main/docs/security-and-access-control.md) for the table-by-table policy matrix.
