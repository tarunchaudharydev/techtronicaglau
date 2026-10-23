# Open-source status, releases, and support

## Project maturity

This project is **pre-1.0 and early-stage**. The website is deployed, but a deployment is not a stable software release. The package version `0.1.0` is application metadata; there is no published GitHub release, long-term support commitment, or compatibility guarantee at this time.

Until a stable release is announced, interfaces, database integration, and deployment requirements may change. Do not rely on the project for safety-critical or mission-critical work. Review the source and test it in an environment you control before adoption.

## What is open source

The original frontend application source and project documentation carry the MIT license. GitHub repository visibility is a separate setting: a license file does not make a private repository publicly accessible. The repository currently remains private until the maintainer completes a public-release review. The repository is an application source repository, not a published npm package; `package.json` remains marked `private` to prevent accidental package publication.

The database schema, migration files, RLS and Storage policies, and invitation Edge Function are maintained in the separate [backend repository](https://github.com/tarunchaudharydev/techtronica-backend). A frontend change does not automatically change or deploy the backend.

## Releases and versioning

There is no release cadence or support matrix yet. When maintainers begin publishing releases, each release should:

1. Use a Git tag and GitHub release with a concise changelog.
2. Identify frontend and backend compatibility requirements, including required migrations.
3. State whether the release is stable, pre-release, or unsupported.
4. Include upgrade, rollback, and security notes for breaking changes.
5. Keep the README and security policy consistent with the published release.

Until then, use the latest reviewed source and check the repository's open issues and pull requests for known limitations. Do not assume that a Git commit or package version is a supported release.

## Support

Community support is currently best-effort through the [issue tracker](https://github.com/tarunchaudharydev/techtronicaglau/issues). No response time, uptime, or remediation SLA is promised. Include sanitized reproduction steps and environment details; never post access tokens, service keys, private member data, or raw IP addresses.

Report suspected vulnerabilities privately according to [SECURITY.md](../SECURITY.md). Do not publish exploit details in a public issue.

## Scope of the MIT license

See the repository's [LICENSE](../LICENSE) and [NOTICE](../NOTICE.md). MIT applies to original source code and documentation in this repository. It does not grant rights to third-party dependencies, trademarks, photos, member data, or other material whose rights belong to another party.
