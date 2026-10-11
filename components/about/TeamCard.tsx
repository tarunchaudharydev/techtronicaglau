"use client";

import Image from "next/image";
import BirthdayBadge from "@/components/features/BirthdayBadge";
import { isBirthdayToday } from "@/lib/utils/isBirthdayToday";
import type { Member } from "@/lib/data/teamData";

interface TeamCardProps {
  member: Member;
}

export default function TeamCard({ member }: TeamCardProps) {
  const birthdayToday = isBirthdayToday(member.dob);

  return (
    <div
      className="
        relative bg-white dark:bg-slate-900
        rounded-2xl shadow-sm
        hover:shadow-lg
        transition-all duration-300
        p-6 text-center
        flex flex-col items-center
      "
    >
      {birthdayToday && (
        <div className="absolute top-4 right-4">
          <BirthdayBadge />
        </div>
      )}

      <div className="relative w-28 h-28 md:w-32 md:h-32 rounded-full overflow-hidden mb-4">
        <Image
          src={member.image}
          alt={member.name}
          fill
          className="object-cover"
        />
      </div>

      <h3 className="font-semibold text-gray-900 text-lg">{member.name}</h3>

      <p className="text-indigo-600 text-sm mb-1">{member.roles.join(", ")}</p>

      <p className="text-xs text-gray-500">{member.shortBio}</p>
    </div>
  );
}
