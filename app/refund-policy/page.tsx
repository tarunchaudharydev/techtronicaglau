import type { Metadata } from "next";
import PolicyDocument from "@/components/policy/PolicyDocument";

export const metadata: Metadata = { title: "Refund Policy | Techtronica" };
export default function RefundPolicyPage() { return <PolicyDocument slug="refund-policy" title="Refund & Cancellation Policy" />; }
