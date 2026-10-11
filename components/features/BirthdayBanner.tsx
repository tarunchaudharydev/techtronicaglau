"use client";

import type { Member } from "@/lib/data/teamData";
import { isBirthdayToday } from "@/lib/utils/isBirthdayToday";

export default function BirthdayBanner({ members }: { members: Member[] }) {
  const birthdayMembers = members.filter((m) => isBirthdayToday(m.dob));

  if (birthdayMembers.length === 0) return null;

  const names = birthdayMembers.map((m) => m.name.split(" ")[0]);

  const isMultiple = names.length > 1;

  return (
    <div
      className="
        w-full
        bg-gradient-to-r from-pink-500 via-rose-500 to-indigo-600
        text-white
        py-4 px-4
        text-center
        text-sm md:text-base
        font-medium
        shadow-md
        animate-[pulseSoft_3s_ease-in-out_infinite]
      "
    >
      <span className="block">
         Today we celebrate{" "}
        <span className="font-semibold">{names.join(", ")}</span>
        {isMultiple ? "'s birthdays" : "'s birthday"}!
      </span>

      <span className="block text-xs md:text-sm opacity-90 mt-1">
        From the Techtronica Society family 💙
      </span>
    </div>
  );
}
