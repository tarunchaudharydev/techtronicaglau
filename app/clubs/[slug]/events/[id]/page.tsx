import { notFound } from "next/navigation";
import DatabaseEventDetails from "@/components/events/DatabaseEventDetails";
import { getVisibleEventBySlug } from "@/lib/data/public-content";
import { createClient } from "@/lib/supabase/server";

export default async function EventDetailPage({
  params,
}: {
  params: Promise<{ slug: string; id: string }>;
}) {
  const { slug, id } = await params;
  const event = await getVisibleEventBySlug(id);
  const club = Array.isArray(event?.clubs) ? event.clubs[0] : event?.clubs;
  if (!event || club?.slug !== slug) notFound();

  const supabase = await createClient();
  const { data: auth } = supabase ? await supabase.auth.getUser() : { data: { user: null } };
  let registration: { id: string; status: string } | null = null;
  if (supabase && auth.user) {
    const { data } = await supabase.from("event_registrations").select("id, status").eq("event_id", event.id).eq("user_id", auth.user.id).maybeSingle();
    registration = data;
  }
  return <DatabaseEventDetails event={event} registration={registration} backHref={`/clubs/${slug}/events`} backLabel="Back to club events" />;
}
