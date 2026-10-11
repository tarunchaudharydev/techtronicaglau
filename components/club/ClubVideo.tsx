import type { Club } from "@/lib/config/clubs";

export default function ClubVideo({ club }: { club: Club }) {
  if (!club.promoVideo) return null;

  return (
    <section className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
      <div className="relative w-full overflow-hidden rounded-3xl shadow-lg bg-black aspect-[16/9] sm:aspect-[4/3]">
        <video
          controls
          preload="none"
          className="absolute inset-0 h-full w-full object-cover"
        >
          <source src={club.promoVideo} />
          Your browser does not support the video tag.
        </video>
      </div>
    </section>
  );
}
