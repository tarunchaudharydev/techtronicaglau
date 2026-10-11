"use client";

import { useState } from "react";
import type { Club } from "@/lib/config/clubs";

export default function ClubContact({ club }: { club: Club }) {
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();

    const form = e.currentTarget;

    setLoading(true);
    setSent(false);
    setError("");

    const formData = new FormData(form);

    try {
      const response = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: formData.get("name"),
          email: formData.get("email"),
          topic: formData.get("topic"),
          message: formData.get("message"),
          clubSlug: club.slug,
          website: formData.get("website"),
        }),
      });

      const result = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(result.error || "We could not send your message.");
      setSent(true);
      form.reset();
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "We could not send your message.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="relative py-24 pt-28 px-4 bg-gradient-to-br from-indigo-50 via-sky-50 dark:via-slate-900 to-purple-100 dark:to-black">
      {/* Header */}
      <div className="max-w-4xl mx-auto text-center mb-14">
        <h2 className="text-4xl sm:text-5xl font-extrabold tracking-tight text-foreground dark:text-white">
          Contact <span className="text-indigo-600">&quot;{club.name}&quot;</span>
        </h2>
        <p className="mt-4 text-sm sm:text-base text-muted">
          Reach us at{" "}
          <span className="font-medium text-slate-800">
            {club.contact.instagram || club.contact.linkedin || "our society team"}
          </span>
        </p>
      </div>

      <div className="relative max-w-3xl mx-auto">
  
        <div className="absolute -inset-1 rounded-3xl bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 blur opacity-25"></div>

        <div className="relative bg-white dark:bg-slate-900 rounded-3xl shadow-2xl p-8 sm:p-12">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="hidden" aria-hidden="true">
              <label htmlFor="club-contact-website">Leave this field empty</label>
              <input id="club-contact-website" name="website" tabIndex={-1} autoComplete="off" />
            </div>
            <div className="grid gap-5 sm:grid-cols-2">
              <input
                name="name"
                required
                placeholder="Your name"
                className="w-full rounded-xl border border-slate-300 dark:border-slate-700 px-4 py-3 text-sm text-foreground dark:text-white
                           focus:outline-none focus:ring-4 focus:ring-indigo-500/20 focus:border-indigo-500"
              />

              <input
                name="email"
                type="email"
                required
                placeholder="Your email"
                className="w-full rounded-xl border border-slate-300 dark:border-slate-700 px-4 py-3 text-sm text-foreground dark:text-white
                           focus:outline-none focus:ring-4 focus:ring-indigo-500/20 focus:border-indigo-500"
              />
            </div>

            <input
              name="topic"
              placeholder="Topic (optional)"
              className="w-full rounded-xl border border-slate-300 dark:border-slate-700 px-4 py-3 text-sm text-foreground dark:text-white
                         focus:outline-none focus:ring-4 focus:ring-indigo-500/20 focus:border-indigo-500"
            />

            <textarea
              name="message"
              rows={5}
              required
              placeholder={`Write your message to ${club.name}`}
              className="w-full rounded-xl border border-slate-300 dark:border-slate-700 px-4 py-3 text-sm text-foreground dark:text-white resize-none
                         focus:outline-none focus:ring-4 focus:ring-indigo-500/20 focus:border-indigo-500"
            />

            <button
              type="submit"
              disabled={loading}
              className="
                w-full rounded-xl py-4 text-sm sm:text-base font-semibold text-white
                bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600
                hover:brightness-110 active:scale-[0.98]
                transition-all duration-200
                shadow-lg shadow-indigo-500/30
                disabled:opacity-60 disabled:cursor-not-allowed
              "
            >
              {loading ? "Sending..." : "Send Message"}
            </button>

            {sent && (
              <p className="text-center text-sm font-medium text-emerald-600">
                Message sent successfully.
              </p>
            )}
            {error && <p role="alert" className="text-center text-sm font-medium text-red-600">{error}</p>}
          </form>
        </div>
      </div>
    </section>
  );
}
