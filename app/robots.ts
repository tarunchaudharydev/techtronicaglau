import type { MetadataRoute } from "next";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://techtronicaglau.vercel.app";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/account", "/manage", "/auth"],
      },
    ],
    sitemap: `${siteUrl.replace(/\/$/, "")}/sitemap.xml`,
  };
}
