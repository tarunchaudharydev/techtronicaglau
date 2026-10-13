# Security Policy

## Scope

This policy covers the frontend application and source code in this repository, including its Next.js pages, server actions, route handlers, Supabase client integration, authentication flows, role-aware management UI, and deployment configuration maintained here.

The Supabase schema, migrations, Row Level Security policies, database functions, Storage policies, and Edge Functions are maintained separately in the [Techtronica backend repository](https://github.com/tarunchaudharydev/techtronica-backend). Report a vulnerability in those components against that repository’s security policy. If an issue crosses both repositories, describe the frontend and backend impact in separate private reports and link them without including exploit details publicly.

Third-party services and dependencies are not controlled by this project. Report vulnerabilities in those products to their maintainers as well; contact the project owner privately if the application’s use or configuration creates an additional vulnerability.

## Supported versions

Security fixes are intended for the latest code on the `main` branch and the production deployment. This repository does not currently publish a separate list of supported release branches. Older commits, forks, and unannounced deployments may not receive fixes.

## Reporting a vulnerability

Please do not report security vulnerabilities through public GitHub Issues, Discussions, pull requests, or social media.

1. If GitHub private vulnerability reporting is available for this repository, use **Security → Report a vulnerability** to create a private report.
2. If private reporting is unavailable, contact the repository owner privately through [GitHub](https://github.com/tarunchaudharydev) and ask for a secure channel. Do not include exploit details in a public issue while arranging contact.
3. For a vulnerability that also affects the backend repository, report it privately there too.

Include, when safe:

- The affected page, route, component, or commit.
- A concise description of the security impact and conditions required.
- Reproduction steps or a minimal proof of concept using accounts and data you control.
- Any suggested mitigation.

Do not include passwords, session cookies, access tokens, Supabase keys, private member records, real student identifiers, or other people’s IP addresses in a report. Redact sensitive values from screenshots and logs. The footer’s IP display and speed check are user-requested diagnostics; report any unintended exposure, collection, or persistence of visitor data.

## Testing and disclosure

Only test systems and accounts you own or have explicit permission to assess. Avoid accessing, changing, or downloading real member data; avoid denial-of-service testing, automated high-volume scans, and actions that could interrupt the production service.

Please allow the maintainer a reasonable opportunity to investigate and prepare a fix before public disclosure. Coordinate a disclosure date with the maintainer. The project does not currently promise a fixed acknowledgement or remediation SLA; response and prioritization depend on maintainer availability and severity.

## Maintainer handling

The maintainer will review the report, assess impact and affected versions, and may request a focused reproduction. If confirmed, the maintainer will work on a fix and communicate any coordinated disclosure plan through the private report. Do not assume a report is resolved until the maintainer confirms it.
