/** @param {string | null | undefined} dob @param {Date} [now] */
export function isBirthdayToday(dob, now = new Date()) {
  if (!dob) return false;

  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(dob);
  if (!match) return false;

  const month = Number(match[2]);
  const day = Number(match[3]);
  if (month < 1 || month > 12 || day < 1 || day > 31) return false;

  const normalizedBirthDate = new Date(Date.UTC(2000, month - 1, day));
  if (normalizedBirthDate.getUTCMonth() !== month - 1 || normalizedBirthDate.getUTCDate() !== day) return false;

  const today = new Intl.DateTimeFormat("en-US", {
    timeZone: "Asia/Kolkata",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(now);
  const currentMonth = today.find((part) => part.type === "month")?.value;
  const currentDay = today.find((part) => part.type === "day")?.value;

  return currentMonth === String(month).padStart(2, "0") && currentDay === String(day).padStart(2, "0");
}
