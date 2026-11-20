"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { Logo } from "./Logo";
import { navLinks, site } from "@/lib/site";

export function Header() {
  const pathname = usePathname();
  // The menu is open only for the page it was opened on, so navigating closes it.
  const [openAt, setOpenAt] = useState<string | null>(null);
  const open = openAt === pathname;
  const buttonRef = useRef<HTMLButtonElement>(null);

  // Escape closes the menu and returns focus to the toggle.
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setOpenAt(null);
        buttonRef.current?.focus();
      }
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open]);

  return (
    <header className="sticky top-0 z-40 border-b border-slate-200/80 bg-white/90 backdrop-blur supports-[backdrop-filter]:bg-white/80">
      <div className="mx-auto flex h-18 max-w-7xl items-center justify-between gap-6 px-4 sm:px-6 lg:px-8">
        <Link href="/" aria-label={`${site.name} — home`} className="rounded-md">
          <Logo />
        </Link>

        <nav aria-label="Primary" className="hidden md:block">
          <ul className="flex items-center gap-1">
            {navLinks.map((l) => {
              const current = l.href === "/" ? pathname === "/" : pathname.startsWith(l.href);
              return (
                <li key={l.href}>
                  <Link
                    href={l.href}
                    aria-current={current ? "page" : undefined}
                    className="rounded-md px-3.5 py-2 text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-100 hover:text-brand-900 aria-[current=page]:text-brand-900 aria-[current=page]:underline aria-[current=page]:decoration-accent-600 aria-[current=page]:decoration-2 aria-[current=page]:underline-offset-8"
                  >
                    {l.label}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        <div className="hidden items-center gap-4 md:flex">
          <a href={`tel:${site.phoneHref}`} className="text-sm font-bold text-brand-900 hover:text-accent-700">
            {site.phone}
          </a>
          <Link href="/contact" className="btn btn-primary">Free Estimate</Link>
        </div>

        <button
          ref={buttonRef}
          type="button"
          className="inline-flex items-center gap-2 rounded-md border border-slate-300 px-3 py-2 text-sm font-semibold text-brand-900 md:hidden"
          aria-expanded={open}
          aria-controls="mobile-menu"
          onClick={() => setOpenAt(open ? null : pathname)}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
            {open ? <path d="M6 6l12 12M18 6 6 18" /> : <path d="M4 7h16M4 12h16M4 17h16" />}
          </svg>
          {open ? "Close" : "Menu"}
        </button>
      </div>

      {open && (
        <nav id="mobile-menu" aria-label="Mobile" className="border-t border-slate-200 bg-white md:hidden">
          <ul className="mx-auto flex max-w-7xl flex-col px-4 py-3 sm:px-6">
            {navLinks.map((l) => {
              const current = l.href === "/" ? pathname === "/" : pathname.startsWith(l.href);
              return (
                <li key={l.href}>
                  <Link
                    href={l.href}
                    aria-current={current ? "page" : undefined}
                    className="block rounded-md px-3 py-3 text-base font-semibold text-slate-800 hover:bg-slate-100 aria-[current=page]:bg-brand-50 aria-[current=page]:text-brand-900"
                  >
                    {l.label}
                  </Link>
                </li>
              );
            })}
            <li className="mt-2 grid grid-cols-2 gap-3 pb-2">
              <a href={`tel:${site.phoneHref}`} className="btn btn-secondary">Call now</a>
              <Link href="/contact" className="btn btn-primary">Free Estimate</Link>
            </li>
          </ul>
        </nav>
      )}
    </header>
  );
}
