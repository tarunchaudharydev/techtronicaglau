import Image from "next/image";

export type Sponsor = {
  name: string;
  logo: string;
};

export default function SponsorsMarquee({ sponsors }: { sponsors: Sponsor[] }) {
  if (sponsors.length === 0) return null;
  return (
    <section className="overflow-hidden rounded-[1.75rem] border border-slate-200/80 bg-white px-5 py-8 shadow-[0_12px_40px_rgba(15,23,42,0.04)] sm:px-8 sm:py-10">
      <div className="space-y-2 text-center">
        <p className="text-xs font-semibold uppercase tracking-[.18em] text-sky-700">
          Our Sponsors & Partners
        </p>
        <h2 className="text-xl font-semibold tracking-tight text-slate-950 sm:text-2xl">
          Trusted by Industry & Institutions
        </h2>
      </div>

      <div className="relative mt-7 overflow-hidden">
        <div className="marquee flex items-center gap-10 sm:gap-14">
          {[...sponsors, ...sponsors].map((sponsor, index) => (
            <div
              key={index}
              className="flex min-w-[140px] items-center justify-center opacity-75 transition hover:opacity-100 sm:min-w-[180px]"
            >
              <Image
                src={sponsor.logo}
                alt={sponsor.name}
                width={160}
                height={80}
                className="max-h-16 object-contain grayscale transition hover:grayscale-0 sm:max-h-20"
              />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
