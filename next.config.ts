import type { NextConfig } from "next";
import packageJson from "./package.json";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "images.unsplash.com" },
      { protocol: "https", hostname: "i.ibb.co" },
      { protocol: "https", hostname: "techtronica.vercel.app" },
      { protocol: "https", hostname: "erivblclxwtonwysgdle.supabase.co", pathname: "/storage/v1/object/public/**" },
      { protocol: "https", hostname: "erivblclxwtonwysgdle.supabase.co", pathname: "/storage/v1/object/sign/**" },
    ],
  },
  env: {
    NEXT_PUBLIC_APP_VERSION: packageJson.version,
    NEXT_PUBLIC_BUILD_TIME: new Date().toISOString(),
  },
};

export default nextConfig;
