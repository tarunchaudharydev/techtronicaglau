# Society notifications and activity

## Who receives notifications

The in-app feed is available only to signed-in users with an active society membership. Database row-level security enforces this rule for reads and read receipts. A manager permission alone does not grant feed access. Public events can still be viewed on the public Events page; event notifications remain member-only.

## Activity included

The database creates feed entries for published events, role and permission changes, role assignments, club and position changes, membership activity, website directory/content updates, attendance session creation and attendance marking, contact enquiries, and event registrations. Activity messages avoid applicant, attendee, registrant, and contact-form private details. Attendance activity is grouped by session and the manager who recorded it to avoid one alert per member in the roster.

## Mobile and desktop behavior

The bell panel is a bounded, independently scrollable feed. It loads the first 30 entries and fetches older entries as the reader reaches the end or presses **Load older notifications**. On mobile it respects the safe-area inset and allows vertical touch scrolling; tapping outside, pressing Escape, following a notice, or choosing the close button dismisses the panel. The realtime channel refreshes the feed after inserts and read-receipt changes.

## Attendance saves

Attendance controls update their visible selection as soon as the manager chooses a status. Requests for a member are sent in order, while a newer choice is queued and saved after the current request. The UI rolls back to the last confirmed status if the final save fails and shows an accessible error. One row’s save does not block marking another member.

## Database and security

The backend migration adds the activity kind, backfills historical notices to the member-only audience, and enforces membership-only reads with RLS. Notification generation runs in database triggers so activity is captured consistently for changes made through the app or database. The frontend only reads notification rows allowed by RLS and stores each member’s own read receipts.

For deployment steps, use the [backend migration runbook](https://github.com/tarunchaudharydev/techtronica-backend/blob/main/supabase/migrations/README.md) and [Realtime guide](realtime.md).
