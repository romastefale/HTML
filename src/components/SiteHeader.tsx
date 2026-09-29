import React, { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { useReducedMotion } from "../lib/useMedia";
import { useTheme } from "../lib/theme";
import { HOME_URL } from "./Surfaces";
import "./SiteHeader.css";

export interface NavItem {
  href: string;
  label: string;
  /** Leading "‹" chevron (the Back item on the sample page). */
  back?: boolean;
  ariaLabel?: string;
  /** Section items ("#id") follow the scroll (aria-current="location");
   *  set false for an item that isn't a section (e.g. "Pesquisar"). */
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
 * The shared top bar (home + sample), built like the fork's demo-site header
 * (site/src/components/SiteHeader.tsx): a full-width frosted bar with the
 * wordmark on the left, text links (current one bolder) and a round theme
 * toggle on the right. One bar, the same from the first paint to the end of
 * the page; when the links don't fit they scroll sideways (swipe, trackpad,
 * Shift + wheel), the scrollbar hidden and a soft fade on the side with more.
 */
export const SiteHeader: React.FC<{ items: NavItem[]; label?: string }> = ({ items, label = "Principal" }) => {
  const { theme, toggle } = useTheme();
  const navRef = useRef<HTMLElement>(null);
  const linkRefs = useRef<(HTMLAnchorElement | null)[]>([]);
  const [active, setActive] = useState(-1);
  const [fade, setFade] = useState({ start: false, end: false });
  const reduceMotion = useReducedMotion();
  const first = useRef(true);

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
      const line = (navRef.current?.closest("header")?.getBoundingClientRect().bottom ?? 0) + 32;
      const atEnd = innerHeight + scrollY >= document.documentElement.scrollHeight - 2;
      let idx = -1;
      targets.forEach((el, i) => {
        if (el && (idx === -1 || el.getBoundingClientRect().top <= line)) idx = i;
      });
      if (atEnd) targets.forEach((el, i) => el && (idx = i));
      setActive(idx);
    };
    const onScroll = () => {
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
  }, [items]);

  // Keep the current link visible in the bar: instantly on load, smoothly after.
  useLayoutEffect(() => {
    if (active < 0) return;
    reveal(active, !first.current);
    first.current = false;
  }, [active, reveal]);

  const dark = theme === "dark";
  return (
    <header className="site-header">
      <a className="sh-brand" href={HOME_URL}>
        <span className="sh-brand-ns">romastefale/</span>vidro
      </a>
      <nav
        ref={navRef}
        className="sh-nav"
        aria-label={label}
        data-fade-start={fade.start || undefined}
        data-fade-end={fade.end || undefined}
        onScroll={syncFade}
      >
        {items.map((it, i) => (
          <a
            key={it.href + it.label}
            ref={(el) => {
              linkRefs.current[i] = el;
            }}
            href={it.href}
            aria-label={it.ariaLabel}
            aria-current={i === active ? "location" : undefined}
            onFocus={() => reveal(i, true)}
            onClick={(e) => it.onSelect?.(e)}
          >
            {it.back && <Chevron />}
            {it.label}
          </a>
        ))}
      </nav>
      <div className="sh-spacer" />
      <button
        type="button"
        className="sh-pill"
        onClick={toggle}
        aria-label={dark ? "Ativar modo claro" : "Ativar modo escuro"}
        title="Alternar modo claro / escuro"
        onPointerDown={pressDown}
        onPointerUp={pressUp}
        onPointerLeave={pressUp}
      >
        {dark ? <Sun /> : <Moon />}
      </button>
    </header>
  );
};
