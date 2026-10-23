import type { Metadata } from "next";
import { Suspense } from "react";
import ManagementAreaDirectory, { type ManagementDirectoryGroup } from "@/components/manage/ManagementAreaDirectory";
import Link from "next/link";
import { redirect } from "next/navigation";
import {
  ArrowUpRight,
  BellRing,
  CalendarDays,
  ClipboardCheck,
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
} from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { getCurrentAppUser } from "@/lib/auth/current-user";
import { getMyPermissionKeys } from "@/lib/auth/permissions";
import AdminDataTable, { type AdminDataColumn, type AdminDataRow } from "@/components/manage/AdminDataTable";
import { AdminOverviewDonut } from "@/components/manage/AdminOverviewDonut";
import { AdminDashboardRefresh } from "@/components/manage/AdminDashboardRefresh";

export const metadata: Metadata = { title: "Society management | Techtronica" };

const sections = [
  {
    title: "Membership requests",
    href: "/manage/memberships",
    permission: "members.manage",
    group: "People & access",
    description:
      "Review society and club applications, then welcome new members.",
    icon: UsersRound,
  },
  {
    title: "Team directory",
    href: "/manage/team",
    permission: "team.manage",
    group: "People & access",
    description:
      "Update team, mentor, and faculty profiles and their visibility.",
    icon: Network,
  },
  {
    title: "Alumni directory",
    href: "/manage/alumni",
    permission: "alumni.manage",
    group: "People & access",
    description: "Share alumni profiles, achievements, and career journeys.",
    icon: GraduationCap,
    tone: "amber",
  },
  {
    title: "Roles & access",
    href: "/manage/access",
    permission: "admin.manage",
    group: "People & access",
    description: "Assign roles and control what each society team can manage.",
    icon: ShieldCheck,
    tone: "rose",
  },
  {
    title: "Users & sessions",
    href: "/manage/users",
    permission: "admin.manage",
    group: "People & access",
    description: "Invite accounts, review sign-ins, and manage account access.",
    icon: UserPlus,
    tone: "blue",
  },
  {
    title: "Clubs",
    href: "/manage/clubs",
    permission: "clubs.manage",
    group: "Clubs & events",
    description: "Keep club pages, details, and membership history up to date.",
    icon: Layers3,
    tone: "cyan",
  },
  {
    title: "Positions",
    href: "/manage/positions",
    permission: "positions.manage",
    group: "Clubs & events",
    description: "Create and maintain the positions held across the society.",
    icon: ContactRound,
    tone: "indigo",
  },
  {
    title: "Events",
    href: "/manage/events",
    permission: "events.manage",
    group: "Clubs & events",
    description:
      "Publish events and manage their dates, capacity, and visibility.",
    icon: CalendarDays,
    tone: "fuchsia",
  },
  {
    title: "Meeting attendance",
    href: "/manage/attendance",
    permission: "attendance.manage",
    group: "Clubs & events",
    description:
      "Create meeting sheets, mark active members present, absent, or excused, and export attendance.",
    icon: ClipboardCheck,
  },
  {
    title: "Registrations",
    href: "/manage/registrations",
    permission: "registrations.manage",
    group: "Clubs & events",
    description: "Review attendees and record cancellations or attendance.",
    icon: TicketCheck,
  },
  {
    title: "Contact inbox",
    href: "/manage/contacts",
    permission: "contacts.manage",
    group: "Website & communication",
    description: "Read and follow up on messages in your assigned scope.",
    icon: Inbox,
    tone: "orange",
  },
  {
    title: "Website content",
    href: "/manage/content",
    permission: "content.manage",
    group: "Website & communication",
    description:
      "Update homepage sections, FAQs, resources, and site information.",
    icon: Sparkles,
    tone: "blue",
  },
  {
    title: "Notifications & updates",
    href: "/manage/notifications",
    permission: "content.manage",
    group: "Website & communication",
    description:
      "Publish deployment notes, version releases, and society updates.",
    icon: BellRing,
    tone: "orange",
  },
] as const;

const groupStyles = {
  "People & access": {
    icon: UsersRound,
    tint: "bg-sky-50 text-sky-700 ring-sky-100",
    number: "01",
    description:
      "Applications, member profiles, alumni, and the permissions behind them.",
  },
  "Clubs & events": {
    icon: CalendarDays,
    tint: "bg-sky-50 text-sky-700 ring-sky-100",
    number: "02",
    description:
      "Build the club structure, run events, and keep meeting records.",
  },
  "Website & communication": {
    icon: Sparkles,
    tint: "bg-amber-50 text-amber-700 ring-amber-100",
    number: "03",
    description:
      "Handle public enquiries and keep the society website current.",
  },
} as const;

type GroupName = keyof typeof groupStyles;

export default async function ManageHomePage() {
  const supabase = await createClient();
  if (!supabase) return <Unavailable />;

  const appUser = await getCurrentAppUser();
  const userId = appUser?.id ?? "";
  if (!userId) redirect("/auth/sign-in?next=/manage");

  const { permissionKeys, error } = await getMyPermissionKeys(supabase, userId);
  const isAdmin = permissionKeys.has("admin.manage");
  const availableSections = sections.filter(
    ({ permission }) => isAdmin || permissionKeys.has(permission),
  );
  const groups = (Object.keys(groupStyles) as GroupName[])
    .map((name) => ({
      name,
      sections: availableSections.filter((section) => section.group === name),
    }))
    .filter((group) => group.sections.length > 0);

  const directoryGroups: ManagementDirectoryGroup[] = groups.map(({ name, sections: groupSections }) => ({
    name,
    number: groupStyles[name].number,
    description: groupStyles[name].description,
    sections: groupSections.map(({ title, href, description }) => ({ title, href, description })),
  }));

  const adminActions = [
    {
      title: "Add society member",
      detail: "Add a verified account to the society.",
      href: "/manage/memberships#add-society-member",
      icon: UsersRound,
      tint: "bg-sky-50 text-sky-700",
    },
    {
      title: "Invite a manager",
      detail: "Invite a person and assign their role.",
      href: "/manage/access#invite-user",
      icon: UserPlus,
      tint: "bg-slate-100 text-slate-700",
    },
    {
      title: "Create an event",
      detail: "Draft and publish a society or club event.",
      href: "/manage/events#add-event",
      icon: CalendarDays,
      tint: "bg-cyan-50 text-cyan-800",
    },
    {
      title: "Take meeting attendance",
      detail: "Start a meeting sheet and record member presence.",
      href: "/manage/attendance#create-meeting",
      icon: ClipboardCheck,
      tint: "bg-emerald-50 text-emerald-700",
    },
    {
      title: "Add a club",
      detail: "Create a club page and set its details.",
      href: "/manage/clubs#add-club",
      icon: Layers3,
      tint: "bg-cyan-50 text-cyan-700",
    },
    {
      title: "Create a position",
      detail: "Define a society or club position.",
      href: "/manage/positions#add-position",
      icon: ContactRound,
      tint: "bg-blue-50 text-blue-700",
    },
    {
      title: "Update website content",
      detail: "Edit the site pages and resources.",
      href: "/manage/content#add-content",
      icon: Sparkles,
      tint: "bg-amber-50 text-amber-700",
    },
  ] as const;
  return (
    <main className="min-h-[calc(100vh-5rem)] bg-[#f8f9fa] px-4 py-5 sm:px-6 sm:py-7">
      <div className="mx-auto max-w-[1440px]">
        <header className="border-b border-slate-200 bg-white px-4 py-4 sm:px-5 sm:py-5">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.16em] text-sky-700">Society workspace</p>
              <h1 className="mt-1 text-2xl font-semibold tracking-tight text-slate-950 sm:text-3xl">
                Manage society
              </h1>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">
                Review work that needs attention, check society activity, and open the tools assigned to your role.
              </p>
            </div>
            <div className="flex flex-wrap gap-2 sm:justify-end">
              <span className="inline-flex min-h-10 items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm font-semibold text-slate-700">
                <ShieldCheck aria-hidden="true" className="size-4 text-emerald-700" />
                {isAdmin ? "Administrator" : "Scoped manager"}
              </span>
              <span className="inline-flex min-h-10 items-center rounded-xl border border-slate-200 bg-white px-3 text-sm font-medium text-slate-600">
                {availableSections.length} areas available
              </span>
            </div>
          </div>
          <div className="mt-4 flex items-start gap-2 border-t border-slate-100 pt-3 text-xs leading-5 text-slate-500 sm:text-sm">
            <ShieldCheck aria-hidden="true" className="mt-0.5 size-4 shrink-0 text-sky-700" />
            <p>
              Changes are checked against your permissions when you save. You only see areas assigned to your active society or club roles.
            </p>
          </div>
        </header>

        {!error && groups.length > 0 && (
          <>
            {isAdmin && (
              <section aria-labelledby="admin-shortcuts" className="mt-4 rounded-2xl border border-slate-200 bg-white p-4 sm:p-5">
                <div className="flex flex-wrap items-end justify-between gap-2">
                  <div><p className="text-xs font-bold uppercase tracking-[0.14em] text-sky-700">Admin tools</p><h2 id="admin-shortcuts" className="mt-1 text-lg font-bold text-slate-950 sm:text-xl">Common tasks</h2></div>
                  <p className="text-xs text-slate-500 sm:text-sm">Shortcuts for frequent society work</p>
                </div>
                <div className="mt-3 grid grid-cols-2 gap-2 lg:grid-cols-4">
                  {adminActions.slice(0, 4).map(({ title, detail, href, icon: Icon, tint }) => (
                    <Link key={href} href={href} className="flex min-h-[4.5rem] min-w-0 items-center gap-2.5 rounded-xl border border-slate-200 bg-white p-3 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500">
                      <span className={"grid size-9 shrink-0 place-items-center rounded-lg " + tint}><Icon aria-hidden="true" className="size-[18px]" /></span>
                      <span className="min-w-0"><span className="block text-xs font-semibold leading-4 text-slate-900 sm:text-sm">{title}</span><span className="mt-1 hidden text-xs leading-4 text-slate-500 sm:block">{detail}</span></span>
                    </Link>
                  ))}
                </div>
              </section>
            )}
            <ManagementAreaDirectory groups={directoryGroups} />
          </>
        )}

        {isAdmin && !error && (
          <Suspense fallback={<AdminInsightsSkeleton />}>
            <AdminInsights supabase={supabase} />
          </Suspense>
        )}


        {error && (
          <div
            role="alert"
            className="mt-6 flex items-start gap-3 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-950"
          >
            <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-amber-100">
              <ShieldCheck aria-hidden="true" className="size-4" />
            </span>
            <div>
              <p className="font-semibold">Could not load your access</p>
              <p className="mt-1 text-amber-900">
                Refresh this page to try again. Your permissions have not been
                changed.
              </p>
            </div>
          </div>
        )}

        {!error && availableSections.length === 0 && (
          <section className="mt-7 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
            <div className="grid size-12 place-items-center rounded-2xl bg-sky-50 text-sky-700">
              <ShieldCheck aria-hidden="true" className="size-6" />
            </div>
            <h2 className="mt-5 text-xl font-bold text-slate-950">
              Your workspace is ready
            </h2>
            <p className="mt-2 max-w-xl text-sm leading-6 text-slate-600">
              There is no management role assigned to this account yet. You can
              still update your profile and submit club applications from your
              account.
            </p>
            <Link
              className="mt-5 inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-sky-700 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-sky-800 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:ring-offset-2"
              href="/account"
            >
              Open your account{" "}
              <ArrowUpRight aria-hidden="true" className="size-4" />
            </Link>
          </section>
        )}


      </div>
    </main>
  );
}

async function AdminInsights({ supabase }: { supabase: NonNullable<Awaited<ReturnType<typeof createClient>>> }) {
  const overviewPromise = Promise.all([
          supabase
            .from("memberships")
            .select("id", { count: "exact", head: true })
            .eq("status", "pending"),
          supabase
            .from("memberships")
            .select("id", { count: "exact", head: true })
            .in("status", ["active", "inactive", "rejected"]),
          supabase
            .from("contact_submissions")
            .select("id", { count: "exact", head: true })
            .eq("status", "new"),
          supabase
            .from("contact_submissions")
            .select("id", { count: "exact", head: true })
            .eq("status", "in_progress"),
          supabase
            .from("contact_submissions")
            .select("id", { count: "exact", head: true })
            .eq("status", "resolved"),
          supabase
            .from("contact_submissions")
            .select("id", { count: "exact", head: true })
            .eq("status", "spam"),
          supabase
            .from("event_registrations")
            .select("id", { count: "exact", head: true })
            .in("status", ["registered", "waitlisted"]),
          supabase
            .from("event_registrations")
            .select("id", { count: "exact", head: true })
            .in("status", ["cancelled", "attended", "no_show"]),
          supabase
            .from("profiles")
            .select("id", { count: "exact", head: true }),
          supabase
            .from("memberships")
            .select("user_id", { count: "exact", head: true })
            .is("club_id", null)
            .eq("status", "active"),
  ]);
  const activityPromise = Promise.all([
          supabase
            .from("memberships")
            .select("id, created_at, profiles(full_name), clubs(name)")
            .eq("status", "pending")
            .order("created_at", { ascending: false })
            .limit(10),
          supabase
            .from("contact_submissions")
            .select("id, name, topic, created_at, clubs(name)")
            .eq("status", "new")
            .order("created_at", { ascending: false })
            .limit(10),
          supabase
            .from("event_registrations")
            .select(
              "id, status, registered_at, events!event_registrations_event_id_fkey!inner(title), profiles!event_registrations_user_id_fkey!inner(full_name)",
            )
            .order("registered_at", { ascending: false })
            .limit(10),
  ]);
  const [overview, activity] = await Promise.all([overviewPromise, activityPromise]);

  const overviewStats = overview
    ? [
        {
          label: "Membership applications pending",
          count: overview[0].count,
          error: overview[0].error,
        },
        {
          label: "Membership applications reviewed",
          count: overview[1].count,
          error: overview[1].error,
        },
        {
          label: "New enquiries",
          count: overview[2].count,
          error: overview[2].error,
        },
        {
          label: "Enquiries in progress",
          count: overview[3].count,
          error: overview[3].error,
        },
        {
          label: "Resolved enquiries",
          count: overview[4].count,
          error: overview[4].error,
        },
        {
          label: "Spam enquiries",
          count: overview[5].count,
          error: overview[5].error,
        },
        {
          label: "Active registrations",
          count: overview[6].count,
          error: overview[6].error,
        },
        {
          label: "Closed registrations",
          count: overview[7].count,
          error: overview[7].error,
        },
      ]
    : [];
  const memberTotals = overview
    ? {
        accounts: overview[8].count,
        members: overview[9].count,
        error: Boolean(overview[8].error || overview[9].error),
      }
    : null;
  const nonMembers =
    memberTotals &&
    !memberTotals.error &&
    memberTotals.accounts !== null &&
    memberTotals.members !== null
      ? Math.max(0, memberTotals.accounts - memberTotals.members)
      : null;
  const overviewHasError =
    overviewStats.some((stat) => stat.error) || Boolean(memberTotals?.error);
  const needsAttentionCount =
    overview && !overview[0].error && !overview[2].error
      ? Math.max(0, overview[0].count ?? 0) + Math.max(0, overview[2].count ?? 0)
      : null;
  const activityItems = activity
    ? [
        ...(activity[0].data ?? []).map((row) => ({
          id: `membership-${row.id}`,
          title: one(row.profiles)?.full_name || "Someone",
          detail: `Applied to ${one(row.clubs)?.name || "the society"}`,
          date: row.created_at,
          href: "/manage/memberships",
          type: "Membership application",
          status: "Needs review",
        })),
        ...(activity[1].data ?? []).map((row) => ({
          id: `contact-${row.id}`,
          title: row.name || "New enquiry",
          detail:
            row.topic ||
            `Contact form · ${one(row.clubs)?.name || "Society-wide"}`,
          date: row.created_at,
          href: "/manage/contacts",
          type: "Contact form",
          status: "Needs reply",
        })),
        ...(activity[2].data ?? []).map((row) => ({
          id: `registration-${row.id}`,
          title: one(row.profiles)?.full_name || "Member",
          detail: `Registration ${row.status.replaceAll("_", " ")} · ${one(row.events)?.title || "an event"}`,
          date: row.registered_at,
          href: "/manage/registrations",
          type: "Event registration",
          status: row.status.replaceAll("_", " "),
        })),
      ]
        .sort((a, b) => new Date(b.date).valueOf() - new Date(a.date).valueOf())
        .slice(0, 30)
    : [];
  const activityHasError = activity?.some((result) => result.error) ?? false;
  const activityColumns: AdminDataColumn[] = [
    { key: "person", label: "Person", sortable: false },
    { key: "activity", label: "Activity", sortable: false },
    { key: "status", label: "Status" },
    { key: "date", label: "Received" },
  ];
  const activityRows: AdminDataRow[] = activityItems.map((item) => ({
    id: item.id,
    searchText: [item.title, item.detail, item.type, item.status, item.date].join(" "),
    values: {
      person: item.title,
      activity: item.detail,
      status: item.status,
      date: item.date,
    },
    cells: {
      person: <span className="font-semibold text-slate-900">{item.title}</span>,
      activity: <span className="text-slate-600">{item.detail}</span>,
      status: (
        <span className="inline-flex rounded-full bg-sky-50 px-2.5 py-1 text-xs font-semibold capitalize text-sky-800">
          {item.status}
        </span>
      ),
      date: (
        <time className="whitespace-nowrap text-xs text-slate-500" dateTime={item.date}>
          {formatActivityDate(item.date)}
        </time>
      ),
    },
    card: (
      <article className="rounded-xl border border-slate-200 bg-white p-4">
        <div className="flex flex-wrap items-start justify-between gap-2">
          <div className="min-w-0">
            <h3 className="truncate text-sm font-semibold text-slate-900">{item.title}</h3>
            <p className="mt-1 text-xs text-slate-500">{item.detail}</p>
          </div>
          <span className="rounded-full bg-sky-50 px-2.5 py-1 text-xs font-semibold capitalize text-sky-800">{item.status}</span>
        </div>
        <div className="mt-3 flex items-center justify-between gap-3 border-t border-slate-100 pt-3">
          <span className="text-xs text-slate-500">{item.type} · {formatActivityDate(item.date)}</span>
          <Link href={item.href} className="shrink-0 text-xs font-semibold text-sky-700 hover:underline">Open</Link>
        </div>
      </article>
    ),
    actions: (
      <Link href={item.href} className="text-xs font-semibold text-sky-700 hover:underline">
        Open
      </Link>
    ),
  }));
  return (
          <section aria-labelledby="admin-overview" className="mt-5">
            <div className="mb-3 flex flex-wrap items-end justify-between gap-2">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.16em] text-sky-700">
                  Administrator overview
                </p>
                <h2
                  id="admin-overview"
                  className="mt-1 text-xl font-bold text-slate-950 sm:text-2xl"
                >
                  Society activity at a glance
                </h2>
              </div>
              <p className="text-xs text-slate-500">
                Live totals from records available to your admin account
              </p>
            </div>
            {overviewHasError && (
              <p
                role="status"
                className="mb-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900"
              >
                Some status totals are temporarily unavailable. Your management
                tools are still available.
              </p>
            )}
            <div className="mb-5 grid gap-3 min-[480px]:grid-cols-3">
              <MemberTotalCard
                label="Registered accounts"
                count={
                  memberTotals?.error ? null : (memberTotals?.accounts ?? null)
                }
                detail="Accounts with a Techtronica profile"
              />
              <MemberTotalCard
                label="Active society members"
                count={
                  memberTotals?.error ? null : (memberTotals?.members ?? null)
                }
                detail="Current society-wide memberships"
              />
              <MemberTotalCard
                label="Not society members"
                count={nonMembers}
                detail="Registered accounts without active society membership"
              />
            </div>
            <AdminOverviewDonut
              workflows={[
                {
                  label: "Membership requests",
                  stats: overviewStats.slice(0, 2).map(({ label, count, error: statError }) => ({ label, count, unavailable: Boolean(statError) })),
                },
                {
                  label: "Contact enquiries",
                  stats: overviewStats.slice(2, 6).map(({ label, count, error: statError }) => ({ label, count, unavailable: Boolean(statError) })),
                },
                {
                  label: "Event registrations",
                  stats: overviewStats.slice(6, 8).map(({ label, count, error: statError }) => ({ label, count, unavailable: Boolean(statError) })),
                },
              ]}
            />
            <section
              aria-labelledby="incoming-activity"
              className="mt-5 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5"
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <h3
                    id="incoming-activity"
                    className="text-base font-bold text-slate-950 sm:text-lg"
                  >
                    Latest activity
                  </h3>
                  <p className="mt-1 text-xs leading-5 text-slate-500">
                    Search, sort, switch views, and export recent membership applications, enquiries, and registrations.
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="inline-flex min-h-10 items-center rounded-xl bg-amber-50 px-3 text-xs font-semibold text-amber-900 ring-1 ring-amber-200">
                    {needsAttentionCount === null ? "— need review" : `${needsAttentionCount.toLocaleString("en-IN")} need review`}
                  </span>
                  <AdminDashboardRefresh />
                </div>
              </div>
              {activityHasError && (
                <p
                  role="status"
                  className="mt-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900"
                >
                  Some activity could not be loaded. Refresh to try again.
                </p>
              )}
              <AdminDataTable
                id="manage-dashboard-activity"
                columns={activityColumns}
                rows={activityRows}
                pageSizes={[5, 10, 25]}
                emptyMessage={activityHasError ? "Activity is temporarily unavailable. Refresh to try again." : "No new membership applications, enquiries, or registrations in the latest activity."}
              />
            </section>
          </section>
  );
}

function AdminInsightsSkeleton() {
  return (
    <section aria-label="Loading society activity" className="mt-5 animate-pulse rounded-2xl border border-slate-200 bg-white p-4 sm:p-5">
      <div className="h-5 w-48 rounded bg-slate-200" />
      <div className="mt-3 grid gap-3 min-[480px]:grid-cols-3"><div className="h-24 rounded-xl bg-slate-100" /><div className="h-24 rounded-xl bg-slate-100" /><div className="h-24 rounded-xl bg-slate-100" /></div>
      <div className="mt-3 h-48 rounded-xl bg-slate-100" />
    </section>
  );
}

function Unavailable({
  message = "Connect the Supabase project to use society management.",
}: {
  message?: string;
}) {
  return (
    <main className="min-h-[calc(100vh-5rem)] bg-gradient-to-br from-sky-50 via-white to-slate-50 px-4 py-24 text-center">
      <div className="mx-auto max-w-xl rounded-3xl border border-sky-100 bg-white/90 p-8 shadow-lg shadow-sky-950/5 sm:p-12">
        <div className="mx-auto grid size-14 place-items-center rounded-2xl bg-sky-100 text-sky-700">
          <Settings2 aria-hidden="true" className="size-6" />
        </div>
        <h1 className="mt-5 text-2xl font-bold text-slate-950">
          Management unavailable
        </h1>
        <p className="mt-3 text-sm leading-6 text-slate-600">{message}</p>
        <Link
          className="mt-6 inline-flex min-h-11 items-center justify-center rounded-xl bg-sky-700 px-4 py-2.5 text-sm font-semibold text-white hover:bg-sky-800"
          href="/account"
        >
          Return to your account
        </Link>
      </div>
    </main>
  );
}

function one<T>(value: T | T[] | null | undefined): T | null {
  return Array.isArray(value) ? (value[0] ?? null) : (value ?? null);
}

function formatActivityDate(value: string) {
  const date = new Date(value);
  return Number.isNaN(date.valueOf())
    ? "Date unavailable"
    : new Intl.DateTimeFormat("en-IN", {
        dateStyle: "medium",
        timeStyle: "short",
        timeZone: "Asia/Kolkata",
      }).format(date);
}

function MemberTotalCard({ label, count, detail }: {
  label: string;
  count: number | null;
  detail: string;
}) {
  return (
    <article className="min-w-0 rounded-xl border border-slate-200 bg-white p-4">
      <p className="text-sm font-medium text-slate-600">{label}</p>
      <p className="mt-2 text-2xl font-semibold tabular-nums text-slate-950">
        {count === null ? "—" : count.toLocaleString("en-IN")}
      </p>
      <p className="mt-1 text-xs leading-5 text-slate-600">{detail}</p>
    </article>
  );
}
