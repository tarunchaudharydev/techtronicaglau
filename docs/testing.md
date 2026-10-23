# Testing and local development

This repository has two testing layers. The fast checks run without provider credentials; full sign-in and data-backed flows use an isolated non-production stack.

## Requirements

- Node.js 22 or 24 LTS and npm
- A Clerk **development** instance and a dedicated non-production Supabase project for interactive flows
- The backend repository's schema/migrations and seed instructions for a data-backed environment

Do not use the live Techtronica Clerk instance, production Supabase project, real member records, or production storage in contributor testing.

## Fast checks

Install dependencies and run the credential-free checks:

```sh
npm ci
npm run lint
npm run typecheck
npm test
npm run audit
```

The unit tests use Node's built-in test runner. They cover India-time birthday date boundaries, the non-production environment template, and streamed JSON byte limits including absent or understated `Content-Length`. CI blocks on type checking, tests, and `npm audit --audit-level=moderate`; lint remains non-blocking while its existing baseline is cleaned up. Avoid introducing new lint errors.

The Next.js production build needs provider environment values and is not run in the secret-free GitHub Actions workflow. To check it locally, first configure the isolated environment below, then run:

```sh
npm run build
```

## Isolated service environment

1. Create or use a Clerk development instance. Configure its local sign-in and sign-up routes as `/auth/sign-in` and `/auth/sign-up`.
2. Create a separate Supabase project for development/testing. Do not copy production records. Use the backend repository's reviewed migrations and synthetic seed data so the project has the schema the app expects.
3. Copy the safe template and fill it with those development-only credentials:

   ```sh
   cp .env.test.example .env.local
   ```

4. Start the site:

   ```sh
   npm run dev
   ```

5. Use separate test accounts for unauthenticated, ordinary user, club member, and administrator views. Grant roles only in the test database.
6. After schema or RLS changes, verify with the backend repository's own local Supabase setup and SQL tests before testing the frontend.

The frontend repository does not contain the complete Supabase project configuration or canonical schema. Running `supabase start` from this repository alone does not create a complete app test backend. Follow the [backend repository](https://github.com/tarunchaudharydev/techtronica-backend) for the isolated database environment and reset/seed workflow.

## Manual smoke checklist

- Sign in with a test account, refresh, and confirm the session remains active.
- Sign out from the desktop account menu, mobile account menu, and account page. Each action should show an immediate pending state, clear the session, and land on the sign-in page.
- Confirm an ordinary account cannot access society or club management routes.
- Confirm a club-scoped test role sees only its assigned club operations.
- Create and edit a test event; confirm public/private visibility and registration behavior.
- Confirm notification and member data are scoped to the test account.
- Check one narrow mobile viewport and keyboard navigation for every UI change.

Record the environment, steps, expected/actual behavior, and checks in the pull request. Redact tokens, emails, user IDs, and member data from logs and screenshots.
