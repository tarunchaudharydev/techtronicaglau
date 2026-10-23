# Contributing

Thanks for considering a contribution to Techtronica's website. Contributions are welcome through focused issues and pull requests.

## Before starting

- Search open issues and pull requests for related work.
- For larger changes, open an issue first to agree on scope and avoid duplicated effort.
- Keep one pull request focused on one behavior or maintenance goal.
- Do not use real member data, production credentials, or private images in examples or screenshots.

## Local setup

1. Install Node.js 22 or 24 LTS and npm.
2. Clone the frontend repository and run `npm ci`.
3. Copy `.env.test.example` to `.env.local`; use a Clerk development instance and a dedicated non-production Supabase project. Never use production credentials.
4. Start the application with `npm run dev`.

See the [README](README.md) for environment variables and the [documentation index](docs/README.md) for system details.

## Change guidelines

- Keep authorization in Supabase RLS, permission functions, and server-side checks. Hiding a button is not access control.
- Validate untrusted input at server boundaries and retain database constraints as a second defense.
- Keep member-specific responses out of shared public caches.
- Use bounded queries and stable pagination for growing directories and management tables.
- Preserve history through deactivation when a hard delete is unnecessary.
- Make accessible keyboard, focus, responsive, and reduced-motion behavior part of UI changes.
- Keep the Techtronica brand's current Geist typography and sky/indigo/violet palette consistent.
- Update documentation when routes, roles, environment variables, or operational behavior changes.

### Database changes

Database schema and policy changes belong in the [backend repository](https://github.com/tarunchaudharydev/techtronica-backend) as reviewed, forward-only Supabase migrations. Coordinate frontend and backend pull requests when they depend on each other. Regenerate `types/database.ts` after schema changes and ensure the frontend types match the migration.

## Before opening a pull request

Run the available checks:

~~~sh
npm ci
npm run lint
npm run typecheck
npm test
~~~

Run `npm run build` when you have configured the isolated test services. CI intentionally does not need auth or database secrets. For service-backed flows, include the relevant smoke checks from [Testing](docs/testing.md) in the pull request.

## Pull request checklist

- [ ] Explain the problem and the user-visible result.
- [ ] Link related issues.
- [ ] List database migrations, environment changes, and deployment requirements.
- [ ] Report checks performed and any checks not run.
- [ ] Add screenshots for visible UI changes.
- [ ] Confirm no secrets, private member information, or unrelated changes are included.
