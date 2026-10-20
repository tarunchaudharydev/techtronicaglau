# Architecture

## System context

~~~mermaid
flowchart LR
  Visitor[Public visitor or member] --> Next[Next.js application]
  Next -->|Clerk session| Auth[Clerk]
  Next -->|Publishable key plus Clerk token| API[Supabase Data API]
  Auth --> API
  API --> RLS[Postgres RLS and permission checks]
  RLS --> DB[(Supabase Postgres)]
  Next -->|Admin invitation request| AuthAdmin[Clerk Backend API]
  Next -->|Optional consented coarse summary| Diagnostics[Network diagnostics table]
~~~

The application uses `@supabase/ssr` clients in server components, server actions, route handlers, and browser components. Clerk session tokens authenticate those data requests through Supabase Third-Party Auth. Server-side Clerk Backend API calls handle invitations, bans, and session administration.

## Data domains

- **Identity:** Clerk accounts and sessions; application-owned `profiles` and `private_profiles` retain stable profile UUIDs.
- **Organization and access:** `clubs`, `memberships`, `positions`, `permissions`, `roles`, `role_permissions`, and `user_role_assignments`.
- **Society content:** `site_content`, `events`, `team_members`, `alumni`, and `contact_submissions`.
- **Participation:** `event_registrations`.
- **Optional diagnostics:** one coarse, consented connection summary per browser session. Raw IP addresses, exact location, and continuous speed samples are not stored by the application.

The generated API types are in `types/database.ts`. The backend repository owns the migration history and database policies.

## Authorization flow

1. Clerk verifies the account and provides a signed session token.
2. The server or browser passes that token to a request-scoped Supabase client.
3. `private.current_profile_id()` maps the verified Clerk subject to the application's stable profile UUID.
4. The application reads current database roles to render relevant management paths.
5. Postgres RLS, permission functions, constraints, and triggers independently validate reads and writes.

The user interface improves discoverability; the database is the security boundary. Never use client state or user-editable Auth metadata as an authorization source.

## Data and caching boundaries

- Anonymous public reads may use the public content helper and its revalidation policy.
- Requests dependent on auth cookies, membership, or private records must remain request-scoped.
- Shared caches must not contain member-specific or manager-specific results.
- Management lists use bounded result sizes; use stable pagination for growing datasets.
- Event capacity and registration state are guarded by database logic to prevent concurrent overbooking and invalid transitions.

## Source organization

~~~text
app/                 Next.js App Router routes and server actions
components/          shared UI and feature components
lib/auth/            Clerk identity resolution and permission lookup
lib/data/            typed Supabase queries and mappers
lib/manage/          manager authorization, validation, and shared tools
lib/supabase/        browser and server clients
types/               generated database types and application models
docs/                architecture, security, setup, and operations guides
~~~

## Related documentation

- [Authentication and permissions](authentication-and-permissions.md)
- [Content management and visibility](content-management.md)
- [Security and access control](security-and-access-control.md)
- [Operations and deployment](operations.md)
- [Backend schema and migrations](https://github.com/tarunchaudharydev/techtronica-backend)


## Live database updates

The root layout mounts a browser Realtime listener. It subscribes to shared site/member tables on public routes and adds role, contact, and attendance tables only under `/manage`. Insert and update notifications trigger a debounced Next.js route refresh; the browser then re-runs server queries under the current session and RLS policies. The notification bell has a separate feed/read-state subscription. Offline recovery and tab visibility changes trigger a reconciliation refresh.

Realtime delivery does not replace RLS or Next.js cache invalidation. Sensitive private profile and network diagnostic tables are not published. The current client listens to inserts and updates; write actions must invalidate paths/tags for deletes. See the [live update guide](realtime.md) for table scope, publication setup, troubleshooting, and privacy requirements.
