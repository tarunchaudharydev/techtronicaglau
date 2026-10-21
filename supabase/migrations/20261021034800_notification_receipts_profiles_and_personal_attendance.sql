alter table public.notification_reads
  drop constraint if exists notification_reads_user_id_fkey;

alter table public.notification_reads
  add constraint notification_reads_user_id_fkey
  foreign key (user_id)
  references public.profiles (id)
  on delete cascade;

drop policy if exists meeting_attendance_select_own
  on public.meeting_attendance;

create policy meeting_attendance_select_own
  on public.meeting_attendance
  for select
  to authenticated
  using (user_id = (select private.current_profile_id()));

drop policy if exists meeting_attendance_sessions_select_rostered_member
  on public.meeting_attendance_sessions;

create policy meeting_attendance_sessions_select_rostered_member
  on public.meeting_attendance_sessions
  for select
  to authenticated
  using (
    exists (
      select 1
      from public.meeting_attendance as attendance
      where attendance.session_id = meeting_attendance_sessions.id
        and attendance.user_id = (select private.current_profile_id())
    )
  );
