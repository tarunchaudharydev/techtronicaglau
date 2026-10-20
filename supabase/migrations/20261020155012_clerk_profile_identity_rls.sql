-- Clerk identities use string subjects; map them onto stable app profile UUIDs.
-- Preserve existing role, membership, registration, and attendance foreign keys.
begin;

alter table public.profiles
  add column if not exists clerk_user_id text;

create unique index if not exists profiles_clerk_user_id_uidx
  on public.profiles (clerk_user_id)
  where clerk_user_id is not null;

-- The profile id is resolved only from a Clerk subject already linked to a profile,
-- or from the signed session's server-managed external_id claim when it matches an
-- unlinked existing profile. This keeps app permissions tied to the stable profile UUID.
create or replace function private.current_profile_id()
returns uuid
language sql
stable
security definer
set search_path = ''
as $function$
  select coalesce(
    (
      select p.id
      from public.profiles as p
      where p.clerk_user_id = (select auth.jwt() ->> 'sub')
      limit 1
    ),
    (
      select p.id
      from public.profiles as p
      where p.id::text = (select auth.jwt() ->> 'userId')
        and (p.clerk_user_id is null or p.clerk_user_id = (select auth.jwt() ->> 'sub'))
      limit 1
    )
  );
$function$;

revoke all on function private.current_profile_id() from public, anon, authenticated;
grant execute on function private.current_profile_id() to authenticated;

-- New Clerk-only accounts no longer have a matching auth.users row. The profile
-- UUID remains the app's internal identity and is still protected by RLS.
alter table public.profiles
  drop constraint if exists profiles_id_fkey;

alter policy profiles_update_self
  on public.profiles
  using ((select private.current_profile_id()) = id)
  with check ((select private.current_profile_id()) = id);

drop policy if exists profiles_insert_self on public.profiles;
create policy profiles_insert_self
  on public.profiles
  for insert
  to authenticated
  with check (
    clerk_user_id = (select auth.jwt() ->> 'sub')
    and (
      coalesce((select auth.jwt() ->> 'userId'), '') !~*
        '^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$'
      or id::text = (select auth.jwt() ->> 'userId')
    )
  );

-- Translate existing row policies to the Clerk-to-profile UUID resolver. The
-- predicates remain otherwise unchanged, preserving each table's current access rules.
do $migration$
declare
  policy_row record;
  statement text;
begin
  for policy_row in
    select schemaname, tablename, policyname, qual, with_check
    from pg_policies
    where schemaname in ('public', 'private')
      and (
        coalesce(qual, '') ilike '%auth.uid()%'
        or coalesce(with_check, '') ilike '%auth.uid()%'
      )
  loop
    statement := format(
      'alter policy %I on %I.%I',
      policy_row.policyname,
      policy_row.schemaname,
      policy_row.tablename
    );

    if policy_row.qual is not null then
      statement := statement || format(
        ' using (%s)',
        replace(policy_row.qual, 'auth.uid()', '(select private.current_profile_id())')
      );
    end if;

    if policy_row.with_check is not null then
      statement := statement || format(
        ' with check (%s)',
        replace(policy_row.with_check, 'auth.uid()', '(select private.current_profile_id())')
      );
    end if;

    execute statement;
  end loop;
end;
$migration$;

-- Keep SQL and trigger permission checks aligned with the same internal profile id.
do $migration$
declare
  function_row record;
  definition text;
begin
  for function_row in
    select p.oid
    from pg_proc as p
    join pg_namespace as n on n.oid = p.pronamespace
    where n.nspname in ('public', 'private')
      and p.prosrc ilike '%auth.uid()%'
  loop
    definition := replace(
      pg_get_functiondef(function_row.oid),
      'auth.uid()',
      '(select private.current_profile_id())'
    );
    execute definition;
  end loop;
end;
$migration$;

commit;
