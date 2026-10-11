import type { Metadata } from "next";
import PolicyDocument from "@/components/policy/PolicyDocument";

export const metadata: Metadata = { title: "Terms and Conditions | Techtronica" };
export default function Page() { return <PolicyDocument slug="terms" title="Terms & Conditions" />; }
