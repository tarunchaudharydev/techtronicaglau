import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import type { User } from "@supabase/supabase-js";
import { FiArrowLeft, FiLock, FiUser, FiShield } from "react-icons/fi";
import EmailSettingsForm from "@/components/account/EmailSettingsForm";
import OtherSessionsSettings from "@/components/account/OtherSessionsSettings";
import AccountSessionsList from "@/components/account/AccountSessionsList";
import PasswordSettingsForm from "@/components/account/PasswordSettingsForm";
import ProfileEditor from "@/components/account/ProfileEditor";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: "Profile settings",
  robots: { index: false, follow: false },
};

export default async function AccountSettingsPage() {
  const supabase = await createClient();
  if (!supabase) return <Unavailable message="Database is not available." />;

  let user: User | null = null;
  try {
    const { data, error } = await supabase.auth.getUser();
    user = error ? null : data.user;
  } catch {
    return <Unavailable message="We could not verify your session. Refresh the page or sign in again." />;
  }
  if (!user) redirect("/auth/sign-in?next=/account/settings");

  const [profileResult, sessionsResult] = await Promise.all([
    supabase.from("profiles").select("full_name, department, year_of_study, avatar_url").eq("id", user.id).maybeSingle(),
    supabase.rpc("list_my_auth_sessions"),
  ]);
  const profile = profileResult.data;
  const profileError = profileResult.error;

  const currentProfile = profile ?? {
    full_name: typeof user.user_metadata?.full_name === "string" ? user.user_metadata.full_name : "",
    department: null,
    year_of_study: null,
    avatar_url: null,
  };

  return (
    <main className="mx-auto max-w-5xl px-4 py-10 sm:px-6 lg:py-14">
      <Link className="mb-6 inline-flex items-center gap-2 text-sm font-semibold text-sky-700 hover:underline" href="/account">
        <FiArrowLeft aria-hidden="true" /> Back to account
      </Link>

      <header className="mb-8">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-sky-700">Account preferences</p>
        <h1 className="mt-2 text-3xl font-bold tracking-tight">Profile settings</h1>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-muted">
          Update your member profile, sign-in details, and account security from one place.
        </p>
      </header>

      <nav aria-label="Settings sections" className="mb-7 flex gap-2 overflow-x-auto pb-2">
        <a className="shrink-0 rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:border-sky-300 hover:text-sky-800 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200" href="#profile-settings">Profile</a>
        <a className="shrink-0 rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:border-sky-300 hover:text-sky-800 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200" href="#sign-in-settings">Sign-in</a>
        <a className="shrink-0 rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:border-sky-300 hover:text-sky-800 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200" href="#session-settings">Sessions</a>
      </nav>

      {profileError && (
        <p className="mb-6 rounded-xl bg-amber-50 p-4 text-sm text-amber-900" role="status">
          We could not load your saved profile. You may still try to save your details again.
        </p>
      )}

      <div className="space-y-6">
        <section id="profile-settings" className="scroll-mt-24 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900 sm:p-7">
          <div className="mb-6 flex items-start gap-4">
            <span className="grid size-11 shrink-0 place-items-center rounded-2xl bg-sky-50 text-xl text-sky-700 dark:bg-sky-950 dark:text-sky-300">
              <FiUser aria-hidden="true" />
            </span>
            <div>
              <h2 className="text-xl font-semibold">Personal profile</h2>
              <p className="mt-1 text-sm leading-6 text-muted">Manage the name, photo, department, and study year shown on your member account.</p>
            </div>
          </div>
          <ProfileEditor profile={currentProfile} />
        </section>

        <section id="sign-in-settings" className="scroll-mt-24 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900 sm:p-7">
          <div className="mb-6 flex items-start gap-4">
            <span className="grid size-11 shrink-0 place-items-center rounded-2xl bg-indigo-50 text-xl text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300">
              <FiLock aria-hidden="true" />
            </span>
            <div>
              <h2 className="text-xl font-semibold">Sign-in details</h2>
              <p className="mt-1 text-sm leading-6 text-muted">Change the email address and password you use to sign in.</p>
            </div>
          </div>
          <div className="grid gap-x-8 gap-y-7 xl:grid-cols-2">
            <div>
              <h3 className="mb-3 font-semibold">Email address</h3>
              <EmailSettingsForm currentEmail={user.email ?? ""} />
            </div>
            <div className="xl:border-l xl:border-slate-100 xl:pl-8 dark:xl:border-slate-800">
              <PasswordSettingsForm />
            </div>
          </div>
          <p className="mt-6 rounded-xl bg-slate-50 p-4 text-sm leading-6 text-muted dark:bg-slate-800/70">
            Society roles and permissions are managed by authorized administrators and cannot be changed from profile settings.
          </p>
        </section>

        <section id="session-settings" className="scroll-mt-24 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900 sm:p-7">
          <div className="mb-6 flex items-start gap-4">
            <span className="grid size-11 shrink-0 place-items-center rounded-2xl bg-emerald-50 text-xl text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300">
              <FiShield aria-hidden="true" />
            </span>
            <div>
              <h2 className="text-xl font-semibold">Account sessions</h2>
              <p className="mt-1 text-sm leading-6 text-muted">Review your signed-in device options and end sessions you do not recognize.</p>
            </div>
          </div>
          <AccountSessionsList sessions={sessionsResult.data ?? []} unavailable={Boolean(sessionsResult.error)} />
          <OtherSessionsSettings />
        </section>
      </div>
    </main>
  );
}

function Unavailable({ message }: { message: string }) {
  return (
    <main className="mx-auto max-w-xl px-4 py-24 text-center">
      <h1 className="text-2xl font-bold">Settings unavailable</h1>
      <p className="mt-3 text-sm text-muted">{message}</p>
      <Link className="mt-6 inline-block text-sky-700 underline" href="/auth/sign-in">Sign in</Link>
    </main>
  );
}
