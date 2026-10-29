# Project structure

This guide is the maintained overview of the repository. Place new work in the smallest relevant feature folder; avoid adding another generic root-level folder when an existing area fits.

```text
.github/
  ISSUE_TEMPLATE/       Issue forms and pull request template
  workflows/            Credential-free CI checks
app/
  (public)/              Public route group
  auth/                  Sign-in and sign-up routes
  account/               Signed-in account and profile routes
  api/                   Next.js route handlers
  clubs/, events/        Public club and event pages
  manage/                Society administration routes
components/
  auth/, account/        Identity and account UI
  club/, clubs/, events/ Feature UI
  manage/                Admin tables, forms, and controls
  notifications/         In-app notification UI
  ui/                     Shared interface primitives
docs/                     System, operations, contributor, and testing guides
lib/
  auth/                   Server-side identity and permission helpers
  data/                   Data access and shared query logic
  manage/                 Admin workflows
  supabase/               Browser/server Supabase clients and configuration
  utils/                  Small shared helpers
public/                    Static images, icons, and PWA assets
supabase/migrations/       Supplemental migration history in this frontend repo
test/
  unit/                    Credential-free automated unit tests
  legacy-supabase-auth/    Archived pre-Clerk reference code; not used at runtime
types/                     Shared TypeScript and database types
mobile/                    Expo SDK 58 React Native app; independent mobile package and route structure
```

## Where to make a change

| Change | Start here |
| --- | --- |
| Route, page metadata, server action | `app/` |
| Reusable or feature UI | `components/` |
| Authentication or authorization | `lib/auth/` and the matching `docs/` guide |
| Supabase client/query behavior | `lib/supabase/` or `lib/data/` |
| Database schema, RLS, storage policies | [Backend repository](https://github.com/tarunchaudharydev/techtronica-backend); coordinate generated changes here |
| Small deterministic logic | `lib/utils/` with a focused test under `test/unit/` |
| Shared type changes | `types/` |
| Public/static images and app icons | `public/` |
| Native app screens and shared mobile query code | `mobile/app/`, `mobile/lib/`, and `mobile/components/` |
| Contributor setup, operations, or product behavior | `docs/` |

`test/legacy-supabase-auth/` is historical code preserved for reference. Do not import from it into the application. The backend repository is authoritative for production schema and migration operations; coordinate any corresponding frontend type or query changes in this repo.
