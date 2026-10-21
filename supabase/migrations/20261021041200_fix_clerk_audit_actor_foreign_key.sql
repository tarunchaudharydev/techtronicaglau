begin;

-- Clerk identities are mapped to stable public.profiles UUIDs. The audit trigger
-- records private.current_profile_id(), so audit actors must reference profiles,
-- not the legacy auth.users table.
alter table private.audit_log
  drop constraint if exists audit_log_actor_id_fkey;

alter table private.audit_log
  add constraint audit_log_actor_id_fkey
  foreign key (actor_id)
  references public.profiles (id)
  on delete set null;

comment on constraint audit_log_actor_id_fkey on private.audit_log is
  'Audit actors reference stable application profile IDs resolved from Clerk sessions.';

commit;
