"use client";

import { useEffect, useState } from "react";
import { deadlineIST, getTimeLeft } from "@/lib/utils/time";

export function useCountdown(deadlineDate?: string) {
  const [timeLeft, setTimeLeft] = useState<ReturnType<typeof getTimeLeft>>(null);

  useEffect(() => {
    if (!deadlineDate) return;

    const deadline = deadlineIST(deadlineDate);

    const update = () => {
      setTimeLeft(getTimeLeft(deadline));
    };

    update(); 
    const interval = setInterval(update, 1000); 
    return () => clearInterval(interval);
  }, [deadlineDate]);

  return timeLeft;
}
