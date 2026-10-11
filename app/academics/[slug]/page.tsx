import Link from "next/link";
import { notFound } from "next/navigation";
import { FiArrowLeft } from "react-icons/fi";
import { getPublicSiteContentBySlug } from "@/lib/data/public-content";
import { contentObject, contentText } from "@/lib/data/content-fields";

export default async function ResourcePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const resource = await getPublicSiteContentBySlug("learning_resource", slug);
  if (!resource) notFound();
  const content = contentObject(resource.content);
  const fileUrl = contentText(content.file_url);
  if (!fileUrl) notFound();

  return <main className="mx-auto max-w-6xl px-4 pb-20 pt-28">
    <Link href="/academics" className="mb-5 inline-flex items-center gap-2 rounded-full bg-slate-100 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-200 dark:text-white">
      <FiArrowLeft /> Back to Academics
    </Link>
    <h1 className="mb-2 text-2xl font-bold text-foreground dark:text-white sm:text-3xl">{resource.title}</h1>
    <p className="mb-6 text-sm text-muted">{contentText(content.subject)} · {contentText(content.year)} · {contentText(content.category)}</p>
    <div className="overflow-hidden rounded-2xl border bg-white shadow-sm dark:bg-slate-900">
      <div className="relative aspect-[1/1.4142]">
        <iframe src={`${fileUrl}#zoom=page-width`} title={resource.title} className="absolute inset-0 h-full w-full" />
      </div>
    </div>
  </main>;
}
