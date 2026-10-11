import type { Member } from "@/lib/data/teamData";
import type { Alumni } from "@/lib/data/alumni";
import type { Json, Tables } from "@/types/database";

type TeamRow = Pick<Tables<"team_members">, "id" | "display_name" | "title" | "member_type" | "roles" | "categories" | "summary" | "biography" | "avatar_url" | "linkedin_url" | "public_contact_url" | "birthday_month" | "birthday_day">;
type AlumniRow = Pick<Tables<"alumni">, "id" | "display_name" | "cohort" | "society_role" | "avatar_url" | "linkedin_url" | "current_role" | "current_company" | "current_location" | "achievements" | "message">;

function biographyParagraphs(value: Json) {
  if (!Array.isArray(value)) return [];

  return value.flatMap((entry) => {
    if (!entry || Array.isArray(entry) || typeof entry !== "object") return [];
    const text = entry.text;
    if (typeof text !== "string" || text.trim().length === 0) return [];
    return [{ text, bold: entry.bold === true }];
  });
}

export function mapTeamMember(row: TeamRow): Member {
  const birthday =
    row.birthday_month && row.birthday_day
      ? `2000-${String(row.birthday_month).padStart(2, "0")}-${String(row.birthday_day).padStart(2, "0")}`
      : undefined;

  return {
    id: row.id,
    name: row.display_name,
    image: row.avatar_url || "/ourTeam/default-profile.png",
    roles: row.roles.length > 0 ? row.roles : [row.title],
    shortBio: row.summary,
    longBio: biographyParagraphs(row.biography),
    categories: row.categories.length > 0 ? row.categories : [row.title],
    linkedin: row.linkedin_url || undefined,
    whatsApp: row.public_contact_url || undefined,
    dob: birthday,
    roleType: row.member_type === "mentor" ? "mentor" : "team",
  };
}

export function mapAlumni(row: AlumniRow): Alumni {
  return {
    id: row.id,
    name: row.display_name,
    session: row.cohort,
    roleInSociety: row.society_role,
    club: undefined,
    image: row.avatar_url || "/ourTeam/default-profile.png",
    linkedin: row.linkedin_url || "",
    currentRole: row.current_role || "",
    currentCompany: row.current_company || undefined,
    currentLocation: row.current_location || undefined,
    achievements: row.achievements,
    message: row.message || undefined,
  };
}
