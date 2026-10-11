export type MemberCategory =
  | "core-member"
  | "Design Team"
  | "GMC"
  | "President"
  | "Vice President"
  | "General Secratory"
  | "alumni"
  | "mentor"
  | "faculty";

export type BioParagraph = {
  text: string;
  bold?: boolean;
};

export interface Member {
  id: number | string;
  name: string;
  image: string;
  roles: string[];
  shortBio: string;
  longBio: BioParagraph[];
  categories: string[];
  linkedin?: string;
  whatsApp?: string;
  dob?: string;
  roleType: "mentor" | "team";
}

