import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import type { User } from "@supabase/supabase-js";
import { signOutAction } from "@/app/auth/actions";
import ProfileEditor from "@/components/account/ProfileEditor";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "My account | Techtronica" };

export default async function AccountPage() {
  const supabase = await createClient();
  if (!supabase) {
    return <Unavailable message="Connect the Supabase project to view your member account." />;
  }

  let user: User | null = null;
  try {
    const { data, error } = await supabase.auth.getUser();
    user = error ? null : data.user;
  } catch {
    return <Unavailable message="We could not verify your session. Refresh the page or sign in again." />;
  }
  if (!user) redirect("/auth/sign-in?next=/account");

  const [profileResult, membershipsResult, registrationsResult] = await Promise.all([
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
  ]);

  const profile = profileResult.data ?? {
    full_name: typeof user.user_metadata?.full_name === "string" ? user.user_metadata.full_name : "",
    department: null,
    year_of_study: null,
    avatar_url: null,
  };
  const accountEmail = user.email ?? "Verified account";

  return (
    <main className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
      <header className="mb-8 flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-sky-700">Member portal</p>
          <h1 className="mt-2 text-3xl font-bold tracking-tight">Your Techtronica account</h1>
          <p className="mt-2 text-sm text-muted">{accountEmail}</p>
        </div>
        <div className="flex flex-wrap gap-3">
          <Link className="rounded-xl border border-slate-300 px-4 py-2 text-sm font-semibold hover:border-sky-500" href="/manage">Manage society</Link>
          <form action={signOutAction}>
            <button className="rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-700 dark:bg-slate-700">Sign out</button>
          </form>
        </div>
      </header>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.2fr)]">
        <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <h2 className="mb-5 text-xl font-semibold">Profile</h2>
          <ProfileEditor profile={profile} />
          {profileResult.error && <p className="mt-4 text-sm text-amber-700">Profile details could not be loaded. You can still try saving them.</p>}
        </section>

        <div className="space-y-6">
          <DirectoryPanel title="Club memberships" error={membershipsResult.error?.message} empty="You have not joined a club yet.">
            {membershipsResult.data?.map((membership) => {
              const club = relation(membership.clubs);
              const position = relation(membership.positions);
              return (
                <li className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 py-3 first:border-0 dark:border-slate-800" key={membership.id}>
                  <div>
                    <p className="font-medium">{club?.name ?? "Society membership"}</p>
                    <p className="text-xs text-muted">{position?.name ?? "Member"}</p>
                  </div>
                  <StatusBadge status={membership.status} />
                </li>
              );
            })}
          </DirectoryPanel>

          <DirectoryPanel title="Event registrations" error={registrationsResult.error?.message} empty="Your event registrations will appear here.">
            {registrationsResult.data?.map((registration) => {
              const event = relation(registration.events);
              return (
                <li className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 py-3 first:border-0 dark:border-slate-800" key={registration.id}>
                  <div>
                    {event?.slug ? <Link className="font-medium text-sky-700 hover:underline" href={`/events/${event.slug}`}>{event.title}</Link> : <p className="font-medium">Event registration</p>}
                    <p className="text-xs text-muted">{event?.starts_at ? formatDate(event.starts_at) : formatDate(registration.registered_at)}</p>
                  </div>
                  <StatusBadge status={registration.status} />
                </li>
              );
            })}
          </DirectoryPanel>
        </div>
      </div>
    </main>
  );
}

function DirectoryPanel({
  title,
  empty,
  error,
  children,
}: {
  title: string;
  empty: string;
  error?: string;
  children: React.ReactNode;
}) {
  const hasChildren = Array.isArray(children) ? children.length > 0 : Boolean(children);
  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
      <h2 className="mb-3 text-xl font-semibold">{title}</h2>
      {error ? <p className="text-sm text-amber-700">This list could not be loaded. Refresh the page to retry.</p> : hasChildren ? <ul>{children}</ul> : <p className="text-sm text-muted">{empty}</p>}
    </section>
  );
}

function StatusBadge({ status }: { status: string }) {
  const statusColor: Record<string, string> = {
    active: "bg-emerald-100 text-emerald-800",
    registered: "bg-emerald-100 text-emerald-800",
    attended: "bg-sky-100 text-sky-800",
    waitlisted: "bg-amber-100 text-amber-800",
    pending: "bg-amber-100 text-amber-800",
    rejected: "bg-rose-100 text-rose-800",
    cancelled: "bg-slate-100 text-slate-700",
    inactive: "bg-slate-100 text-slate-700",
    no_show: "bg-rose-100 text-rose-800",
  };
  return <span className={`rounded-full px-3 py-1 text-xs font-semibold ${statusColor[status] ?? "bg-slate-100 text-slate-700"}`}>{status.replaceAll("_", " ")}</span>;
}

function relation<T>(value: T | T[] | null) {
  return Array.isArray(value) ? value[0] ?? null : value;
}

function formatDate(value: string) {
  const date = new Date(value);
  return Number.isNaN(date.valueOf()) ? "Date unavailable" : new Intl.DateTimeFormat("en-IN", { dateStyle: "medium", timeStyle: "short" }).format(date);
}

function Unavailable({ message }: { message: string }) {
  return <main className="mx-auto max-w-xl px-4 py-24 text-center"><h1 className="text-2xl font-bold">Account unavailable</h1><p className="mt-3 text-sm text-muted">{message}</p><Link className="mt-6 inline-block text-sky-700 underline" href="/auth/sign-in">Sign in</Link></main>;
}
