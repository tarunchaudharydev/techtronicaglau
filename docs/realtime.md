# Live database updates

Techtronica uses Supabase Postgres Changes as an invalidation signal for server-rendered pages. The browser does not use event payloads as application data: after a relevant change it asks Next.js to re-run the current route with the signed-in user's session.

## Route-scoped subscriptions

`components/RealtimePageRefresh.tsx` subscribes only to tables used by the current route. The main groups are:

- **Homepage:** clubs, positions, events, team members, alumni, site content, profiles, and memberships.
- **Static content routes:** site content only.
- **Club routes:** clubs, positions, team members, alumni, events, memberships, and profiles.
- **Event routes:** events, clubs, registrations, registration members, memberships, and profiles.
- **Account routes:** the current profile's memberships, club/position details, registrations, and attendance.
- **Management routes:** the dashboard keeps its overview tables; management subpages subscribe only to their relevant operational tables (for example attendance, contacts, content, or notifications).

The exact lists are typed against `Database` and live in `tablesForPath`. An unmatched route opens no page-refresh subscription. The notification bell has a separate channel for notifications and the signed-in user's read receipts.

Each table uses one Postgres Changes `*` handler, so inserts, updates, and deletes are batched into one short-debounced `router.refresh()`. This invalidates the rendered view without transferring row contents into client state. Background 30-second polling was removed; initial connection, channel reconnect, visibility restoration when a refresh was deferred, and browser reconnection reconcile the route with the database.

## Authorization and privacy

Realtime delivery does not grant access. Table grants and Row Level Security continue to control which changes a session can receive, and the refreshed server query applies RLS again. Keep service-role keys server-only. Sensitive tables such as `private_profiles` and `network_diagnostic_sessions` must not be published or subscribed to by the browser.

Do not add a table to the route lists only to fix a stale screen. First check that its data is rendered on that route, that its audience is authorized by RLS, and that its write path invalidates any Next.js cache.

## Database setup

The backend owns the migration adding application tables to Supabase's `supabase_realtime` publication:

[`20261020120000_enable_realtime_live_data.sql`](https://github.com/tarunchaudharydev/techtronica-backend/blob/main/supabase/migrations/20261020120000_enable_realtime_live_data.sql).

When a page needs a new live table:

1. Confirm the route actually renders data from the table and define the narrowest route scope.
2. Review grants and RLS for visitors, members, and managers. Publication membership is not an authorization rule.
3. Add the table to the backend publication using a new, forward-only migration.
4. Add it to the frontend `tablesForPath` mapping.
5. Make the write action invalidate relevant Next.js tags/paths. Realtime is a follow-up, not a substitute for mutation-side invalidation.
6. Verify with the least-privileged role that should see the data and one role that should not.

Preview database migrations before applying them:

```sh
supabase migration list
supabase db push --dry-run
```

Never run a linked database reset against production.

## Caching and freshness

Public read-heavy site content already uses Next.js `unstable_cache` with named tags. Mutation actions should invalidate the tag they change and the affected route. Personalized profile, notification, and member data must not enter a shared cache. Do not add Redis or cache every query without measured evidence.

## Troubleshooting

- **A page changes only after reload:** check the route-to-table mapping, Realtime publication, channel status, server query, and cache tag/path invalidation.
- **Only some accounts receive events:** inspect JWT claims, SELECT grants, and RLS audience predicates.
- **A hidden tab is stale after returning:** check for channel reconnect errors and verify the page reconciles when it returns to the foreground.
- **Notification badge is stale:** check the notifications and notification_reads policies/publication and the notification bell's channel.
- **A route gets refreshes for unrelated edits:** narrow its mapping in `tablesForPath`; do not add broad subscriptions as a fallback.

References: [Supabase database change subscriptions](https://supabase.com/docs/guides/realtime/subscribing-to-database-changes) and [Realtime authorization](https://supabase.com/docs/guides/realtime/authorization).
