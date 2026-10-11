// this is the 404 page for our website it is a global page i mean whenever any use tried to acces an undefined page or indefined route this page show the custom error of 404..


"use client";

import Link from "next/link";
import Lottie from "lottie-react";
import errorAnimation from "@/public/error.json";

export default function NotFound() {
  return (
    <main className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-50 via-sky-50 dark:via-slate-900 to-amber-50 px-4">
      <div className="w-full max-w-xl rounded-3xl border border-purple-200 bg-white dark:bg-slate-900/90 px-6 py-8 shadow-[0_25px_80px_rgba(15,23,42,0.15)] backdrop-blur-xl text-center">
      
        <div className="mx-auto max-w-xs">
          <Lottie animationData={errorAnimation} loop autoplay />
        </div>

        <div className="space-y-3 mt-2">
          <h1 className="text-xl sm:text-2xl font-extrabold text-foreground dark:text-white">
            Lost in the circuit of{" "}
            <span className="bg-gradient-to-r from-sky-500 via-purple-500 to-amber-500 bg-clip-text text-transparent">
              Techtronica
            </span>
            .
          </h1>

          <p className="text-sm sm:text-base text-slate-700 font-medium max-w-md mx-auto">
            The page you’re looking for doesn’t exist or hasn’t been connected
            yet. Navigate back or explore different sections.
          </p>
        </div>

        <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Link
            href="/"
            className="rounded-full bg-gradient-to-r from-sky-500 to-blue-600 px-6 py-2.5 text-sm font-semibold text-white shadow-md transition hover:-translate-y-0.5"
          >
            Back to Home
          </Link>

          <Link
            href="/clubs"
            className="rounded-full border border-purple-200 bg-white dark:bg-slate-900 px-6 py-2.5 text-sm font-semibold text-purple-800 transition hover:bg-purple-50 hover:-translate-y-0.5"
          >
            Explore Clubs
          </Link>

          <Link
            href="/events"
            className="rounded-full border border-sky-200 bg-white dark:bg-slate-900 px-6 py-2.5 text-sm font-semibold text-sky-800 transition hover:bg-sky-50 hover:-translate-y-0.5"
          >
            Explore Events
          </Link>

          <Link
            href="/academics"
            className="rounded-full border border-amber-200 bg-white dark:bg-slate-900 px-6 py-2.5 text-sm font-semibold text-amber-800 transition hover:bg-amber-50 hover:-translate-y-0.5"
          >
            Explore Academics
          </Link>
        </div>
      </div>
    </main>
  );
}
