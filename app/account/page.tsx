import PendingSubmitButton from "@/components/ui/PendingSubmitButton";
import type { Metadata } from "next";
import type { ReactNode } from "react";
import Link from "next/link";
import Image from "next/image";
import { redirect } from "next/navigation";
import type { User } from "@supabase/supabase-js";
import {
  ArrowRight, BadgeCheck, CalendarDays, Clock3, Settings2,
  ShieldCheck, Sparkles, Users, LogOut, BriefcaseBusiness,
} from "lucide-react";
import { signOutAction } from "@/app/auth/actions";
import { createClient } from "@/lib/supabase/server";
import { getMyPermissionKeys } from "@/lib/auth/permissions";
import AccountSessionsList from "@/components/account/AccountSessionsList";

const MANAGEMENT_PERMISSION_KEYS = [
  "admin.manage", "members.manage", "team.manage", "alumni.manage", "clubs.manage",
  "positions.manage", "events.manage", "registrations.manage", "contacts.manage", "content.manage",
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
    supabase.from("profiles").select("full_name, department, year_of_study, avatar_url").eq("id", user.id).maybeSingle(),
    supabase.from("memberships").select("id, status, created_at, club_id, clubs(name, slug), positions(name)")
      .eq("user_id", user.id).order("created_at", { ascending: false }).order("id", { ascending: false }).limit(25),
    supabase.from("event_registrations").select("id, status, registered_at, events(title, slug, starts_at)")
      .eq("user_id", user.id).order("registered_at", { ascending: false }).order("id", { ascending: false }).limit(25),
    accessPromise,
    supabase.rpc("list_my_auth_sessions"),
  ]);

  const canManageSociety = !accessResult.error
    && MANAGEMENT_PERMISSION_KEYS.some((permission) => accessResult.permissionKeys.has(permission));
  const profile = profileResult.data ?? {
    full_name: typeof user.user_metadata?.full_name === "string" ? user.user_metadata.full_name : "",
    department: null, year_of_study: null, avatar_url: null,
  };
  const name = profile.full_name.trim() || user.email?.split("@")[0] || "Techtronica member";
  const memberships = membershipsResult.data ?? [];
  const registrations = registrationsResult.data ?? [];
  const activeMemberships = memberships.filter((membership) => membership.status === "active").length;
  const pendingMemberships = memberships.filter((membership) => membership.status === "pending").length;
  const now = Date.now();
  const upcomingRegistrations = registrations.filter((registration) => {
    const event = relation(registration.events);
    return Boolean(event?.starts_at && new Date(event.starts_at).valueOf() >= now && !["cancelled", "rejected", "no_show"].includes(registration.status));
  });
  const nextRegistration = [...upcomingRegistrations].sort((a, b) => {
    const eventA = relation(a.events)?.starts_at ?? "";
    const eventB = relation(b.events)?.starts_at ?? "";
    return eventA.localeCompare(eventB);
  })[0];
  const profileFields = [profile.full_name.trim(), profile.department?.trim(), profile.year_of_study, profile.avatar_url?.trim()];
  const profileProgress = Math.round(profileFields.filter(Boolean).length / profileFields.length * 100);
  const initials = name.split(/\s+/).filter(Boolean).slice(0, 2)
    .map((part) => Array.from(part)[0]?.toLocaleUpperCase() ?? "").join("") || "T";
  const isVerified = Boolean(user.email_confirmed_at);
  const nextEvent = nextRegistration ? relation(nextRegistration.events) : null;
  const sessionCount = sessionsResult.error ? null : sessionsResult.data?.[0]?.total_sessions ?? 0;

  return (
    <main className="mx-auto w-full max-w-6xl px-4 py-7 sm:px-6 lg:px-8 lg:py-9">
      <header className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="min-w-0">
          <p className="text-xs font-semibold uppercase tracking-[.14em] text-sky-700 dark:text-sky-300">Member portal</p>
          <h1 className="mt-1 text-3xl font-semibold tracking-tight text-slate-950 dark:text-white sm:text-4xl">Your account</h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600 dark:text-slate-400">Your profile, society activity, and security in one place.</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Link className="inline-flex min-h-10 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-3.5 text-sm font-medium text-slate-700 transition hover:border-sky-300 hover:bg-sky-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:hover:bg-slate-800" href="/account/settings">
            <Settings2 className="size-4" /> Settings
          </Link>
          {canManageSociety && <Link className="inline-flex min-h-10 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-3.5 text-sm font-medium text-slate-700 transition hover:border-sky-300 hover:bg-sky-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:hover:bg-slate-800" href="/manage">
            <BriefcaseBusiness className="size-4" /> Manage society
          </Link>}
          <form action={signOutAction}>
            <PendingSubmitButton className="inline-flex min-h-10 items-center justify-center gap-2 rounded-xl px-3.5 text-sm font-medium text-slate-600 transition hover:bg-slate-100 hover:text-slate-900 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-white">
              <LogOut className="size-4" /> Sign out
            </PendingSubmitButton>
          </form>
        </div>
      </header>

      <section aria-label="Profile summary" className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <div className="flex flex-col gap-5 p-5 sm:flex-row sm:items-center sm:p-6">
          <div className="flex min-w-0 flex-1 items-center gap-4">
            {profile.avatar_url ? (
              <Image alt={name + "'s profile"} className="size-16 shrink-0 rounded-full border border-slate-200 object-cover sm:size-[4.5rem]" height={72} src={profile.avatar_url} unoptimized width={72} />
            ) : (
              <div aria-label={name + " initials"} className="grid size-16 shrink-0 place-items-center rounded-full bg-sky-50 text-xl font-semibold text-sky-800 ring-1 ring-sky-100 sm:size-[4.5rem] sm:text-2xl dark:bg-sky-950 dark:text-sky-200 dark:ring-sky-900" role="img">{initials}</div>
            )}
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-700 dark:bg-slate-800 dark:text-slate-200">{activeMemberships > 0 ? "Society member" : "Community account"}</span>
                {isVerified ? (
                  <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-800 dark:bg-emerald-950 dark:text-emerald-200"><BadgeCheck className="size-3.5" /> Email verified</span>
                ) : (
                  <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2.5 py-1 text-xs font-medium text-amber-800 dark:bg-amber-950 dark:text-amber-200"><Clock3 className="size-3.5" /> Verify your email</span>
                )}
              </div>
              <h2 className="mt-2 truncate text-xl font-semibold tracking-tight text-slate-950 dark:text-white sm:text-2xl">{name}</h2>
              <p className="mt-0.5 break-all text-sm text-slate-600 dark:text-slate-300">{user.email ?? "Email unavailable"}</p>
              <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">Account created {formatDate(user.created_at, { dateStyle: "long" })}</p>
            </div>
          </div>
          <Link href="/account/settings#profile-settings" className="inline-flex min-h-10 shrink-0 items-center justify-center gap-2 self-start rounded-xl bg-sky-700 px-4 text-sm font-medium text-white transition hover:bg-sky-800 sm:self-center dark:bg-sky-600 dark:hover:bg-sky-500">
            Edit profile <ArrowRight className="size-4" />
          </Link>
        </div>

        <div className="border-t border-slate-100 px-5 py-4 sm:px-6 dark:border-slate-800">
          <div className="flex items-center justify-between gap-3 text-xs">
            <span className="font-medium text-slate-700 dark:text-slate-200">Profile completeness</span>
            <span className="tabular-nums text-slate-500 dark:text-slate-400">{profileProgress}%</span>
          </div>
          <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
            <div className="h-full rounded-full bg-sky-600 transition-[width] duration-500 dark:bg-sky-400" style={{ width: profileProgress + "%" }} />
          </div>
          <p className="mt-2 text-xs leading-5 text-slate-500 dark:text-slate-400">
            {profileProgress === 100 ? "Your profile has the key details members use to recognize you." : "Add a photo, department, and study year to complete your profile."}
            {profileProgress < 100 && <> <Link href="/account/settings#profile-settings" className="font-medium text-sky-700 hover:underline dark:text-sky-300">Complete profile</Link></>}
          </p>
        </div>
      </section>

      <section aria-label="Account activity summary" className="mt-4 grid grid-cols-2 overflow-hidden rounded-2xl border border-slate-200 bg-white md:grid-cols-4 dark:border-slate-800 dark:bg-slate-900">
        <div className="border-b border-r border-slate-200 md:border-b-0 dark:border-slate-800"><StatCard icon={<Users className="size-4" />} label="Club memberships" value={activeMemberships} detail={membershipsResult.error ? "Could not load memberships" : "Active clubs"} /></div>
        <div className="border-b border-slate-200 md:border-b-0 md:border-r dark:border-slate-800"><StatCard icon={<Clock3 className="size-4" />} label="Applications" value={pendingMemberships} detail={membershipsResult.error ? "Could not load applications" : "Awaiting review"} /></div>
        <div className="border-r border-slate-200 dark:border-slate-800"><StatCard icon={<CalendarDays className="size-4" />} label="Upcoming events" value={upcomingRegistrations.length} detail={registrationsResult.error ? "Could not load registrations" : "Your registrations"} /></div>
        <div><StatCard icon={<ShieldCheck className="size-4" />} label="Signed-in devices" value={sessionCount === null ? "—" : sessionCount} detail={sessionsResult.error ? "Session list unavailable" : "Active sessions"} /></div>
      </section>

      {profileResult.error && <p className="mt-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900 dark:border-amber-900 dark:bg-amber-950/40 dark:text-amber-100" role="status">Some profile details could not be loaded. Review your settings and try again.</p>}

      <div className="mt-5 grid gap-5 lg:grid-cols-[1.1fr_.9fr]">
        <section aria-label="Profile details" className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6 dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-start justify-between gap-4 border-b border-slate-100 pb-4 dark:border-slate-800">
            <div>
              <h2 className="text-lg font-semibold tracking-tight text-slate-950 dark:text-white">Profile details</h2>
              <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Information used across the member portal.</p>
            </div>
            <Link href="/account/settings#profile-settings" aria-label="Edit profile details" className="inline-flex min-h-9 items-center gap-2 rounded-lg px-2.5 text-sm font-medium text-sky-700 transition hover:bg-sky-50 dark:text-sky-300 dark:hover:bg-slate-800"><Settings2 className="size-4" /> Edit</Link>
          </div>
          <dl className="mt-2 grid gap-x-8 sm:grid-cols-2">
            <ProfileDetail label="Department" value={profile.department || "Add your department"} />
            <ProfileDetail label="Year of study" value={profile.year_of_study ? "Year " + profile.year_of_study : "Add your study year"} />
            <ProfileDetail label="Account email" value={user.email ?? "Email unavailable"} />
            <ProfileDetail label="Member since" value={formatDate(user.created_at, { dateStyle: "medium" })} />
          </dl>
        </section>

        <section aria-label="Next event" className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6 dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center gap-3">
            <span className="grid size-9 place-items-center rounded-xl bg-sky-50 text-sky-700 dark:bg-sky-950 dark:text-sky-300"><CalendarDays className="size-4" /></span>
            <div>
              <p className="text-xs font-medium text-slate-500 dark:text-slate-400">Your next event</p>
              {nextEvent ? (
                <h2 className="mt-0.5 text-lg font-semibold tracking-tight text-slate-950 dark:text-white">{nextEvent.title}</h2>
              ) : (
                <h2 className="mt-0.5 text-lg font-semibold tracking-tight text-slate-950 dark:text-white">Nothing scheduled yet</h2>
              )}
            </div>
          </div>
          {nextEvent ? (
            <>
              <p className="mt-4 flex items-center gap-2 text-sm text-slate-600 dark:text-slate-300"><CalendarDays className="size-4 shrink-0 text-slate-400" />{formatDate(nextEvent.starts_at)}</p>
              {nextEvent.slug && <Link href={"/events/" + nextEvent.slug} className="mt-4 inline-flex items-center gap-2 text-sm font-medium text-sky-700 hover:underline dark:text-sky-300">View event <ArrowRight className="size-4" /></Link>}
            </>
          ) : (
            <>
              <p className="mt-4 text-sm leading-6 text-slate-600 dark:text-slate-300">Your upcoming event registrations will appear here.</p>
              <Link href="/events" className="mt-4 inline-flex items-center gap-2 text-sm font-medium text-sky-700 hover:underline dark:text-sky-300">Browse events <ArrowRight className="size-4" /></Link>
            </>
          )}
        </section>
      </div>

      <section aria-label="Quick links" className="mt-5 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6 dark:border-slate-800 dark:bg-slate-900">
        <div className="mb-3">
          <h2 className="text-lg font-semibold tracking-tight text-slate-950 dark:text-white">Explore Techtronica</h2>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Shortcuts to the places members use most.</p>
        </div>
        <div className="grid gap-2 sm:grid-cols-3">
          <QuickLink href="/clubs" icon={<Users className="size-4" />} title="Explore clubs" description="Find your community." />
          <QuickLink href="/events" icon={<CalendarDays className="size-4" />} title="Browse events" description="See upcoming activities." />
          <QuickLink href="/account/settings#session-settings" icon={<ShieldCheck className="size-4" />} title="Security settings" description="Manage devices and passwords." />
        </div>
      </section>

      <section aria-label="Signed-in devices" className="mt-5 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6 dark:border-slate-800 dark:bg-slate-900">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-3">
            <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-200"><ShieldCheck className="size-4" /></span>
            <div>
              <p className="text-xs font-medium text-slate-500 dark:text-slate-400">Account security</p>
              <h2 className="mt-0.5 text-lg font-semibold tracking-tight text-slate-950 dark:text-white">Signed-in devices</h2>
              <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">Review recent sessions and sign out devices you no longer use.</p>
            </div>
          </div>
          <Link className="inline-flex min-h-9 items-center justify-center gap-2 self-start rounded-lg px-2.5 text-sm font-medium text-sky-700 transition hover:bg-sky-50 dark:text-sky-300 dark:hover:bg-slate-800 sm:self-center" href="/account/settings#session-settings">Manage sessions <ArrowRight className="size-4" /></Link>
        </div>
        <AccountSessionsList sessions={sessionsResult.data ?? []} unavailable={Boolean(sessionsResult.error)} compact />
      </section>

      <div className="mt-5 grid gap-5 xl:grid-cols-2">
        <CollectionPanel
          title="Club memberships"
          eyebrow="Your community"
          description="Your position and current application status across Techtronica clubs."
          error={membershipsResult.error ? "Memberships could not be loaded. Refresh to try again." : null}
          empty="You have not joined a club yet. Explore the clubs and apply to join a community."
          emptyHref="/clubs"
          emptyAction="Explore clubs"
        >
          {memberships.map((membership) => {
            const club = relation(membership.clubs);
            const position = relation(membership.positions);
            return <li className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 py-3 first:border-0 dark:border-slate-800" key={membership.id}>
              <div className="min-w-0"><p className="font-medium text-slate-900 dark:text-white">{club?.slug ? <Link className="hover:text-sky-700 hover:underline" href={"/clubs/" + club.slug}>{club.name}</Link> : club?.name ?? "Society membership"}</p><p className="mt-1 text-sm text-slate-500">{position?.name ?? "Member"}</p></div>
              <StatusBadge status={membership.status} />
            </li>;
          })}
        </CollectionPanel>

        <CollectionPanel
          title="Event registrations"
          eyebrow="Your activity"
          description="Your latest event sign-ups and their current status."
          error={registrationsResult.error ? "Event registrations could not be loaded. Refresh to try again." : null}
          empty="Your event registrations will appear here after you sign up."
          emptyHref="/events"
          emptyAction="Browse events"
        >
          {registrations.map((registration) => {
            const event = relation(registration.events);
            return <li className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 py-3 first:border-0 dark:border-slate-800" key={registration.id}>
              <div className="min-w-0"><p className="font-medium text-slate-900 dark:text-white">{event?.slug ? <Link className="hover:text-sky-700 hover:underline" href={"/events/" + event.slug}>{event.title}</Link> : event?.title ?? "Event registration"}</p><p className="mt-1 text-sm text-slate-500">{event?.starts_at ? formatDate(event.starts_at) : "Registered " + formatDate(registration.registered_at)}</p></div>
              <StatusBadge status={registration.status} />
            </li>;
          })}
        </CollectionPanel>
      </div>
    </main>
  );
}

function ProfileDetail({ label, value }: { label: string; value: string }) {
  return <div className="border-b border-slate-100 py-3 last:border-0 dark:border-slate-800"><dt className="text-xs text-slate-500 dark:text-slate-400">{label}</dt><dd className="mt-1 break-words text-sm font-medium text-slate-900 dark:text-slate-100">{value}</dd></div>;
}

function StatCard({ icon, label, value, detail }: { icon: ReactNode; label: string; value: number | string; detail: string }) {
  return <div className="px-4 py-4 sm:px-5">
    <div className="flex items-center gap-3">
      <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300">{icon}</span>
      <div className="min-w-0">
        <p className="truncate text-xs text-slate-500 dark:text-slate-400">{label}</p>
        <p className="mt-0.5 text-xl font-semibold tabular-nums text-slate-950 dark:text-white">{value}</p>
      </div>
    </div>
    <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">{detail}</p>
  </div>;
}

function QuickLink({ href, icon, title, description }: { href: string; icon: ReactNode; title: string; description: string }) {
  return <Link href={href} className="group flex min-h-16 items-center gap-3 rounded-xl border border-slate-200 px-3.5 py-3 transition hover:border-sky-300 hover:bg-sky-50/60 dark:border-slate-800 dark:hover:border-slate-700 dark:hover:bg-slate-800/60">
    <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300">{icon}</span>
    <span className="min-w-0 flex-1">
      <span className="block text-sm font-medium text-slate-900 dark:text-white">{title}</span>
      <span className="mt-0.5 block text-xs text-slate-500 dark:text-slate-400">{description}</span>
    </span>
    <ArrowRight className="size-4 shrink-0 text-slate-400 transition group-hover:translate-x-0.5 group-hover:text-sky-700" />
  </Link>;
}

function CollectionPanel({ title, eyebrow, description, empty, emptyHref, emptyAction, error, children }: {
  title: string; eyebrow: string; description: string; empty: string; emptyHref: string; emptyAction: string;
  error: string | null; children: ReactNode[];
}) {
  return <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6 dark:border-slate-800 dark:bg-slate-900">
    <div className="border-b border-slate-100 pb-4 dark:border-slate-800">
      <p className="text-xs font-medium text-slate-500 dark:text-slate-400">{eyebrow}</p>
      <h2 className="mt-1 text-lg font-semibold tracking-tight text-slate-950 dark:text-white">{title}</h2>
      <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{description}</p>
    </div>
    {error ? <p className="mt-4 rounded-lg bg-amber-50 px-3 py-2.5 text-sm text-amber-900 dark:bg-amber-950/40 dark:text-amber-100" role="status">{error}</p>
      : children.length ? <ul>{children}</ul>
      : <div className="py-6">
          <p className="text-sm leading-6 text-slate-600 dark:text-slate-400">{empty}</p>
          <Link className="mt-3 inline-flex items-center gap-1.5 text-sm font-medium text-sky-700 hover:underline dark:text-sky-300" href={emptyHref}>{emptyAction} <ArrowRight className="size-4" /></Link>
        </div>}
  </section>;
}

function StatusBadge({ status }: { status: string }) {
  const colors: Record<string, string> = {
    active: "bg-emerald-50 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-200",
    registered: "bg-emerald-50 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-200",
    attended: "bg-sky-50 text-sky-800 dark:bg-sky-950 dark:text-sky-200",
    waitlisted: "bg-amber-50 text-amber-800 dark:bg-amber-950 dark:text-amber-200",
    pending: "bg-amber-50 text-amber-800 dark:bg-amber-950 dark:text-amber-200",
    rejected: "bg-rose-50 text-rose-800 dark:bg-rose-950 dark:text-rose-200",
    no_show: "bg-rose-50 text-rose-800 dark:bg-rose-950 dark:text-rose-200",
    cancelled: "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300",
    inactive: "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300",
  };
  return <span className={["shrink-0 rounded-full px-2.5 py-1 text-xs font-medium capitalize", colors[status] ?? "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300"].join(" ")}>{status.replaceAll("_", " ")}</span>;
}

function relation<T>(value: T | T[] | null) { return Array.isArray(value) ? value[0] ?? null : value; }

function formatDate(value: string, options: Intl.DateTimeFormatOptions = { dateStyle: "medium", timeStyle: "short" }) {
  const date = new Date(value);
  return Number.isNaN(date.valueOf()) ? "Date unavailable" : new Intl.DateTimeFormat("en-IN", options).format(date);
}

function Unavailable({ message }: { message: string }) {
  return <main className="mx-auto max-w-xl px-4 py-24 text-center"><h1 className="text-2xl font-bold">Account unavailable</h1><p className="mt-3 text-sm text-muted">{message}</p><Link className="mt-6 inline-block text-sky-700 underline" href="/auth/sign-in">Sign in</Link></main>;
}
