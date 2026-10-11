import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import type { User } from "@supabase/supabase-js";
import { FiArrowLeft, FiLock, FiUser } from "react-icons/fi";
import EmailSettingsForm from "@/components/account/EmailSettingsForm";
import ProfileEditor from "@/components/account/ProfileEditor";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: "Profile settings",
  robots: { index: false, follow: false },
};

export default async function AccountSettingsPage() {
  const supabase = await createClient();
  if (!supabase) return <Unavailable message="Connect the Supabase project to manage account settings." />;

  let user: User | null = null;
  try {
    const { data, error } = await supabase.auth.getUser();
    user = error ? null : data.user;
  } catch {
    return <Unavailable message="We could not verify your session. Refresh the page or sign in again." />;
  }
  if (!user) redirect("/auth/sign-in?next=/account/settings");

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("full_name, department, year_of_study, avatar_url")
    .eq("id", user.id)
    .maybeSingle();

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
          Keep your profile details current and manage the email address used to sign in to Techtronica.
        </p>
      </header>

      {profileError && (
        <p className="mb-6 rounded-xl bg-amber-50 p-4 text-sm text-amber-900" role="status">
          We could not load your saved profile. You may still try to save your details again.
        </p>
      )}

      <div className="grid items-start gap-6 lg:grid-cols-2">
        <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900 sm:p-7">
          <div className="mb-6 flex items-start gap-4">
            <span className="grid size-11 shrink-0 place-items-center rounded-2xl bg-sky-50 text-xl text-sky-700 dark:bg-sky-950 dark:text-sky-300">
              <FiUser aria-hidden="true" />
            </span>
            <div>
              <h2 className="text-xl font-semibold">Personal profile</h2>
              <p className="mt-1 text-sm leading-6 text-muted">Update the details shown in your member account.</p>
            </div>
          </div>
          <ProfileEditor profile={currentProfile} />
        </section>

        <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900 sm:p-7">
          <div className="mb-6 flex items-start gap-4">
            <span className="grid size-11 shrink-0 place-items-center rounded-2xl bg-indigo-50 text-xl text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300">
              <FiLock aria-hidden="true" />
            </span>
            <div>
              <h2 className="text-xl font-semibold">Sign-in and security</h2>
              <p className="mt-1 text-sm leading-6 text-muted">Manage your email and password with confirmation links.</p>
            </div>
          </div>
          <EmailSettingsForm currentEmail={user.email ?? ""} />
          <p className="mt-5 rounded-xl bg-slate-50 p-4 text-sm leading-6 text-muted dark:bg-slate-800/70">
            Society roles and permissions are managed by authorized administrators and cannot be changed from profile settings.
          </p>
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
