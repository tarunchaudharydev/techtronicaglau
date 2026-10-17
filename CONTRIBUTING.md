# Contributing

Thanks for considering a contribution to Techtronica's website. Contributions are welcome through focused issues and pull requests.

## Before starting

- Search open issues and pull requests for related work.
- For larger changes, open an issue first to agree on scope and avoid duplicated effort.
- Keep one pull request focused on one behavior or maintenance goal.
- Do not use real member data, production credentials, or private images in examples or screenshots.

## Local setup

1. Install Node.js 20 or later and npm.
2. Clone the frontend repository and run `npm ci`.
3. Copy `.env.example` to `.env.local` and configure an authorized Supabase project.
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
npm run lint
npx tsc --noEmit
npm run build
~~~

There is no `npm test` script at this time. If you add or change a user flow, include a concise manual verification plan.

## Pull request checklist

- [ ] Explain the problem and the user-visible result.
- [ ] Link related issues.
- [ ] List database migrations, environment changes, and deployment requirements.
- [ ] Report checks performed and any checks not run.
- [ ] Add screenshots for visible UI changes.
- [ ] Confirm no secrets, private member information, or unrelated changes are included.
