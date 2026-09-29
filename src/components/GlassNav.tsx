import React, { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { Glass } from "@samasante/liquid-glass";
import { FROST, PANEL } from "../lib/optics";
import "./GlassNav.css";

export interface NavItem {
  href: string;
  label: string;
  /** Marks the current page/section (aria-current="page"). */
  current?: boolean;
  /** Leading "‹" chevron (the Back item on the sample page). */
  back?: boolean;
  ariaLabel?: string;
  onSelect?: (e: React.MouseEvent<HTMLAnchorElement>) => void;
}

type State = "full" | "compact" | "open";

const COMPACT_AT = 72; // px scrolled before the pill collapses
const FULL_AT = 24; // hysteresis: back to the full pill near the top
const DOT = 50; // the round "…" button (= pill height)

const Chevron = () => (
  <svg viewBox="0 0 24 24" aria-hidden="true">
    <path d="M15.4 4.8 8.2 12l7.2 7.2" fill="none" stroke="currentColor" strokeWidth="2.35" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);
const Dots = () => (
  <svg viewBox="0 0 24 24" aria-hidden="true">
    <circle cx="6" cy="12" r="1.9" fill="currentColor" />
    <circle cx="12" cy="12" r="1.9" fill="currentColor" />
    <circle cx="18" cy="12" r="1.9" fill="currentColor" />
  </svg>
);
const Close = () => (
  <svg viewBox="0 0 24 24" aria-hidden="true">
    <path d="M6.5 6.5l11 11M17.5 6.5l-11 11" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
  </svg>
);

const Links: React.FC<{ items: NavItem[]; onPick?: () => void; firstRef?: React.Ref<HTMLAnchorElement> }> = ({ items, onPick, firstRef }) => (
  <>
    {items.map((it, i) => (
      <a
        key={it.href + it.label}
        ref={i === 0 ? firstRef : undefined}
        href={it.href}
        aria-label={it.ariaLabel}
        aria-current={it.current ? "page" : undefined}
        onClick={(e) => {
          it.onSelect?.(e);
          onPick?.();
        }}
      >
        {it.back && <Chevron />}
        {it.label}
      </a>
    ))}
  </>
);

/**
 * The shared glass pill nav (home + sample). Full at the top of the page; once
 * you scroll it morphs into a round glass "…" button so the content stands
 * out; the button reopens the links as a glass popover (closes on Esc, outside
 * tap or a pick). Both surfaces are material <Glass> boxes.
 */
export const GlassNav: React.FC<{ items: NavItem[]; label?: string }> = ({ items, label = "Principal" }) => {
  const [state, setState] = useState<State>("full");
  const [menu, setMenu] = useState<"closed" | "open" | "closing">("closed");
  const [fullW, setFullW] = useState<number | null>(null);
  const [ready, setReady] = useState(false);
  const linksRef = useRef<HTMLElement>(null);
  const navRef = useRef<HTMLElement>(null);
  const moreRef = useRef<HTMLButtonElement>(null);
  const firstMenuLink = useRef<HTMLAnchorElement>(null);
  const stateRef = useRef(state);
  stateRef.current = state;

  // Measure the full pill (the links row) before paint, and on any resize.
  useLayoutEffect(() => {
    const el = linksRef.current;
    if (!el) return;
    const measure = () => setFullW(el.offsetWidth);
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);
  useEffect(() => {
    // Enable the width transition only after the first measured paint.
    const id = requestAnimationFrame(() => requestAnimationFrame(() => setReady(true)));
    return () => cancelAnimationFrame(id);
  }, []);

  const open = useCallback(() => {
    setState("open");
    setMenu("open");
  }, []);
  const close = useCallback((focusToggle = false) => {
    setState(window.scrollY <= FULL_AT ? "full" : "compact");
    setMenu((m) => (m === "closed" ? m : "closing"));
    if (focusToggle) moreRef.current?.focus();
  }, []);

  // Scroll → full / compact (with hysteresis), rAF-throttled.
  useEffect(() => {
    let raf = 0;
    const onScroll = () => {
      if (raf) return;
      raf = requestAnimationFrame(() => {
        raf = 0;
        const y = window.scrollY;
        if (y <= FULL_AT) {
          if (stateRef.current !== "full") close();
        } else if (y > COMPACT_AT && stateRef.current === "full") setState("compact");
      });
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      cancelAnimationFrame(raf);
    };
  }, [close]);

  // While open: Esc closes (focus back to "…"), a tap outside the nav closes.
  useEffect(() => {
    if (state !== "open") return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") close(true);
    };
    const onDown = (e: PointerEvent) => {
      if (!navRef.current?.contains(e.target as Node)) close();
    };
    document.addEventListener("keydown", onKey);
    document.addEventListener("pointerdown", onDown);
    firstMenuLink.current?.focus({ preventScroll: true });
    return () => {
      document.removeEventListener("keydown", onKey);
      document.removeEventListener("pointerdown", onDown);
    };
  }, [state, close]);

  // Fallback in case animationend never fires (e.g. the tab is hidden).
  useEffect(() => {
    if (menu !== "closing") return;
    const id = setTimeout(() => setMenu("closed"), 400);
    return () => clearTimeout(id);
  }, [menu]);

  const width = state === "full" ? (fullW ?? undefined) : DOT;

  return (
    <header ref={navRef} className={`gnav${ready ? " is-ready" : ""}`} data-state={state}>
      <div className="gnav-anchor">
        <Glass className="glass gnav-pill tint-ink" optics={FROST} style={{ width }}>
          <nav ref={linksRef} className="gnav-links" aria-label={label}>
            <Links items={items} />
          </nav>
          <button
            ref={moreRef}
            className="gnav-more"
            type="button"
            aria-label={state === "open" ? "Fechar menu" : "Abrir menu"}
            aria-expanded={state === "open"}
            aria-controls="gnav-menu"
            onClick={() => (state === "open" ? close() : open())}
          >
            {state === "open" ? <Close /> : <Dots />}
          </button>
        </Glass>
        {menu !== "closed" && (
          <div
            id="gnav-menu"
            className={`gnav-menu ${menu === "open" ? "is-open" : "is-closing"}`}
            onAnimationEnd={() => setMenu((m) => (m === "closing" ? "closed" : m))}
          >
            <Glass className="glass gnav-menu-glass" optics={PANEL} style={{ display: "block" }}>
              <nav aria-label={`${label} (menu)`}>
                <ul>
                  {items.map((it, i) => (
                    <li key={it.href + it.label}>
                      <Links items={[it]} firstRef={i === 0 ? firstMenuLink : undefined} onPick={() => close()} />
                    </li>
                  ))}
                </ul>
              </nav>
            </Glass>
          </div>
        )}
      </div>
    </header>
  );
};
