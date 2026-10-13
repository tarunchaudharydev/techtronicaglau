# Techtronica GLAU Society Website

The Next.js website for Techtronica Society at GLA University. This repository contains the public website, member account flows, and role-aware society management area. Supabase Auth and Postgres provide authentication and the content/permissions API.

[Production website](https://techtronicaglau.vercel.app/) · [Frontend repository](https://github.com/tarunchaudharydev/techtronicaglau) · [Backend repository](https://github.com/tarunchaudharydev/techtronica-backend) · [Supabase project](https://supabase.com/dashboard/project/erivblclxwtonwysgdle)

## What the application supports

- Public pages for the society, clubs, events, team, alumni, projects, academics, and resources.
- Email/password sign-up, sign-in, email confirmation, password recovery, and profile management.
- Membership applications and member access for private society content.
- Database-backed roles, permissions, club/society scopes, positions, and membership review.
- Persistent public contact forms with a private, scope-aware manager inbox.
- Admin tools for clubs, positions, events, team and alumni directories, roles, invitations, member assignments, and event registrations.
- Public/private visibility for events and team members. New records default to public. Supabase RLS filters private rows for active members and authorized managers.
- A database-backed content manager for homepage/about content, FAQs, resources, gallery, projects, research, patents, and policies.
- Supabase Storage buckets for public site media and private member media, with one image upload field per record form.
- Server-rendered Supabase requests that carry the current visitor's cookies and JWT.

The five seeded clubs are Technovation, Code-E-Phobia, Unnati, Gizmo, and Mindblogger.

## Architecture

~~~mermaid
flowchart LR
  Visitor[Public visitor] --> Web[Next.js website]
  Member[Society member] -->|Auth session cookie| Web
  Web -->|publishable key + session JWT| Auth[Supabase Auth]
  Web -->|scoped query or server action| API[Supabase Data API]
  API --> RLS[Postgres RLS and permission functions]
  RLS --> DB[(Society database)]
  Web -->|admin invitation only| Invite[Supabase Edge Function]
  Invite --> Auth
~~~

The browser publishable key is public by design. Access is enforced by Postgres policies and database functions, not just by hiding UI controls. The website never uses a service-role key. Read [the security guide](docs/security-and-access-control.md) before changing permissions or access policies.

### Public and private records

Events and team profiles have an is_public column that defaults to true. Public pages can read active public records. Authenticated people with an active society-wide or club membership can read private records. Relevant managers can read/manage records in their permitted scope. Cached public content never includes a member-specific private response.

### Role model

Roles group permissions and are assigned to society or club scopes. Active memberships can inherit the role of an assigned position. Managers only see and change rows allowed by the database for their scope.

| Capability | Management area |
| --- | --- |
| admin.manage | Roles, permissions, invitations, and direct role assignments |
| clubs.manage | Club information and activation |
| positions.manage | Society and club positions |
| members.manage | Membership application review |
| events.manage | Event creation, editing, publication, and visibility |
| registrations.manage | Registration status and attendance |
| team.manage | Team directory |
| alumni.manage | Alumni directory |
| contacts.manage | Society and club contact inbox |
| content.manage | Homepage and other editable website content |

A Society Admin can access all management areas. New permissions are added through a reviewed database migration; do not grant a permission from user-editable Auth metadata.

## Quick start

### Requirements

- Node.js 20 or later
- npm
- Access to the Supabase project for a working local environment

### Install and configure

~~~sh
git clone https://github.com/tarunchaudharydev/techtronicaglau.git
cd techtronicaglau
npm ci
cp .env.example .env.local
~~~

Set the public Supabase URL and publishable key in .env.local. Set NEXT_PUBLIC_SITE_URL to the local or deployed origin used for Auth redirects.

~~~dotenv
NEXT_PUBLIC_SUPABASE_URL=https://erivblclxwtonwysgdle.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=your-supabase-publishable-key
NEXT_PUBLIC_SITE_URL=http://localhost:3000
~~~

Never put a Supabase secret or service-role key in a NEXT_PUBLIC_ variable, commit .env.local, or share it in issue text.

### Run locally

~~~
npm run dev
~~~

Open [http://localhost:3000](http://localhost:3000).

Useful commands:

~~~
npm run lint
npx tsc --noEmit
npm run build
npm start
~~~

## Repository map

~~~
app/
  (public)/       public about, alumni, and contact pages
  account/        signed-in profile and membership view
  auth/           sign-in, sign-up, confirmation, and recovery flows
  clubs/          club pages and membership applications
  events/         event list, details, registration, and cancellation
  manage/         permission-scoped society management pages/actions
components/       shared and feature-specific interface components
docs/             architecture, security, setup, and operations guides
lib/auth/         permission and session helpers
lib/data/         typed content queries and mappers
lib/manage/       server-side manager gates and validation helpers
lib/supabase/     browser/server Supabase clients and cookie proxy
proxy.ts           refreshes the Supabase session for requests
types/database.ts generated Supabase schema types
types/event.ts    application event display type
~~~

## Authentication setup

1. In Supabase Auth, configure the site URL and allowed redirect URLs for local and production origins.
2. Configure email confirmation, password recovery, sender, and templates.
3. Have the intended administrator create and confirm an account.
4. Assign the first Society Admin using the secure bootstrap procedure in the backend repository.
5. Add the Vercel environment variables and deploy.

Sign-up does not grant management access. The database creates the user's profile rows; role grants remain manager-controlled. See [Auth and permissions](docs/authentication-and-permissions.md) and [production operations](docs/operations.md).

## Management pages

Open /manage after signing in with an assigned management permission. The dashboard only shows areas allowed by the current permission set. Database RLS independently checks every load and mutation.

- Memberships: review club requests. A Society Admin can add an existing verified email account as a society member; this does not assign a role.
- Clubs: edit public club details; deactivate a club to preserve membership history.
- Positions: create, update, deactivate, or remove position definitions, subject to role and assignment constraints.
- Events: set status, registration windows, capacity, club scope, and public/private visibility.
- Registrations: view scoped sign-ups, cancel active registrations, and record attendance or no-shows.
- Team and alumni: maintain active profiles and their public/private visibility where supported.
- Roles and access: manage role capabilities, invitations, and user role assignments as a Society Admin.
- Website content: edit the public pages and upload one image per record form.

Avoid deleting a row when deactivation preserves useful history. Event deletion also removes its registration records according to the database foreign-key behavior.

## Documentation

- [Architecture and data model](docs/architecture.md)
- [Authentication and permissions](docs/authentication-and-permissions.md)
- [Content management and visibility](docs/content-management.md)
- [Storage and image workflow](docs/storage-and-assets.md)
- [Install Techtronica as an app](docs/installable-app.md)
- [Security and access control](docs/security-and-access-control.md)
- [Operations and deployment](docs/operations.md)
- [Contributing and review](CONTRIBUTING.md)
- [Supabase schema, migrations, and backend runbooks](https://github.com/tarunchaudharydev/techtronica-backend)

## Operational notes

- Website content, club details, events, team profiles, and alumni records come from Supabase. Keep authored content edits in the database manager workflow.
- If Supabase environment variables are absent, data-backed features show a connection state and do not grant access.
- Public cache helpers contain only anonymous public reads; member-specific requests remain request-scoped.
- The repository has no production secrets. Vercel/Supabase dashboards own environment configuration.
- Update generated database types after schema migrations and review them with the migration.

## License

The original frontend source code and documentation in this repository are licensed under the [MIT License](LICENSE).

Techtronica and GLA University names and logos, society/member data, photographs, and other branded media are not covered by that license. Third-party packages and assets remain under their respective licenses. Do not reuse those materials without permission from their respective rights holders.
