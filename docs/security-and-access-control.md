# Security and access control

## Trust boundaries

- Supabase publishable key: identifies the project; it is public and safe for browser use.
- Auth session: establishes the user identity. Supabase Postgres policies derive the user from the verified JWT.
- Database roles and permissions: the authority for all management operations. Do not trust browser state or editable Auth metadata.
- Service credentials: not used by this frontend. The invitation Edge Function keeps its server-side credential in Supabase secrets.

The website uses cookie-aware server clients. A server component or server action still represents the signed-in user and receives only that user's database privileges.

## Defense in depth

1. Server actions validate form shape, lengths, IDs, dates, URLs, slugs, and allowed status transitions.
2. UI areas are hidden when the current user lacks a capability.
3. Every read/write is independently checked by Supabase RLS, scoped permission functions, constraints, and triggers.
4. Public data caching is limited to anonymous reads; member-specific results never enter shared public caches.

Hiding an admin control does not authorize a database request. A policy-filtered query may return no rows without an error, so explain missing scope access in the UI.

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

- The invitation Edge Function verifies the Auth JWT and checks society-wide admin.manage before using its server-side Auth Admin credential.
- Role creation, permission replacement, and deletion use admin-only database functions that enforce uniqueness and prevent removal of system or assigned roles.
- Event registration capacity, waitlist assignment, and promotion are database-owned to handle concurrent sign-ups.
- Cancelling an active registration may promote a waitlisted user. Stale manager actions are rejected by checking the previous status.
- Prefer deactivation for clubs, positions, team, and alumni when history matters. Deleting an event cascades to its registrations in the current schema.

## Security review checklist

For a new table or capability, review:

- RLS is enabled on every exposed table and policies cover intended operations.
- SQL grants are no broader than necessary for anon/authenticated.
- Inserts and updates derive ownership from auth.uid() and prevent client-selected privilege/status escalation.
- Scope checks cover reads and writes, and database constraints protect valid relationships.
- SECURITY DEFINER functions use a constrained search_path, qualified references, and minimal execute grants.
- Authenticated/private queries do not enter a shared anonymous cache.
- Sensitive user data is not added to public tables, logs, or analytics.
- Forward-only migrations are reviewed and tested against a development database before production.

See the backend [security and access-control guide](https://github.com/tarunchaudharydev/techtronica-backend/blob/main/docs/security-and-access-control.md) for the table-by-table policy matrix.
