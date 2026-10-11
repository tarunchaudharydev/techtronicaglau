import type { Metadata } from "next";
import PolicyDocument from "@/components/policy/PolicyDocument";

export const metadata: Metadata = { title: "Code of Conduct | Techtronica" };
export default function CodeOfConductPage() { return <PolicyDocument slug="code-of-conduct" title="Code of Conduct" />; }
