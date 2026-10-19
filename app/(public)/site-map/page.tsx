import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Site map | Techtronica Society",
  description: "Browse the public pages of the Techtronica Society website.",
};

const pageGroups = [
  {
    title: "Discover Techtronica",
    links: [
      ["Home", "/"],
      ["About Techtronica", "/about"],
      ["Clubs", "/clubs"],
      ["Events", "/events"],
      ["Gallery", "/gallery"],
      ["Alumni", "/alumni"],
    ],
  },
  {
    title: "Explore",
    links: [
      ["Academics", "/academics"],
      ["Projects", "/projects"],
      ["Research", "/research"],
      ["Contact us", "/contact"],
      ["Frequently asked questions", "/faq"],
    ],
  },
  {
    title: "Policies and access",
    links: [
      ["Accessibility statement", "/accessibility"],
      ["Code of conduct", "/code-of-conduct"],
      ["Privacy policy", "/privacy-policy"],
      ["Terms of use", "/terms"],
      ["Refund policy", "/refund-policy"],
    ],
  },
] as const;

export default function SiteMapPage() {
  return (
    <main className="mx-auto w-full max-w-5xl px-4 py-12 sm:px-6 sm:py-16">
      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-sky-700">
        Website navigation
      </p>
      <h1 className="mt-3 text-3xl font-bold tracking-tight text-slate-950 sm:text-4xl">
        Site map
      </h1>
      <p className="mt-4 max-w-2xl text-base leading-7 text-slate-600">
        Find the main public pages on the Techtronica Society website. Public
        clubs, events, and learning resources are also listed in the{" "}
        <Link
          className="font-semibold text-sky-700 underline decoration-sky-300 underline-offset-4 hover:text-sky-900"
          href="/sitemap.xml"
        >
          XML sitemap
        </Link>
        .
      </p>

      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {pageGroups.map((group) => (
          <section
            key={group.title}
            className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6"
          >
            <h2 className="text-lg font-semibold text-slate-900">
              {group.title}
            </h2>
            <ul className="mt-4 space-y-3">
              {group.links.map(([label, href]) => (
                <li key={href}>
                  <Link
                    className="font-medium text-sky-700 underline decoration-sky-200 underline-offset-4 hover:text-sky-900"
                    href={href}
                  >
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        ))}
      </div>
    </main>
  );
}
