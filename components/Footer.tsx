"use client";

import Link from "next/link";
import Image from "next/image";
import LastUpdated from "./features/LastUpdate";
import Version from "./features/Version";

function Footer() {
  return (
    <footer className="mt-0">
      <div className="bg-slate-100 px-4">\
        <div className="mx-auto max-w-7xl rounded-t-3xl bg-white dark:bg-slate-900 shadow-[0_-12px_40px_rgba(0,0,0,0.08)]">
          <div className="mx-auto max-w-6xl px-4 py-30">
            <div className="flex flex-col gap-12 lg:flex-row ">
              <div className="flex-1 space-y-5">
                <div className="relative h-14 w-40 sm:h-16 sm:w-48">
                  <Link href="/">
                    <Image
                      src="/logo.png"
                      alt="Techtronica Logo"
                      
                      fill
                      className="object-contain"
                    />
                  </Link>
                </div>

                <div className="space-y-2 text-xs sm:text-sm max-w-md">
                  <p className="font-semibold text-sky-700">
                    GLA UNIVERSITY, Mathura
                  </p>
                  <p className="text-slate-700">
                    Department of{" "}
                    <span className="font-semibold">
                      Electronics and Communication Engineering
                    </span>
                  </p>
                  <p className="text-slate-500 leading-relaxed">
                    A student society connecting circuits, communication, and
                    creativity through hands-on projects, events, and
                    collaboration.
                  </p>
                </div>
              </div>

              <div className="flex-1 grid grid-cols-2 gap-y-10 gap-x-8 sm:grid-cols-4 ">
                <div>
                  <h3 className="mb-4 text-[11px] font-semibold uppercase tracking-wider text-sky-700">
                    Navigate
                  </h3>
                  <ul className="space-y-2 text-xs sm:text-sm">
                    <li>
                      <Link href="/" className="footer-link">
                        Home
                      </Link>
                    </li>
                    <li>
                      <Link href="/clubs" className="footer-link">
                        Clubs
                      </Link>
                    </li>
                    <li>
                      <Link href="/gallery" className="footer-link">
                        Gallery
                      </Link>
                    </li>
                    <li>
                      <Link href="/events" className="footer-link">
                        Events
                      </Link>
                    </li>
                  </ul>
                </div>

                <div>
                  <h3 className="mb-4 text-[11px] font-semibold uppercase tracking-wider text-sky-700">
                    About
                  </h3>
                  <ul className="space-y-2 text-xs sm:text-sm">
                    <li>
                      <Link href="/about" className="footer-link">
                        About Techtronica
                      </Link>
                    </li>
                    <li>
                      <Link href="/alumni" className="footer-link">
                        Alumni
                      </Link>
                    </li>
                    <li>
                      <Link href="/contact" className="footer-link">
                        Contact Us
                      </Link>
                    </li>
                    <li>
                      <Link href="/privacy-policy" className="footer-link">
                        Privacy Policy
                      </Link>
                    </li>
                    <li>
                      <Link href="/terms" className="footer-link">
                        Terms
                      </Link>
                    </li>
                    <li>
                      <Link href="/code-of-conduct" className="footer-link">
                        Code of Conduct
                      </Link>
                    </li>
                    <li>
                      <Link href="/faq" className="footer-link">
                        FAQ
                      </Link>
                    </li>
                    <li>
                      <Link href="/refund-policy" className="footer-link">
                        Refund Policy
                      </Link>
                    </li>
                  </ul>
                </div>

                <div>
                  <h3 className="mb-4 text-[11px] font-semibold uppercase tracking-wider text-sky-700">
                    Connect
                  </h3>
                  <ul className="space-y-2 text-xs sm:text-sm">
                    <li>
                      <a
                        href="https://www.instagram.com/techtronica_glau"
                        className="footer-link"
                      >
                        Instagram
                      </a>
                    </li>
                    <li>
                      <a
                        href="https://www.linkedin.com/company/techtronica-society2016/"
                        className="footer-link"
                      >
                        LinkedIn
                      </a>
                    </li>
                    <li>
                      <a
                        href="mailto:techtronica@gla.ac.in"
                        className="footer-link break-all"
                      >
                        techtronica@gla.ac.in
                      </a>
                    </li>
                  </ul>
                </div>

                <div>
                  <h3 className="mb-4 text-[11px] font-semibold uppercase tracking-wider text-sky-700 ">
                    Official Links
                  </h3>
                  <ul className="space-y-2 text-xs sm:text-sm">
                    <li>
                      <a
                        href="https://www.gla.ac.in"
                        target="_blank"
                        className="footer-link"
                      >
                        GLA University Website
                      </a>
                    </li>
                    <li>
                      <a
                        href="https://www.gla.ac.in/academics/department-of-electronics-communication-engineering"
                        target="_blank"
                        className="footer-link"
                      >
                        ECE Department Page
                      </a>
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          </div>




          {/* Bottom */}
          <div className="relative overflow-hidden border-t border-slate-200 dark:border-slate-800 bg-slate-50">
            {/* BIG BACKGROUND BRAND */}
            <div className="pointer-events-none absolute inset-x-0 bottom-0 flex flex-col items-center">
              {/* YEAR (attached + readable) */}
              {/* <span className="select-none rounded-full bg-white dark:bg-slate-900/80 px-4 py-1 text-[12px] sm:text-sm font-semibold tracking-wide text-slate-400 shadow-sm mb-2">
                {new Date().getFullYear()}
              </span> */}

              {/* BRAND NAME */}
              <span className="select-none text-[22vw] sm:text-[18vw] md:text-[16vw] font-extrabold tracking-tight text-slate-200 leading-none -mb-8">
                Techtronica
              </span>
            </div>
            {/* FOREGROUND COPYRIGHT */}

            <div className="relative mx-auto max-w-6xl px-4 py-8 text-[11px] text-muted text-center sm:text-left">
              © {new Date().getFullYear()} Techtronica 
              {/* • GLA University • */}
              {/* Electronics & Communication Engineering */}
              <Version />
              <LastUpdated />
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}

export default Footer;
