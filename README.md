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
- [System diagrams](docs/diagrams.md)
- [Technology](#technology)
- [Run locally](#run-locally)
- [Project structure](docs/project-structure.md)
- [Testing](docs/testing.md)
- [Database and backend](#database-and-backend)
- [Deploy](#deploy)
- [Contribute](#contribute)
- [Stability and support](#stability-and-support)
- [License and third-party materials](#license-and-third-party-materials)

## What it includes

- Public pages for the society, five clubs, events, internship listings linked to official employer pages, team, alumni, projects, research, gallery, and learning resources.
- Clerk-managed sign-up, sign-in, email verification, password recovery, device sessions, and profile settings.
- Club applications and member-only access to private events and team profiles.
- Society and club roles, positions, scoped permissions, and membership review.
- Admin workspaces for managing clubs, events, internship listings and review, registrations, team members, alumni, roles, positions, memberships, invitations, website content, and contact enquiries.
- Public/private visibility controls for events and team records. New records default to public.
- Database-backed content and Supabase Storage for website and member media.
- Installable Progressive Web App behavior using the responsive website.

The seeded clubs are Technovation, Code-E-Phobia, Unnati, Gizmo, and Mindblogger.

## Architecture and security
[Open the editable architecture diagram in Figma](https://www.figma.com/board/gAGnPMmSaABH8jC6riESPs?node-id=1-2) · [Browse all system diagrams](docs/diagrams.md)

[![Techtronica application architecture](docs/images/figma-application-architecture.png)](https://www.figma.com/board/gAGnPMmSaABH8jC6riESPs?node-id=1-2)

Clerk manages login identity and sessions. Supabase stores profiles and app data, and validates Clerk session tokens through Third-Party Auth. Postgres row-level security (RLS) and database permissions enforce access. Browser code never uses a Supabase service-role/secret key or grants app roles from Clerk metadata. The scheduled internship maintenance route uses a server-only database key and a separate `CRON_SECRET`. UI hiding is not an authorization boundary. Run `npm run audit` to check the dependency tree; CI blocks on moderate and higher advisories.

Read [Architecture](docs/architecture.md), [Authentication and permissions](docs/authentication-and-permissions.md), and [Security and access control](docs/security-and-access-control.md) before changing data access or roles. Database schema, migrations, RLS policies, Storage policies, and Edge Functions live in the [backend repository](https://github.com/tarunchaudharydev/techtronica-backend).

## Technology

| Area | Stack |
| --- | --- |
| Web | Next.js App Router, React, TypeScript |
| Styling | Tailwind CSS and project component styles |
| Identity | Clerk |
| Data and access | Supabase Postgres, RLS, Storage |
| Hosting | Vercel |

The exact dependency versions are defined in [package.json](package.json) and [package-lock.json](package-lock.json).

## Run locally

### Requirements

- Node.js 22 or 24 (LTS)
- npm
- A configured Clerk instance and Supabase project for authenticated and data-backed features

### Setup

~~~sh
git clone https://github.com/tarunchaudharydev/techtronicaglau.git
cd techtronicaglau
npm ci
cp .env.test.example .env.local
~~~

Set these values in `.env.local`:

~~~dotenv
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/auth/sign-in
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/auth/sign-up
NEXT_PUBLIC_SUPABASE_URL=https://your-project-ref.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=your-supabase-publishable-key
NEXT_PUBLIC_SITE_URL=http://localhost:3000
# Needed for the scheduled internship discovery and maintenance endpoint:
SUPABASE_SECRET_KEY=server-only-secret-key-from-your-non-production-project
CRON_SECRET=random-secret-with-at-least-16-characters
# Optional provider key for daily internship discovery through Google Jobs:
SERPAPI_API_KEY=
~~~

The test template uses placeholder credentials and a non-production Supabase URL. Replace them with a Clerk development instance and a dedicated non-production Supabase project you control. The frontend repository does not contain the full backend schema; follow the backend repository's local/test setup before expecting data-backed pages to work. The `SUPABASE_SECRET_KEY` and `CRON_SECRET` values are needed to exercise the scheduled endpoint; `SERPAPI_API_KEY` enables provider discovery. Keep all three server-only. Never connect contributor work to production, commit `.env.local`, put a service-role key in a `NEXT_PUBLIC_` variable, or paste credentials into an issue or pull request.

### Start the development server

~~~sh
npm run dev
~~~

Open [http://localhost:3000](http://localhost:3000).

### Available checks

~~~sh
npm run lint
npm run typecheck
npm test
npm run audit
npm run build
~~~

The automated test runner uses Node's built-in test framework and does not require external credentials. It covers streamed request-body limits, the test environment template, and India-time birthday boundaries. CI gates on the dependency audit, type checking, and unit tests; lint remains a non-blocking cleanup signal until the existing baseline is resolved. The production build and service-backed flows need your local non-production keys. Follow [Testing](docs/testing.md) for the isolated integration environment and smoke checklist.

## Database and backend

The frontend's Supabase schema types are maintained in [types/database.ts](types/database.ts). Make schema changes in the backend repository as reviewed, forward-only migrations; then regenerate and review frontend types against the applied migration.

Read [backend setup and database documentation](https://github.com/tarunchaudharydev/techtronica-backend) before applying migrations or changing RLS. A frontend deployment does not apply database migrations.

For the first Society Admin, follow the protected bootstrap procedure in the backend repository after linking that account's Clerk subject to its app profile. Public sign-up creates a normal account and does not grant society membership or management permissions. Review the [Clerk cutover checklist](docs/auth-migration-checklist.md) before enabling a production migration.

## Deploy

The production site is hosted on Vercel. Deployment requires the Clerk publishable/secret keys, Supabase URL/publishable key, and correct site URL to be configured for the target environment. Automatic internship discovery also needs `SUPABASE_SECRET_KEY` (server-only), `CRON_SECRET`, and `SERPAPI_API_KEY` set for Production. The daily importer discovers roles through Google Jobs and publishes only employer-matched results with direct, allowlisted official career links. The cron runs daily at 02:30 UTC and activates only on production deployments. Clerk must allow the deployed origin and Supabase Third-Party Auth must trust the configured Clerk issuer.

Use the checklist in [Operations and deployment](docs/operations.md). Preview deployments are not production releases. Verify public/private visibility and representative role scopes before promoting changes.

## Contribute

Issues and pull requests are welcome. Start with the [contribution guide](CONTRIBUTING.md), read the [documentation index](docs/README.md), and check existing issues before opening a new one.

Pull requests should describe the user-visible change, database or environment requirements, checks performed, and any screenshots needed to review UI changes. Keep fixes focused and avoid including real member records or credentials.

## Stability and support

The package version is currently `0.1.0`; it is application metadata, not a published release or a promise of API, schema, or deployment compatibility. The project does not currently publish a support window, service-level agreement, or bug-bounty program. Features and database integrations may change before a 1.0 release.

See [release and support policy](docs/open-source.md) and [security reporting](SECURITY.md). Security vulnerabilities should not be reported in public issues.

## License and third-party materials

Original frontend source code and documentation are available under the [MIT License](LICENSE). The license does not grant rights to Techtronica or GLA University names, logos, photographs, member data, or other third-party materials. Review [NOTICE.md](NOTICE.md) before reusing visual assets or society content. Dependencies and other third-party files remain under their own licenses.
