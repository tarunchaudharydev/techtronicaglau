# Techtronica at GLA University

[![MIT License](https://img.shields.io/badge/license-MIT-4c9f70.svg)](LICENSE)
[![Version](https://img.shields.io/badge/version-0.1.0-blue.svg)](package.json)
[![Next.js](https://img.shields.io/badge/Next.js-16-black.svg)](https://nextjs.org/)
[![Supabase](https://img.shields.io/badge/backend-Supabase-3ecf8e.svg)](https://supabase.com/)

The official website and member portal for Techtronica, the Electronics and Communication Engineering society at GLA University, Mathura. It brings the society's clubs, events, projects, team, alumni, and member services into one responsive application.

> **Project status:** Early-stage, pre-1.0 software. The website is deployed, but this repository has no published stable release or compatibility promise. See [stability and releases](docs/open-source.md).

[Visit the website](https://techtronicaglau.vercel.app/) · [Report a bug or request a feature](https://github.com/tarunchaudharydev/techtronicaglau/issues) · [Read the documentation](docs/README.md)

## Contents

- [What it includes](#what-it-includes)
- [Architecture and security](#architecture-and-security)
- [Technology](#technology)
- [Run locally](#run-locally)
- [Database and backend](#database-and-backend)
- [Deploy](#deploy)
- [Contribute](#contribute)
- [Stability and support](#stability-and-support)
- [License and third-party materials](#license-and-third-party-materials)

## What it includes

- Public pages for the society, five clubs, events, team, alumni, projects, research, gallery, and learning resources.
- Email and password sign-up, sign-in, email verification, password recovery, and profile settings.
- Club applications and member-only access to private events and team profiles.
- Society and club roles, positions, scoped permissions, and membership review.
- Admin workspaces for managing clubs, events, registrations, team members, alumni, roles, positions, memberships, invitations, website content, and contact enquiries.
- Public/private visibility controls for events and team records. New records default to public.
- Database-backed content and Supabase Storage for website and member media.
- Installable Progressive Web App behavior using the responsive website.

The seeded clubs are Technovation, Code-E-Phobia, Unnati, Gizmo, and Mindblogger.

## Architecture and security

~~~mermaid
flowchart LR
  Visitor[Visitor or member] --> Web[Next.js application]
  Web -->|SSR session and publishable key| Auth[Supabase Auth]
  Web -->|User-scoped requests| API[Supabase Data API]
  Auth --> API
  API --> RLS[Postgres RLS and permission checks]
  RLS --> DB[(Supabase database)]
  Web -->|Admin invitation flow| Invite[Supabase Edge Function]
  Invite --> Auth
~~~

The frontend uses cookie-aware Supabase clients. The publishable key is intentionally public; database row-level security (RLS) and permission checks enforce access. The frontend does not use a service-role key. UI hiding is not an authorization boundary.

Read [Architecture](docs/architecture.md), [Authentication and permissions](docs/authentication-and-permissions.md), and [Security and access control](docs/security-and-access-control.md) before changing data access or roles. Database schema, migrations, RLS policies, Storage policies, and Edge Functions live in the [backend repository](https://github.com/tarunchaudharydev/techtronica-backend).

## Technology

| Area | Stack |
| --- | --- |
| Web | Next.js App Router, React, TypeScript |
| Styling | Tailwind CSS and project component styles |
| Auth and data | Supabase Auth, Postgres, RLS, Storage |
| Hosting | Vercel |

The exact dependency versions are defined in [package.json](package.json) and [package-lock.json](package-lock.json).

## Run locally

### Requirements

- Node.js 20 or later
- npm
- Access to a configured Supabase project for authenticated and data-backed features

### Setup

~~~sh
git clone https://github.com/tarunchaudharydev/techtronicaglau.git
cd techtronicaglau
npm ci
cp .env.example .env.local
~~~

Set these values in `.env.local`:

~~~dotenv
NEXT_PUBLIC_SUPABASE_URL=https://your-project-ref.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=your-supabase-publishable-key
NEXT_PUBLIC_SITE_URL=http://localhost:3000
~~~

The example file points to the society's Supabase project. Use credentials only for an environment you are authorized to access. Never commit `.env.local`, place a secret/service-role key in a `NEXT_PUBLIC_` variable, or paste credentials into an issue or pull request.

### Start the development server

~~~sh
npm run dev
~~~

Open [http://localhost:3000](http://localhost:3000).

### Available checks

~~~sh
npm run lint
npx tsc --noEmit
npm run build
~~~

There is currently no `npm test` script. For changes that affect authorization, database behavior, or user flows, include a clear manual verification plan in the pull request.

## Database and backend

The frontend's Supabase schema types are maintained in [types/database.ts](types/database.ts). Make schema changes in the backend repository as reviewed, forward-only migrations; then regenerate and review frontend types against the applied migration.

Read [backend setup and database documentation](https://github.com/tarunchaudharydev/techtronica-backend) before applying migrations or changing RLS. A frontend deployment does not apply database migrations.

For the first local manager account, follow the protected bootstrap procedure in the backend repository. Public sign-up creates a normal account and does not grant society membership or management permissions.

## Deploy

The production site is hosted on Vercel. Deployment requires the Supabase URL, publishable key, and correct site URL to be configured for the target environment. Supabase Auth must allow the matching callback and password-reset URLs.

Use the checklist in [Operations and deployment](docs/operations.md). Preview deployments are not production releases. Verify public/private visibility and representative role scopes before promoting changes.

## Contribute

Issues and pull requests are welcome. Start with the [contribution guide](CONTRIBUTING.md), read the [documentation index](docs/README.md), and check existing issues before opening a new one.

Pull requests should describe the user-visible change, database or environment requirements, checks performed, and any screenshots needed to review UI changes. Keep fixes focused and avoid including real member records or credentials.

## Stability and support

The package version is currently `0.1.0`; it is application metadata, not a published release or a promise of API, schema, or deployment compatibility. The project does not currently publish a support window, service-level agreement, or bug-bounty program. Features and database integrations may change before a 1.0 release.

See [release and support policy](docs/open-source.md) and [security reporting](SECURITY.md). Security vulnerabilities should not be reported in public issues.

## License and third-party materials

Original frontend source code and documentation are available under the [MIT License](LICENSE). The license does not grant rights to Techtronica or GLA University names, logos, photographs, member data, or other third-party materials. Review [NOTICE.md](NOTICE.md) before reusing visual assets or society content. Dependencies and other third-party files remain under their own licenses.
