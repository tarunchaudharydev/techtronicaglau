# Live database updates

This guide describes the browser's Supabase Realtime subscriptions and the Next.js refresh path used to keep pages current without routine reloads.

## What updates live

The application listens for database `INSERT` and `UPDATE` changes on:

- Shared pages: `clubs`, `positions`, `events`, `team_members`, `alumni`, `site_content`, `profiles`, `memberships`, `event_registrations`, `event_registration_members`, `notifications`, and `notification_reads`.
- Management pages only: `permissions`, `roles`, `role_permissions`, `user_role_assignments`, `contact_submissions`, `meeting_attendance_sessions`, and `meeting_attendance`.

The shared listener refreshes the current Next.js route after a short 180 ms debounce. A batch of related writes therefore causes one refresh rather than a burst of requests. The browser then re-runs the route's server components with the current user's session. The listener is mounted once in the root layout; management-only subscriptions are added only under `/manage`.

The notification bell maintains its own channel so the feed and read/unread count can update immediately. The admin dashboard does not poll on a timer. If the connection drops, the client retries; when the browser reconnects or becomes visible again, the page reconciles with the database.

## Access and privacy

Realtime is a delivery mechanism, not an authorization mechanism. Reads remain subject to the signed-in user's database grants and Row Level Security (RLS). A table being present in the Realtime publication does not grant read access.

The listener reacts to a change notification and refreshes the current route; it does not pass row payloads into the page. Queries must still select only fields appropriate for their audience. `private_profiles` and `network_diagnostic_sessions` are intentionally excluded from the publication and must stay out of browser subscriptions.

The client currently registers `INSERT` and `UPDATE` handlers. For deletes, the server action must invalidate the affected Next.js path/cache and the UI must refresh after the action. Do not depend on a Realtime `DELETE` event for UI correctness.

## Database setup

The backend repository owns the migration that adds the application tables to the Supabase `supabase_realtime` publication:

[`20261020120000_enable_realtime_live_data.sql`](https://github.com/tarunchaudharydev/techtronica-backend/blob/main/supabase/migrations/20261020120000_enable_realtime_live_data.sql).

When introducing a table that needs live UI updates:

1. Confirm its `SELECT` grants and RLS policies are correct for every relevant audience.
2. Add it to the Realtime publication in a reviewed backend migration.
3. Add it to `sharedTables` or `managementTables` in `components/RealtimePageRefresh.tsx`, choosing the narrowest scope.
4. Keep private or high-volume data out unless the product requires it and its access model has been reviewed.
5. Ensure delete actions invalidate server caches explicitly.
6. Verify the behavior as a visitor, signed-in non-member, member, club manager, and Society Admin as applicable.

Do not add service-role credentials to the browser to make subscriptions work.

## Caching and performance

Realtime and Next.js caching solve different parts of freshness. A database event tells the browser to refresh; server actions that change cached public content should still invalidate the relevant Next.js tag or path immediately. For example, content writes use `updateTag("site-content")` and revalidate affected routes.

Subscriptions are batched, scoped to the current route class, and reconciled after reconnect/focus. Avoid adding periodic polling as a fallback while a healthy channel is active. For bounded, noncritical background data, prefer a deliberate stale-time refresh policy over a tight polling loop.

## Troubleshooting

- **A page changes only after a manual reload:** confirm the table is in the backend publication and in the correct frontend table list; check the browser console for channel errors.
- **Only some users receive a change:** inspect the table's `SELECT` grant and RLS policy for each user's JWT. This is usually an access-policy or audience issue.
- **Data remains stale after the event arrives:** inspect the server query and Next.js cache tags/paths. Realtime cannot invalidate a cache that the write action does not name.
- **The feed says notifications are unavailable:** check the `notifications` and `notification_reads` migrations, publication membership, RLS policies, and the Supabase Realtime connection.
- **Updates appear after returning to a tab:** the app reconciles on visibility change and after reconnect; check network restrictions if the socket cannot stay connected.

Supabase references: [listen to database changes](https://supabase.com/docs/guides/realtime/subscribing-to-database-changes) and [Realtime authorization](https://supabase.com/docs/guides/realtime/authorization).


## Society notification feed

The notification bell listens for published member-only notices and read-receipt changes. The panel loads notices in pages of 30, supports loading older entries, and closes on outside pointer input or Escape. The database policy allows reads only to active society members; event and management notifications follow that same audience rule. See the [notification and activity guide](notifications.md).
