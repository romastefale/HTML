import React, { useCallback, useEffect, useId, useLayoutEffect, useRef, useState } from "react";
import { flushSync } from "react-dom";
import { FROST } from "../lib/optics";
import { Frost } from "./Frost";
import { useReducedMotion } from "../lib/useMedia";
import { useTheme } from "../lib/theme";
import { Magnifier, PageSearch } from "./PageSearch";
import "./SiteHeader.css";

export interface NavItem {
  href: string;
  label: string;
  /** Leading "‹" chevron (the Back item on the sample page). */
  back?: boolean;
  ariaLabel?: string;
  /** Section items ("#id") follow the scroll (aria-current="location");
   *  set false for an item that isn't a section. */
  spy?: boolean;
  onSelect?: (e: React.MouseEvent<HTMLAnchorElement>) => void;
}

const Chevron = () => (
  <svg viewBox="0 0 24 24" width="14" height="14" aria-hidden="true">
    <path d="M15.4 4.8 8.2 12l7.2 7.2" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);
// Theme icons: exactly the fork site's (site/src/components/SiteHeader.tsx).
const Sun = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <circle cx="12" cy="12" r="4" />
    <path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" />
  </svg>
);
const Moon = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
    <path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z" />
  </svg>
);

// The site's press feedback on its round pills.
const pressDown = (e: React.PointerEvent) => ((e.currentTarget as HTMLElement).style.transform = "scale(0.96)");
const pressUp = (e: React.PointerEvent) => ((e.currentTarget as HTMLElement).style.transform = "scale(1)");

const EDGE = 12; // px kept clear around an item scrolled into view

/**
 * The shared top menu (home + sample), the same at the top of the page and all
 * the way down: a floating glass pill inset under the safe area, holding the
 * fork demo-site header's parts (site/src/components/SiteHeader.tsx) minus
 * the wordmark: the section links (the current one on a soft selected pill
 * that slides between them) and round 34px buttons for the light/dark mode
 * and the page search (magnifier). When the links don't fit they scroll
 * sideways (swipe, trackpad, Shift + wheel), the scrollbar hidden and a soft
 * fade on the side with more. The magnifier turns the pill itself into the
 * search bar; the magnifier again, Esc or a tap outside turns it back.
 */
export const SiteHeader: React.FC<{ items: NavItem[]; label?: string; searchScope?: string }> = ({
  items,
  label = "Principal",
  searchScope = "conteudo",
}) => {
  const { theme, toggle } = useTheme();
  const headerRef = useRef<HTMLElement>(null);
  const barRef = useRef<HTMLDivElement>(null);
  const searchBtn = useRef<HTMLButtonElement>(null);
  const searchInput = useRef<HTMLInputElement>(null);
  const searchId = `busca-${useId().replace(/:/g, "")}`;
  const [searchOpen, setSearchOpen] = useState(false);
  const navRef = useRef<HTMLElement>(null);
  const linkRefs = useRef<(HTMLAnchorElement | null)[]>([]);
  const [active, setActive] = useState(-1);
  const [fade, setFade] = useState({ start: false, end: false });
  const reduceMotion = useReducedMotion();
  const first = useRef(true);
  // A tapped section stays selected through its own smooth scroll: the spy is
  // paused until the page has been still for a moment (then the next real
  // scroll takes over again).
  const pinned = useRef(false);
  const pinTimer = useRef(0);
  const pin = useCallback((ms: number) => {
    pinned.current = true;
    clearTimeout(pinTimer.current);
    pinTimer.current = window.setTimeout(() => (pinned.current = false), ms);
  }, []);
  useEffect(() => () => clearTimeout(pinTimer.current), []);
  const [indicator, setIndicator] = useState<{ x: number; w: number } | null>(null);
  const [animate, setAnimate] = useState(false);

  // Scroll one link into view INSIDE the bar only (never the page).
  const reveal = useCallback(
    (i: number, smooth: boolean) => {
      const sc = navRef.current;
      const a = linkRefs.current[i];
      if (!sc || !a) return;
      const left = a.offsetLeft - EDGE;
      const right = a.offsetLeft + a.offsetWidth + EDGE - sc.clientWidth;
      const to = sc.scrollLeft > left ? left : sc.scrollLeft < right ? right : null;
      if (to !== null) sc.scrollTo({ left: Math.max(0, to), behavior: smooth && !reduceMotion ? "smooth" : "auto" });
    },
    [reduceMotion],
  );

  // Fade only the side(s) that have more links.
  const syncFade = useCallback(() => {
    const sc = navRef.current;
    if (!sc) return;
    const max = sc.scrollWidth - sc.clientWidth;
    const next = { start: sc.scrollLeft > 1, end: sc.scrollLeft < max - 1 };
    setFade((p) => (p.start === next.start && p.end === next.end ? p : next));
  }, []);
  useLayoutEffect(() => {
    const sc = navRef.current;
    if (!sc) return;
    syncFade();
    const ro = new ResizeObserver(syncFade);
    ro.observe(sc);
    return () => ro.disconnect();
  }, [syncFade]);

  // Shift + wheel scrolls the links sideways in every engine (Chromium does it
  // natively; WebKit/Gecko builds don't always). Non-passive to own the event.
  useEffect(() => {
    const sc = navRef.current;
    if (!sc) return;
    const onWheel = (e: WheelEvent) => {
      if (!e.shiftKey || Math.abs(e.deltaX) >= Math.abs(e.deltaY)) return;
      if (sc.scrollWidth <= sc.clientWidth) return;
      e.preventDefault();
      sc.scrollLeft += e.deltaMode === 1 ? e.deltaY * 16 : e.deltaY;
    };
    sc.addEventListener("wheel", onWheel, { passive: false });
    return () => sc.removeEventListener("wheel", onWheel);
  }, []);

  // Scroll-spy: the last section whose top has passed under the bar.
  useEffect(() => {
    const targets = items.map((it) =>
      it.spy !== false && it.href.startsWith("#") ? document.getElementById(it.href.slice(1)) : null,
    );
    if (!targets.some(Boolean)) return;
    let raf = 0;
    const compute = () => {
      raf = 0;
      const line = (navRef.current?.getBoundingClientRect().bottom ?? 0) + 32;
      const atEnd = innerHeight + scrollY >= document.documentElement.scrollHeight - 2;
      let idx = -1;
      targets.forEach((el, i) => {
        if (el && (idx === -1 || el.getBoundingClientRect().top <= line)) idx = i;
      });
      if (atEnd) targets.forEach((el, i) => el && (idx = i));
      setActive(idx);
    };
    const onScroll = () => {
      if (pinned.current) return pin(220); // still scrolling to a tapped section
      if (!raf) raf = requestAnimationFrame(compute);
    };
    compute();
    addEventListener("scroll", onScroll, { passive: true });
    addEventListener("resize", onScroll);
    return () => {
      cancelAnimationFrame(raf);
      removeEventListener("scroll", onScroll);
      removeEventListener("resize", onScroll);
    };
  }, [items, pin]);

  // Keep the current link visible in the bar: instantly on load, smoothly after.
  useLayoutEffect(() => {
    if (active < 0) return;
    reveal(active, !first.current);
    first.current = false;
  }, [active, reveal]);

  // The selected pill behind the current link: one soft glass highlight that
  // slides (and resizes) to the link, measured in the nav's scroll content.
  useLayoutEffect(() => {
    const a = active >= 0 ? linkRefs.current[active] : null;
    const measure = () => setIndicator(a ? { x: a.offsetLeft, w: a.offsetWidth } : null);
    measure();
    if (!a) return;
    const ro = new ResizeObserver(measure);
    ro.observe(a);
    return () => ro.disconnect();
  }, [active]);
  // No slide on the first placement (only once it's been drawn).
  useEffect(() => {
    if (!indicator || animate) return;
    const r = requestAnimationFrame(() => setAnimate(true));
    return () => cancelAnimationFrame(r);
  }, [indicator, animate]);

  // Open synchronously inside the tap (flushSync) so focus() still counts as
  // user-initiated and iOS brings the keyboard up.
  const openSearch = () => {
    flushSync(() => setSearchOpen(true));
    searchInput.current?.focus({ preventScroll: true });
  };
  const closeSearch = useCallback((refocus = true) => {
    setSearchOpen(false);
    if (refocus) searchBtn.current?.focus({ preventScroll: true });
  }, []);

  // While open: Esc anywhere, or a tap/click outside the pill, closes it (a
  // scroll gesture isn't a click, so reading the results is fine).
  useEffect(() => {
    if (!searchOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") closeSearch();
    };
    const onClick = (e: MouseEvent) => {
      const t = e.target as Node;
      if (barRef.current?.contains(t)) return;
      closeSearch(false);
    };
    document.addEventListener("keydown", onKey);
    document.addEventListener("click", onClick);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.removeEventListener("click", onClick);
    };
  }, [searchOpen, closeSearch]);

  // With the on-screen keyboard up, iOS can pan the visual viewport inside the
  // layout one; keep the menu (and the open field) pinned to what's visible.
  useEffect(() => {
    const vv = window.visualViewport;
    const el = headerRef.current;
    if (!vv || !el || !searchOpen) return;
    const update = () => el.style.setProperty("--vv-top", `${Math.max(0, vv.offsetTop)}px`);
    update();
    vv.addEventListener("resize", update, { passive: true });
    vv.addEventListener("scroll", update, { passive: true });
    return () => {
      vv.removeEventListener("resize", update);
      vv.removeEventListener("scroll", update);
      el.style.removeProperty("--vv-top");
    };
  }, [searchOpen]);

  const dark = theme === "dark";
  return (
    <header ref={headerRef} className="site-header">
      <div ref={barRef} className="sh-anchor">
        <Frost
          className="glass sh-bar tint-bar"
          optics={FROST}
          style={{ display: "flex" }}
          data-mode={searchOpen ? "search" : "menu"}
        >
          {/* Menu mode. In search mode the links stay in the layout (hidden,
              inert) so the pill keeps exactly its size and place. */}
          <nav
            ref={navRef}
            className="sh-nav"
            aria-label={label}
            data-fade-start={fade.start || undefined}
            data-fade-end={fade.end || undefined}
            onScroll={syncFade}
            inert={searchOpen}
          >
            <span
              className="sh-indicator"
              aria-hidden="true"
              data-animate={animate || undefined}
              style={indicator ? { width: indicator.w, transform: `translateX(${indicator.x}px)` } : { opacity: 0 }}
            />
            {items.map((it, i) => (
              <a
                key={it.href + it.label}
                ref={(el) => {
                  linkRefs.current[i] = el;
                }}
                href={it.href}
                aria-label={it.ariaLabel}
                aria-current={i === active ? "location" : undefined}
                onFocus={() => reveal(i, false)}
                onClick={(e) => {
                  it.onSelect?.(e);
                  // A section link is selected at once, before the page scrolls.
                  if (it.spy !== false && it.href.startsWith("#")) {
                    pin(700);
                    setActive(i);
                  }
                }}
              >
                {it.back && <Chevron />}
                {/* data-text reserves the bold width: the pill never changes size
                    when the current link changes. */}
                <span className="sh-label" data-text={it.label}>
                  {it.label}
                </span>
              </a>
            ))}
          </nav>
          {/* Search mode: the field takes the pill, up to the magnifier. */}
          <PageSearch open={searchOpen} id={searchId} scopeId={searchScope} inputRef={searchInput} onClose={closeSearch} />
          <div className="sh-actions">
            {/* Hidden during search (the field needs the room at 393px). */}
            <button
              type="button"
              className="sh-pill sh-theme"
              onClick={toggle}
              aria-label={dark ? "Ativar modo claro" : "Ativar modo escuro"}
              title="Alternar modo claro / escuro"
              inert={searchOpen}
              onPointerDown={pressDown}
              onPointerUp={pressUp}
              onPointerLeave={pressUp}
            >
              {dark ? <Sun /> : <Moon />}
            </button>
            {/* The toggle: opens the search in the pill, closes it again. */}
            <button
              ref={searchBtn}
              type="button"
              className="sh-pill sh-search-btn"
              onClick={() => (searchOpen ? closeSearch() : openSearch())}
              aria-label={searchOpen ? "Fechar pesquisa" : "Pesquisar na página"}
              aria-expanded={searchOpen}
              aria-controls={searchId}
              title={searchOpen ? "Fechar pesquisa" : "Pesquisar na página"}
              onPointerDown={pressDown}
              onPointerUp={pressUp}
              onPointerLeave={pressUp}
            >
              <Magnifier />
            </button>
          </div>
        </Frost>
      </div>
    </header>
  );
};
