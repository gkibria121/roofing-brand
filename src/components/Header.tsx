"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useId, useRef } from "react";
import { SERVICE_AREAS } from "@/lib/serviceAreas";
import { productsMegaMenu, site } from "@/lib/site";
import { Logo } from "./Logo";

interface SubmenuEntry {
  li: HTMLLIElement | null;
  trigger: HTMLButtonElement | null;
  list: HTMLElement | null;
}

type PopoverEl = HTMLElement & {
  showPopover?: (options?: { source?: HTMLElement }) => void;
  hidePopover?: () => void;
};

function isPopoverShown(el: HTMLElement | null): boolean {
  if (!el) return false;
  try {
    return el.matches(":popover-open") || el.classList.contains(":popover-open");
  } catch {
    return el.classList.contains(":popover-open");
  }
}

export function Header() {
  const pathname = usePathname();
  const uid = useId();
  const menuId = `${uid}-site-menu`;
  const productsMenuId = `${uid}-products-menu`;
  const areasMenuId = `${uid}-areas-menu`;

  const headerRef = useRef<HTMLElement>(null);
  const innerRef = useRef<HTMLDivElement>(null);
  const menuRef = useRef<HTMLUListElement>(null);

  const productsLiRef = useRef<HTMLLIElement>(null);
  const productsBtnRef = useRef<HTMLButtonElement>(null);
  const productsListRef = useRef<HTMLDivElement>(null);

  const areasLiRef = useRef<HTMLLIElement>(null);
  const areasBtnRef = useRef<HTMLButtonElement>(null);
  const areasListRef = useRef<HTMLUListElement>(null);

  // Conditionally load Popover polyfill only when native Popover API is missing.
  useEffect(() => {
    if (typeof HTMLElement !== "undefined" && !Object.hasOwn(HTMLElement.prototype, "popover")) {
      import("@oddbird/popover-polyfill").catch(() => {});
    }
  }, []);

  // Measure inline fit with ResizeObserver and synchronize popover attributes & wide submenus.
  useEffect(() => {
    const header = headerRef.current;
    const inner = innerRef.current;
    const menu = menuRef.current as PopoverEl | null;
    if (!header || !inner || !menu) return;

    const submenus: SubmenuEntry[] = [
      { li: productsLiRef.current, trigger: productsBtnRef.current, list: productsListRef.current },
      { li: areasLiRef.current, trigger: areasBtnRef.current, list: areasListRef.current },
    ];

    const hoverPreviewed = new WeakSet<HTMLElement>();
    let lastCollapsedWidth = 0;
    let rafId = 0;

    function syncLayout(forceMeasure = false) {
      if (!header || !inner || !menu) return;
      const wasWide = header.classList.contains("is-wide");
      const currentWidth = header.clientWidth;

      if (!wasWide && !forceMeasure && currentWidth <= lastCollapsedWidth) {
        return;
      }

      const menuWasOpen = !wasWide && isPopoverShown(menu);
      header.classList.add("is-measuring");

      // Measure natural inline width
      header.classList.add("is-wide");
      menu.removeAttribute("popover");
      const fits = inner.scrollWidth <= inner.clientWidth + 1;

      if (fits) {
        header.classList.add("is-wide");
        menu.removeAttribute("popover");
        for (const sub of submenus) {
          if (!sub.list || !sub.trigger) continue;
          sub.list.setAttribute("popover", "auto");
          sub.list.hidden = false;
          sub.trigger.setAttribute("aria-expanded", isPopoverShown(sub.list) ? "true" : "false");
        }
      } else {
        header.classList.remove("is-wide");
        lastCollapsedWidth = currentWidth;
        menu.setAttribute("popover", "auto");
        for (const sub of submenus) {
          if (!sub.list || !sub.trigger) continue;
          sub.list.removeAttribute("popover");
          sub.list.hidden = true;
          sub.trigger.setAttribute("aria-expanded", "false");
          hoverPreviewed.delete(sub.list);
        }
        if (menuWasOpen) {
          try {
            menu.showPopover?.();
          } catch {
            // ignore if polyfill not yet upgraded
          }
        }
      }

      cancelAnimationFrame(rafId);
      rafId = requestAnimationFrame(() => {
        header.classList.remove("is-measuring");
      });
    }

    // Initial measurement
    syncLayout(true);

    const ro = new ResizeObserver(() => syncLayout(false));
    ro.observe(header);
    ro.observe(menu);

    // Wire wide-mode popover toggle, anchor-position JS fallback, hover preview & focusout,
    // and narrow-mode inline disclosure toggle.
    const cleanups: (() => void)[] = [];

    for (const sub of submenus) {
      const { li, trigger, list } = sub;
      if (!li || !trigger || !list) continue;
      const popList = list as PopoverEl;

      const onToggle = (e: Event) => {
        const te = e as Event & { newState?: "open" | "closed" };
        const opened = te.newState === "open";
        trigger.setAttribute("aria-expanded", opened ? "true" : "false");
        if (!opened) {
          hoverPreviewed.delete(list);
          list.style.top = "";
          list.style.left = "";
          return;
        }
        // Fallback viewport-aware placement when CSS position-area is unsupported (e.g. Firefox)
        if (!CSS.supports("position-area", "block-end")) {
          const tRect = trigger.getBoundingClientRect();
          const mRect = list.getBoundingClientRect();
          let top = tRect.bottom + 8;
          if (top + mRect.height > window.innerHeight - 8) {
            top = Math.max(8, tRect.top - mRect.height - 8);
          }
          const maxLeft = Math.max(8, window.innerWidth - mRect.width - 8);
          const left = Math.min(maxLeft, Math.max(8, tRect.left));
          list.style.top = `${top}px`;
          list.style.left = `${left}px`;
        }
      };

      const onTriggerClick = (e: MouseEvent) => {
        if (header.classList.contains("is-wide")) {
          if (hoverPreviewed.has(list) && isPopoverShown(list)) {
            // Pin open instead of closing on first click after hover preview
            e.preventDefault();
            hoverPreviewed.delete(list);
          }
          return;
        }
        // Narrow mode: inline disclosure toggle
        e.preventDefault();
        const nextHidden = !list.hidden;
        list.hidden = nextHidden;
        trigger.setAttribute("aria-expanded", nextHidden ? "false" : "true");
      };

      const onPointerEnter = (e: PointerEvent) => {
        if (!header.classList.contains("is-wide")) return;
        if (e.pointerType === "touch" || !window.matchMedia("(hover: hover)").matches) return;
        if (!isPopoverShown(list)) {
          hoverPreviewed.add(list);
          try {
            popList.showPopover?.({ source: trigger });
          } catch {
            // ignore
          }
        }
      };

      const onPointerLeave = (e: PointerEvent) => {
        if (!header.classList.contains("is-wide")) return;
        if (e.pointerType === "touch") return;
        if (hoverPreviewed.has(list) && isPopoverShown(list)) {
          hoverPreviewed.delete(list);
          try {
            popList.hidePopover?.();
          } catch {
            // ignore
          }
        }
      };

      const onFocusOut = (e: FocusEvent) => {
        if (!header.classList.contains("is-wide")) return;
        const related = e.relatedTarget as Node | null;
        if (related && !li.contains(related) && isPopoverShown(list)) {
          hoverPreviewed.delete(list);
          try {
            popList.hidePopover?.();
          } catch {
            // ignore
          }
        }
      };

      list.addEventListener("toggle", onToggle);
      trigger.addEventListener("click", onTriggerClick);
      li.addEventListener("pointerenter", onPointerEnter);
      li.addEventListener("pointerleave", onPointerLeave);
      li.addEventListener("focusout", onFocusOut);

      cleanups.push(() => {
        list.removeEventListener("toggle", onToggle);
        trigger.removeEventListener("click", onTriggerClick);
        li.removeEventListener("pointerenter", onPointerEnter);
        li.removeEventListener("pointerleave", onPointerLeave);
        li.removeEventListener("focusout", onFocusOut);
      });
    }

    return () => {
      cancelAnimationFrame(rafId);
      ro.disconnect();
      for (const fn of cleanups) fn();
    };
  }, []);

  // Close open navigation popovers whenever route changes.
  function closeAllPopovers() {
    const els = [menuRef.current, productsListRef.current, areasListRef.current] as (PopoverEl | null)[];
    for (const el of els) {
      if (el && isPopoverShown(el)) {
        try {
          el.hidePopover?.();
        } catch {
          // ignore
        }
      }
    }
  }

  useEffect(() => {
    closeAllPopovers();
  }, [pathname]);

  const onProducts = pathname.startsWith("/products") || pathname.startsWith("/services");
  const onHowItWorks = pathname.startsWith("/how-it-works");
  const onServiceAreas = pathname.startsWith("/service-areas");
  const onBlog = pathname.startsWith("/blog");
  const onPortal = pathname.startsWith("/portal");

  const topLinkCls =
    "inline-flex items-center gap-1 whitespace-nowrap rounded-lg px-2.5 py-2 text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-100 hover:text-brand-900 aria-[current=page]:text-brand-900 aria-[current=page]:underline aria-[current=page]:decoration-accent-600 aria-[current=page]:decoration-2 aria-[current=page]:underline-offset-8";

  return (
    <header
      ref={headerRef}
      className="site-header sticky top-0 z-40 border-b border-slate-200/80 bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/85"
    >
      <div
        ref={innerRef}
        className="site-header-inner mx-auto flex h-18 max-w-7xl items-center justify-between gap-4 px-4 sm:px-6 lg:px-8"
      >
        <Link href="/" aria-label={`${site.name} — home`} className="shrink-0 rounded-md">
          <Logo />
        </Link>

        <nav className="site-nav flex items-center" aria-label="Primary">
          <button
            type="button"
            className="menu-button inline-flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-semibold text-brand-900 hover:bg-slate-50"
            popoverTarget={menuId}
            popoverTargetAction="toggle"
            aria-controls={menuId}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
              <path d="M4 7h16M4 12h16M4 17h16" />
            </svg>
            <span>Menu</span>
          </button>

          <ul ref={menuRef} id={menuId} className="site-menu" popover="auto">
            {/* Products dropdown */}
            <li ref={productsLiRef} className="nav-dropdown relative">
              <button
                ref={productsBtnRef}
                type="button"
                className={`dropdown-trigger w-full justify-between ${topLinkCls} ${
                  onProducts ? "text-brand-900 underline decoration-accent-600 decoration-2 underline-offset-8" : ""
                }`}
                aria-expanded="false"
                aria-controls={productsMenuId}
                popoverTarget={productsMenuId}
              >
                <span>Products</span>
                <svg
                  className="nav-chevron size-3.5 text-slate-500 transition-transform"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.4"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden="true"
                >
                  <path d="m6 9 6 6 6-6" />
                </svg>
              </button>
              <div ref={productsListRef} id={productsMenuId} className="dropdown-list mega-menu">
                {/* Top Row: 3D Calculator Hero Promo + Quick Material Links */}
                <div className="grid gap-3 sm:grid-cols-[1.18fr_1fr]">
                  {/* Left: 3D Exterior Calculator Promo Card */}
                  <div className="relative flex min-h-[154px] flex-col justify-between overflow-hidden rounded-2xl border border-brand-800 bg-brand-900 p-4 text-white">
                    <Image
                      src={productsMegaMenu.promo.image}
                      alt=""
                      fill
                      sizes="340px"
                      aria-hidden="true"
                      className="object-cover object-right opacity-55"
                    />
                    <div
                      aria-hidden="true"
                      className="absolute inset-0 bg-gradient-to-r from-brand-900 via-brand-900/90 to-brand-900/25"
                    />
                    <div className="relative z-10 max-w-[220px]">
                      <p className="font-heading text-base font-extrabold leading-tight text-white">
                        {productsMegaMenu.promo.title}
                      </p>
                      <p className="mt-1.5 whitespace-normal text-xs leading-snug text-slate-200">
                        {productsMegaMenu.promo.description}
                      </p>
                    </div>
                    <Link
                      href={productsMegaMenu.promo.href}
                      onClick={closeAllPopovers}
                      className="relative z-10 mt-3 inline-flex w-full items-center justify-center gap-1.5 rounded-xl border border-white/35 bg-brand-900/75 px-3 py-2 text-xs font-bold text-white backdrop-blur transition-colors hover:border-accent-400 hover:bg-accent-600"
                    >
                      <span>{productsMegaMenu.promo.ctaLabel}</span>
                      <span aria-hidden="true">→</span>
                    </Link>
                  </div>

                  {/* Right: Quick Material Pills + All Products */}
                  <div className="flex flex-col justify-between rounded-2xl border border-slate-200 bg-slate-50/90 p-3.5">
                    <div className="grid grid-cols-2 gap-2">
                      {productsMegaMenu.quickLinks.map((item) => (
                        <Link
                          key={item.href}
                          href={item.href}
                          onClick={closeAllPopovers}
                          className="inline-flex items-center justify-between gap-1 rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-xs font-bold text-brand-900 shadow-2xs transition-colors hover:border-accent-600 hover:bg-orange-50/50 hover:text-accent-700"
                        >
                          <span className="truncate">{item.label}</span>
                          <span aria-hidden="true" className="text-slate-400">›</span>
                        </Link>
                      ))}
                    </div>
                    <Link
                      href={productsMegaMenu.allLink.href}
                      onClick={closeAllPopovers}
                      className="mt-2.5 inline-flex w-full items-center justify-center gap-1.5 rounded-xl border border-brand-900/25 bg-white px-3 py-2 text-xs font-bold text-brand-900 transition-colors hover:border-accent-600 hover:bg-orange-50/60 hover:text-accent-700"
                    >
                      <span>{productsMegaMenu.allLink.label}</span>
                      <span aria-hidden="true">→</span>
                    </Link>
                  </div>
                </div>

                {/* Bottom Row: 4 Visual Product Cards */}
                <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-4">
                  {productsMegaMenu.visualCards.map((card) => (
                    <Link
                      key={card.label}
                      href={card.href}
                      onClick={closeAllPopovers}
                      className="group relative aspect-[4/3.7] overflow-hidden rounded-2xl border border-slate-200 bg-brand-900 shadow-xs"
                    >
                      <Image
                        src={card.image}
                        alt={card.alt}
                        fill
                        sizes="(max-width: 640px) 44vw, 155px"
                        className="object-cover transition-transform duration-300 group-hover:scale-105"
                      />
                      <div
                        aria-hidden="true"
                        className="absolute inset-0 bg-gradient-to-t from-slate-950/85 via-slate-950/20 to-transparent"
                      />
                      <span className="absolute inset-x-2.5 bottom-2.5 whitespace-normal text-left font-heading text-xs font-extrabold leading-tight text-white drop-shadow-xs sm:text-[13px]">
                        {card.label}
                      </span>
                    </Link>
                  ))}
                </div>
              </div>
            </li>

            {/* How it works */}
            <li>
              <Link
                href="/how-it-works"
                aria-current={onHowItWorks ? "page" : undefined}
                className={`w-full ${topLinkCls}`}
              >
                How it works
              </Link>
            </li>

            {/* Service Areas dropdown */}
            <li ref={areasLiRef} className="nav-dropdown relative">
              <button
                ref={areasBtnRef}
                type="button"
                className={`dropdown-trigger w-full justify-between ${topLinkCls} ${
                  onServiceAreas ? "text-brand-900 underline decoration-accent-600 decoration-2 underline-offset-8" : ""
                }`}
                aria-expanded="false"
                aria-controls={areasMenuId}
                popoverTarget={areasMenuId}
              >
                <span>Service Areas</span>
                <svg
                  className="nav-chevron size-3.5 text-slate-500 transition-transform"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.4"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden="true"
                >
                  <path d="m6 9 6 6 6-6" />
                </svg>
              </button>
              <ul ref={areasListRef} id={areasMenuId} className="dropdown-list">
                {SERVICE_AREAS.map((area) => {
                  const href = `/service-areas/${area.slug}`;
                  return (
                    <li key={area.slug}>
                      <Link
                        href={href}
                        aria-current={pathname === href ? "page" : undefined}
                        className="flex items-center justify-between gap-3 rounded-xl px-3 py-2 text-left transition-colors hover:bg-slate-50 aria-[current=page]:bg-brand-50"
                      >
                        <span>
                          <span className="block text-sm font-bold text-brand-900">{area.name}</span>
                          <span className="block text-[11px] text-slate-500">ZIP {area.sampleZips.slice(0, 3).join(", ")}</span>
                        </span>
                        <span className="rounded-md bg-slate-100 px-1.5 py-0.5 text-[10px] font-bold text-slate-600">
                          {area.state}
                        </span>
                      </Link>
                    </li>
                  );
                })}
                <li className="mt-1 border-t border-slate-100 pt-1">
                  <Link
                    href="/service-areas"
                    aria-current={pathname === "/service-areas" ? "page" : undefined}
                    className="block rounded-xl px-3 py-2 text-xs font-bold text-accent-700 hover:bg-orange-50/60"
                  >
                    View all service areas &amp; ZIP lookup →
                  </Link>
                </li>
              </ul>
            </li>

            {/* Blog */}
            <li>
              <Link href="/blog" aria-current={onBlog ? "page" : undefined} className={`w-full ${topLinkCls}`}>
                Blog
              </Link>
            </li>

            {/* Phone with handset icon */}
            <li className="nav-utility-sep border-t border-slate-100 pt-2">
              <a
                href={`tel:${site.phoneHref}`}
                className="inline-flex w-full items-center gap-1.5 whitespace-nowrap rounded-lg px-2.5 py-2 text-sm font-bold text-brand-900 transition-colors hover:bg-slate-100 hover:text-accent-700"
              >
                <svg viewBox="0 0 24 24" className="size-4 shrink-0 text-accent-600" fill="currentColor" aria-hidden="true">
                  <path d="M6.62 10.79a15.05 15.05 0 0 0 6.59 6.59l2.2-2.2a1 1 0 0 1 1.01-.24c1.12.37 2.33.57 3.58.57a1 1 0 0 1 1 1V20a1 1 0 0 1-1 1C10.61 21 3 13.39 3 4a1 1 0 0 1 1-1h3.5a1 1 0 0 1 1 1c0 1.25.2 2.46.57 3.58a1 1 0 0 1-.25 1.01l-2.2 2.2Z" />
                </svg>
                <span>{site.phone}</span>
              </a>
            </li>

            {/* Customer Portal with user icon */}
            <li>
              <Link
                href="/portal"
                aria-current={onPortal ? "page" : undefined}
                className={`w-full ${topLinkCls}`}
              >
                <svg viewBox="0 0 24 24" className="size-4 shrink-0 text-brand-700" fill="currentColor" aria-hidden="true">
                  <path d="M12 12a4.5 4.5 0 1 0-4.5-4.5A4.5 4.5 0 0 0 12 12Zm0 2c-3.87 0-7 2.02-7 4.5V20h14v-1.5c0-2.48-3.13-4.5-7-4.5Z" />
                </svg>
                <span>Customer Portal</span>
              </Link>
            </li>

            {/* Primary CTA: Get a Quote */}
            <li className="nav-cta-item pt-1.5">
              <Link href="/estimate" className="btn btn-primary w-full whitespace-nowrap px-4 py-2.5 text-sm">
                Get a Quote
              </Link>
            </li>
          </ul>
        </nav>
      </div>
    </header>
  );
}
