// this is the main file for the layout of the website, it contains the navbar, footer and main content of the website, it also contains the global styles and fonts, it also contains the theme provider for dark mode and light mode, it also contains the analytics and speed insights for the website, it also contains the digital clock for the website, it also contains the event popup for the website, it also contains the upcoming event data for the website

import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";

import "./globals.css";

import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import DigitalClock from "../components/features/DigitalClock";

// import { ThemeProvider } from "next-themes";

import { Suspense } from "react";
import { SpeedInsights } from "@vercel/speed-insights/next";
import { Analytics } from "@vercel/analytics/next";
import EventPopupLoader from "@/components/features/events/EventPopupLoader";
import PwaInstallPrompt from "@/components/PwaInstallPrompt";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || "https://techtronicaglau.vercel.app"),
  title: {
    default: "Techtronica Society | GLA University, Mathura",
    template: "%s | Techtronica GLAU",
  },
  description:
    "Explore Techtronica, the student technical society at GLA University in Mathura. Discover student-led clubs, engineering projects, workshops, and campus events.",
  applicationName: "Techtronica Society",
  appleWebApp: { capable: true, statusBarStyle: "default", title: "Techtronica" },
  icons: {
    apple: [{ url: "/logo.png", sizes: "512x512", type: "image/png" }],
  },
  keywords: [
    "Techtronica Society",
    "Techtronica GLAU",
    "GLA University Mathura",
    "GLA University technical society",
    "student technical clubs at GLA University",
    "engineering workshops and events in Mathura",
    "student engineering projects",
  ],
  openGraph: {
    type: "website",
    locale: "en_IN",
    url: "/",
    siteName: "Techtronica Society",
    title: "Techtronica Society | GLA University, Mathura",
    description:
      "Discover student-led technical clubs, engineering projects, workshops, and events at GLA University in Mathura.",
    images: [{ url: "/logo.png", width: 512, height: 512, alt: "Techtronica Society at GLA University" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Techtronica Society | GLA University, Mathura",
    description:
      "Student-led technical clubs, engineering projects, workshops, and events at GLA University in Mathura.",
    images: ["/logo.png"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true, "max-image-preview": "large", "max-snippet": -1, "max-video-preview": -1 },
  },
};

export const viewport: Viewport = {
  themeColor: "#0284c7",
  viewportFit: "cover",
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify([
              {
                "@context": "https://schema.org",
                "@type": "Organization",
                name: "Techtronica Society",
                alternateName: ["Techtronica", "Techtronica GLAU"],
                url: process.env.NEXT_PUBLIC_SITE_URL || "https://techtronicaglau.vercel.app",
                logo: `${process.env.NEXT_PUBLIC_SITE_URL || "https://techtronicaglau.vercel.app"}/logo.png`,
                description:
                  "A student-led technical society at GLA University, Mathura, bringing students together through clubs, engineering projects, workshops, and events.",
                keywords: ["Techtronica", "GLA University", "GLAU", "student technical society", "Mathura"],
              },
              {
                "@context": "https://schema.org",
                "@type": "WebSite",
                name: "Techtronica Society",
                alternateName: "Techtronica GLAU",
                url: process.env.NEXT_PUBLIC_SITE_URL || "https://techtronicaglau.vercel.app",
                inLanguage: "en-IN",
              },
            ]),
          }}
        />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-white dark:bg-slate-900 text-foreground dark:text-white dark:bg-black dark:text-white transition-colors duration-300`}
      >
        {/* <ThemeProvider attribute="class" defaultTheme="system" enableSystem> */}
        <Navbar />

        <main className="pt-28 min-h-screen bg-gradient-to-br from-white dark:from-slate-950 via-sky-50 dark:via-slate-900 to-purple-100 dark:to-black dark:from-slate-900 dark:via-slate-800 dark:to-black transition-colors duration-300">
          <Suspense fallback={null}><EventPopupLoader /></Suspense>
          {children}
        </main>

        <Analytics />
        <SpeedInsights />
        <DigitalClock />
        <Footer />
        <PwaInstallPrompt />
      
      </body>
    </html>
  );
}
