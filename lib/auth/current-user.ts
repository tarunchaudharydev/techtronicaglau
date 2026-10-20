import { auth, currentUser } from "@clerk/nextjs/server";
import { createClient } from "@/lib/supabase/server";

const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export type CurrentAppUser = {
  id: string;
  clerkUserId: string;
  email: string | null;
  emailVerified: boolean;
  fullName: string;
  createdAt: string;
  department: string | null;
  yearOfStudy: number | null;
  avatarUrl: string | null;
};

/**
 * Resolve a Clerk identity to the app's stable profile UUID. Existing users should
 * be imported to Clerk with their Supabase profile UUID as external_id; new users
 * receive a generated UUID and a server-verified Clerk subject link.
 */
export async function getCurrentAppUser(): Promise<CurrentAppUser | null> {
  const { userId, sessionClaims } = await auth();
  if (!userId) return null;

  const [clerkUser, supabase] = await Promise.all([currentUser(), createClient()]);
  if (!clerkUser || !supabase) return null;

  const externalId = clerkUser.externalId?.trim() || null;
  const importedProfileId = externalId && uuidPattern.test(externalId) ? externalId : null;
  let profile: {
    id: string;
    clerk_user_id: string | null;
    full_name: string;
    created_at: string;
    department: string | null;
    year_of_study: number | null;
    avatar_url: string | null;
  } | null = null;

  if (importedProfileId) {
    const { data, error } = await supabase
      .from("profiles")
      .select("id, clerk_user_id, full_name, created_at, department, year_of_study, avatar_url")
      .eq("id", importedProfileId)
      .maybeSingle();
    if (error) return null;
    profile = data;
    if (profile?.clerk_user_id && profile.clerk_user_id !== userId) return null;
  }

  if (!profile) {
    const { data, error } = await supabase
      .from("profiles")
      .select("id, clerk_user_id, full_name, created_at, department, year_of_study, avatar_url")
      .eq("clerk_user_id", userId)
      .maybeSingle();
    if (error) return null;
    profile = data;
  }

  if (!profile) {
    const metadata = clerkUser.publicMetadata.techtronica;
    const invitedName = metadata && typeof metadata === "object" && "invited_name" in metadata && typeof metadata.invited_name === "string"
      ? metadata.invited_name.trim()
      : "";
    const name = clerkUser.fullName?.trim() || invitedName || clerkUser.primaryEmailAddress?.emailAddress.split("@")[0] || "Techtronica member";
    const { data, error } = await supabase
      .from("profiles")
      .insert({
        id: importedProfileId ?? crypto.randomUUID(),
        clerk_user_id: userId,
        full_name: name.slice(0, 120),
      })
      .select("id, clerk_user_id, full_name, created_at, department, year_of_study, avatar_url")
      .maybeSingle();

    if (error || !data) {
      // A concurrent request may have created the profile after the first lookup.
      const existing = await supabase
        .from("profiles")
        .select("id, clerk_user_id, full_name, created_at, department, year_of_study, avatar_url")
        .eq("clerk_user_id", userId)
        .maybeSingle();
      if (existing.error || !existing.data) return null;
      profile = existing.data;
    } else {
      profile = data;
    }
  } else if (!profile.clerk_user_id) {
    const { data, error } = await supabase
      .from("profiles")
      .update({ clerk_user_id: userId })
      .eq("id", profile.id)
      .is("clerk_user_id", null)
      .select("id, clerk_user_id, full_name, created_at, department, year_of_study, avatar_url")
      .maybeSingle();
    if (error) return null;
    if (data) profile = data;
  }

  if (profile.clerk_user_id && profile.clerk_user_id !== userId) return null;

  const email = clerkUser.primaryEmailAddress?.emailAddress ?? null;
  const claimName = typeof sessionClaims?.name === "string" ? sessionClaims.name : "";
  return {
    id: profile.id,
    clerkUserId: userId,
    email,
    emailVerified: clerkUser.primaryEmailAddress?.verification?.status === "verified",
    fullName: profile.full_name || clerkUser.fullName || claimName || email?.split("@")[0] || "Techtronica member",
    createdAt: profile.created_at,
    department: profile.department,
    yearOfStudy: profile.year_of_study,
    avatarUrl: profile.avatar_url,
  };
}

