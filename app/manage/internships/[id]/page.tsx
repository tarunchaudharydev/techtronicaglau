import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import InternshipAdminForm from "@/components/internships/InternshipAdminForm";
import { requireManager, validId } from "@/lib/manage/server";
import { updateInternship } from "../actions";
import { notFound } from "next/navigation";

export const metadata: Metadata = { title: "Edit internship | Society management" };

export default async function EditInternshipPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!validId(id)) notFound();
  const { supabase } = await requireManager("internships.manage");
  const { data: listing, error } = await supabase.from("internships").select("*").eq("id", id).maybeSingle();
  if (error) return <main className="mx-auto max-w-4xl px-4 py-10"><p role="alert" className="rounded-xl bg-rose-50 p-4 text-rose-800">The listing could not be loaded.</p></main>;
  if (!listing) notFound();
  const { data: company } = await supabase.from("internship_companies").select("careers_url").eq("id", listing.company_id).maybeSingle();
  return <main className="mx-auto max-w-5xl px-4 py-8 sm:px-6"><Link href="/manage/internships" className="inline-flex min-h-10 items-center gap-2 rounded-lg px-2 text-sm font-semibold text-sky-800 hover:bg-sky-50 dark:text-sky-300 dark:hover:bg-slate-900"><ArrowLeft aria-hidden="true" className="size-4" />Back to internship listings</Link><section className="mt-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900 sm:p-7"><p className="text-xs font-bold uppercase tracking-[0.16em] text-sky-700 dark:text-sky-300">Editing resets review</p><h1 className="mt-1 text-2xl font-bold">Edit {listing.title}</h1><p className="mb-6 mt-2 text-sm leading-6 text-slate-600 dark:text-slate-300">Saving any edits makes this listing unverified and removes it from public search until it is reviewed again.</p><InternshipAdminForm action={updateInternship} initial={listing} companyName={listing.company_name} careersUrl={company?.careers_url ?? ""} submitLabel="Save changes and require review" /></section></main>;
}
