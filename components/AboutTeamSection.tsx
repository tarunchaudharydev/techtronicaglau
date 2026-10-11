"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { Linkedin, MessageCircle } from "lucide-react";
import type { Member } from "@/lib/data/teamData";

// cool feature to show birthday confetti when a team member's profile is opened on their birthday
const isBirthdayToday = (dob?: string) => {
  if (!dob) return false;
  const today = new Date();
  const birthDate = new Date(dob);
  return (
    today.getDate() === birthDate.getDate() &&
    today.getMonth() === birthDate.getMonth()
  );
};

const getRoleColor = (role: string) => {
  const r = role.toLowerCase();

  if (r.includes("president"))
    return "bg-yellow-100 text-yellow-700 border border-yellow-300";

  if (r.includes("vice"))
    return "bg-blue-100 text-blue-700 border border-blue-300";

  if (r.includes("mentor"))
    return "bg-emerald-100 text-emerald-700 border border-emerald-300";

  if (r.includes("design"))
    return "bg-pink-100 text-pink-700 border border-pink-300";

  if (r.includes("tech"))
    return "bg-cyan-100 text-cyan-700 border border-cyan-300";

  return "bg-indigo-100 text-indigo-700 border border-indigo-300";
};

const getCardStyle = (categories: string[]) => {
  if (categories.includes("President")) {
    return `
      bg-white dark:bg-slate-900
      border-2 border-yellow-300
      shadow-[0_0_40px_rgba(255,200,0,0.4)]
      hover:shadow-[0_0_60px_rgba(255,200,0,0.6)]
    `;
  }

  if (categories.includes("mentor")) {
    return `
      bg-white dark:bg-slate-900
      border border-emerald-200
      shadow-[0_0_30px_rgba(16,185,129,0.4)]
      hover:shadow-[0_0_45px_rgba(16,185,129,0.6)]
    `;
  }

  if (categories.includes("Vice President")) {
    return `
      bg-white dark:bg-slate-900
      border border-blue-200
      shadow-[0_0_20px_rgba(59,130,246,0.3)]
      hover:shadow-[0_0_35px_rgba(59,130,246,0.5)]
    `;
  }

  if (categories.includes("Design Team")) {
    return `
      bg-gradient-to-br from-pink-50 via-purple-50 to-indigo-50
      border border-pink-200
    `;
  }

  if (categories.includes("Tech Team")) {
    return `
      bg-gradient-to-br from-slate-900 to-slate-800
      text-white
      border border-cyan-500/30
      shadow-[0_0_25px_rgba(34,211,238,0.4)]
      hover:shadow-[0_0_45px_rgba(34,211,238,0.6)]
    `;
  }

  return "bg-white dark:bg-slate-900 shadow-xl hover:shadow-2xl";
};

export default function AboutTeamSection({
  members: directoryMembers,
}: {
  members: Member[];
}) {
  const [selected, setSelected] = useState<{ member: Member } | null>(null);

  useEffect(() => {
    if (!selected) return;
    if (!isBirthdayToday(selected.member.dob)) return;

    const duration = 2000;
    const end = Date.now() + duration;

    const interval = setInterval(() => {
      if (Date.now() > end) return clearInterval(interval);

      const confetti = document.createElement("div");
      confetti.className =
        "fixed w-2 h-2 bg-pink-400 rounded-full animate-bounce z-50";
      confetti.style.left = Math.random() * window.innerWidth + "px";
      confetti.style.top = "-10px";
      document.body.appendChild(confetti);

      setTimeout(() => confetti.remove(), 2000);
    }, 120);

    return () => clearInterval(interval);
  }, [selected]);

  return (
    <section className="py-20 bg-gradient-to-br from-indigo-950 via-purple-950 to-slate-900 pt-28 -mt-25">
      <div className="mx-auto max-w-6xl px-6">
        <div className="text-center mb-14 text-white">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">Meet the Team</h2>
          <p className="text-lg max-w-3xl mx-auto text-gray-300">
            The people who plan, build, and lead Techtronica Society.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-3 gap-10">
          {directoryMembers.map((m) => {
            const isBirthday = isBirthdayToday(m.dob);
            const cardStyle = getCardStyle(m.categories);
            const isTech = m.categories.includes("Tech Team");

            return (
              <button
                key={m.id}
                onClick={() => setSelected({ member: m })}
                className={`group rounded-3xl p-6 transition-all duration-300 hover:-translate-y-2 cursor-pointer ${cardStyle}`}
              >
                <div className="relative flex gap-5 items-center">
                  <div className="relative w-24 h-24 rounded-2xl overflow-hidden ring-2 ring-white/40">
                    <Image
                      src={m.image}
                      alt={m.name}
                      fill
                      className="object-cover group-hover:scale-105 transition duration-300"
                    />
                  </div>

                  <div>
                    <h3
                      className={`text-xl font-semibold ${
                        isTech ? "text-white" : "text-gray-900"
                      }`}
                    >
                      {m.name}
                    </h3>

                    <div className="flex flex-wrap gap-2 mt-2">
                      {m.roles.map((role, index) => (
                        <span
                          key={index}
                          className={`px-3 py-1 text-xs font-medium rounded-full ${getRoleColor(
                            role,
                          )}`}
                        >
                          {role}
                        </span>
                      ))}
                    </div>

                    <p
                      className={`text-xs mt-3 ${
                        isTech ? "text-gray-300" : "text-gray-600"
                      }`}
                    >
                      {m.shortBio}
                    </p>
                  </div>
                </div>

                <div className="mt-6 flex justify-between items-center">
                  <span
                    className={`text-sm font-medium ${
                      isTech ? "text-cyan-400" : "text-indigo-600"
                    }`}
                  >
                    View Profile →
                  </span>

                  {isBirthday && (
                    <span className="text-xs px-3 py-1 rounded-full bg-pink-100 text-pink-600">
                      🎂 Birthday
                    </span>
                  )}
                </div>
              </button>
            );
          })}
        </div>
        {directoryMembers.length === 0 && <p className="text-center text-sm text-gray-300">Team profiles will be published here soon.</p>}
      </div>

      {selected && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center px-4">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-3xl w-full p-6 relative max-h-[90vh] overflow-y-auto shadow-2xl">
            <button
              onClick={() => setSelected(null)}
              className="absolute top-4 right-4 text-gray-500 hover:text-gray-900 text-lg cursor-pointer transition"
            >
              ✕
            </button>

            <div className="flex flex-col md:flex-row gap-6">
              <div className="flex-shrink-0">
                <Image
                  src={selected.member.image}
                  alt={selected.member.name}
                  width={200}
                  height={200}
                  className="rounded-2xl object-cover"
                />
              </div>

              <div>
                <h3 className="text-2xl font-semibold text-gray-900">
                  {selected.member.name}
                </h3>

                <div className="flex flex-wrap gap-2 mt-3">
                  {selected.member.roles.map((role, index) => (
                    <span
                      key={index}
                      className={`px-3 py-1 text-xs font-medium rounded-full ${getRoleColor(
                        role,
                      )}`}
                    >
                      {role}
                    </span>
                  ))}
                </div>

                {selected.member.longBio.map((para, index) => (
                  <p
                    key={index}
                    className={`mt-3 text-sm leading-relaxed ${
                      para.bold
                        ? "font-semibold text-foreground dark:text-white"
                        : "text-gray-700"
                    }`}
                  >
                    {para.text}
                  </p>
                ))}

                <div className="mt-5 flex gap-3">
                  {selected.member.linkedin && (
                    <a
                      href={selected.member.linkedin}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="h-9 w-9 flex items-center justify-center rounded-full bg-sky-600 text-white cursor-pointer"
                    >
                      <Linkedin size={16} />
                    </a>
                  )}
                  {selected.member.whatsApp && (
                    <a
                      href={selected.member.whatsApp}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="h-9 w-9 flex items-center justify-center rounded-full bg-green-500 text-white cursor-pointer"
                    >
                      <MessageCircle size={16} />
                    </a>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
