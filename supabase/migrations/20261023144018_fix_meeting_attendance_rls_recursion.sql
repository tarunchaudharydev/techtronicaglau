create or replace function private.is_current_user_rostered_for_session(target_session_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $function$
  select (select private.current_profile_id()) is not null
    and exists (
      select 1
      from public.meeting_attendance as attendance
      where attendance.session_id = target_session_id
        and attendance.user_id = (select private.current_profile_id())
    );
$function$;

revoke all on function private.is_current_user_rostered_for_session(uuid) from public, anon;
grant execute on function private.is_current_user_rostered_for_session(uuid) to authenticated;

drop policy if exists meeting_attendance_sessions_select_rostered_member
  on public.meeting_attendance_sessions;

create policy meeting_attendance_sessions_select_rostered_member
  on public.meeting_attendance_sessions
  for select
  to authenticated
  using ((select private.is_current_user_rostered_for_session(id)));
