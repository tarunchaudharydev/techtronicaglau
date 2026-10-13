# Security Policy

## Project maturity and version

The application is currently **pre-1.0 / early-stage**, not a declared stable release. The frontend's `package.json` currently lists version `0.1.0`; that is application metadata and does not by itself identify a published release or guarantee compatibility. The repository has no published GitHub release or stated long-term support commitment.

The website may be deployed while the source remains early-stage. A running deployment does not mean that features, database behavior, APIs, or availability are stable. Interfaces and database integrations may change; validate the project for your own use and keep appropriate backups. Do not depend on it for safety-critical or otherwise mission-critical workflows.

Until the project publishes a release and support matrix, security fixes are intended for the latest `main` branch and the currently maintained production deployment. Older commits, forks, and custom deployments may not receive fixes. When stable releases are introduced, this section should be updated with their tags and support windows.

## Scope and system boundaries

This policy covers the frontend application and source code in this repository:

- Next.js pages, server actions, and route handlers.
- Supabase Auth and cookie-aware frontend integration.
- Role-aware society management interfaces and frontend authorization checks.
- Application deployment configuration maintained in this repository.

The frontend uses a Supabase publishable key, which is designed to be visible to browsers. Access to protected data and management operations must be enforced by the backend, not by hiding buttons or pages in the UI.

The Supabase schema, migrations, Row Level Security (RLS) policies, database functions, Storage policies, and Edge Functions are maintained separately in the [Techtronica backend repository](https://github.com/tarunchaudharydev/techtronica-backend). Report a vulnerability in those components against that repository's security policy. If an issue crosses both repositories, report each side privately and link the reports without putting exploit details in a public issue.

Vercel, Supabase, npm packages, and other third-party services are outside this repository's direct control. Report vulnerabilities in those products to their respective security teams. Contact the project maintainer privately if the application's use or configuration creates an additional vulnerability.

## What to report

Examples of in-scope security issues include:

- Unauthorized access to member, profile, contact, event-registration, or other private data.
- Authentication or authorization bypass, including role or club-scope escalation.
- Server-side input handling that enables injection, cross-site scripting, or unintended code execution.
- Exposure of secrets, session tokens, or sensitive data through the frontend, logs, or shared caches.
- A vulnerability in a frontend route or action that permits unauthorized reads or changes.
- A privacy or access-control flaw involving the visitor IP display or opt-in network speed check.

Do not report ordinary bugs, feature requests, visual issues, or availability problems as security vulnerabilities unless they create a security impact. If uncertain, report privately and explain the potential impact.

## Reporting a vulnerability

Please do not disclose security vulnerabilities through public GitHub Issues, Discussions, pull requests, or social media.

1. When GitHub private vulnerability reporting is enabled, use **Security → Report a vulnerability** in this repository.
2. If private reporting is unavailable, contact the repository owner privately through [GitHub](https://github.com/tarunchaudharydev) and ask for a secure channel. Do not post exploit details publicly while arranging contact.
3. For an issue that also affects the backend, send a separate private report there and link the two reports without copying sensitive details into public comments.

**Repository owner:** before making this repository public, enable GitHub private vulnerability reporting in the repository's Security settings and confirm that the private reporting flow is available. Keep the private GitHub contact route as the fallback.

When safe, include:

- The affected page, route, component, dependency, or commit.
- The security impact and conditions required to reproduce it.
- Minimal reproduction steps or a proof of concept using accounts and data you control.
- A suggested mitigation, if you have one.

Never include passwords, session cookies, access tokens, Supabase secret/service-role keys, private member records, real student identifiers, or another person's IP address. Redact sensitive values from screenshots, logs, and reproduction data.

## Safe testing

Only test systems and accounts you own or have explicit permission to assess. Use synthetic data. Do not access, alter, or download real member data. Do not run denial-of-service tests, high-volume automated scans, or tests likely to disrupt production or another user's account.

If testing requires production access, stop and request written authorization from the maintainer first. Avoid changing roles, permissions, memberships, event registrations, or stored files outside accounts and records you control.

## Triage and disclosure

The maintainer will review reports as availability allows, assess their impact and affected versions, and may ask for a focused reproduction. If an issue is confirmed, the maintainer will work on a fix and coordinate a disclosure plan with the reporter.

There is currently no guaranteed acknowledgement or remediation SLA, no published bug-bounty program, and no formal severity-response schedule. Severity and prioritization will be determined by the maintainer based on impact and exploitability. Please allow a reasonable opportunity to investigate and prepare a fix before public disclosure; coordinate a disclosure date with the maintainer. Do not assume a report is resolved until the maintainer confirms it.
