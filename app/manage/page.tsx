import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import {
  ArrowUpRight,
  CalendarDays,
  ContactRound,
  GraduationCap,
  Inbox,
  Layers3,
  Network,
  Settings2,
  ShieldCheck,
  Sparkles,
  TicketCheck,
  UserPlus,
  UsersRound,
  type LucideIcon,
} from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { getMyPermissionKeys } from "@/lib/auth/permissions";

export const metadata: Metadata = { title: "Society management | Techtronica" };

const sections = [
  { title: "Membership requests", href: "/manage/memberships", permission: "members.manage", group: "People & access", description: "Review society and club applications, then welcome new members.", icon: UsersRound, tone: "sky" },
  { title: "Team directory", href: "/manage/team", permission: "team.manage", group: "People & access", description: "Update team, mentor, and faculty profiles and their visibility.", icon: Network, tone: "violet" },
  { title: "Alumni directory", href: "/manage/alumni", permission: "alumni.manage", group: "People & access", description: "Share alumni profiles, achievements, and career journeys.", icon: GraduationCap, tone: "amber" },
  { title: "Roles & access", href: "/manage/access", permission: "admin.manage", group: "People & access", description: "Assign roles and control what each society team can manage.", icon: ShieldCheck, tone: "rose" },
  { title: "Clubs", href: "/manage/clubs", permission: "clubs.manage", group: "Clubs & events", description: "Keep club pages, details, and membership history up to date.", icon: Layers3, tone: "cyan" },
  { title: "Positions", href: "/manage/positions", permission: "positions.manage", group: "Clubs & events", description: "Create and maintain the positions held across the society.", icon: ContactRound, tone: "indigo" },
  { title: "Events", href: "/manage/events", permission: "events.manage", group: "Clubs & events", description: "Publish events and manage their dates, capacity, and visibility.", icon: CalendarDays, tone: "fuchsia" },
  { title: "Registrations", href: "/manage/registrations", permission: "registrations.manage", group: "Clubs & events", description: "Review attendees and record cancellations or attendance.", icon: TicketCheck, tone: "emerald" },
  { title: "Contact inbox", href: "/manage/contacts", permission: "contacts.manage", group: "Website & communication", description: "Read and follow up on messages in your assigned scope.", icon: Inbox, tone: "orange" },
  { title: "Website content", href: "/manage/content", permission: "content.manage", group: "Website & communication", description: "Update homepage sections, FAQs, resources, and site information.", icon: Sparkles, tone: "blue" },
] as const;

const groupStyles = {
  "People & access": { icon: UsersRound, tint: "bg-sky-50 text-sky-700 ring-sky-100", number: "01" },
  "Clubs & events": { icon: CalendarDays, tint: "bg-violet-50 text-violet-700 ring-violet-100", number: "02" },
  "Website & communication": { icon: Sparkles, tint: "bg-amber-50 text-amber-700 ring-amber-100", number: "03" },
} as const;

const toneStyles = {
  sky: "bg-sky-50 text-sky-700 group-hover:bg-sky-600 group-hover:text-white",
  violet: "bg-violet-50 text-violet-700 group-hover:bg-violet-600 group-hover:text-white",
  amber: "bg-amber-50 text-amber-700 group-hover:bg-amber-500 group-hover:text-white",
  rose: "bg-rose-50 text-rose-700 group-hover:bg-rose-600 group-hover:text-white",
  cyan: "bg-cyan-50 text-cyan-700 group-hover:bg-cyan-600 group-hover:text-white",
  indigo: "bg-indigo-50 text-indigo-700 group-hover:bg-indigo-600 group-hover:text-white",
  fuchsia: "bg-fuchsia-50 text-fuchsia-700 group-hover:bg-fuchsia-600 group-hover:text-white",
  emerald: "bg-emerald-50 text-emerald-700 group-hover:bg-emerald-600 group-hover:text-white",
  orange: "bg-orange-50 text-orange-700 group-hover:bg-orange-500 group-hover:text-white",
  blue: "bg-blue-50 text-blue-700 group-hover:bg-blue-600 group-hover:text-white",
} as const;

type GroupName = keyof typeof groupStyles;
type Section = (typeof sections)[number];

export default async function ManageHomePage() {
  const supabase = await createClient();
  if (!supabase) return <Unavailable />;

  let userId = "";
  try {
    const { data, error } = await supabase.auth.getUser();
    if (!error) userId = data.user?.id ?? "";
  } catch {
    return <Unavailable message="We could not verify your session. Refresh or sign in again." />;
  }
  if (!userId) redirect("/auth/sign-in?next=/manage");

  const { permissionKeys, error } = await getMyPermissionKeys(supabase, userId);
  const isAdmin = permissionKeys.has("admin.manage");
  const availableSections = sections.filter(({ permission }) => isAdmin || permissionKeys.has(permission));
  const groups = (Object.keys(groupStyles) as GroupName[]).map((name) => ({
    name,
    sections: availableSections.filter((section) => section.group === name),
  })).filter((group) => group.sections.length > 0);

  const overview = isAdmin && !error ? await Promise.all([
    supabase.from("memberships").select("id", { count: "exact", head: true }).eq("status", "active"),
    supabase.from("clubs").select("id", { count: "exact", head: true }).eq("is_active", true),
    supabase.from("events").select("id", { count: "exact", head: true }).eq("status", "published").gte("starts_at", new Date().toISOString()),
    supabase.from("contact_submissions").select("id", { count: "exact", head: true }).in("status", ["new", "in_progress"]),
  ]) : null;
  const overviewStats = overview ? [
    { label: "Active memberships", count: overview[0].count, error: overview[0].error, href: "/manage/memberships", icon: UsersRound, tint: "bg-sky-50 text-sky-700" },
    { label: "Active clubs", count: overview[1].count, error: overview[1].error, href: "/manage/clubs", icon: Layers3, tint: "bg-violet-50 text-violet-700" },
    { label: "Upcoming events", count: overview[2].count, error: overview[2].error, href: "/manage/events", icon: CalendarDays, tint: "bg-emerald-50 text-emerald-700" },
    { label: "Open enquiries", count: overview[3].count, error: overview[3].error, href: "/manage/contacts", icon: Inbox, tint: "bg-amber-50 text-amber-700" },
  ] : [];
  const overviewHasError = overviewStats.some((stat) => stat.error);
  const adminActions = [
    { title: "Add society member", detail: "Add a verified account to the society.", href: "/manage/memberships#add-society-member", icon: UsersRound, tint: "bg-sky-50 text-sky-700" },
    { title: "Invite a manager", detail: "Invite a person and assign their role.", href: "/manage/access#invite-user", icon: UserPlus, tint: "bg-violet-50 text-violet-700" },
    { title: "Create an event", detail: "Draft and publish a society or club event.", href: "/manage/events#add-event", icon: CalendarDays, tint: "bg-fuchsia-50 text-fuchsia-700" },
    { title: "Add a club", detail: "Create a club page and set its details.", href: "/manage/clubs#add-club", icon: Layers3, tint: "bg-cyan-50 text-cyan-700" },
    { title: "Create a position", detail: "Define a society or club position.", href: "/manage/positions#add-position", icon: ContactRound, tint: "bg-indigo-50 text-indigo-700" },
    { title: "Update website content", detail: "Edit the site pages and resources.", href: "/manage/content#add-content", icon: Sparkles, tint: "bg-amber-50 text-amber-700" },
  ] as const;
  return (
    <main className="min-h-[calc(100vh-5rem)] bg-gradient-to-b from-sky-50/70 via-slate-50 to-white px-4 py-6 sm:px-6 sm:py-10 lg:py-12">
      <div className="mx-auto max-w-7xl">
        <header className="relative isolate overflow-hidden rounded-[2rem] border border-sky-100 bg-gradient-to-br from-white via-sky-50 to-violet-100/80 p-5 shadow-[0_18px_60px_-35px_rgba(14,116,144,0.3)] sm:p-8 lg:p-10">
          <div aria-hidden="true" className="absolute -right-16 -top-24 -z-10 size-72 rounded-full bg-fuchsia-200/35 blur-3xl" />
          <div aria-hidden="true" className="absolute -bottom-28 right-1/3 -z-10 size-64 rounded-full bg-cyan-200/45 blur-3xl" />
          <div className="flex flex-col gap-8 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-3xl">
              <div className="inline-flex items-center gap-2 rounded-full border border-white/90 bg-white/75 px-3 py-1.5 text-xs font-bold uppercase tracking-[0.16em] text-sky-800 shadow-sm">
                <span className="grid size-6 place-items-center rounded-full bg-sky-100"><Settings2 aria-hidden="true" className="size-3.5" /></span>
                Society workspace
              </div>
              <h1 className="mt-5 text-3xl font-bold tracking-tight text-slate-950 sm:text-4xl lg:text-5xl">Manage society</h1>
              <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-600 sm:text-base sm:leading-7">A clear home for your people, clubs, events, and website. Choose an area below to get started.</p>
            </div>

            <div className="grid grid-cols-1 gap-3 min-[380px]:grid-cols-2 sm:max-w-md lg:min-w-[320px]">
              <div className="rounded-2xl border border-white/90 bg-white/80 p-4 shadow-sm backdrop-blur-sm sm:p-5">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Available areas</p>
                <p className="mt-1 text-3xl font-bold tracking-tight text-slate-950">{availableSections.length.toString().padStart(2, "0")}</p>
                <p className="mt-1 text-xs text-slate-500">Based on your access</p>
              </div>
              <div className="rounded-2xl border border-white/90 bg-white/80 p-4 shadow-sm backdrop-blur-sm sm:p-5">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Workspace access</p>
                <p className="mt-2 inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-1 text-sm font-semibold text-emerald-800">
                  <span aria-hidden="true" className="size-1.5 rounded-full bg-emerald-500" />
                  {isAdmin ? "Administrator" : "Scoped manager"}
                </p>
                <p className="mt-2 text-xs leading-5 text-slate-500">Your assigned roles set what you can manage.</p>
              </div>
            </div>
          </div>
          <div className="mt-7 flex items-start gap-2 border-t border-sky-200/70 pt-4 text-xs leading-5 text-slate-500 sm:mt-8 sm:text-sm">
            <ShieldCheck aria-hidden="true" className="mt-0.5 size-4 shrink-0 text-sky-700" />
            <p>Changes are checked against your permissions when you save. You only see management areas assigned to your active society or club roles.</p>
          </div>
        </header>

        {isAdmin && !error && <section aria-labelledby="admin-overview" className="mt-7">
          <div className="mb-3 flex flex-wrap items-end justify-between gap-2">
            <div><p className="text-xs font-bold uppercase tracking-[0.16em] text-sky-700">Administrator overview</p><h2 id="admin-overview" className="mt-1 text-xl font-bold text-slate-950 sm:text-2xl">Society at a glance</h2></div>
            <p className="text-xs text-slate-500">Live totals from records visible to your admin account</p>
          </div>
          {overviewHasError && <p role="status" className="mb-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">Some overview totals are temporarily unavailable. Your management tools are still available.</p>}
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            {overviewStats.map(({ label, count, error: countError, href, icon: Icon, tint }) => <Link key={label} href={href} className="group flex min-h-28 items-center gap-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition hover:-translate-y-0.5 hover:border-sky-200 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500">
              <span className={`grid size-11 shrink-0 place-items-center rounded-xl ${tint}`}><Icon aria-hidden="true" className="size-5" /></span>
              <span className="min-w-0"><span className="block text-2xl font-bold tabular-nums text-slate-950">{countError ? "—" : (count ?? 0).toLocaleString("en-IN")}</span><span className="mt-0.5 block text-sm text-slate-500">{label}</span></span>
              <ArrowUpRight aria-hidden="true" className="ml-auto size-4 shrink-0 text-slate-300 transition group-hover:text-sky-700" />
            </Link>)}
          </div>
          <OverviewChart stats={overviewStats} />
        </section>}

        {isAdmin && !error && <section aria-labelledby="admin-shortcuts" className="mt-8 rounded-3xl border border-sky-100 bg-gradient-to-br from-white via-sky-50/70 to-violet-50/80 p-5 shadow-sm sm:p-7">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
            <div><p className="text-xs font-bold uppercase tracking-[0.16em] text-violet-700">Admin tools</p><h2 id="admin-shortcuts" className="mt-1 text-xl font-bold text-slate-950 sm:text-2xl">Common tasks</h2></div>
            <p className="max-w-xl text-sm leading-6 text-slate-600">Jump straight to common setup and publishing actions. Each page checks your permissions before allowing changes.</p>
          </div>
          <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {adminActions.map(({ title, detail, href, icon: Icon, tint }) => <Link key={href} href={href} className="group flex min-h-20 items-center gap-3 rounded-2xl border border-white bg-white/90 p-4 shadow-sm transition hover:-translate-y-0.5 hover:border-sky-200 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500">
              <span className={`grid size-10 shrink-0 place-items-center rounded-xl ${tint}`}><Icon aria-hidden="true" className="size-5" /></span>
              <span className="min-w-0 flex-1"><span className="block text-sm font-bold text-slate-900">{title}</span><span className="mt-1 block text-xs leading-5 text-slate-500">{detail}</span></span>
              <ArrowUpRight aria-hidden="true" className="size-4 shrink-0 text-slate-300 transition group-hover:text-sky-700" />
            </Link>)}
          </div>
        </section>}

        {error && <div role="alert" className="mt-6 flex items-start gap-3 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-950">
          <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-amber-100"><ShieldCheck aria-hidden="true" className="size-4" /></span>
          <div><p className="font-semibold">Could not load your access</p><p className="mt-1 text-amber-900">Refresh this page to try again. Your permissions have not been changed.</p></div>
        </div>}

        {!error && availableSections.length === 0 && <section className="mt-7 rounded-3xl border border-violet-100 bg-gradient-to-br from-white via-violet-50 to-sky-50 p-6 shadow-sm sm:p-8">
          <div className="grid size-12 place-items-center rounded-2xl bg-violet-100 text-violet-700"><ShieldCheck aria-hidden="true" className="size-6" /></div>
          <h2 className="mt-5 text-xl font-bold text-slate-950">Your workspace is ready</h2>
          <p className="mt-2 max-w-xl text-sm leading-6 text-slate-600">There is no management role assigned to this account yet. You can still update your profile and submit club applications from your account.</p>
          <Link className="mt-5 inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-violet-700 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-violet-800 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:ring-offset-2" href="/account">Open your account <ArrowUpRight aria-hidden="true" className="size-4" /></Link>
        </section>}

        {!error && groups.length > 0 && <div className="mt-8 space-y-9 sm:mt-10 sm:space-y-11">
          {groups.map(({ name, sections: groupSections }) => {
            const style = groupStyles[name];
            const GroupIcon = style.icon;
            return <section key={name} aria-labelledby={`group-${style.number}`}>
              <div className="mb-4 flex items-center gap-3 sm:mb-5">
                <span className={`grid size-11 shrink-0 place-items-center rounded-2xl ring-1 ${style.tint}`}><GroupIcon aria-hidden="true" className="size-5" /></span>
                <div>
                  <p className="text-[11px] font-bold tracking-[0.16em] text-slate-400">{style.number} / WORKSPACE</p>
                  <h2 id={`group-${style.number}`} className="text-lg font-bold tracking-tight text-slate-900 sm:text-xl">{name}</h2>
                </div>
                <span className="ml-auto hidden rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-semibold text-slate-500 sm:inline-flex">{groupSections.length} {groupSections.length === 1 ? "area" : "areas"}</span>
              </div>
              <div className="grid gap-3 sm:grid-cols-2 sm:gap-4 xl:grid-cols-3">
                {groupSections.map((section, index) => <ManagementCard key={section.href} section={section} number={index + 1} />)}
              </div>
            </section>;
          })}
        </div>}
      </div>
    </main>
  );
}


function OverviewChart({ stats }: { stats: Array<{ label: string; count: number | null; error: unknown }> }) {
  const maxCount = Math.max(1, ...stats.map(({ count, error }) => error ? 0 : count ?? 0));
  const barTints: Record<string, string> = {
    "Active memberships": "bg-sky-500",
    "Active clubs": "bg-violet-500",
    "Upcoming events": "bg-emerald-500",
    "Open enquiries": "bg-amber-500",
  };

  return (
    <figure aria-labelledby="overview-chart-title" className="mt-4 min-w-0 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-6">
      <figcaption className="flex flex-wrap items-start justify-between gap-x-4 gap-y-1">
        <div>
          <h3 id="overview-chart-title" className="text-base font-bold text-slate-950">Workspace snapshot</h3>
          <p className="mt-1 text-xs leading-5 text-slate-500">Bar lengths compare the totals shown above.</p>
        </div>
        <span aria-hidden="true" className="mt-0.5 hidden size-2.5 rounded-full bg-sky-500 sm:block" />
      </figcaption>
      <ul className="mt-5 space-y-4">
        {stats.map(({ label, count, error }) => {
          const value = error ? null : count ?? 0;
          const width = value === null || value === 0 ? 0 : Math.max(3, Math.round((value / maxCount) * 100));
          return (
            <li key={label} className="grid min-w-0 grid-cols-[minmax(0,1fr)_auto] items-center gap-x-3 gap-y-2 sm:grid-cols-[9.5rem_minmax(0,1fr)_3rem]">
              <span className="truncate text-sm font-medium text-slate-700">{label}</span>
              <span className="text-right text-sm font-semibold tabular-nums text-slate-900 sm:col-start-3 sm:row-start-1">{value === null ? "—" : value.toLocaleString("en-IN")}</span>
              <div
                role="progressbar"
                aria-label={`${label} compared with the largest overview total`}
                aria-valuemin={0}
                aria-valuemax={maxCount}
                aria-valuenow={value ?? 0}
                className="col-span-2 h-2.5 overflow-hidden rounded-full bg-slate-100 sm:col-span-1 sm:col-start-2 sm:row-start-1"
              >
                <div
                  aria-hidden="true"
                  className={`h-full rounded-full transition-[width] duration-700 motion-reduce:transition-none ${barTints[label] ?? "bg-sky-500"}`}
                  style={{ width: `${width}%` }}
                />
              </div>
            </li>
          );
        })}
      </ul>
    </figure>
  );
}

function ManagementCard({ section, number }: { section: Section; number: number }) {
  const Icon: LucideIcon = section.icon;
  return <Link href={section.href} className="group relative flex min-h-52 flex-col overflow-hidden rounded-3xl border border-slate-200/90 bg-white p-5 shadow-[0_8px_30px_-24px_rgba(15,23,42,0.3)] transition duration-200 hover:-translate-y-1 hover:border-sky-200 hover:shadow-[0_22px_40px_-28px_rgba(14,116,144,0.42)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500 focus-visible:ring-offset-2 sm:p-6">
    <span aria-hidden="true" className="absolute -right-8 -top-10 size-28 rounded-full bg-gradient-to-br from-sky-50 to-violet-50 transition duration-300 group-hover:scale-125" />
    <div className="relative flex items-start justify-between gap-4">
      <span className={`grid size-12 place-items-center rounded-2xl transition duration-200 ${toneStyles[section.tone]}`}><Icon aria-hidden="true" className="size-5" /></span>
      <span className="grid size-9 place-items-center rounded-full border border-slate-200 text-slate-400 transition group-hover:border-sky-200 group-hover:bg-sky-50 group-hover:text-sky-700"><ArrowUpRight aria-hidden="true" className="size-4" /></span>
    </div>
    <div className="relative mt-5 flex-1">
      <div className="flex items-center gap-2">
        <h3 className="text-base font-bold tracking-tight text-slate-900 group-hover:text-sky-800 sm:text-lg">{section.title}</h3>
        <span className="text-[10px] font-bold tabular-nums text-slate-300">{String(number).padStart(2, "0")}</span>
      </div>
      <p className="mt-2 max-w-sm text-sm leading-6 text-slate-500">{section.description}</p>
    </div>
    <span className="relative mt-5 inline-flex min-h-10 items-center text-sm font-semibold text-sky-700">Open workspace <ArrowUpRight aria-hidden="true" className="ml-1.5 size-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" /></span>
  </Link>;
}

function Unavailable({ message = "Connect the Supabase project to use society management." }: { message?: string }) {
  return <main className="min-h-[calc(100vh-5rem)] bg-gradient-to-br from-sky-50 via-white to-violet-50 px-4 py-24 text-center"><div className="mx-auto max-w-xl rounded-3xl border border-sky-100 bg-white/90 p-8 shadow-lg shadow-sky-950/5 sm:p-12"><div className="mx-auto grid size-14 place-items-center rounded-2xl bg-sky-100 text-sky-700"><Settings2 aria-hidden="true" className="size-6" /></div><h1 className="mt-5 text-2xl font-bold text-slate-950">Management unavailable</h1><p className="mt-3 text-sm leading-6 text-slate-600">{message}</p><Link className="mt-6 inline-flex min-h-11 items-center justify-center rounded-xl bg-sky-700 px-4 py-2.5 text-sm font-semibold text-white hover:bg-sky-800" href="/account">Return to your account</Link></div></main>;
}
