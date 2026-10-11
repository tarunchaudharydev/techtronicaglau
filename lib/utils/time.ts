export function nowIST(): Date {
  return new Date(
    new Date().toLocaleString("en-US", { timeZone: "Asia/Kolkata" })
  );
}

export function deadlineIST(date: string): Date {
  return new Date(`${date}T23:59:59+05:30`);
}

export function getTimeLeft(deadline: Date) {
  const diff = deadline.getTime() - nowIST().getTime();

  if (diff <= 0) return null;

  const totalSeconds = Math.floor(diff / 1000);

  return {
    days: Math.floor(totalSeconds / 86400),
    hours: Math.floor((totalSeconds % 86400) / 3600),
    minutes: Math.floor((totalSeconds % 3600) / 60),
    seconds: totalSeconds % 60,
  };
}
