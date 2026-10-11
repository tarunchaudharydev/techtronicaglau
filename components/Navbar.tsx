// "use client";

// import { useState, useEffect, useRef } from "react";
// import Link from "next/link";
// import Image from "next/image";
// import { usePathname } from "next/navigation";

// // import ThemeToggle from "@/components/features/ThemeToggle";

// const navLinks = [
//   { href: "/", label: "Home" },
//   { href: "/clubs", label: "Clubs" },
//   { href: "/about", label: "About us" },
//   { href: "/events", label: "Events" },
//   // { href: "/academics", label: "Academics" },
//   // { href: "/home", label: "Sidebar" },
//   {
//     href: "/library",
//     label: "Library",
//     badge: "NEW",
//   },
//   // { href: "/research", label: "Research & Patents" },
//   { href: "/alumni", label: "Alumni" },
//   { href: "/contact", label: "Contact us" },
//   // <ThemeToggle />,
// ];

// // const academicsItems = [
// //   { href: "/researchAndPatents", label: "Research & Patents" },
// //   { href: "resources", label: "Resources" },
// // ];

// const clubItems = [
//   { href: "/clubs/code-e-phobia", label: "Code-E-Phobia" },
//   { href: "/clubs/mindboggler", label: "Mindboggler" },
//   { href: "/clubs/technovation", label: "Technovation" },
//   { href: "/clubs/unnati", label: "Unnati" },
//   { href: "/clubs/gizmo", label: "Gizmo" },
// ];

// export default function Navbar() {
//   const [isMobileOpen, setIsMobileOpen] = useState(false);
//   const [isClubsOpen, setIsClubsOpen] = useState(false);
//   const pathname = usePathname();
//   const navRef = useRef<HTMLDivElement | null>(null);

//   const isActive = (href: string) =>
//     href === "/" ? pathname === "/" : pathname.startsWith(href);

//   // close mobile menu on outside click
//   useEffect(() => {
//     if (!isMobileOpen) return;
//     const handler = (e: MouseEvent) => {
//       if (navRef.current && !navRef.current.contains(e.target as Node)) {
//         setIsMobileOpen(false);
//       }
//     };
//     document.addEventListener("mousedown", handler);
//     return () => document.removeEventListener("mousedown", handler);
//   }, [isMobileOpen]);

//   return (
//     <header className="fixed inset-x-0 top-0 z-50 flex justify-center">
//       <div ref={navRef} className="mt-4 w-full max-w-5xl px-4">
//         <nav
//           className="
//             flex items-center justify-between
//             rounded-3xl border border-white/20
//             bg-blue-500/10 backdrop-blur-lg
//             shadow-lg shadow-black/20
//             px-4 sm:px-6 py-3
//           "
//         >
//           {/* Logo */}
//           <Link href="/" className="flex items-center shrink-0">
//             <div className="relative h-14 w-40 rounded-2xl overflow-hidden">
//               <Image
//                 src="/logo.png"
//                 alt="Society Logo"
//                 fill
//                 sizes="160px"
//                 className="object-contain"
//                 priority
//               />
//               {/* <ThemeToggle /> */}
//             </div>
//           </Link>

//           {/* Desktop nav */}
//           <div className="hidden md:flex items-center gap-6 text-sm font-medium">
//             {navLinks.map((link) => {
//               const active = isActive(link.href);

//               if (link.href === "/clubs") {
//                 return (
//                   <div
//                     key={link.href}
//                     className="relative"
//                     onMouseEnter={() => setIsClubsOpen(true)}
//                     onMouseLeave={() => setIsClubsOpen(false)}
//                   >
//                     <div className="inline-flex items-center gap-1 cursor-pointer">
//                       <Link
//                         href="/clubs"
//                         className={`transition-colors ${
//                           active
//                             ? "text-blue-600"
//                             : "text-foreground dark:text-white hover:text-yellow-500"
//                         }`}
//                       >
//                         Clubs
//                       </Link>
//                       <span className="text-xs">▼</span>
//                     </div>

//                     {isClubsOpen && (
//                       <div className="absolute left-1/2 z-50 mt-0 w-60 -translate-x-1/2 rounded-2xl border border-black bg-white dark:bg-slate-900 shadow-xl">
//                         <ul className="py-2 text-xs text-black">
//                           {clubItems.map((club) => (
//                             <li key={club.href}>
//                               <Link
//                                 href={club.href}
//                                 className="block px-4 py-2 text-foreground dark:text-white hover:text-yellow-500 transition-colors"
//                               >
//                                 {club.label}
//                               </Link>
//                             </li>
//                           ))}
//                         </ul>
//                       </div>
//                     )}
//                   </div>
//                 );
//               }

//               return (
//                 <Link
//                   key={link.href}
//                   href={link.href}
//                   className={`relative inline-flex items-center transition-colors ${
//                     active
//                       ? "text-blue-600"
//                       : "text-foreground dark:text-white hover:text-yellow-500"
//                   }`}
//                 >
//                   <span>{link.label}</span>

//                   {link.badge && (
//                     <span
//                       className="
//         absolute -top-3 -right-3
//         rounded-full
//         bg-gradient-to-r from-pink-500 to-red-500
//         px-1.5 py-[2px]
//         text-[9px] font-semibold text-white
//         animate-pulse
//       "
//                     >
//                       {link.badge}
//                     </span>
//                   )}
//                 </Link>
//               );
//             })}
//           </div>

//           {/* Mobile hamburger */}
//           <button
//             onClick={() => setIsMobileOpen((v) => !v)}
//             className="md:hidden inline-flex items-center justify-center rounded-full p-2 text-black hover:bg-white dark:bg-slate-900/20 transition-colors"
//             aria-label="Toggle menu"
//           >
//             <div className="space-y-1.5">
//               <span className="block h-0.5 w-5 bg-black rounded-full" />
//               <span className="block h-0.5 w-4 bg-black rounded-full" />
//               <span className="block h-0.5 w-5 bg-black rounded-full" />
//             </div>
//           </button>
//         </nav>

//         {/* ✅ FIXED Mobile menu */}
//         <div
//           className={`
//             md:hidden mt-2 rounded-3xl border border-slate-200 dark:border-slate-800
//             bg-white dark:bg-slate-900 shadow-lg
//             transition-all duration-300 overflow-hidden
//             ${isMobileOpen ? "max-h-[80vh] opacity-100" : "max-h-0 opacity-0"}
//           `}
//         >
//           <nav className="flex flex-col px-4 py-3 space-y-2 text-sm font-medium text-foreground dark:text-white overflow-y-auto">
//             {navLinks.map((link) => {
//               if (link.href === "/clubs") {
//                 return (
//                   <div key={link.href} className="space-y-1">
//                     <Link
//                       href="/clubs"
//                       onClick={() => setIsMobileOpen(false)}
//                       className="hover:text-sky-600"
//                     >
//                       Clubs
//                     </Link>
//                     <div className="ml-3 border-l border-slate-200 dark:border-slate-800 pl-3 space-y-1 text-[13px] text-slate-700">
//                       {clubItems.map((club) => (
//                         <Link
//                           key={club.href}
//                           href={club.href}
//                           onClick={() => setIsMobileOpen(false)}
//                           className="block hover:text-sky-600"
//                         >
//                           {club.label}
//                         </Link>
//                       ))}
//                     </div>
//                   </div>
//                 );
//               }

//               return (
//                 <Link
//                   key={link.href}
//                   href={link.href}
//                   onClick={() => setIsMobileOpen(false)}
//                   className="flex items-center gap-2 hover:text-sky-600"
//                 >
//                   <span>{link.label}</span>

//                   {link.badge && (
//                     <span className="rounded-full bg-pink-500 px-2 py-[2px] text-[10px] font-semibold text-white">
//                       {link.badge}
//                     </span>
//                   )}
//                 </Link>
//               );
//             })}
//           </nav>
//         </div>
//       </div>
//     </header>
//   );
// }




























































"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import type { User } from "@supabase/supabase-js";
import {
  AiOutlineHome,
  AiOutlineAppstore,
  AiOutlineCalendar,
  AiOutlineUser,
  AiOutlineMenu,
} from "react-icons/ai";
import { LogIn, UserPlus, UserRound } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { isSupabaseConfigured } from "@/lib/supabase/config";

const navLinks = [
  { href: "/", label: "Home" },
  { href: "/clubs", label: "Clubs" },
  { href: "/about", label: "About us" },
  { href: "/events", label: "Events" },
  { href: "/library", label: "Library", badge: "NEW" },
  { href: "/alumni", label: "Alumni" },
  { href: "/contact", label: "Contact us" },
];

type HeaderAccountState =
  | { status: "loading" }
  | { status: "signed-out" }
  | { status: "signed-in"; name: string; initials: string };

const clubItems = [
  { href: "/clubs/code-e-phobia", label: "Code-E-Phobia" },
  { href: "/clubs/mindboggler", label: "Mindboggler" },
  { href: "/clubs/technovation", label: "Technovation" },
  { href: "/clubs/unnati", label: "Unnati" },
  { href: "/clubs/gizmo", label: "Gizmo" },
];

export default function Navbar() {
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [isClubsOpen, setIsClubsOpen] = useState(false);
  const [accountState, setAccountState] = useState<HeaderAccountState>(() => isSupabaseConfigured ? { status: "loading" } : { status: "signed-out" });
  const pathname = usePathname();
  const navRef = useRef<HTMLDivElement | null>(null);

  const isActive = (href: string) =>
    href === "/" ? pathname === "/" : pathname.startsWith(href);

  useEffect(() => {
    if (!isSupabaseConfigured) return;
    let mounted = true;
    let authEvents = 0;
    let supabase: ReturnType<typeof createClient>;

    try {
      supabase = createClient();
    } catch {
      return;
    }

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      authEvents += 1;
      if (mounted) setAccountState(accountStateFor(session?.user ?? null));
    });
    const initialEventVersion = authEvents;

    void supabase.auth.getUser().then(({ data, error }) => {
      if (mounted && authEvents === initialEventVersion) {
        setAccountState(accountStateFor(error ? null : data.user));
      }
    }).catch(() => {
      if (mounted && authEvents === initialEventVersion) setAccountState({ status: "signed-out" });
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (!isMobileOpen) return;
    const handler = (e: MouseEvent) => {
      if (navRef.current && !navRef.current.contains(e.target as Node)) {
        setIsMobileOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [isMobileOpen]);

  return (
    <>
      <header className="hidden lg:flex fixed inset-x-0 top-0 z-50 justify-center">
        <div ref={navRef} className="mt-4 w-full max-w-6xl px-4">
          <nav
            className="
              flex items-center justify-between
              rounded-2xl
              bg-white/70 dark:bg-slate-900/70
              backdrop-blur-xl
              border border-white/20 dark:border-white/10
              shadow-[0_8px_30px_rgb(0,0,0,0.12)]
              px-3 py-3 xl:px-6
              transition-all duration-300
              hover:shadow-[0_10px_40px_rgb(0,0,0,0.18)]
            "
          >
            <Link href="/" className="flex items-center shrink-0">
              <div className="relative h-12 w-36 rounded-xl overflow-hidden transition-transform duration-300 hover:scale-105">
                <Image
                  src="/logo.png"
                  alt="Society Logo"
                  fill
                  sizes="160px"
                  className="object-contain"
                  priority
                />
              </div>
            </Link>

            <div className="flex items-center gap-3 text-xs font-medium xl:gap-5 xl:text-sm">
              {navLinks.map((link) => {
                const active = isActive(link.href);

                if (link.href === "/clubs") {
                  return (
                    <div
                      key={link.href}
                      className="relative"
                      onMouseEnter={() => setIsClubsOpen(true)}
                      onMouseLeave={() => setIsClubsOpen(false)}
                    >
                      <Link
                        href="/clubs"
                        className={`relative group px-2 py-1 ${
                          active
                            ? "text-blue-600"
                            : "text-gray-700 dark:text-gray-300 hover:text-blue-500"
                        }`}
                      >
                        Clubs ▼
                        <span
                          className={`
                            absolute left-0 -bottom-1 h-[2px] w-full
                            bg-blue-500 origin-left scale-x-0
                            transition-transform duration-300
                            ${active ? "scale-x-100" : "group-hover:scale-x-100"}
                          `}
                        />
                      </Link>

                      {isClubsOpen && (
                        <div className="absolute left-1/2 z-50 mt-2 w-60 -translate-x-1/2 rounded-xl border bg-white dark:bg-slate-900 shadow-xl">
                          <ul className="py-2 text-xs">
                            {clubItems.map((club) => (
                              <li key={club.href}>
                                <Link
                                  href={club.href}
                                  className="block px-4 py-2 hover:text-blue-500"
                                >
                                  {club.label}
                                </Link>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  );
                }

                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    className={`relative group px-2 py-1 ${
                      active
                        ? "text-blue-600"
                        : "text-gray-700 dark:text-gray-300 hover:text-blue-500"
                    }`}
                  >
                    {link.label}

                    {link.badge && (
                      <span className="absolute -top-3 -right-3 rounded-full bg-gradient-to-r from-pink-500 to-red-500 px-1.5 py-[2px] text-[9px] text-white animate-pulse">
                        {link.badge}
                      </span>
                    )}

                    <span
                      className={`
                        absolute left-0 -bottom-1 h-[2px] w-full
                        bg-blue-500 origin-left scale-x-0
                        transition-transform duration-300
                        ${active ? "scale-x-100" : "group-hover:scale-x-100"}
                      `}
                    />
                  </Link>
                );
              })}
            </div>
            <HeaderAccountLinks account={accountState} variant="desktop" pathname={pathname} />
          </nav>
        </div>
      </header>


      
<header className="lg:hidden fixed top-0 left-0 right-0 z-50 bg-white/80 dark:bg-slate-900/80 backdrop-blur-lg border-b border-slate-200 dark:border-slate-800">
  <div className="flex items-center justify-between px-4 py-2">
    
    {/* Logo */}
    <Link href="/" className="flex items-center">
      <div className="relative h-10 w-28">
        <Image
          src="/logo.png"
          alt="Logo"
          fill
          className="object-contain"
        />
      </div>
    </Link>

    <div className="flex items-center gap-1">
      <HeaderAccountLinks account={accountState} variant="mobile" pathname={pathname} />
      <button
        onClick={() => setIsMobileOpen(true)}
        className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition"
        aria-label="Open navigation menu"
        aria-expanded={isMobileOpen}
      >
        <AiOutlineMenu size={22} />
      </button>
    </div>
  </div>
</header>

      <div className="lg:hidden fixed bottom-0 left-0 right-0 z-50 bg-white dark:bg-slate-900 border-t shadow-lg">
        <div className="flex justify-around py-2 text-xs">
          <NavItem href="/" icon={<AiOutlineHome />} active={isActive("/")} />
          <NavItem href="/clubs" icon={<AiOutlineAppstore />} active={isActive("/clubs")} />
          <NavItem href="/events" icon={<AiOutlineCalendar />} active={isActive("/events")} />
          <NavItem href="/alumni" icon={<AiOutlineUser />} active={isActive("/alumni")} />

          <button onClick={() => setIsMobileOpen(true)}>
            <AiOutlineMenu size={22} />
          </button>
        </div>
      </div>

      {isMobileOpen && (
        <div className="fixed inset-0 z-50 bg-black/40">
          <div
            ref={navRef}
            className="absolute bottom-0 w-full rounded-t-3xl bg-white dark:bg-slate-900 p-4 max-h-[80vh] overflow-y-auto"
          >
            <div className="flex justify-between mb-4">
              <h2 className="font-semibold">Menu</h2>
              <button onClick={() => setIsMobileOpen(false)}>✕</button>
            </div>

            <div className="space-y-3">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setIsMobileOpen(false)}
                  className="block"
                >
                  {link.label}
                </Link>
              ))}

              <div className="mt-4 border-t border-slate-200 pt-4 dark:border-slate-800">
                <HeaderAccountLinks account={accountState} variant="drawer" pathname={pathname} onNavigate={() => setIsMobileOpen(false)} />
              </div>

              <div>
                <p className="text-sm font-medium mt-3">Clubs</p>
                <div className="ml-3 mt-1 space-y-1 text-sm">
                  {clubItems.map((club) => (
                    <Link
                      key={club.href}
                      href={club.href}
                      onClick={() => setIsMobileOpen(false)}
                      className="block"
                    >
                      {club.label}
                    </Link>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

function accountStateFor(user: User | null): HeaderAccountState {
  if (!user) return { status: "signed-out" };
  const metadataName = user.user_metadata?.full_name;
  const name = typeof metadataName === "string" && metadataName.trim()
    ? metadataName.trim().replace(/\s+/g, " ")
    : user.email?.split("@")[0] || "Techtronica member";
  const initials = name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => Array.from(part)[0]?.toLocaleUpperCase() ?? "")
    .join("") || "T";
  return { status: "signed-in", name: name.slice(0, 40), initials };
}

function HeaderAccountLinks({
  account,
  variant,
  pathname,
  onNavigate,
}: {
  account: HeaderAccountState;
  variant: "desktop" | "mobile" | "drawer";
  pathname: string;
  onNavigate?: () => void;
}) {
  const signInHref = `/auth/sign-in?next=${encodeURIComponent(pathname || "/")}`;

  if (account.status === "loading") {
    return <span role="status" aria-label="Loading account" className={`inline-block animate-pulse rounded-full bg-slate-200/80 ${variant === "mobile" ? "size-9" : "h-10 w-24"}`} />;
  }

  if (account.status === "signed-out") {
    if (variant === "mobile") {
      return <Link href={signInHref} className="inline-flex min-h-9 items-center gap-1.5 rounded-full border border-sky-200 bg-white/80 px-3 text-xs font-semibold text-sky-800 shadow-sm transition hover:bg-sky-50"><LogIn aria-hidden="true" className="size-3.5" /> Sign in</Link>;
    }
    if (variant === "drawer") {
      return <div className="grid grid-cols-2 gap-3">
        <Link href={signInHref} onClick={onNavigate} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-slate-300 px-4 text-sm font-semibold text-slate-700 transition hover:border-sky-300 hover:bg-sky-50"><LogIn aria-hidden="true" className="size-4" /> Sign in</Link>
        <Link href="/auth/sign-up" onClick={onNavigate} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-sky-700 px-4 text-sm font-semibold text-white transition hover:bg-sky-800"><UserPlus aria-hidden="true" className="size-4" /> Sign up</Link>
      </div>;
    }
    return <div className="flex shrink-0 items-center gap-1.5 xl:gap-2">
      <Link href={signInHref} className="inline-flex min-h-9 items-center gap-1 rounded-full px-2.5 text-xs font-semibold text-slate-700 transition hover:bg-sky-50 hover:text-sky-800 xl:px-3 xl:text-sm"><LogIn aria-hidden="true" className="hidden size-3.5 xl:block" /> Sign in</Link>
      <Link href="/auth/sign-up" className="inline-flex min-h-9 items-center gap-1 rounded-full bg-gradient-to-r from-sky-600 to-indigo-600 px-3 text-xs font-semibold text-white shadow-sm transition hover:from-sky-700 hover:to-indigo-700 xl:gap-1.5 xl:px-3.5 xl:text-sm"><UserPlus aria-hidden="true" className="hidden size-3.5 xl:block" /> Sign up</Link>
    </div>;
  }

  const isProfileActive = pathname.startsWith("/account");
  const profileLinkClass = `inline-flex min-h-10 items-center gap-2 rounded-full border px-2.5 py-1.5 text-sm font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500 ${isProfileActive ? "border-sky-200 bg-sky-50 text-sky-800" : "border-slate-200 bg-white/80 text-slate-700 hover:border-sky-200 hover:bg-sky-50 hover:text-sky-800"}`;

  if (variant === "mobile") {
    return <Link href="/account" aria-label={`Open ${account.name}'s profile`} title="Profile" className={`${profileLinkClass} size-10 justify-center p-0 sm:w-auto sm:justify-start sm:px-2.5`}>
      <span className="grid size-7 shrink-0 place-items-center rounded-full bg-gradient-to-br from-sky-500 to-indigo-600 text-[10px] font-bold text-white">{account.initials}</span>
      <span className="hidden sm:inline">Profile</span>
    </Link>;
  }

  if (variant === "drawer") {
    return <div className="space-y-2">
      <Link href="/account" onClick={onNavigate} className="flex min-h-14 items-center gap-3 rounded-2xl bg-gradient-to-r from-sky-50 to-violet-50 p-3 text-slate-900">
        <span className="grid size-10 shrink-0 place-items-center rounded-full bg-gradient-to-br from-sky-500 to-indigo-600 text-xs font-bold text-white">{account.initials}</span>
        <span className="min-w-0 flex-1"><span className="block text-sm font-bold">Profile</span><span className="block truncate text-xs text-slate-500">{account.name}</span></span>
        <UserRound aria-hidden="true" className="size-4 shrink-0 text-sky-700" />
      </Link>
      <Link href="/account/settings" onClick={onNavigate} className="block rounded-xl px-3 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-100 hover:text-sky-800">Profile settings</Link>
    </div>;
  }

  return <Link href="/account" className={profileLinkClass} aria-current={isProfileActive ? "page" : undefined} aria-label={`Open ${account.name}'s profile`}>
    <span className="grid size-7 shrink-0 place-items-center rounded-full bg-gradient-to-br from-sky-500 to-indigo-600 text-[10px] font-bold text-white">{account.initials}</span>
    <span>Profile</span>
  </Link>;
}

function NavItem({
  href,
  icon,
  active,
}: {
  href: string;
  icon: React.ReactNode;
  active: boolean;
}) {
  return (
    <Link
      href={href}
      className={`flex flex-col items-center ${
        active ? "text-blue-600" : ""
      }`}
    >
      <div className="text-xl">{icon}</div>
    </Link>
  );
}
