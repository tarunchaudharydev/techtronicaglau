import Link from "next/link";

const CoreTeamCTA = ({ title, description, buttonLabel, href }: { title: string; description: string; buttonLabel: string; href: string }) => {
  return (
    <div className="rounded-3xl border border-sky-100 bg-white dark:bg-slate-900/80 shadow-md px-5 py-6 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
      <div>
        <h2 className="text-base sm:text-lg font-semibold text-sky-900">
          {title}
        </h2>
        <p className="text-xs sm:text-sm text-slate-700 max-w-xl">
          {description}
        </p>
      </div>
      <Link
        href={href}
        className="inline-flex items-center justify-center px-5 py-2.5 rounded-full text-xs sm:text-sm font-semibold text-white bg-sky-700 hover:bg-sky-800 transition-colors shadow-sm"
      >
        {buttonLabel}
      </Link>
    </div>
  );
};

export default CoreTeamCTA;
