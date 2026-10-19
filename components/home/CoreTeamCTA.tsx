import Link from "next/link";

const CoreTeamCTA = ({ title, description, buttonLabel, href }: { title: string; description: string; buttonLabel: string; href: string }) => {
  return (
    <section className="flex flex-col gap-5 rounded-[1.75rem] border border-slate-200 bg-white p-6 shadow-[0_12px_40px_rgba(15,23,42,0.05)] sm:p-9 md:flex-row md:items-center md:justify-between lg:p-10">
      <div className="max-w-2xl space-y-2">
        <h2 className="text-xl font-semibold tracking-tight text-slate-950 sm:text-2xl">
          {title}
        </h2>
        <p className="text-sm leading-7 text-slate-600 sm:text-base">
          {description}
        </p>
      </div>
      <Link
        href={href}
        className="inline-flex min-h-11 shrink-0 items-center justify-center rounded-xl bg-sky-700 px-5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-sky-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-700 focus-visible:ring-offset-2"
      >
        {buttonLabel}
      </Link>
    </section>
  );
};

export default CoreTeamCTA;
