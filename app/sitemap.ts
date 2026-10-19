import type { MetadataRoute } from "next";
import {
  getPublicClubs,
  getPublicEvents,
  getPublicSiteContent,
} from "@/lib/data/public-content";

const siteUrl = (process.env.NEXT_PUBLIC_SITE_URL || "https://techtronicaglau.vercel.app").replace(/\/$/, "");

const publicPages = [
  ["", 1],
  ["/about", 0.8],
  ["/clubs", 0.9],
  ["/events", 0.9],
  ["/alumni", 0.6],
  ["/academics", 0.6],
  ["/projects", 0.6],
  ["/research", 0.6],
  ["/gallery", 0.5],
  ["/contact", 0.5],
  ["/faq", 0.4],
  ["/code-of-conduct", 0.3],
  ["/privacy-policy", 0.2],
  ["/terms", 0.2],
  ["/refund-policy", 0.2],
  ["/accessibility", 0.3],
  ["/site-map", 0.3],
] as const;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [clubs, events, resources] = await Promise.all([
    getPublicClubs(),
    getPublicEvents(),
    getPublicSiteContent("learning_resource"),
  ]);

  const staticEntries: MetadataRoute.Sitemap = publicPages.map(([path, priority]) => ({
    url: `${siteUrl}${path}`,
    changeFrequency: path === "" ? "weekly" : "monthly",
    priority,
  }));

  const clubEntries: MetadataRoute.Sitemap = (clubs ?? []).flatMap((club) =>
    club.slug
      ? [{ url: `${siteUrl}/clubs/${encodeURIComponent(club.slug)}`, changeFrequency: "monthly", priority: 0.7 }]
      : [],
  );

  // Include only explicitly public, published event slugs; private member events must never be indexed.
  const eventEntries: MetadataRoute.Sitemap = (events ?? []).flatMap((event) =>
    event.is_public && event.slug
      ? [{ url: `${siteUrl}/events/${encodeURIComponent(event.slug)}`, changeFrequency: "weekly", priority: 0.7 }]
      : [],
  );

  const resourceEntries: MetadataRoute.Sitemap = (resources ?? []).flatMap((resource) =>
    resource.slug
      ? [{ url: `${siteUrl}/academics/${encodeURIComponent(resource.slug)}`, changeFrequency: "monthly", priority: 0.5 }]
      : [],
  );

  return [...staticEntries, ...clubEntries, ...eventEntries, ...resourceEntries];
}
