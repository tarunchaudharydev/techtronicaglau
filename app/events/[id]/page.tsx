import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getPublicEventBySlug, getVisibleEventBySlug } from "@/lib/data/public-content";
import DatabaseEventDetails from "@/components/events/DatabaseEventDetails";
import { createClient } from "@/lib/supabase/server";
import { getCurrentAppUser } from "@/lib/auth/current-user";

type PageProps = {
  params: Promise<{
    id: string;
  }>;
  searchParams: Promise<{ registration?: string }>;
};

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params;
  const event = await getPublicEventBySlug(id);
  if (!event) {
    return { title: "Member event", robots: { index: false, follow: false } };
  }

  const description = event.summary?.trim() ||
    `${event.title} is hosted by Techtronica Society at GLA University, Mathura. View event details, venue, and registration information.`;
  return {
    title: `${event.title} | Techtronica Events`,
    description: description.slice(0, 160),
    alternates: { canonical: `/events/${encodeURIComponent(event.slug)}` },
    openGraph: { title: `${event.title} | Techtronica GLAU`, description: description.slice(0, 160), type: "article" },
  };
}

export default async function EventDetailPage({ params, searchParams }: PageProps) {
  const { id } = await params;
  const { registration: registrationMessage } = await searchParams;

  const event = await getVisibleEventBySlug(id);
  if (!event) notFound();

  const supabase = await createClient();
  const appUser = await getCurrentAppUser();
  let currentRegistration: { id: string; status: string } | null = null;
  if (supabase && appUser) {
    const { data } = await supabase.from("event_registrations").select("id, status").eq("event_id", event.id).eq("user_id", appUser.id).maybeSingle();
    currentRegistration = data;
  }
  return <DatabaseEventDetails event={event} registration={currentRegistration} result={registrationMessage} />;
}
