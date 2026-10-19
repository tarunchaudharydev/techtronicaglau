import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Accessibility | Techtronica Society",
  description: "Read Techtronica Society's accessibility statement and learn how to report an accessibility barrier.",
};

const sections = [
  {
    title: "Our approach",
    body: "We want students, alumni, and visitors to be able to use Techtronica on desktop and mobile devices. We aim to support keyboard navigation, clear page structure, readable text, meaningful labels, responsive layouts, and reduced-motion preferences where supported.",
  },
  {
    title: "Current limitations",
    body: "Accessibility is ongoing work. Some older pages, uploaded images, third-party content, and authenticated management screens may not yet work equally well with every assistive technology. We do not claim formal conformance to a particular accessibility standard at this time.",
  },
  {
    title: "Report a barrier",
    body: "If something prevents you from finding information or completing a task, please tell us. Include the page URL, what you were trying to do, your browser and device, and (if relevant) the assistive technology you use. Please do not include passwords or sensitive student information.",
  },
  {
    title: "Review",
    body: "We review reported barriers and use them to guide improvements as the website changes. This statement was last reviewed on 20 October 2026.",
  },
];

export default function AccessibilityPage() {
  return (
    <main className="mx-auto w-full max-w-4xl px-4 py-12 sm:px-6 sm:py-16">
      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-sky-700">
        Website information
      </p>
      <h1 className="mt-3 text-3xl font-bold tracking-tight text-slate-950 sm:text-4xl">
        Accessibility statement
      </h1>
      <p className="mt-4 max-w-2xl text-base leading-7 text-slate-600">
        Techtronica Society at GLA University is working to make this website
        accessible and usable for everyone.
      </p>

      <div className="mt-8 space-y-4">
        {sections.map((section) => (
          <section
            key={section.title}
            className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-7"
          >
            <h2 className="text-lg font-semibold text-slate-900">
              {section.title}
            </h2>
            <p className="mt-3 leading-7 text-slate-600">{section.body}</p>
            {section.title === "Report a barrier" && (
              <p className="mt-4">
                <a
                  className="font-semibold text-sky-700 underline decoration-sky-300 underline-offset-4 hover:text-sky-900"
                  href="mailto:techtronica@gla.ac.in?subject=Website%20accessibility%20feedback"
                >
                  Email techtronica@gla.ac.in
                </a>
                <span className="text-slate-600"> or use our </span>
                <Link
                  className="font-semibold text-sky-700 underline decoration-sky-300 underline-offset-4 hover:text-sky-900"
                  href="/contact"
                >
                  contact page
                </Link>
                <span className="text-slate-600">.</span>
              </p>
            )}
          </section>
        ))}
      </div>
    </main>
  );
}
