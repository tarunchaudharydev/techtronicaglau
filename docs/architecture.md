# Architecture

## System context

~~~mermaid
flowchart LR
  Visitor[Public visitor] --> Next[Next.js application]
  Member[Society member] -->|Auth cookie| Next
  Next -->|SSR client + publishable key + user JWT| Auth[Supabase Auth]
  Next -->|RLS-protected read/write| API[Supabase Data API]
  Auth -->|signed identity| API
  API --> RLS[Postgres RLS + private permission functions]
  RLS --> DB[(Supabase Postgres)]
  Next -->|invite request| EF[admin-invite-user Edge Function]
  EF --> AuthAdmin[Auth Admin API]
~~~

Next.js uses @supabase/ssr cookie-aware clients for server components and actions. A request is always executed as its visitor; there is no service credential in the UI. The invitation function is a narrow admin-only exception.

## Data domains

- Identity: Supabase Auth, profiles, private_profiles.
- Organization: clubs, memberships, positions.
- Authorization: permissions, roles, role_permissions, user_role_assignments.
- Content: events, team_members, alumni, and contact_submissions.
- Event participation: event_registrations.

The generated API types are in types/database.ts; the backend repository's migration files define the schema.

## Query and caching boundaries

- Public anonymous reads can use the public content helper and its revalidation policy.
- Requests dependent on auth cookies or membership must not enter a shared public cache.
- Row-level security remains the source of truth for private rows.
- Lists and management pages use bounded result sizes and keyset cursors where appropriate.
- Database event registration locks the event row during seat allocation; concurrent requests cannot overbook capacity.

## Source organization

~~~text
app/                 Next.js App Router routes and server actions
components/          shared UI and feature components
lib/auth/            permission lookup and auth helpers
lib/data/            Supabase queries, mappers, static content
lib/manage/          shared manager validation and authorization gate
lib/supabase/        browser and server clients
types/               generated schema types and UI models
docs/                architecture, policy, operations and content guides
~~~
