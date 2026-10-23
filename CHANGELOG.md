# Changelog

Changes that affect users or contributors are recorded here. This project has not published a stable release.

## Unreleased

- Fixed JSON request body limits so public endpoints enforce streamed byte caps even when `Content-Length` is absent or inaccurate.
- Added baseline browser security headers and same-origin checks for public JSON endpoints.
- Updated vulnerable Next.js, Clerk, Swiper, and affected transitive dependencies; the refreshed lockfile reports no current npm advisories.
- Added blocking dependency-audit CI and weekly Dependabot updates.
- Updated authentication, security, operations, testing, and contributor documentation for the Clerk and Supabase boundaries.

Until the first tagged release is published, see the repository commit history and pull requests for changes.
