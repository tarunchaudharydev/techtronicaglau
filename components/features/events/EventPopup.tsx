"use client";

import { useCallback, useEffect, useState } from "react";
import type { EventSummary } from "@/lib/data/event-mappers";
import Image from "next/image";
import Link from "next/link";
import EventCountdown from "../../events/EventCountdown";

interface Props {
  event: EventSummary;
}

export default function EventPopup({ event }: Props) {
  const [open, setOpen] = useState(false);
  const [eventHasPassed, setEventHasPassed] = useState(false);

  const eventDateTime = new Date(event.startsAt).getTime();
  const popupCutoffTime = eventDateTime - 24 * 60 * 60 * 1000;

  useEffect(() => {
    const remaining = eventDateTime - Date.now();

    if (remaining <= 0) {
      const timer = window.setTimeout(() => setEventHasPassed(true), 0);
      return () => window.clearTimeout(timer);
    }

    const resetTimer = window.setTimeout(() => setEventHasPassed(false), 0);
    const passedTimer = window.setTimeout(
      () => setEventHasPassed(true),
      remaining,
    );

    return () => {
      window.clearTimeout(resetTimer);
      window.clearTimeout(passedTimer);
    };
  }, [eventDateTime]);

  useEffect(() => {
    const storageKey = `event-popup-shown:${event.slug}`;
    try {
      if (sessionStorage.getItem(storageKey)) return;
    } catch {
      // Storage may be disabled by a strict browser privacy setting.
    }

    const now = Date.now();

    if (now >= eventDateTime) return;

    if (now >= popupCutoffTime) return;

    const timer = setTimeout(() => setOpen(true), 2000);
    return () => clearTimeout(timer);
  }, [event.slug, eventDateTime, popupCutoffTime]);

  const closePopup = useCallback(() => {
    try {
      sessionStorage.setItem(`event-popup-shown:${event.slug}`, "true");
    } catch {
      // Closing the popup must still work when storage is unavailable.
    }
    setOpen(false);
  }, [event.slug]);

  useEffect(() => {
    if (!open) return;
    const dismissOnEscape = (keyboardEvent: KeyboardEvent) => {
      if (keyboardEvent.key === "Escape") closePopup();
    };
    window.addEventListener("keydown", dismissOnEscape);
    return () => window.removeEventListener("keydown", dismissOnEscape);
  }, [open, closePopup]);

  if (!open) return null;

  return (
    <div role="dialog" aria-modal="true" aria-labelledby="upcoming-event-title" className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm px-4">
      <div className="relative w-full max-w-md rounded-2xl bg-gradient-to-br from-slate-900 via-slate-800 to-black text-white shadow-[0_30px_80px_rgba(56,189,248,0.25)] overflow-hidden transition-transform duration-300 hover:-translate-y-1">

        <button
          onClick={closePopup}
          aria-label="Close popup"
          className="absolute right-3 top-3 z-10 flex h-9 w-9 items-center justify-center rounded-full bg-white dark:bg-slate-900/10 text-lg text-white cursor-pointer
                     transition-all duration-300
                     hover:bg-red-500 hover:rotate-90 hover:scale-110 hover:shadow-lg"
        >
          ✕
        </button>

        <div className="relative h-40 sm:h-48 w-full bg-black">
          <Image
            src={event.coverImage}
            alt={event.title}
            fill
            className="object-contain bg-black"
            priority
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent pointer-events-none" />
        </div>

        <div className="p-4 sm:p-6 space-y-3">
          <h2 id="upcoming-event-title" className="text-lg sm:text-xl font-bold text-sky-400">
            {event.title}
          </h2>

          <p className="text-xs sm:text-sm text-slate-300">
            {event.date} • {event.time} • {event.location}
          </p>

          <ul className="text-xs sm:text-sm text-slate-300 space-y-1">
            {event.description.split(/\n+/).filter(Boolean).slice(0, 2).map((point, i) => (
              <li key={i}>• {point}</li>
            ))}
          </ul>

          <div className="pt-3">
            {!eventHasPassed && (
              <div className="rounded-2xl bg-white dark:bg-slate-900 p-6 shadow-sm space-y-4">
                <p className="text-lg font-semibold text-emerald-900">
                  Time Left
                </p>

                {event.registrationDeadline && (
                  <EventCountdown deadline={event.registrationDeadline} />
                )}

                <div className="flex flex-wrap gap-3">
                  <Link
                    href={`/events/${event.slug}`}
                    onClick={closePopup}
                    className="flex-1 rounded-xl bg-sky-600 py-2 text-center text-sm font-semibold text-white
                               transition-all duration-300
                               hover:-translate-y-0.5 hover:bg-sky-700 hover:shadow-md"
                  >
                    View event & register
                  </Link>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
