import Link from "next/link";
import { Folder } from "lucide-react";
import { getPublicSiteContent } from "@/lib/data/public-content";
import { contentObject, contentText } from "@/lib/data/content-fields";

export default async function LibrarySection() {
  const [folders, resources, projects, research] = await Promise.all([
    getPublicSiteContent("library_folder"),
    getPublicSiteContent("learning_resource"),
    getPublicSiteContent("project"),
    getPublicSiteContent("research_work"),
  ]);
  const counts: Record<string, number> = {
    learning_resource: resources?.length ?? 0,
    project: projects?.length ?? 0,
    research_work: research?.length ?? 0,
  };

  return <section className="min-h-[65vh] bg-gradient-to-br from-white via-slate-50 to-purple-50 py-16 transition-colors duration-300">
    <div className="mx-auto max-w-6xl px-4">
      <h1 className="mb-10 text-3xl font-extrabold">Library</h1>
      {!folders?.length ? <p className="rounded-2xl border border-slate-200 bg-white p-6 text-sm text-muted dark:border-slate-800 dark:bg-slate-900">No library categories have been published yet.</p> :
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {folders.map((folder) => {
            const content = contentObject(folder.content);
            const href = internalHref(contentText(content.href));
            if (!href) return null;
            const countType = contentText(content.count_type);
            return <Link key={folder.id} href={href} className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:border-sky-300 dark:border-slate-800 dark:bg-slate-900">
              <span className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-sky-100 text-sky-800"><Folder className="h-6 w-6" /></span>
              <h2 className="text-xl font-semibold">{folder.title}</h2>
              <p className="mt-1 text-sm text-muted">{contentText(content.subtitle)}</p>
              {countType && <p className="mt-4 text-xs text-muted">{counts[countType] ?? 0} published items</p>}
            </Link>;
          })}
        </div>}
    </div>
  </section>;
}

function internalHref(value: string) { return value.startsWith("/") && !value.startsWith("//") ? value : null; }
