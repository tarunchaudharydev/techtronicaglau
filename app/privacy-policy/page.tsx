import type { Metadata } from "next";
import PolicyDocument from "@/components/policy/PolicyDocument";

export const metadata: Metadata = { title: "Privacy Policy | Techtronica" };
export default function Page() { return <PolicyDocument slug="privacy-policy" title="Privacy Policy" />; }
