# Authentication and permissions

## Request lifecycle

1. Supabase Auth issues and refreshes the visitor's session.
2. The Next.js request proxy refreshes the cookie using the Supabase SSR client.
3. Server components and server actions create a cookie-aware Supabase client.
4. The database evaluates the signed JWT, row-level policies, and scope-aware permission functions for every operation.
5. The UI uses the returned permission set to make management areas discoverable; it does not replace the database check.

The publishable project key is safe to expose. Never use a Supabase service-role/secret key in the browser or ordinary request handlers.

## Authentication flows

- /auth/sign-up: creates an email/password Auth account and basic profile data.
- /auth/sign-in: email and password sign-in. The frontend does not offer social or phone sign-in, and signup does not grant membership or a role.
- /auth/callback: exchanges confirmation/recovery codes and validates the local redirect path.
- /auth/forgot-password: requests a recovery email.
- /auth/reset-password: sets a new password for a valid recovery session.
- /account: edits the signed-in user's profile and shows membership state.

The database trigger creates profile rows. In Supabase Auth → Sign In / Providers, keep Email enabled and disable every other provider. Require email confirmation, configure email delivery, set NEXT_PUBLIC_SITE_URL, and allow the matching callback URL in Supabase Auth settings. The frontend code uses email/password only; the provider switch itself is a Supabase dashboard setting.

## Membership scope

Anyone can register a normal account with email/password. Only a Society Admin can add or activate an account as a society member; direct writes, approvals, and removals for society-wide membership rows are protected by database policies and an admin-checked RPC. An account must exist and have a verified email before it can be added. Users can request membership in one of the five clubs, and a manager can approve/reject requests only within the assigned club scope. Pending requests do not grant member-only content access. Only active memberships count for private events and team records.

A club manager's permissions do not transfer to another club. Society-scoped roles require a null club scope; club roles require a concrete matching club.

## Capabilities

| Key | Purpose |
| --- | --- |
| admin.manage | Manage roles, existing permission grants, invitations, direct role assignments, and administrative private-profile access. |
| clubs.manage | Manage club data and activation. |
| positions.manage | Manage position definitions within the permitted society/club scope. |
| members.manage | Review and update membership records in scope. |
| events.manage | Manage events in scope. |
| registrations.manage | Read and update event registrations in scope. |
| team.manage | Manage team directory entries in scope. |
| alumni.manage | Manage alumni entries in scope. |
| contacts.manage | Read and update the contact inbox within the assigned society or club scope. |
| content.manage | Manage published website content and public website media. |

Capabilities are granted by database roles. A permission key is schema-managed, while role-to-permission assignments can be configured by an admin. The backend repository's bootstrap script assigns the first Society Admin; public signup never grants privileges.

## Edge cases handled

- Missing Supabase configuration returns an unavailable state instead of silently using privileged access.
- Invalid callback destinations are rejected to prevent open redirects.
- Manager permissions are reloaded from Postgres, and database policy checks still run on writes.
- Repeated membership or registration requests can conflict with unique constraints; the UI reports a refresh/retry message rather than assuming success.
- Membership approval actions require the request to remain pending.
- Manager registration status transitions use the previously-read status to reject stale updates.
- Sign-up confirmation may create an account without an active session; the UI asks the user to confirm email before signing in.
