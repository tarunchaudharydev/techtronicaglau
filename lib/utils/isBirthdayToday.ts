import { isBirthdayToday as isBirthdayTodayImpl } from "./isBirthdayToday.mjs";

export const isBirthdayToday: (dob?: string | null, now?: Date) => boolean = isBirthdayTodayImpl;
