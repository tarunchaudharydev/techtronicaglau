import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    id: "/",
    name: "Techtronica Society — GLA University",
    short_name: "Techtronica",
    description: "Explore Techtronica Society at GLA University: clubs, events, projects, and the member community.",
    start_url: "/",
    scope: "/",
    display: "standalone",
    display_override: ["standalone", "minimal-ui"],
    background_color: "#f8fafc",
    theme_color: "#0284c7",
    categories: ["education", "social"],
    icons: [
      { src: "/logo.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/logo.png", sizes: "512x512", type: "image/png", purpose: "any" },
    ],
  };
}
