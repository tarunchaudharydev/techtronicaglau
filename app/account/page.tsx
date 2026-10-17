import PendingSubmitButton from "@/components/ui/PendingSubmitButton";
import type { Metadata } from "next";
import type { ReactNode } from "react";
import Link from "next/link";
import Image from "next/image";
import { redirect } from "next/navigation";
import type { User } from "@supabase/supabase-js";
import { FiArrowRight, FiCalendar, FiSettings, FiUsers } from "react-icons/fi";
import { signOutAction } from "@/app/auth/actions";
import { createClient } from "@/lib/supabase/server";
import { getMyPermissionKeys } from "@/lib/auth/permissions";
import AccountSessionsList from "@/components/account/AccountSessionsList";

const MANAGEMENT_PERMISSION_KEYS = [
  "admin.manage",
  "members.manage",
  "team.manage",
  "alumni.manage",
  "clubs.manage",
  "positions.manage",
  "events.manage",
  "registrations.manage",
  "contacts.manage",
  "content.manage",
] as const;

export const metadata: Metadata = {
  title: "My account",
  robots: { index: false, follow: false },
};

export default async function AccountPage() {
  const supabase = await createClient();
  if (!supabase) return <Unavailable message="Connect the Supabase project to view your member account." />;

  let user: User | null = null;
  try {
    const { data, error } = await supabase.auth.getUser();
    user = error ? null : data.user;
  } catch {
    return <Unavailable message="We could not verify your session. Refresh the page or sign in again." />;
  }
  if (!user) redirect("/auth/sign-in?next=/account");

  const accessPromise = getMyPermissionKeys(supabase, user.id).catch(() => ({
    permissionKeys: new Set<string>(),
    error: true,
  }));
  const [profileResult, membershipsResult, registrationsResult, accessResult, sessionsResult] = await Promise.all([
    supabase
      .from("profiles")
      .select("full_name, department, year_of_study, avatar_url")
      .eq("id", user.id)
      .maybeSingle(),
    supabase
      .from("memberships")
      .select("id, status, created_at, club_id, clubs(name, slug), positions(name)")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .order("id", { ascending: false })
      .limit(25),
    supabase
      .from("event_registrations")
      .select("id, status, registered_at, events(title, slug, starts_at)")
      .eq("user_id", user.id)
      .order("registered_at", { ascending: false })
      .order("id", { ascending: false })
      .limit(25),
    accessPromise,
    supabase.rpc("list_my_auth_sessions"),
  ]);

  const canManageSociety = !accessResult.error
    && MANAGEMENT_PERMISSION_KEYS.some((permission) => accessResult.permissionKeys.has(permission));
  const profile = profileResult.data ?? {
    full_name: typeof user.user_metadata?.full_name === "string" ? user.user_metadata.full_name : "",
    department: null,
    year_of_study: null,
    avatar_url: null,
  };
  const name = profile.full_name.trim() || user.email?.split("@")[0] || "Techtronica member";
  const memberships = membershipsResult.data ?? [];
  const registrations = registrationsResult.data ?? [];
  const activeMemberships = memberships.filter((membership) => membership.status === "active").length;
  const initials = name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => Array.from(part)[0]?.toLocaleUpperCase() ?? "")
    .join("");
  const accountLabel = activeMemberships > 0 ? "Society member" : "Community account";

  return (
    <main className="mx-auto max-w-6xl px-4 py-10 sm:px-6 lg:py-14">
      <header className="mb-8 flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-sky-700">Member portal</p>
          <h1 className="mt-2 text-3xl font-bold tracking-tight">Your account</h1>
          <p className="mt-2 text-sm text-muted">Your Techtronica profile, club memberships, and event activity.</p>
        </div>
        <div className="flex flex-wrap gap-3">
          <Link
            className="inline-flex items-center gap-2 rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold transition hover:border-sky-500 hover:text-sky-700 dark:border-slate-700 dark:bg-slate-900"
            href="/account/settings"
          >
            <FiSettings aria-hidden="true" /> Profile settings
          </Link>
          {canManageSociety && <Link
            className="inline-flex items-center rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold transition hover:border-sky-500 hover:text-sky-700 dark:border-slate-700 dark:bg-slate-900"
            href="/manage"
          >
            Manage society
          </Link>}
          <form action={signOutAction}>
            <PendingSubmitButton className="rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-700 dark:bg-slate-700">
              Sign out
            </PendingSubmitButton>
          </form>
        </div>
      </header>

      <section className="grid gap-5 lg:grid-cols-[1.3fr_1fr]" aria-label="Account overview">
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900 sm:p-8">
          <div className="flex flex-wrap items-center gap-5">
            {profile.avatar_url ? (
              <Image
                alt={`${name}'s profile`}
                className="size-20 shrink-0 rounded-2xl object-cover shadow-sm"
                height={80}
                src={profile.avatar_url}
                unoptimized
                width={80}
              />
            ) : (
              <div
                aria-label={`${name} initials`}
                className="grid size-20 shrink-0 place-items-center rounded-2xl bg-gradient-to-br from-sky-500 to-indigo-600 text-2xl font-bold text-white shadow-sm"
                role="img"
              >
                {initials || "T"}
              </div>
            )}
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium text-sky-700">{accountLabel}</p>
              <h2 className="mt-1 break-words text-2xl font-bold tracking-tight">{name}</h2>
              <p className="mt-1 break-all text-sm text-muted">{user.email ?? "Verified account"}</p>
            </div>
            <Link className="inline-flex items-center gap-2 text-sm font-semibold text-sky-700 hover:underline" href="/account/settings">
              Edit profile <FiArrowRight aria-hidden="true" />
            </Link>
          </div>

          {profileResult.error && (
            <p className="mt-5 rounded-xl bg-amber-50 p-3 text-sm text-amber-900" role="status">
              Profile details could not be loaded. You can review them in settings and try again.
            </p>
          )}

          <dl className="mt-7 grid gap-4 border-t border-slate-100 pt-5 dark:border-slate-800 sm:grid-cols-2">
            <ProfileDetail label="Department" value={profile.department || "Add your department"} />
            <ProfileDetail
              label="Year of study"
              value={profile.year_of_study ? `Year ${profile.year_of_study}` : "Add your study year"}
            />
            <ProfileDetail label="Account email" value={user.email ?? "Email unavailable"} />
            <ProfileDetail label="Member since" value={formatDate(user.created_at, { dateStyle: "medium" })} />
          </dl>
        </div>

        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-1">
          <StatCard
            icon={<FiUsers aria-hidden="true" />}
            label="Active club memberships"
            value={activeMemberships}
            detail={membershipsResult.error ? "Memberships could not be loaded" : `${memberships.length} total listed`}
          />
          <StatCard
            icon={<FiCalendar aria-hidden="true" />}
            label="Event registrations"
            value={registrations.length}
            detail={registrationsResult.error ? "Registrations could not be loaded" : "Your recent event activity"}
          />
        </div>
      </section>

      <section className="mt-6 rounded-3xl border border-emerald-100 bg-gradient-to-br from-white via-emerald-50/60 to-sky-50/70 p-5 shadow-sm sm:p-6" aria-label="Signed-in devices"><div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between"><div><p className="text-xs font-bold uppercase tracking-[0.16em] text-emerald-700">Account security</p><h2 className="mt-1 text-lg font-bold text-slate-950">Devices signed in to your account</h2><p className="mt-1 text-sm text-slate-600">Review recent sessions and sign out devices you do not recognize.</p></div><Link className="inline-flex min-h-10 items-center justify-center rounded-xl border border-emerald-200 bg-white px-4 py-2 text-sm font-semibold text-emerald-800 hover:bg-emerald-50" href="/account/settings#session-settings">Manage sessions</Link></div><AccountSessionsList sessions={sessionsResult.data ?? []} unavailable={Boolean(sessionsResult.error)} compact /></section>

      <div className="mt-8 grid gap-5 lg:grid-cols-2">
        <CollectionPanel
          title="Club memberships"
          description="Your positions and membership status across Techtronica clubs."
          error={membershipsResult.error ? "Memberships could not be loaded. Refresh to try again." : null}
          empty="You have not joined a club yet. Explore the clubs and apply to join a community."
          emptyHref="/clubs"
          emptyAction="Explore clubs"
        >
          {memberships.map((membership) => {
            const club = relation(membership.clubs);
            const position = relation(membership.positions);
            return (
              <li className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 py-4 first:border-0 dark:border-slate-800" key={membership.id}>
                <div className="min-w-0">
                  {club?.slug ? (
                    <Link className="font-semibold hover:text-sky-700 hover:underline" href={`/clubs/${club.slug}`}>
                      {club.name}
                    </Link>
                  ) : (
                    <p className="font-semibold">{club?.name ?? "Society membership"}</p>
                  )}
                  <p className="mt-1 text-sm text-muted">{position?.name ?? "Member"}</p>
                </div>
                <StatusBadge status={membership.status} />
              </li>
            );
          })}
        </CollectionPanel>

        <CollectionPanel
          title="Event registrations"
          description="Keep track of the events you have registered for."
          error={registrationsResult.error ? "Event registrations could not be loaded. Refresh to try again." : null}
          empty="Your registrations will appear here when you sign up for an event."
          emptyHref="/events"
          emptyAction="Browse events"
        >
          {registrations.map((registration) => {
            const event = relation(registration.events);
            return (
              <li className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 py-4 first:border-0 dark:border-slate-800" key={registration.id}>
                <div className="min-w-0">
                  {event?.slug ? (
                    <Link className="font-semibold text-sky-700 hover:underline" href={`/events/${event.slug}`}>
                      {event.title}
                    </Link>
                  ) : (
                    <p className="font-semibold">{event?.title ?? "Event registration"}</p>
                  )}
                  <p className="mt-1 text-sm text-muted">
                    {event?.starts_at ? formatDate(event.starts_at) : `Registered ${formatDate(registration.registered_at)}`}
                  </p>
                </div>
                <StatusBadge status={registration.status} />
              </li>
            );
          })}
        </CollectionPanel>
      </div>
    </main>
  );
}

function ProfileDetail({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-0">
      <dt className="text-xs font-semibold uppercase tracking-wide text-muted">{label}</dt>
      <dd className="mt-1 break-words text-sm font-medium">{value}</dd>
    </div>
  );
}

function StatCard({ icon, label, value, detail }: { icon: ReactNode; label: string; value: number; detail: string }) {
  return (
    <section className="flex items-center gap-4 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
      <span className="grid size-12 shrink-0 place-items-center rounded-2xl bg-sky-50 text-xl text-sky-700 dark:bg-sky-950 dark:text-sky-300">{icon}</span>
      <div className="min-w-0">
        <p className="text-sm text-muted">{label}</p>
        <p className="mt-0.5 text-2xl font-bold tabular-nums">{value}</p>
        <p className="mt-0.5 text-xs text-muted">{detail}</p>
      </div>
    </section>
  );
}

function CollectionPanel({
  title,
  description,
  empty,
  emptyHref,
  emptyAction,
  error,
  children,
}: {
  title: string;
  description: string;
  empty: string;
  emptyHref: string;
  emptyAction: string;
  error: string | null;
  children: ReactNode[];
}) {
  return (
    <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900 sm:p-7">
      <div className="border-b border-slate-100 pb-4 dark:border-slate-800">
        <h2 className="text-xl font-semibold">{title}</h2>
        <p className="mt-1 text-sm text-muted">{description}</p>
      </div>
      {error ? (
        <p className="mt-5 text-sm text-amber-800" role="status">{error}</p>
      ) : children.length ? (
        <ul className="mt-1">{children}</ul>
      ) : (
        <div className="py-7">
          <p className="text-sm leading-6 text-muted">{empty}</p>
          <Link className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-sky-700 hover:underline" href={emptyHref}>
            {emptyAction} <FiArrowRight aria-hidden="true" />
          </Link>
        </div>
      )}
    </section>
  );
}

function StatusBadge({ status }: { status: string }) {
  const colors: Record<string, string> = {
    active: "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300",
    registered: "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300",
    attended: "bg-sky-100 text-sky-800 dark:bg-sky-950 dark:text-sky-300",
    waitlisted: "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300",
    pending: "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300",
    rejected: "bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300",
    cancelled: "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300",
    inactive: "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300",
    no_show: "bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300",
  };
  const label = status.replaceAll("_", " ");
  return (
    <span className={`shrink-0 rounded-full px-3 py-1 text-xs font-semibold capitalize ${colors[status] ?? "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300"}`}>
      {label}
    </span>
  );
}

function relation<T>(value: T | T[] | null) {
  return Array.isArray(value) ? value[0] ?? null : value;
}

function formatDate(value: string, options: Intl.DateTimeFormatOptions = { dateStyle: "medium", timeStyle: "short" }) {
  const date = new Date(value);
  return Number.isNaN(date.valueOf()) ? "Date unavailable" : new Intl.DateTimeFormat("en-IN", options).format(date);
}

function Unavailable({ message }: { message: string }) {
  return (
    <main className="mx-auto max-w-xl px-4 py-24 text-center">
      <h1 className="text-2xl font-bold">Account unavailable</h1>
      <p className="mt-3 text-sm text-muted">{message}</p>
      <Link className="mt-6 inline-block text-sky-700 underline" href="/auth/sign-in">Sign in</Link>
    </main>
  );
}
