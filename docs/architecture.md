# Architecture

## System context

~~~mermaid
flowchart LR
  Visitor[Public visitor or member] --> Next[Next.js application]
  Next -->|Cookie-aware request| Auth[Supabase Auth]
  Next -->|Publishable key plus user session| API[Supabase Data API]
  Auth --> API
  API --> RLS[Postgres RLS and permission checks]
  RLS --> DB[(Supabase Postgres)]
  Next -->|Authorized invitation request| EF[admin-invite-user Edge Function]
  EF --> AuthAdmin[Supabase Auth Admin API]
  Next -->|Optional consented coarse summary| Diagnostics[Network diagnostics table]
~~~

The application uses `@supabase/ssr` clients in server components, server actions, and route handlers. Authenticated requests carry the visitor's session. The invitation Edge Function is a narrow server-side exception for inviting users; its secret remains in Supabase configuration.

## Data domains

- **Identity:** Supabase Auth, `profiles`, and `private_profiles`.
- **Organization and access:** `clubs`, `memberships`, `positions`, `permissions`, `roles`, `role_permissions`, and `user_role_assignments`.
- **Society content:** `site_content`, `events`, `team_members`, `alumni`, and `contact_submissions`.
- **Participation:** `event_registrations`.
- **Optional diagnostics:** one coarse, consented connection summary per browser session. Raw IP addresses, exact location, and continuous speed samples are not stored by the application.

The generated API types are in `types/database.ts`. The backend repository owns the migration history and database policies.

## Authorization flow

1. Supabase Auth verifies the account and provides the session JWT.
2. The server creates a cookie-aware Supabase client for the current request.
3. The application checks the current role/permission to render relevant management paths.
4. Postgres RLS, permission functions, constraints, and triggers independently validate reads and writes.

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
lib/auth/            permission lookup and auth helpers
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
