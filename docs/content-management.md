# Content management and visibility

## Database-backed website content

The live public pages read editable content from `public.site_content` and club records from `public.clubs`. The CMS covers the homepage, about page, FAQs, academic resources, projects, research, patents, gallery, library categories, and policy pages. Events, team profiles, and alumni use their dedicated tables. Website content edits are managed from `/manage/content`; event and directory records have their own management pages.

The live project is seeded from the former website content. Placeholder sponsor names and example project/research records were excluded. Event records imported from the old static site are marked completed; add current events from `/manage/events`.

## Event visibility

Each event uses `is_public`, defaulting to true.

| Event state | Visitor | Signed-in non-member | Active society member | Scoped manager |
| --- | --- | --- | --- | --- |
| Public + published | Visible | Visible | Visible | Visible |
| Private + published | Hidden | Hidden | Visible | Visible |
| Draft/cancelled/completed | Not listed publicly | Not listed publicly | Not listed publicly | Visible to event managers for management |

An active membership in any club or at society scope unlocks a private event. Pending/rejected memberships do not. Registration still obeys publication status, registration dates, and capacity rules in Postgres.

## Team visibility

Team records also use `is_public`, defaulting to true. Active public profiles render for everyone. Private profiles are returned only to authenticated active society members or a manager with the appropriate scope. Inactive profiles are omitted. Public caches never contain member-specific results.

## Society membership and roles

Anyone can create a normal email/password account. Only a Society Admin can add or activate a society-wide membership, using `/manage/memberships`. The account must exist and have a verified email. This action does not grant a management role. A Society Admin must separately grant a role from `/manage/access`. Club membership applications are separate: a user can request a club membership and an authorized club manager can review it.

Database RLS and the `admin_add_society_member` RPC enforce these rules. Hiding controls in the dashboard is not the authorization boundary.

## Admin workflows

1. Sign in to a verified account with the appropriate permission.
2. Open `/manage` and choose a management area.
3. Save the record. Server validation, database constraints, and RLS check the request.
4. For events and team profiles, choose visibility explicitly; new records default to public.
5. Deactivate records when history should be retained.

Contact forms save to the private inbox. Society and club managers with `contacts.manage` can read and update messages only within their scope; a Society Admin can access all messages.

## Images

See [Storage and image workflow](storage-and-assets.md). New uploads use one image field per management form, a 10 MB per-file limit, and the `site-media` public bucket or `member-media` private bucket. Existing website images are still referenced by their old public asset paths until an administrator replaces each with a Storage upload.

## Deletion and history

Clubs and positions can be deactivated to retain assignment history. Event deletion also deletes linked registrations; use completed/cancelled states when event history matters. Team and alumni entries can be deactivated to hide them while retaining the record.

## Troubleshooting

- A private event is missing: check that the account has active membership.
- A manager cannot edit a row: verify the active role, its permission, and its society/club scope.
- A public page is stale: refresh and confirm that the record is active and public.
- A page has no content: check that a public, active row exists in `site_content` or the relevant table.
- Supabase is unavailable: configure the public project URL/key and check project status and Data API access.
