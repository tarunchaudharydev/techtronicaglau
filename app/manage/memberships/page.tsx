import PendingSubmitButton from "@/components/ui/PendingSubmitButton";
import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import MembershipDecision from "@/components/manage/MembershipDecision";
import BulkInviteForm from "@/components/manage/BulkInviteForm";
import ResultMessage from "@/components/manage/ResultMessage";
import { createClient } from "@/lib/supabase/server";
import { getMyPermissionKeys } from "@/lib/auth/permissions";
import { addSocietyMember } from "./actions";

export const metadata: Metadata = { title: "Membership requests | Techtronica" };
const pageSize = 25;

export default async function ManageMembershipsPage({
  searchParams,
}: {
  searchParams: Promise<{ before?: string; result?: string }>;
}) {
  const params = await searchParams;
  const cursor = parseCursor(params.before);
  const supabase = await createClient();
  if (!supabase) return <Unavailable />;

  let userId = "";
  try {
    const { data, error } = await supabase.auth.getUser();
    if (!error) userId = data.user?.id ?? "";
  } catch {
    return <Unavailable message="We could not verify your session. Please sign in again." />;
  }
  if (!userId) redirect("/auth/sign-in?next=/manage/memberships");

  const { permissionKeys, error: permissionError } = await getMyPermissionKeys(supabase, userId);
  const canReview = permissionKeys.has("members.manage") || permissionKeys.has("admin.manage");
  const canAddSocietyMember = permissionKeys.has("admin.manage");
  if (!canReview && !permissionError) return <NoAccess />;

  let query = supabase
    .from("memberships")
    .select("id, user_id, status, created_at, club_id, profiles(full_name, department, year_of_study), clubs(name, slug)")
    .eq("status", "pending")
    .order("created_at", { ascending: false })
    .order("id", { ascending: false })
    .limit(pageSize + 1);
  if (cursor) {
    query = query.or(`created_at.lt.${cursor.createdAt},and(created_at.eq.${cursor.createdAt},id.lt.${cursor.id})`);
  }

  const { data, error } = await query;
  const requests = data?.slice(0, pageSize) ?? [];
  const hasMore = (data?.length ?? 0) > pageSize;
  const lastRequest = requests.at(-1);
  const nextCursor = hasMore && lastRequest ? `${lastRequest.created_at}|${lastRequest.id}` : null;

  return (
    <main className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
      <Link className="text-sm font-medium text-sky-700 hover:underline" href="/manage">← Management</Link>
      <h1 className="mt-4 text-3xl font-bold">Membership requests</h1>
      <p className="mt-2 max-w-3xl text-sm text-muted">Society membership is assigned by a Society Admin. Club applications are shown in pages of 25; approve or reject only while a request is pending.</p>
      <ResultMessage result={params.result} />
      {canAddSocietyMember && <section id="add-society-member" className="mt-6 scroll-mt-24 rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900 sm:p-6">
        <h2 className="text-lg font-semibold">Add or invite society members</h2>
        <p className="mt-1 text-sm leading-6 text-muted">Add an account that has already verified its email, or invite several people to create accounts. Invitations do not create memberships or grant roles; add new members after they verify and sign up.</p>
        <div className="mt-5 grid gap-4 lg:grid-cols-2">
          <div className="min-w-0 rounded-2xl border border-slate-200 p-4 dark:border-slate-800 sm:p-5">
            <h3 className="font-semibold">Add a verified account</h3>
            <p className="mt-1 text-sm leading-5 text-muted">Creates an active society membership for an existing account.</p>
            <form action={addSocietyMember} className="mt-4 space-y-3">
              <label className="block text-sm font-medium" htmlFor="society-member-email">Account email
                <input id="society-member-email" name="email" type="email" autoComplete="email" required maxLength={254} className="mt-1 block min-h-11 w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-base font-normal text-slate-900 outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-200 dark:border-slate-700 dark:bg-slate-950 dark:text-white sm:text-sm" />
              </label>
              <PendingSubmitButton className="min-h-11 rounded-xl bg-sky-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-sky-700" type="submit">Add society member</PendingSubmitButton>
            </form>
          </div>
          <div className="min-w-0 rounded-2xl border border-sky-100 bg-sky-50/50 p-4 dark:border-sky-900 dark:bg-sky-950/20 sm:p-5">
            <h3 className="font-semibold">Invite multiple people</h3>
            <p className="mt-1 text-sm leading-5 text-muted">Send account setup emails in one batch. Each address is checked separately.</p>
            <BulkInviteForm />
          </div>
        </div>
      </section>}
      <p className="mt-3 max-w-3xl text-sm text-muted">Club managers can review applications only for clubs in their assigned scope. Database policies reject direct attempts to create society memberships without admin permission.</p>
      {permissionError && <p className="mt-6 rounded-xl bg-amber-50 p-4 text-sm text-amber-900">We could not verify your current management permissions. Refresh the page to retry.</p>}
      {error && <p className="mt-6 rounded-xl bg-rose-50 p-4 text-sm text-rose-900">The request list could not be loaded. Refresh the page to retry.</p>}
      {!error && requests.length === 0 && <p className="mt-6 rounded-2xl border border-slate-200 bg-white p-6 text-sm text-muted dark:border-slate-800 dark:bg-slate-900">There are no pending requests in your assigned scope.</p>}

      <div className="mt-6 space-y-3">
        {!error && requests.map((request) => {
          const profile = one(request.profiles);
          const club = one(request.clubs);
          return (
            <article className="grid gap-4 rounded-2xl border border-slate-200 bg-white p-5 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center dark:border-slate-800 dark:bg-slate-900" key={request.id}>
              <div>
                <h2 className="font-semibold">{profile?.full_name || "Member"}</h2>
                <p className="mt-1 text-sm text-muted">{club?.name ?? "Society-wide membership"}{profile?.department ? ` · ${profile.department}` : ""}{profile?.year_of_study ? ` · Year ${profile.year_of_study}` : ""}</p>
                <p className="mt-1 text-xs text-muted">Requested {formatDate(request.created_at)}</p>
              </div>
              <MembershipDecision membershipId={request.id} />
            </article>
          );
        })}
      </div>

      {nextCursor && <Link className="mt-6 inline-flex rounded-xl border border-slate-300 px-4 py-2 text-sm font-semibold hover:border-sky-500" href={`/manage/memberships?before=${encodeURIComponent(nextCursor)}`}>Next 25 requests →</Link>}
    </main>
  );
}

function one<T>(value: T | T[] | null) { return Array.isArray(value) ? value[0] ?? null : value; }
function formatDate(value: string) { const date = new Date(value); return Number.isNaN(date.valueOf()) ? "Date unavailable" : new Intl.DateTimeFormat("en-IN", { dateStyle: "medium", timeStyle: "short" }).format(date); }
function parseCursor(value?: string) {
  if (!value || value.length > 120) return null;
  const [dateValue, id, ...extra] = value.split("|");
  if (extra.length || !id || !/^[0-9a-f-]{36}$/i.test(id)) return null;
  const date = new Date(dateValue);
  return Number.isNaN(date.valueOf()) ? null : { createdAt: date.toISOString(), id };
}
function NoAccess() { return <main className="mx-auto max-w-xl px-4 py-24 text-center"><h1 className="text-2xl font-bold">Access not assigned</h1><p className="mt-3 text-sm text-muted">You do not have the members.manage capability in a society or club scope.</p><Link className="mt-6 inline-block text-sky-700 underline" href="/manage">Return to management</Link></main>; }
function Unavailable({ message = "Connect Supabase to review membership requests." }: { message?: string }) { return <main className="mx-auto max-w-xl px-4 py-24 text-center"><h1 className="text-2xl font-bold">Membership management unavailable</h1><p className="mt-3 text-sm text-muted">{message}</p><Link className="mt-6 inline-block text-sky-700 underline" href="/account">Return to your account</Link></main>; }
