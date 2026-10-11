// this is the main file for the layout of the website, it contains the navbar, footer and main content of the website, it also contains the global styles and fonts, it also contains the theme provider for dark mode and light mode, it also contains the analytics and speed insights for the website, it also contains the digital clock for the website, it also contains the event popup for the website, it also contains the upcoming event data for the website

import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";

import "./globals.css";

import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import DigitalClock from "../components/features/DigitalClock";

// import { ThemeProvider } from "next-themes";

import { SpeedInsights } from "@vercel/speed-insights/next";
import { Analytics } from "@vercel/analytics/next";
import EventPopup from "@/components/features/events/EventPopup";
import { mapDatabaseEvent } from "@/lib/data/event-mappers";
import { getPublicEvents } from "@/lib/data/public-content";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

// export const metadata: Metadata = {
//   title: "Techtronica Society",
//   description: "Made with ❤️ by Techtronica Society.",
// };



export const metadata: Metadata = {
  metadataBase: new URL("https://techtronicaglau.vercel.app"),

  title: {
    default: "Techtronica Society | GLA University, Mathura",
    template: "%s | Techtronica GLAU",
  },

  description: "Made with ❤️ by Techtronica Society.",

  applicationName: "Techtronica Society",

  keywords: [
    "Techtronica Society",
    "Techtronica GLAU",
    "GLA University Mathura",
    "GLA University technical society",
    "electronics and communication engineering",
    "technical clubs",
    "student projects",
    "technical workshops",
    "college technical events",
    "student innovation",
    "technical society",
    "technical society GLAU",
    "technical society GLA University",
    "techtronica",
    "gla university",
    "gla university mathura",
    "gla8085",
    "glauniversity",
    "exam.glauniversity",
    "glauniversity.ac.in",
    "glauniversity.in",
    "glauniversity.edu.in",
    "glauniversity.org",
    "glauniversity.net",
    ""
  ],

  alternates: {
    canonical: "/",
  },

  openGraph: {
    type: "website",
    locale: "en_IN",
    url: "/",
    siteName: "Techtronica Society",
    title: "Techtronica Society | GLA University, Mathura",
    description:
      "Discover technical clubs, electronics projects, workshops, events, and student innovation at Techtronica Society, GLA University.",
  },

  twitter: {
    card: "summary_large_image",
    title: "Techtronica Society | GLA University, Mathura",
    description:
      "Explore technical clubs, electronics projects, workshops, and events at Techtronica GLAU.",
  },

  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
    },
  },
};


export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const publicEvents = await getPublicEvents();
  // This root-layout event query is cached public content; private events never enter the popup.
  // eslint-disable-next-line react-hooks/purity
  const now = Date.now();
  const nextEvent = [...(publicEvents ?? [])]
    .filter((event) => new Date(event.starts_at).valueOf() > now)
    .sort((a, b) => a.starts_at.localeCompare(b.starts_at))[0];
  const eventPopupData = nextEvent ? mapDatabaseEvent(nextEvent) : null;

  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-white dark:bg-slate-900 text-foreground dark:text-white dark:bg-black dark:text-white transition-colors duration-300`}
      >
        {/* <ThemeProvider attribute="class" defaultTheme="system" enableSystem> */}
        <Navbar />

        <main className="pt-28 min-h-screen bg-gradient-to-br from-white dark:from-slate-950 via-sky-50 dark:via-slate-900 to-purple-100 dark:to-black dark:from-slate-900 dark:via-slate-800 dark:to-black transition-colors duration-300">
          {eventPopupData && <EventPopup event={eventPopupData} />}
          {children}
        </main>

        <Analytics />
        <SpeedInsights />
        <DigitalClock />
        <Footer />
      
      </body>
    </html>
  );
}
