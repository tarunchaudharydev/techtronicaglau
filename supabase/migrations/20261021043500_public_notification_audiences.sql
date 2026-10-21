-- Let non-member accounts receive public release/deployment notices and public event notices.
-- Active society members can continue to see all society notifications.

alter table public.notifications
  drop constraint if exists notifications_audience_check;

alter table public.notifications
  add constraint notifications_audience_check
  check (audience in ('society_members', 'everyone'));

-- Previously published event notices follow the event's current visibility.
update public.notifications as n
set audience = case when e.is_public then 'everyone' else 'society_members' end
from public.events as e
where n.event_id = e.id;

-- Version and deployment notes are general product announcements.
update public.notifications
set audience = 'everyone'
where event_id is null
  and kind in ('deployment', 'release');

drop policy if exists notifications_read_active_members_or_society_admin
  on public.notifications;

create policy notifications_read_visible_audience
  on public.notifications
  for select
  to authenticated
  using (
    published_at <= now()
    and (
      audience = 'everyone'
      or (select private.is_active_society_member())
      or (select private.has_permission('admin.manage'))
    )
  );

drop policy if exists notifications_publish_member_notices
  on public.notifications;

create policy notifications_publish_notices
  on public.notifications
  for insert
  to authenticated
  with check (
    event_id is null
    and created_by = (select private.current_profile_id())
    and audience in ('society_members', 'everyone')
    and (
      (select private.has_permission('content.manage'))
      or (select private.has_permission('admin.manage'))
    )
  );

-- A read receipt may only reference a notice visible to the current account.
drop policy if exists notification_reads_select_own_member_or_admin
  on public.notification_reads;
create policy notification_reads_select_own_visible
  on public.notification_reads
  for select
  to authenticated
  using (
    user_id = (select private.current_profile_id())
    and exists (
      select 1
      from public.notifications as n
      where n.id = notification_reads.notification_id
    )
  );

drop policy if exists notification_reads_insert_own_visible_member_or_admin
  on public.notification_reads;
create policy notification_reads_insert_own_visible
  on public.notification_reads
  for insert
  to authenticated
  with check (
    user_id = (select private.current_profile_id())
    and exists (
      select 1
      from public.notifications as n
      where n.id = notification_reads.notification_id
    )
  );

drop policy if exists notification_reads_update_own_member_or_admin
  on public.notification_reads;
create policy notification_reads_update_own_visible
  on public.notification_reads
  for update
  to authenticated
  using (
    user_id = (select private.current_profile_id())
    and exists (
      select 1
      from public.notifications as n
      where n.id = notification_reads.notification_id
    )
  )
  with check (
    user_id = (select private.current_profile_id())
    and exists (
      select 1
      from public.notifications as n
      where n.id = notification_reads.notification_id
    )
  );

create or replace function private.notify_when_event_published()
returns trigger
language plpgsql
security definer
set search_path to ''
as $function$
declare
  actor_name text;
  notice_message text;
  notice_audience text;
begin
  notice_audience := case when new.is_public then 'everyone' else 'society_members' end;

  if new.status = 'published'
     and (tg_op = 'INSERT' or old.status is distinct from 'published') then
    select nullif(btrim(p.full_name), '')
      into actor_name
      from public.profiles p
     where p.id = coalesce(new.created_by, (select private.current_profile_id()));

    notice_message := left(
      coalesce(actor_name || ' published “' || new.title || '”. ', '')
      || coalesce(nullif(btrim(new.summary), ''), 'A new Techtronica event is ready to explore.'),
      1200
    );

    insert into public.notifications (
      kind, title, message, href, audience, event_id, created_by, published_at
    )
    values (
      'event',
      left('New event: ' || new.title, 160),
      notice_message,
      '/events/' || new.slug,
      notice_audience,
      new.id,
      coalesce(new.created_by, (select private.current_profile_id())),
      now()
    )
    on conflict (event_id) where event_id is not null do update
      set title = excluded.title,
          message = excluded.message,
          href = excluded.href,
          audience = excluded.audience,
          created_by = excluded.created_by,
          published_at = excluded.published_at;
  elsif tg_op = 'UPDATE'
     and new.status = 'published'
     and old.status = 'published'
     and old.is_public is distinct from new.is_public then
    update public.notifications
       set audience = notice_audience,
           published_at = now()
     where event_id = new.id;
  end if;

  return new;
end;
$function$;
