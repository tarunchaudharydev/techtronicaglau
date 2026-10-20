import type { Metadata } from "next";
import Link from "next/link";
import { clerkClient } from "@clerk/nextjs/server";
import type { Invitation, User } from "@clerk/backend";
import { changeUserStatus, inviteUsers } from "./actions";
import { requireManager } from "@/lib/manage/server";

export const metadata: Metadata = { title: "User management | Techtronica" };
type SearchParams = Promise<{ q?: string; page?: string; result?: string; sent?: string }>;
const pageSize = 25;

export default async function ManageUsersPage({ searchParams }: { searchParams: SearchParams }) {
  const params = await searchParams;
  await requireManager("admin.manage");
  const query = (params.q ?? "").trim().slice(0, 100);
  const page = Math.max(1, Math.min(10000, Number.parseInt(params.page ?? "1", 10) || 1));

  let users: User[] = [];
  let invitations: Invitation[] = [];
  let totalUsers = 0;
  let serviceUnavailable = false;
  try {
    const client = await clerkClient();
    const [userResponse, invitationResponse] = await Promise.all([
      client.users.getUserList({ limit: pageSize, offset: (page - 1) * pageSize, orderBy: "-created_at", ...(query ? { query } : {}) }),
      client.invitations.getInvitationList({ limit: 8, offset: 0, orderBy: "-created_at" }),
    ]);
    users = userResponse.data;
    totalUsers = userResponse.totalCount;
    invitations = invitationResponse.data;
  } catch {
    serviceUnavailable = true;
  }

  const start = totalUsers ? (page - 1) * pageSize + 1 : 0;
  const end = Math.min(page * pageSize, totalUsers);
  const resultMessage = params.result === "invited"
    ? `${Math.min(50, Number.parseInt(params.sent ?? "1", 10) || 1)} invitation${params.sent === "1" ? "" : "s"} sent from Clerk.`
    : params.result === "saved" ? "Account status updated in Clerk."
      : params.result === "invalid" ? "Review the email list or account selection and try again."
        : params.result === "self_action" ? "You cannot suspend your own administrator account here."
          : params.result === "suspended_partial" ? "The account is suspended, but Clerk could not revoke every existing session. Open the account details and sign out remaining devices."
          : params.result === "error" ? "Clerk could not complete the request. Refresh and try again."
            : null;

  return (
    <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:py-12">
      <Link className="text-sm font-medium text-sky-700 hover:underline" href="/manage">← Back to management</Link>
      <header className="mt-5 max-w-3xl">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-sky-700">Clerk identity workspace</p>
        <h1 className="mt-2 text-3xl font-bold tracking-tight sm:text-4xl">Users and invitations</h1>
        <p className="mt-3 text-sm leading-6 text-muted sm:text-base">Search accounts, invite up to 50 people, review active sessions, and suspend accounts. Assign society and club roles separately in Roles &amp; access.</p>
      </header>

      {resultMessage && <p role="status" className={`mt-5 rounded-xl p-4 text-sm ${params.result === "saved" || params.result === "invited" ? "bg-emerald-50 text-emerald-900" : "bg-amber-50 text-amber-950"}`}>{resultMessage}</p>}
      {serviceUnavailable && <p role="alert" className="mt-5 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-950">Clerk user data is unavailable. Check the Clerk server key and retry.</p>}

      <div className="mt-7 grid items-start gap-6 xl:grid-cols-[minmax(0,1.55fr)_minmax(19rem,0.8fr)]">
        <section aria-labelledby="user-directory-title" className="min-w-0 rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-7">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <h2 id="user-directory-title" className="text-xl font-semibold">User directory</h2>
              <p className="mt-1 text-sm text-muted">{totalUsers ? `Showing ${start}–${end} of ${totalUsers} accounts` : "Accounts are managed by Clerk."}</p>
            </div>
            <form action="/manage/users" className="flex w-full gap-2 sm:w-auto" method="get">
              <label className="sr-only" htmlFor="user-query">Search accounts</label>
              <input className={inputClass} defaultValue={query} id="user-query" maxLength={100} name="q" placeholder="Name, email, or Clerk ID" />
              <button className={secondaryButtonClass} type="submit">Search</button>
            </form>
          </div>
          <div className="mt-5 overflow-x-auto rounded-2xl border border-slate-200">
            <table className="w-full min-w-[760px] border-collapse text-left text-sm">
              <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500"><tr>
                <th className="px-4 py-3 font-semibold">Account</th><th className="px-4 py-3 font-semibold">Status</th><th className="px-4 py-3 font-semibold">Joined</th><th className="px-4 py-3 text-right font-semibold">Actions</th>
              </tr></thead>
              <tbody className="divide-y divide-slate-100">
                {users.map((user) => {
                  const email = user.emailAddresses.find((item) => item.id === user.primaryEmailAddressId)?.emailAddress ?? user.emailAddresses[0]?.emailAddress ?? "No email";
                  const name = user.fullName?.trim() || user.username || email;
                  return <tr key={user.id}>
                    <td className="px-4 py-3">
                      <p className="max-w-sm truncate font-semibold" title={name}>{name}</p>
                      <p className="mt-1 max-w-sm truncate text-xs text-muted" title={email}>{email}</p>
                      <p className="mt-1 font-mono text-[10px] text-slate-400">{user.id}</p>
                    </td>
                    <td className="px-4 py-3"><span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${user.banned ? "bg-rose-100 text-rose-800" : "bg-emerald-100 text-emerald-800"}`}>{user.banned ? "Suspended" : "Active"}</span></td>
                    <td className="whitespace-nowrap px-4 py-3 text-muted">{formatDate(user.createdAt)}</td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex justify-end gap-3 whitespace-nowrap">
                        <Link className="font-semibold text-sky-700 hover:underline" href={`/manage/users/${user.id}`}>Details</Link>
                        <form action={changeUserStatus}>
                          <input name="user_id" type="hidden" value={user.id} />
                          <input name="action" type="hidden" value={user.banned ? "unban" : "ban"} />
                          <button className={user.banned ? "font-semibold text-emerald-700 hover:underline" : "font-semibold text-rose-700 hover:underline"} type="submit">{user.banned ? "Restore" : "Suspend"}</button>
                        </form>
                      </div>
                    </td>
                  </tr>;
                })}
                {!users.length && !serviceUnavailable && <tr><td className="px-4 py-10 text-center text-muted" colSpan={4}>{query ? "No Clerk users matched this search." : "No Clerk users are available yet."}</td></tr>}
              </tbody>
            </table>
          </div>
          <div className="mt-4 flex items-center justify-between gap-3">
            <span className="text-xs text-muted">Account and device controls are managed by Clerk.</span>
            <div className="flex gap-2">
              {page > 1 && <Link className={secondaryButtonClass} href={pageHref(query, page - 1)}>Previous</Link>}
              {end < totalUsers && <Link className={secondaryButtonClass} href={pageHref(query, page + 1)}>Next</Link>}
            </div>
          </div>
        </section>

        <aside className="space-y-6">
          <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
            <p className="text-xs font-semibold uppercase tracking-wide text-sky-700">Clerk invitations</p>
            <h2 className="mt-1 text-xl font-semibold">Invite up to 50 people</h2>
            <p className="mt-2 text-sm leading-6 text-muted">Paste one email per line, or separate addresses with commas. Clerk sends each person a secure sign-up invitation.</p>
            <form action={inviteUsers} className="mt-4 space-y-3">
              <label className="block text-sm font-medium" htmlFor="invite-emails">Email addresses
                <textarea className={inputClass} id="invite-emails" maxLength={13000} name="emails" placeholder={'person@example.com\nanother@example.com'} required rows={7} />
              </label>
              <p className="text-xs text-muted">Maximum 50 distinct addresses per submission. An invitation does not grant a role or society membership.</p>
              <button className={`${buttonClass} w-full`} type="submit">Send invitations</button>
            </form>
          </section>

          <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
            <div className="flex items-center justify-between gap-3"><div><p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Recent invitations</p><h2 className="mt-1 text-lg font-semibold">Sent by Clerk</h2></div><span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs text-muted">{invitations.length} shown</span></div>
            <ul className="mt-3 divide-y divide-slate-100">
              {invitations.map((invitation) => <li className="flex items-center justify-between gap-3 py-3 text-sm" key={invitation.id}>
                <span className="min-w-0"><span className="block truncate font-medium">{invitation.emailAddress}</span><span className="mt-0.5 block text-xs text-muted">{formatDate(invitation.createdAt)}</span></span>
                <span className="shrink-0 rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium capitalize text-slate-700">{invitation.status}</span>
              </li>)}
              {!invitations.length && <li className="py-4 text-sm text-muted">No invitations found.</li>}
            </ul>
          </section>

          <section className="rounded-3xl border border-sky-200 bg-sky-50 p-5 text-sm leading-6 text-slate-700 sm:p-6">
            <h2 className="font-semibold text-slate-900">Roles and permissions</h2>
            <p className="mt-2">Open <Link className="font-semibold text-sky-800 underline" href="/manage/access">Roles &amp; access</Link> to assign society-wide or club-scoped permissions. Role changes take effect directly from the database and are checked by Supabase RLS.</p>
          </section>
        </aside>
      </div>
    </main>
  );
}

function formatDate(timestamp: number) {
  return new Intl.DateTimeFormat("en-IN", { dateStyle: "medium", timeZone: "Asia/Kolkata" }).format(new Date(timestamp));
}

function pageHref(query: string, page: number) {
  const params = new URLSearchParams();
  if (query) params.set("q", query);
  params.set("page", String(page));
  return `/manage/users?${params}`;
}

const inputClass = "mt-1 block min-h-11 w-full min-w-0 rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm font-normal text-slate-900 outline-none transition focus:border-sky-500 focus:ring-2 focus:ring-sky-200";
const buttonClass = "inline-flex min-h-11 items-center justify-center rounded-xl bg-sky-700 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-sky-800 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:ring-offset-2";
const secondaryButtonClass = "inline-flex min-h-11 items-center justify-center rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-800 transition hover:border-sky-500 hover:text-sky-700";
