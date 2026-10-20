"use client";

import PendingSubmitButton from "@/components/ui/PendingSubmitButton";
import NotificationBell from "@/components/notifications/NotificationBell";
import { useEffect, useRef, useState } from "react";
import { useAuth, useUser } from "@clerk/nextjs";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import {
  Activity, BriefcaseBusiness, CalendarDays, ChevronDown, ChevronRight,
  Code2, GraduationCap, House, Info, Library, LogIn, LogOut, Mail, Menu,
  Sparkles, UserPlus, UserRound, Users, X,
} from "lucide-react";
import { signOutAction } from "@/app/auth/actions";

const navLinks = [
  { href: "/", label: "Home", icon: House },
  { href: "/clubs", label: "Clubs", icon: Users },
  { href: "/events", label: "Events", icon: CalendarDays },
  { href: "/projects", label: "Projects", icon: Code2 },
  { href: "/research", label: "Research", icon: Sparkles },
  { href: "/library", label: "Library", icon: Library, badge: "NEW" },
  { href: "/about", label: "About us", icon: Info },
  { href: "/alumni", label: "Alumni", icon: GraduationCap },
  { href: "/contact", label: "Contact us", icon: Mail },
];

const clubItems = [
  { href: "/clubs/code-e-phobia", label: "Code-E-Phobia" },
  { href: "/clubs/mindboggler", label: "Mindboggler" },
  { href: "/clubs/technovation", label: "Technovation" },
  { href: "/clubs/unnati", label: "Unnati" },
  { href: "/clubs/gizmo", label: "Gizmo" },
];

const comingSoonItems = [
  { label: "Internships", icon: BriefcaseBusiness },
  { label: "Mentorship", icon: GraduationCap },
  { label: "Member activity", icon: Activity },
];

type HeaderAccountState =
  | { status: "loading" }
  | { status: "signed-out" }
  | { status: "signed-in"; userId: string; name: string; initials: string; avatarUrl: string | null };

export default function Navbar() {
  const [account, setAccount] = useState<HeaderAccountState>({ status: "loading" });
  const [menuOpen, setMenuOpen] = useState(false);
  const [clubsOpen, setClubsOpen] = useState(false);
  const [sidebarPinned, setSidebarPinned] = useState(false);
  const [sidebarHovered, setSidebarHovered] = useState(false);
  const pathname = usePathname();
  const { isLoaded: authLoaded, userId: clerkId } = useAuth();
  const { user: clerkUser } = useUser();
  const drawerRef = useRef<HTMLDivElement | null>(null);
  const triggerRef = useRef<HTMLButtonElement | null>(null);
  const sidebarExpanded = sidebarPinned || sidebarHovered;
  const userId = account.status === "signed-in" ? account.userId : null;

  const isActive = (href: string) => href === "/" ? pathname === "/" : pathname.startsWith(href);
  const pageLabel = navLinks.find((link) => isActive(link.href))?.label ?? "Techtronica";

  useEffect(() => {
    if (!authLoaded) return;
    if (!clerkId) {
      setAccount({ status: "signed-out" });
      return;
    }

    let active = true;
    const fallbackName = clerkUser?.fullName?.trim()
      || clerkUser?.primaryEmailAddress?.emailAddress.split("@")[0]
      || "Techtronica member";
    setAccount(accountStateFor("", fallbackName, clerkUser?.imageUrl ?? null));

    void fetch("/api/account/identity", { cache: "no-store", credentials: "same-origin" })
      .then(async (response) => {
        if (!response.ok) throw new Error("Profile identity unavailable");
        return response.json() as Promise<{ id: string; fullName: string; avatarUrl: string | null }>;
      })
      .then((identity) => {
        if (active) setAccount(accountStateFor(identity.id, identity.fullName || fallbackName, identity.avatarUrl));
      })
      .catch(() => {
        // Keep the Clerk account visible; the profile UUID is needed only for database notifications.
      });

    return () => { active = false; };
  }, [authLoaded, clerkId, clerkUser?.id, clerkUser?.fullName, clerkUser?.imageUrl, clerkUser?.primaryEmailAddress?.emailAddress]);

  useEffect(() => {
    if (!menuOpen) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const panel = drawerRef.current;
    const focusable = () => Array.from(panel?.querySelectorAll<HTMLElement>('a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])') ?? []).filter((element) => element.offsetParent !== null);
    focusable()[0]?.focus();
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") { event.preventDefault(); setMenuOpen(false); return; }
      if (event.key !== "Tab") return;
      const elements = focusable();
      if (!elements.length) { event.preventDefault(); return; }
      const first = elements[0];
      const last = elements[elements.length - 1];
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
    };
    const closeOnOutsideClick = (event: PointerEvent) => {
      if (panel && !panel.contains(event.target as Node)) setMenuOpen(false);
    };
    document.addEventListener("keydown", handleKeyDown);
    document.addEventListener("pointerdown", closeOnOutsideClick);
    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", handleKeyDown);
      document.removeEventListener("pointerdown", closeOnOutsideClick);
      triggerRef.current?.focus();
    };
  }, [menuOpen]);

  useEffect(() => setMenuOpen(false), [pathname]);

  return (
    <>
      <aside
        onMouseEnter={() => setSidebarHovered(true)}
        onMouseLeave={() => setSidebarHovered(false)}
        className={`fixed inset-y-0 left-0 z-[60] hidden flex-col border-r border-slate-200 bg-white/95 px-3 py-4 shadow-[8px_0_32px_rgba(15,23,42,.06)] backdrop-blur-xl transition-[width] duration-300 dark:border-slate-800 dark:bg-slate-950/95 lg:flex ${sidebarExpanded ? "w-64" : "w-[4.5rem]"}`}
      >
        <div className={`mb-6 flex h-12 items-center ${sidebarExpanded ? "justify-between px-1" : "justify-center"}`}>
          <Link href="/" aria-label="Techtronica home" className={`relative block shrink-0 transition-all duration-300 ${sidebarExpanded ? "h-11 w-40" : "h-10 w-10 overflow-hidden rounded-full bg-sky-50 dark:bg-slate-800"}`}>
            {sidebarExpanded
              ? <Image src="/logo.png" alt="Techtronica Society" fill priority sizes="160px" className="object-contain object-left" />
              : <span aria-hidden="true" className="grid size-full place-items-center text-sm font-black text-sky-700">T</span>}
          </Link>
          {sidebarExpanded && <button type="button" onClick={() => { setSidebarPinned(false); setSidebarHovered(false); }} aria-label="Collapse navigation sidebar" className="grid size-9 place-items-center rounded-lg text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"><ChevronDown className="size-4 -rotate-90" /></button>}
        </div>
        {sidebarExpanded && <p className="mb-3 px-3 text-[10px] font-bold uppercase tracking-[.16em] text-slate-400">Explore</p>}
        <nav aria-label="Main navigation" className="min-h-0 flex-1 space-y-1 overflow-y-auto overflow-x-hidden">
          {navLinks.map((link) => {
            const Icon = link.icon;
            const active = isActive(link.href);
            return (
              <div key={link.href}>
                <div className={`flex items-center rounded-xl transition ${active ? "bg-sky-50 text-sky-800 dark:bg-sky-950/60 dark:text-sky-200" : "text-slate-600 hover:bg-slate-50 hover:text-sky-800 dark:text-slate-300 dark:hover:bg-slate-900"}`}>
                  <Link href={link.href} title={!sidebarExpanded ? link.label : undefined} aria-current={active ? "page" : undefined} className={`flex min-h-11 min-w-0 flex-1 items-center rounded-xl text-sm font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500 ${sidebarExpanded ? "gap-3 px-3" : "justify-center px-2"}`}>
                    <Icon aria-hidden="true" className={`size-[18px] shrink-0 ${active ? "text-sky-600" : "text-slate-400"}`} />
                    {sidebarExpanded && <><span className="truncate">{link.label}</span>{link.badge && <span className="ml-auto rounded-full bg-sky-100 px-2 py-0.5 text-[9px] font-bold text-sky-700">{link.badge}</span>}</>}
                  </Link>
                  {sidebarExpanded && link.href === "/clubs" && <button type="button" onClick={() => setClubsOpen((open) => !open)} aria-label={clubsOpen ? "Collapse clubs" : "Expand clubs"} aria-expanded={clubsOpen} className="mr-1 rounded-lg p-2 text-slate-400 hover:bg-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500 dark:hover:bg-slate-800">{clubsOpen ? <ChevronDown className="size-4" /> : <ChevronRight className="size-4" />}</button>}
                </div>
                {sidebarExpanded && link.href === "/clubs" && clubsOpen && <div className="ml-8 mt-1 space-y-1 border-l border-slate-200 pl-3 dark:border-slate-700">{clubItems.map((club) => <Link key={club.href} href={club.href} className={`block rounded-lg px-3 py-2 text-xs transition hover:bg-sky-50 hover:text-sky-800 dark:hover:bg-slate-900 ${pathname === club.href ? "font-semibold text-sky-700" : "text-slate-500"}`}>{club.label}</Link>)}</div>}
              </div>
            );
          })}
          {sidebarExpanded && <div className="pt-5"><p className="mb-2 px-3 text-[10px] font-bold uppercase tracking-[.16em] text-slate-400">Coming soon</p>{comingSoonItems.map((item) => { const Icon = item.icon; return <div key={item.label} title={`${item.label} — coming soon`} className="group flex min-h-11 items-center gap-3 rounded-xl px-3 text-slate-400"><Icon className="size-[18px] shrink-0" /><span className="flex-1 text-sm">{item.label}</span><span className="animate-pulse rounded-full bg-slate-100 px-2 py-0.5 text-[9px] font-semibold text-slate-500 dark:bg-slate-800 dark:text-slate-300">Soon</span></div>; })}</div>}
        </nav>
        <div className="mt-3 border-t border-slate-200 pt-3 dark:border-slate-800">
          {account.status === "signed-in" ? (
            <>
              <Link href="/account" title={!sidebarExpanded ? "Profile" : undefined} className={`flex min-h-12 items-center rounded-xl hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500 dark:hover:bg-slate-900 ${sidebarExpanded ? "gap-3 p-2" : "justify-center"}`}>
                <Avatar account={account} size="size-9" />
                {sidebarExpanded && <span className="min-w-0 flex-1"><span className="block text-[10px] text-slate-400">Signed in as</span><span className="block truncate text-sm font-semibold text-slate-800 dark:text-slate-100">{account.name}</span></span>}
              </Link>
              <form action={signOutAction} className={sidebarExpanded ? "mt-1" : "mt-1"}>
                <PendingSubmitButton type="submit" pendingLabel={sidebarExpanded ? "Signing out…" : "…"} aria-label="Sign out" title="Sign out" className={`inline-flex min-h-10 w-full items-center rounded-xl text-sm font-medium text-slate-600 transition hover:bg-rose-50 hover:text-rose-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-500 dark:text-slate-300 dark:hover:bg-rose-950/40 ${sidebarExpanded ? "gap-3 px-3" : "justify-center"}`}><LogOut aria-hidden="true" className="size-[18px]" />{sidebarExpanded && "Sign out"}</PendingSubmitButton>
              </form>
            </>
          ) : account.status === "loading" ? <div className="mx-auto size-9 animate-pulse rounded-full bg-slate-100 dark:bg-slate-900" aria-label="Loading account" /> : (
            <Link href={`/auth/sign-in?next=${encodeURIComponent(pathname || "/")}`} title="Sign in" className={`inline-flex min-h-10 w-full items-center rounded-xl text-sm font-semibold text-sky-700 hover:bg-sky-50 dark:hover:bg-slate-900 ${sidebarExpanded ? "gap-3 px-3" : "justify-center"}`}><LogIn className="size-[18px]" />{sidebarExpanded && "Sign in"}</Link>
          )}
        </div>
      </aside>

      <header className="fixed left-[4.5rem] right-0 top-0 z-40 hidden h-20 items-center justify-between border-b border-slate-200 bg-white/95 px-5 shadow-[0_4px_20px_rgba(15,23,42,0.04)] backdrop-blur-xl dark:border-slate-800 dark:bg-slate-950/90 lg:flex">
        <div className="flex min-w-0 items-center gap-4">
          <button type="button" onClick={() => setSidebarPinned((pinned) => !pinned)} aria-label={sidebarPinned ? "Unpin sidebar" : "Pin sidebar open"} aria-pressed={sidebarPinned} className="grid size-10 shrink-0 place-items-center rounded-xl border border-slate-200 bg-white text-slate-600 shadow-sm transition hover:border-sky-200 hover:bg-sky-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500 dark:text-slate-200 dark:hover:bg-slate-800"><Menu className="size-5" /></button>
          <div className="min-w-0"><p className="truncate text-sm font-semibold text-slate-900 dark:text-white">{pageLabel}</p><p className="hidden text-[11px] text-slate-400 xl:block">Techtronica Society · GLA University</p></div>
        </div>
        <div className="flex shrink-0 items-center gap-3">
          {account.status === "signed-in" && account.userId && <NotificationBell userId={account.userId} />}
          {account.status === "signed-in" ? <Link href="/account" className="flex items-center gap-2 rounded-full border border-slate-200 bg-white/70 py-1 pl-1 pr-3 text-sm font-medium text-slate-700 transition hover:border-sky-300 hover:bg-sky-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"><Avatar account={account} size="size-8" /><span className="max-w-36 truncate">{account.name}</span><ChevronDown className="size-4 text-slate-400" /></Link> : account.status === "signed-out" ? <Link href={`/auth/sign-in?next=${encodeURIComponent(pathname || "/")}`} className="inline-flex min-h-10 items-center gap-2 rounded-xl bg-sky-600 px-4 text-sm font-semibold text-white hover:bg-sky-700"><LogIn className="size-4" />Sign in</Link> : <span className="size-9 animate-pulse rounded-full bg-slate-200" aria-label="Loading account" />}
        </div>
      </header>

      <header className="fixed inset-x-0 top-0 z-50 border-b border-slate-200 bg-white/95 px-3 py-2 shadow-[0_4px_20px_rgba(15,23,42,0.04)] backdrop-blur-xl dark:border-slate-800 dark:bg-slate-950/90 lg:hidden">
        <div className="mx-auto flex h-12 max-w-7xl items-center justify-between gap-3">
          <button ref={triggerRef} type="button" onClick={() => setMenuOpen(true)} aria-label="Open navigation menu" aria-expanded={menuOpen} aria-controls="mobile-navigation" className="grid size-10 shrink-0 place-items-center rounded-full bg-sky-50 text-slate-700 transition hover:bg-sky-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500 dark:bg-slate-800 dark:text-slate-100"><Menu aria-hidden="true" className="size-5" /></button>
          <Link href="/" className="relative h-10 w-32 flex-1" aria-label="Techtronica home"><Image src="/logo.png" alt="" fill sizes="128px" className="object-contain" priority /></Link>
          {account.status === "signed-in" && <NotificationBell userId={account.userId} />}
          {account.status === "signed-in" ? <Link href="/account" aria-label={`Open ${account.name}'s profile`} className="rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500"><Avatar account={account} size="size-10" /></Link> : account.status === "signed-out" ? <Link href={`/auth/sign-in?next=${encodeURIComponent(pathname || "/")}`} aria-label="Sign in" className="grid size-10 place-items-center rounded-full bg-sky-50 text-sky-700 dark:bg-slate-800 dark:text-sky-200"><LogIn className="size-5" /></Link> : <span className="size-10 animate-pulse rounded-full bg-slate-200 dark:bg-slate-800" aria-label="Loading account" />}
        </div>
      </header>

      {menuOpen && <div className="fixed inset-0 z-[70] bg-slate-950/45 backdrop-blur-[2px] lg:hidden"><div id="mobile-navigation" ref={drawerRef} role="dialog" aria-modal="true" aria-label="Navigation menu" className="absolute inset-y-0 left-0 flex w-[min(88vw,350px)] flex-col overflow-y-auto bg-white p-4 shadow-2xl dark:bg-slate-950">
        <div className="mb-5 flex items-center justify-between border-b border-slate-100 pb-4 dark:border-slate-800"><Link href="/" onClick={() => setMenuOpen(false)} className="relative h-11 w-36"><Image src="/logo.png" alt="Techtronica" fill sizes="144px" className="object-contain object-left" /></Link><button type="button" onClick={() => setMenuOpen(false)} aria-label="Close navigation menu" className="grid size-10 place-items-center rounded-full bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-100"><X className="size-5" /></button></div>
        <nav aria-label="Mobile navigation" className="flex-1 space-y-1">{navLinks.map((link) => { const Icon = link.icon; const active = isActive(link.href); return <div key={link.href}><Link href={link.href} onClick={() => setMenuOpen(false)} aria-current={active ? "page" : undefined} className={`flex min-h-12 items-center gap-3 rounded-xl px-3 text-sm font-medium ${active ? "bg-sky-50 text-sky-800 dark:bg-sky-950/60 dark:text-sky-200" : "text-slate-700 hover:bg-slate-50 dark:text-slate-200 dark:hover:bg-slate-900"}`}><Icon aria-hidden="true" className="size-5 text-sky-600" />{link.label}{link.badge && <span className="ml-auto rounded-full bg-sky-100 px-2 py-0.5 text-[9px] font-bold text-sky-700">{link.badge}</span>}</Link>{link.href === "/clubs" && <div className="ml-8 mt-1 grid grid-cols-2 gap-1">{clubItems.map((club) => <Link key={club.href} href={club.href} onClick={() => setMenuOpen(false)} className="rounded-lg px-2 py-2 text-xs text-slate-500 hover:bg-sky-50 hover:text-sky-800 dark:hover:bg-slate-900">{club.label}</Link>)}</div>}</div>; })}</nav>
        <div className="mt-4 border-t border-slate-200 pt-4 dark:border-slate-800"><p className="mb-2 px-3 text-[10px] font-bold uppercase tracking-[.16em] text-slate-400">Coming soon</p><div className="mb-4 grid grid-cols-3 gap-2">{comingSoonItems.map((item) => { const Icon = item.icon; return <div key={item.label} className="flex min-h-20 flex-col items-center justify-center gap-2 rounded-xl border border-slate-200 bg-slate-50 p-2 text-center text-[10px] font-medium text-slate-500 dark:border-slate-700 dark:bg-slate-900"><Icon className="size-4 text-slate-500" /><span>{item.label}</span><span className="animate-pulse text-[9px] font-bold uppercase tracking-wide text-slate-500 dark:text-slate-300">Soon</span></div>; })}</div>
          {account.status === "signed-in" ? <><Link href="/account" onClick={() => setMenuOpen(false)} className="mb-3 flex min-h-14 items-center gap-3 rounded-xl bg-sky-50 p-3 dark:bg-slate-900"><Avatar account={account} size="size-11" /><span className="min-w-0 flex-1"><span className="block text-[11px] text-slate-500">Your account</span><span className="block truncate text-sm font-semibold text-slate-900 dark:text-white">{account.name}</span></span><UserRound className="size-4 text-sky-700" /></Link><Link href="/account/settings" onClick={() => setMenuOpen(false)} className="mb-2 block rounded-xl px-3 py-2 text-sm text-slate-600 hover:bg-slate-50 dark:text-slate-300 dark:hover:bg-slate-900">Profile settings</Link><form action={signOutAction}><PendingSubmitButton type="submit" pendingLabel="Signing out…" className="inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-rose-50 px-4 text-sm font-semibold text-rose-700 hover:bg-rose-100 dark:bg-rose-950/40 dark:text-rose-200"><LogOut className="size-4" />Sign out</PendingSubmitButton></form></> : account.status === "loading" ? <div className="h-14 animate-pulse rounded-xl bg-slate-100 dark:bg-slate-900" aria-label="Loading account" /> : <div className="grid grid-cols-2 gap-2"><Link href={`/auth/sign-in?next=${encodeURIComponent(pathname || "/")}`} onClick={() => setMenuOpen(false)} className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl border border-slate-200 text-sm font-semibold text-slate-700 dark:border-slate-700 dark:text-slate-100"><LogIn className="size-4" />Sign in</Link><Link href="/auth/sign-up" onClick={() => setMenuOpen(false)} className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-sky-600 text-sm font-semibold text-white"><UserPlus className="size-4" />Sign up</Link></div>}
        </div>
      </div><button type="button" className="absolute inset-0 -z-10 cursor-default" aria-label="Close navigation menu" onClick={() => setMenuOpen(false)} /></div>}
    </>
  );
}

function accountStateFor(userId: string, value: string, avatarUrl: string | null): HeaderAccountState {
  const name = value.trim().replace(/\s+/g, " ") || "Techtronica member";
  const initials = name.split(/\s+/).filter(Boolean).slice(0, 2)
    .map((part) => Array.from(part)[0]?.toLocaleUpperCase() ?? "").join("") || "T";
  return { status: "signed-in", userId, name: name.slice(0, 40), initials, avatarUrl };
}

function Avatar({ account, size }: { account: Extract<HeaderAccountState, { status: "signed-in" }>; size: string }) {
  return <span className={`relative grid ${size} shrink-0 place-items-center overflow-hidden rounded-full bg-gradient-to-br from-sky-600 to-sky-800 text-xs font-bold text-white ring-2 ring-white shadow-sm dark:ring-slate-900`}>{account.avatarUrl ? <Image alt="" aria-hidden="true" className="object-cover" fill sizes="44px" src={account.avatarUrl} unoptimized /> : account.initials}</span>;
}
