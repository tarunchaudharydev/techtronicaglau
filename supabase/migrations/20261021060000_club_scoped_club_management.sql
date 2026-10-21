-- Allow a club-scoped manager to update only their assigned club.
-- Society-wide clubs.manage roles retain access to all clubs. Creating new clubs
-- remains society-wide because the insert policy still requires global access.

drop policy if exists clubs_select_active on public.clubs;
create policy clubs_select_active
  on public.clubs
  for select
  to anon, authenticated
  using (
    is_active
    or (select private.has_permission('clubs.manage', id))
  );

drop policy if exists clubs_update_admin on public.clubs;
create policy clubs_update_admin
  on public.clubs
  for update
  to authenticated
  using ((select private.has_permission('clubs.manage', id)))
  with check ((select private.has_permission('clubs.manage', id)));

drop policy if exists clubs_delete_admin on public.clubs;
create policy clubs_delete_admin
  on public.clubs
  for delete
  to authenticated
  using ((select private.has_permission('clubs.manage', id)));
