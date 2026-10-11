"use client";

import { useCountdown } from "@/lib/hooks/useCountdown";
import Lottie from "lottie-react";
import timeAnimation from "@/public/time.json";

function TimeBox({ value, label }: { value: number; label: string }) {
  return (
    <div className="flex flex-col items-center rounded-lg bg-purple-100 px-2 py-1 min-w-[44px]">
      <span className="font-mono text-sm font-bold text-purple-800">
        {String(value).padStart(2, "0")}
      </span>
      <span className="text-[9px] uppercase tracking-wide text-purple-600">
        {label}
      </span>
    </div>
  );
}

export default function EventCountdown({ deadline }: { deadline?: string }) {
  const t = useCountdown(deadline);

  if (!deadline) return null;

  if (!t)
    return (
      <p className="text-xs font-medium text-red-600">❌ Registration closed</p>
    );

  return (
    <div className="flex items-center gap-2">
      <div className="h-6 w-6">
        <Lottie animationData={timeAnimation} loop autoplay />
      </div>

      <div className="flex gap-1">
        <TimeBox value={t.days} label="days" />
        <TimeBox value={t.hours} label="hrs" />
        <TimeBox value={t.minutes} label="min" />
        <div className="animate-pulse">
          <TimeBox value={t.seconds} label="sec" />
        </div>
      </div>

      <span className="text-[10px] text-purple-500">(IST)</span>
    </div>
  );
}
