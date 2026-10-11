import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getMyPermissionKeys } from "@/lib/auth/permissions";

export const metadata: Metadata = { title: "Society management | Techtronica" };

const sections = [
  { title: "Membership requests", href: "/manage/memberships", permission: "members.manage", description: "Review and decide incoming society and club applications." },
  { title: "Contact inbox", href: "/manage/contacts", permission: "contacts.manage", description: "Review and update messages in your society or club scope." },
  { title: "Clubs", href: "/manage/clubs", permission: "clubs.manage", description: "Edit club pages and archive clubs while retaining membership history." },
  { title: "Positions", href: "/manage/positions", permission: "positions.manage", description: "Create, edit, deactivate, or remove position definitions." },
  { title: "Events", href: "/manage/events", permission: "events.manage", description: "Publish events and manage registration windows and capacity." },
  { title: "Event registrations", href: "/manage/registrations", permission: "registrations.manage", description: "Review attendees, cancel registrations, and record attendance." },
  { title: "Team directory", href: "/manage/team", permission: "team.manage", description: "Maintain public team, mentor, and faculty profiles." },
  { title: "Alumni directory", href: "/manage/alumni", permission: "alumni.manage", description: "Maintain public alumni profiles and achievements." },
  { title: "Website content", href: "/manage/content", permission: "content.manage", description: "Manage homepage content, FAQs, resources, research, and other site records." },
  { title: "Roles and access", href: "/manage/access", permission: "admin.manage", description: "Manage role capabilities and user role assignments." },
];

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

  return (
    <main className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-sky-700">Techtronica administration</p>
      <h1 className="mt-2 text-3xl font-bold tracking-tight">Manage society</h1>
      <p className="mt-3 max-w-2xl text-sm leading-6 text-muted">Your account can see the management areas assigned to its active society and club roles. The database checks every operation again when you save.</p>

      {error && <p className="mt-6 rounded-xl bg-amber-50 p-4 text-sm text-amber-900">We could not load your permissions. Refresh the page to retry.</p>}
      {!error && availableSections.length === 0 && (
        <section className="mt-8 rounded-2xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900">
          <h2 className="text-lg font-semibold">No management role assigned</h2>
          <p className="mt-2 text-sm text-muted">You can still update your profile and submit club applications from your account.</p>
          <Link className="mt-4 inline-block font-semibold text-sky-700 hover:underline" href="/account">Open your account →</Link>
        </section>
      )}

      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {availableSections.map((section) => (
          <Link className="group rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition hover:-translate-y-0.5 hover:border-sky-300 hover:shadow-md dark:border-slate-800 dark:bg-slate-900" href={section.href} key={section.href}>
            <h2 className="text-lg font-semibold group-hover:text-sky-700">{section.title}</h2>
            <p className="mt-2 text-sm leading-6 text-muted">{section.description}</p>
            <span className="mt-5 inline-block text-sm font-semibold text-sky-700">Open →</span>
          </Link>
        ))}
      </div>
    </main>
  );
}

function Unavailable({ message = "Connect the Supabase project to use society management." }: { message?: string }) {
  return <main className="mx-auto max-w-xl px-4 py-24 text-center"><h1 className="text-2xl font-bold">Management unavailable</h1><p className="mt-3 text-sm text-muted">{message}</p><Link className="mt-6 inline-block text-sky-700 underline" href="/account">Return to your account</Link></main>;
}
