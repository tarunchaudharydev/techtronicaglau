# Clerk cutover checklist

The frontend code now uses Clerk for authentication and account management while keeping Supabase for application data and row-level security.

## Before enabling production sign-in

1. Create a non-production Clerk instance and configure email verification, password recovery, sign-in and sign-up paths, and allowed origins.
2. Add `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` and `CLERK_SECRET_KEY` to local and Vercel environments. Never commit the secret.
3. Configure Clerk session-token claims:
   ```json
   {
     "role": "authenticated",
     "userId": "{{user.external_id}}"
   }
   ```
4. Configure the Supabase project's Third-Party Auth integration for the Clerk issuer.
5. Back up the database and review the [backend Clerk identity migration](https://github.com/tarunchaudharydev/techtronica-backend/blob/feat/clerk-auth-identity-rbac-20261020/supabase/migrations/20261020133527_clerk_auth_identity_and_rbac.sql) with the backend owner before applying it. This migration has not been applied by the frontend.
6. Migrate existing Supabase users into Clerk and set each Clerk `external_id` to the corresponding existing `profiles.id` UUID. Verify counts and sample identities before routing production users to Clerk.
7. Verify RLS for signed-out visitors, newly created Clerk profiles, migrated accounts, members, scoped managers, and society admins in a staging project.
8. Confirm Clerk invitation email templates and redirect URLs, active-session revocation, and account recovery in staging before production cutover.

Application roles remain in Postgres. Do not store society or club permissions in Clerk public metadata. A Clerk login proves identity; Postgres permission records and RLS determine what a user may do.
