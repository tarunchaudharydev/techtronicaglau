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
    <main className="mx-auto w-full max-w-7xl px-4 py-7 sm:px-6 lg:px-8 lg:py-10">
      <header className="mb-7 flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-[.18em] text-sky-700">
            <span className="size-2 rounded-full bg-sky-500" /> Member portal
          </p>
          <h1 className="mt-2 text-3xl font-extrabold tracking-tight text-slate-950 dark:text-white sm:text-4xl">Your account</h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600 dark:text-slate-400">A clear overview of your profile, society activity, and account security.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 shadow-sm transition hover:border-sky-300 hover:bg-sky-50 hover:text-sky-800 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:hover:bg-slate-800" href="/account/settings">
            <Settings2 className="size-4" /> Profile settings
          </Link>
          {canManageSociety && <Link className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-slate-950 px-4 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-800 dark:bg-sky-600 dark:hover:bg-sky-500" href="/manage">
            <BriefcaseBusiness className="size-4" /> Manage society
          </Link>}
          <form action={signOutAction}>
            <PendingSubmitButton className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-rose-200 bg-rose-50 px-4 text-sm font-semibold text-rose-700 transition hover:bg-rose-100 dark:border-rose-900/70 dark:bg-rose-950/30 dark:text-rose-200">
              <LogOut className="size-4" /> Sign out
            </PendingSubmitButton>
          </form>
        </div>
      </header>

      <section aria-label="Profile summary" className="relative isolate overflow-hidden rounded-[2rem] bg-gradient-to-br from-slate-950 via-blue-950 to-indigo-950 p-5 text-white shadow-xl shadow-sky-950/10 sm:p-8">
        <div aria-hidden="true" className="absolute -right-16 -top-24 -z-10 size-80 rounded-full bg-sky-400/20 blur-3xl" />
        <div aria-hidden="true" className="absolute -bottom-36 left-1/3 -z-10 size-72 rounded-full bg-violet-500/20 blur-3xl" />
        <div className="flex flex-col gap-6 md:flex-row md:items-center">
          {profile.avatar_url ? (
            <Image alt={`${name}'s profile`} className="size-20 shrink-0 rounded-3xl border border-white/20 object-cover shadow-lg sm:size-24" height={96} src={profile.avatar_url} unoptimized width={96} />
          ) : (
            <div aria-label={`${name} initials`} className="grid size-20 shrink-0 place-items-center rounded-3xl bg-gradient-to-br from-sky-400 to-violet-500 text-2xl font-black shadow-lg sm:size-24 sm:text-3xl" role="img">{initials}</div>
          )}
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <span className="rounded-full border border-sky-200/20 bg-sky-300/10 px-3 py-1 text-xs font-semibold text-sky-100">{activeMemberships > 0 ? "Society member" : "Community account"}</span>
              {isVerified ? (
                <span className="inline-flex items-center gap-1 rounded-full border border-emerald-200/20 bg-emerald-300/10 px-3 py-1 text-xs font-semibold text-emerald-100"><BadgeCheck className="size-3.5" /> Email verified</span>
              ) : (
                <span className="inline-flex items-center gap-1 rounded-full border border-amber-200/20 bg-amber-300/10 px-3 py-1 text-xs font-semibold text-amber-100"><Clock3 className="size-3.5" /> Verify your email</span>
              )}
            </div>
            <h2 className="mt-3 break-words text-2xl font-bold tracking-tight sm:text-3xl">{name}</h2>
            <p className="mt-1 break-all text-sm text-slate-300">{user.email ?? "Email unavailable"}</p>
            <p className="mt-3 text-xs text-slate-400">Techtronica account since {formatDate(user.created_at, { dateStyle: "long" })}</p>
          </div>
          <Link href="/account/settings#profile-settings" className="inline-flex min-h-11 shrink-0 items-center justify-center gap-2 self-start rounded-xl border border-white/20 bg-white/10 px-4 text-sm font-semibold text-white backdrop-blur transition hover:bg-white/20 md:self-center">
            Edit profile <ArrowRight className="size-4" />
          </Link>
        </div>

        <div className="mt-7 grid gap-4 border-t border-white/10 pt-5 sm:grid-cols-[1fr_auto] sm:items-center">
          <div>
            <div className="flex items-center justify-between gap-3 text-xs"><span className="font-semibold text-slate-200">Profile details</span><span className="tabular-nums text-slate-300">{profileProgress}% complete</span></div>
            <div className="mt-2 h-2 overflow-hidden rounded-full bg-white/15"><div className="h-full rounded-full bg-gradient-to-r from-sky-300 to-violet-300 transition-[width] duration-700" style={{ width: `${profileProgress}%` }} /></div>
            <p className="mt-2 text-xs text-slate-400">Add a photo, department, and study year to help people recognize your profile.</p>
          </div>
          {profileProgress < 100 && <Link href="/account/settings#profile-settings" className="inline-flex min-h-10 items-center gap-2 text-sm font-semibold text-sky-200 hover:text-white">Complete profile <ArrowRight className="size-4" /></Link>}
        </div>
      </section>

      <section aria-label="Account activity summary" className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard icon={<Users />} label="Active club memberships" value={activeMemberships} detail={membershipsResult.error ? "Could not load memberships" : "Current active clubs"} color="sky" />
        <StatCard icon={<Clock3 />} label="Applications in review" value={pendingMemberships} detail={membershipsResult.error ? "Could not load applications" : "Pending club requests"} color="amber" />
        <StatCard icon={<CalendarDays />} label="Upcoming event registrations" value={upcomingRegistrations.length} detail={registrationsResult.error ? "Could not load registrations" : "Events you are registered for"} color="violet" />
        <StatCard icon={<ShieldCheck />} label="Signed-in devices" value={sessionCount === null ? "—" : sessionCount} detail={sessionsResult.error ? "Session list unavailable" : "Manage devices and sessions"} color="emerald" />
      </section>

      {profileResult.error && <p className="mt-5 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900" role="status">Some profile details could not be loaded. Review your settings and try again.</p>}

      <section className="mt-6 grid gap-5 lg:grid-cols-[1.35fr_.85fr]">
        <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900 sm:p-7">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="text-xs font-bold uppercase tracking-[.16em] text-sky-700">Personal details</p>
              <h2 className="mt-1 text-xl font-bold text-slate-950 dark:text-white">Profile at a glance</h2>
              <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">The details shown to you across the member portal.</p>
            </div>
            <Link href="/account/settings#profile-settings" aria-label="Edit profile details" className="grid size-10 place-items-center rounded-xl border border-slate-200 text-slate-600 transition hover:border-sky-300 hover:bg-sky-50 hover:text-sky-800 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"><Settings2 className="size-4" /></Link>
          </div>
          <dl className="mt-5 grid gap-3 sm:grid-cols-2">
            <ProfileDetail label="Department" value={profile.department || "Add your department"} />
            <ProfileDetail label="Year of study" value={profile.year_of_study ? `Year ${profile.year_of_study}` : "Add your study year"} />
            <ProfileDetail label="Account email" value={user.email ?? "Email unavailable"} />
            <ProfileDetail label="Joined Techtronica" value={formatDate(user.created_at, { dateStyle: "medium" })} />
          </dl>
        </div>

        <section className="rounded-3xl border border-sky-100 bg-gradient-to-br from-white via-sky-50/60 to-violet-50/70 p-5 shadow-sm dark:border-slate-800 dark:from-slate-900 dark:via-slate-900 dark:to-indigo-950/40 sm:p-7">
          <span className="grid size-11 place-items-center rounded-2xl bg-white text-sky-700 shadow-sm dark:bg-slate-800 dark:text-sky-300"><Sparkles className="size-5" /></span>
          <p className="mt-4 text-xs font-bold uppercase tracking-[.16em] text-sky-700">Next up</p>
          {nextEvent ? (
            <>
              <h2 className="mt-1 line-clamp-2 text-xl font-bold text-slate-950 dark:text-white">{nextEvent.title}</h2>
              <p className="mt-2 flex items-center gap-2 text-sm text-slate-600 dark:text-slate-300"><CalendarDays className="size-4 shrink-0" />{formatDate(nextEvent.starts_at)}</p>
              {nextEvent.slug && <Link href={`/events/${nextEvent.slug}`} className="mt-5 inline-flex items-center gap-2 text-sm font-bold text-sky-700 hover:underline dark:text-sky-300">View event <ArrowRight className="size-4" /></Link>}
            </>
          ) : (
            <>
              <h2 className="mt-1 text-xl font-bold text-slate-950 dark:text-white">Find your next event</h2>
              <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-300">Your registered upcoming events will appear here so you can keep them close.</p>
              <Link href="/events" className="mt-5 inline-flex items-center gap-2 text-sm font-bold text-sky-700 hover:underline dark:text-sky-300">Browse events <ArrowRight className="size-4" /></Link>
            </>
          )}
        </section>
      </section>

      <section className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-3" aria-label="Quick links">
        <QuickLink href="/clubs" icon={<Users />} title="Explore clubs" description="Discover the five student communities." />
        <QuickLink href="/events" icon={<CalendarDays />} title="Find an event" description="See upcoming workshops and society events." />
        <QuickLink href="/account/settings#session-settings" icon={<ShieldCheck />} title="Account security" description="Review signed-in devices and password settings." />
      </section>

      <section className="mt-7 rounded-3xl border border-emerald-100 bg-gradient-to-br from-white via-emerald-50/50 to-sky-50/50 p-5 shadow-sm dark:border-slate-800 dark:from-slate-900 dark:via-slate-900 dark:to-emerald-950/20 sm:p-7" aria-label="Signed-in devices">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-3">
            <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-200"><ShieldCheck className="size-5" /></span>
            <div><p className="text-xs font-bold uppercase tracking-[.16em] text-emerald-700">Account security</p><h2 className="mt-1 text-lg font-bold text-slate-950 dark:text-white">Devices signed in to your account</h2><p className="mt-1 text-sm text-slate-600 dark:text-slate-400">Check recent sessions and sign out other devices from settings.</p></div>
          </div>
          <Link className="inline-flex min-h-10 items-center justify-center gap-2 rounded-xl border border-emerald-200 bg-white px-4 text-sm font-semibold text-emerald-800 transition hover:bg-emerald-50 dark:border-emerald-900 dark:bg-slate-900 dark:text-emerald-200 dark:hover:bg-emerald-950/30" href="/account/settings#session-settings">Manage sessions <ArrowRight className="size-4" /></Link>
        </div>
        <AccountSessionsList sessions={sessionsResult.data ?? []} unavailable={Boolean(sessionsResult.error)} compact />
      </section>

      <div className="mt-7 grid gap-5 xl:grid-cols-2">
        <CollectionPanel
          title="Club memberships"
          eyebrow="Your society activity"
          description="See your position and membership status across Techtronica clubs."
          error={membershipsResult.error ? "Memberships could not be loaded. Refresh to try again." : null}
          empty="You have not joined a club yet. Explore the clubs and apply to join a community."
          emptyHref="/clubs"
          emptyAction="Explore clubs"
        >
          {memberships.map((membership) => {
            const club = relation(membership.clubs);
            const position = relation(membership.positions);
            return <li className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 py-4 first:border-0 dark:border-slate-800" key={membership.id}>
              <div className="min-w-0"><p className="font-semibold text-slate-900 dark:text-white">{club?.slug ? <Link className="hover:text-sky-700 hover:underline" href={`/clubs/${club.slug}`}>{club.name}</Link> : club?.name ?? "Society membership"}</p><p className="mt-1 text-sm text-slate-500">{position?.name ?? "Member"}</p></div>
              <StatusBadge status={membership.status} />
            </li>;
          })}
        </CollectionPanel>

        <CollectionPanel
          title="Event registrations"
          eyebrow="Your calendar"
          description="A quick look at your most recent event sign-ups."
          error={registrationsResult.error ? "Event registrations could not be loaded. Refresh to try again." : null}
          empty="Your event registrations will appear here after you sign up."
          emptyHref="/events"
          emptyAction="Browse events"
        >
          {registrations.map((registration) => {
            const event = relation(registration.events);
            return <li className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 py-4 first:border-0 dark:border-slate-800" key={registration.id}>
              <div className="min-w-0"><p className="font-semibold text-slate-900 dark:text-white">{event?.slug ? <Link className="hover:text-sky-700 hover:underline" href={`/events/${event.slug}`}>{event.title}</Link> : event?.title ?? "Event registration"}</p><p className="mt-1 text-sm text-slate-500">{event?.starts_at ? formatDate(event.starts_at) : `Registered ${formatDate(registration.registered_at)}`}</p></div>
              <StatusBadge status={registration.status} />
            </li>;
          })}
        </CollectionPanel>
      </div>
    </main>
  );
}

function ProfileDetail({ label, value }: { label: string; value: string }) {
  return <div className="rounded-2xl border border-slate-100 bg-slate-50/70 p-4 dark:border-slate-800 dark:bg-slate-950/40"><dt className="text-[11px] font-bold uppercase tracking-wide text-slate-500">{label}</dt><dd className="mt-1 break-words text-sm font-semibold text-slate-900 dark:text-slate-100">{value}</dd></div>;
}

function StatCard({ icon, label, value, detail, color }: { icon: ReactNode; label: string; value: number | string; detail: string; color: "sky" | "amber" | "violet" | "emerald" }) {
  const colors = {
    sky: "bg-sky-50 text-sky-700 dark:bg-sky-950/70 dark:text-sky-300",
    amber: "bg-amber-50 text-amber-700 dark:bg-amber-950/50 dark:text-amber-300",
    violet: "bg-violet-50 text-violet-700 dark:bg-violet-950/50 dark:text-violet-300",
    emerald: "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300",
  };
  return <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition duration-200 hover:-translate-y-0.5 hover:shadow-md dark:border-slate-800 dark:bg-slate-900 sm:p-5"><div className="flex items-start justify-between gap-3"><span className={`grid size-10 place-items-center rounded-xl ${colors[color]}`}>{icon}</span><span className="text-2xl font-extrabold tabular-nums text-slate-950 dark:text-white">{value}</span></div><p className="mt-4 text-sm font-semibold text-slate-800 dark:text-slate-100">{label}</p><p className="mt-1 text-xs text-slate-500 dark:text-slate-400">{detail}</p></section>;
}

function QuickLink({ href, icon, title, description }: { href: string; icon: ReactNode; title: string; description: string }) {
  return <Link href={href} className="group flex min-h-24 items-center gap-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition hover:-translate-y-0.5 hover:border-sky-200 hover:shadow-md dark:border-slate-800 dark:bg-slate-900 dark:hover:border-sky-900"><span className="grid size-11 shrink-0 place-items-center rounded-xl bg-sky-50 text-sky-700 transition group-hover:bg-sky-100 dark:bg-sky-950 dark:text-sky-300"><span className="[&_svg]:size-5">{icon}</span></span><span className="min-w-0 flex-1"><span className="block text-sm font-bold text-slate-900 dark:text-white">{title}</span><span className="mt-1 block text-xs leading-5 text-slate-500 dark:text-slate-400">{description}</span></span><ArrowRight className="size-4 shrink-0 text-slate-400 transition group-hover:translate-x-1 group-hover:text-sky-600" /></Link>;
}

function CollectionPanel({ title, eyebrow, description, empty, emptyHref, emptyAction, error, children }: {
  title: string; eyebrow: string; description: string; empty: string; emptyHref: string; emptyAction: string;
  error: string | null; children: ReactNode[];
}) {
  return <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900 sm:p-7"><div className="border-b border-slate-100 pb-4 dark:border-slate-800"><p className="text-[10px] font-bold uppercase tracking-[.16em] text-sky-700">{eyebrow}</p><h2 className="mt-1 text-xl font-bold text-slate-950 dark:text-white">{title}</h2><p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{description}</p></div>{error ? <p className="mt-5 rounded-xl bg-amber-50 p-3 text-sm text-amber-800" role="status">{error}</p> : children.length ? <ul className="mt-1">{children}</ul> : <div className="py-7"><p className="text-sm leading-6 text-slate-500 dark:text-slate-400">{empty}</p><Link className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-sky-700 hover:underline" href={emptyHref}>{emptyAction} <ArrowRight className="size-4" /></Link></div>}</section>;
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
  return <span className={`shrink-0 rounded-full px-3 py-1 text-xs font-semibold capitalize ${colors[status] ?? "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300"}`}>{status.replaceAll("_", " ")}</span>;
}

function relation<T>(value: T | T[] | null) { return Array.isArray(value) ? value[0] ?? null : value; }

function formatDate(value: string, options: Intl.DateTimeFormatOptions = { dateStyle: "medium", timeStyle: "short" }) {
  const date = new Date(value);
  return Number.isNaN(date.valueOf()) ? "Date unavailable" : new Intl.DateTimeFormat("en-IN", options).format(date);
}

function Unavailable({ message }: { message: string }) {
  return <main className="mx-auto max-w-xl px-4 py-24 text-center"><h1 className="text-2xl font-bold">Account unavailable</h1><p className="mt-3 text-sm text-muted">{message}</p><Link className="mt-6 inline-block text-sky-700 underline" href="/auth/sign-in">Sign in</Link></main>;
}
