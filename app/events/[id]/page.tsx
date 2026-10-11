import { notFound } from "next/navigation";
import { getVisibleEventBySlug } from "@/lib/data/public-content";
import DatabaseEventDetails from "@/components/events/DatabaseEventDetails";
import { createClient } from "@/lib/supabase/server";

type PageProps = {
  params: Promise<{
    id: string;
  }>;
  searchParams: Promise<{ registration?: string }>;
};

export default async function EventDetailPage({ params, searchParams }: PageProps) {
  const { id } = await params;
  const { registration: registrationMessage } = await searchParams;

  const event = await getVisibleEventBySlug(id);
  if (!event) notFound();

  const supabase = await createClient();
  const { data: auth } = supabase ? await supabase.auth.getUser() : { data: { user: null } };
  let currentRegistration: { id: string; status: string } | null = null;
  if (supabase && auth.user) {
    const { data } = await supabase.from("event_registrations").select("id, status").eq("event_id", event.id).eq("user_id", auth.user.id).maybeSingle();
    currentRegistration = data;
  }
  return <DatabaseEventDetails event={event} registration={currentRegistration} result={registrationMessage} />;
}
