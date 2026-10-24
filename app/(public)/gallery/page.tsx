import type { Metadata } from "next";
import Image from "next/image";
import { getPublicSiteContent } from "@/lib/data/public-content";
import { contentObject, contentText } from "@/lib/data/content-fields";

export const metadata: Metadata = { title: "Gallery | Techtronica" };

export default async function GalleryPage() {
  const records = await getPublicSiteContent("gallery_image");
  return (
    <main className="mx-auto min-h-[65vh] max-w-7xl px-4 pb-16 pt-28 sm:px-6">
      <header className="mb-10 text-center">
        <p className="text-xs font-semibold uppercase tracking-[0.22em] text-sky-700">
          Techtronica · GLA University
        </p>
        <h1 className="mt-3 text-3xl font-bold sm:text-4xl">Society Gallery</h1>
      </header>
      {!records?.length ? (
        <p className="mx-auto max-w-xl rounded-2xl border border-slate-200 bg-white p-6 text-center text-sm text-muted dark:border-slate-800 dark:bg-slate-900">
          No gallery photos have been published yet.
        </p>
      ) : (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
          {records.map((record) => {
            const content = contentObject(record.content);
            const image = safeImageSource(contentText(content.image_url));
            if (!image) return null;
            return (
              <figure
                key={record.id}
                className="relative aspect-square overflow-hidden rounded-xl bg-slate-100 shadow-md dark:bg-slate-800"
              >
                <Image
                  src={image}
                  alt={contentText(content.alt, record.title)}
                  fill
                  sizes="(max-width: 768px) 50vw, 25vw"
                  className="object-cover transition-transform duration-300 hover:scale-105"
                />
              </figure>
            );
          })}
        </div>
      )}
    </main>
  );
}

function safeImageSource(value: string) {
  return (value.startsWith("/") && !value.startsWith("//")) ||
    value.startsWith(
      "https://erivblclxwtonwysgdle.supabase.co/storage/v1/object/public/",
    )
    ? value
    : "";
}
