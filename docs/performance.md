# Performance and data-access guide

This guide records the current performance choices and how contributors should evaluate changes. Keep improvements evidence-led: do not claim latency gains without measurements from the same environment and workload.

## Findings addressed

The route refresh client previously subscribed to a broad shared table list on ordinary pages and added every management table under `/manage`. It registered separate INSERT, UPDATE, and DELETE handlers per table and also refreshed the route every 30 seconds. The notification bell had its own 30-second refresh timer and fetched the feed for each Realtime event. This caused unrelated data changes and idle browsing to trigger unnecessary network and server-render work.

The current implementation scopes subscriptions to the route, uses one change handler per table, batches bursts, and removes background polling while the Realtime channel is healthy. The notification feed coalesces bursts and serializes refreshes. It still reconciles on connection/reconnect and browser foreground/network restoration.

The Supabase performance advisor also reported an unindexed `notifications.created_by` foreign key and two pairs of permissive attendance SELECT policies. A separate backend migration adds the missing index and combines each attendance policy pair with the same OR conditions. The migration is in review; it has not been applied to production.

## Caching rules

- Public site content, team listings, and alumni listings use tagged Next.js `unstable_cache` entries with bounded revalidation.
- Public, read-heavy content may use shared cache only when the query has a public audience predicate and returns no personalized data.
- Profiles, memberships, registration state, attendance, notification read receipts, and other user-specific reads must stay request/session scoped.
- Mutations that affect cached public content must invalidate the owning tag and affected path.
- Realtime events refresh a route but do not automatically invalidate a Next.js server cache.

Do not add Redis, an extra backend, or broad caching unless measured traffic and a concrete cache-miss/latency problem justify it.

## Query and schema review

Before changing a query or index:

1. Identify the route, the exact selected columns, filters, joins, sort order, and pagination.
2. Check production query logs or `EXPLAIN (ANALYZE, BUFFERS)` in an isolated database with representative data.
3. Add an index only when its leading columns match a real filter/join/order pattern or a foreign-key maintenance need. Consider write cost and overlap with existing indexes.
4. Use stable ordering and cursor pagination for lists that can grow beyond a bounded page.
5. Preserve RLS and verify the query as both an allowed and denied role.
6. Put schema changes in a forward-only backend migration. Never experiment with DDL on production.

Unused-index advisories are candidates for investigation, not automatic drop instructions. Low traffic and a recent reset can make useful indexes appear unused.

## Realtime review

Use [the live updates guide](realtime.md) for route table mappings and authorization rules. Subscribe only where a rendered view needs the table. Prefer invalidating and re-fetching authorized server data over trusting Realtime payloads. Keep notifications isolated to their own channel and audience policy.

## Measurement and current limits

The source review and Supabase advisors identify avoidable refresh work and schema-policy candidates, but the available log sample does not establish end-user page latency or a before/after benchmark. No numerical speed improvement is claimed here. Review the branch's CI lint, type-check, tests, and build results, then measure route request counts, query latency, and interaction response times in the staging deployment before merging to production.

Useful measures include:

- database requests and server render duration per route;
- p50/p95 PostgREST and query latency for representative requests;
- Realtime channel count, event volume, and failed/reconnect rate;
- notification reads per event burst;
- Core Web Vitals on mobile and desktop;
- failed action rate and optimistic rollback rate for interactive flows.

The project does not currently need Redis or sharded counters based on the evidence reviewed. Revisit those options only if production measurements show contention or a cache-hit bottleneck.
