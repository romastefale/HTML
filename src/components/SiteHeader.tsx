import React, { useCallback, useEffect, useId, useLayoutEffect, useRef, useState } from "react";
import { flushSync } from "react-dom";
import { LiquidGlass, type GlassConfig } from "@ybouane/liquidglass";
import { PANEL } from "../lib/optics";
import { Frost } from "./Frost";
import { useMediaQuery, useReducedMotion } from "../lib/useMedia";
import { useTheme, type ThemeName } from "../lib/theme";
import { Magnifier, PageSearch } from "./PageSearch";
import fundoClaro from "../assets/fundo-claro.svg";
import fundoEscuro from "../assets/fundo-escuro.svg";
import { PAGES, type PageKey } from "../lib/pages";
import "./SiteHeader.css";

export interface NavItem {
  href: string;
  label: string;
  ariaLabel?: string;
  /** Section items ("#id") follow the scroll (aria-current="location") and are
   *  the only ones that get the selected pill; set false for an item that
   *  isn't a section. Links to other pages live in the ☰ picker, not here. */
  spy?: boolean;
  onSelect?: (e: React.MouseEvent<HTMLAnchorElement>) => void;
}

// The page-picker (☰) glyph and its check mark, in the stroke style of the theme icons.
const Burger = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" aria-hidden="true">
    <path d="M4.5 7h15M4.5 12h15M4.5 17h15" />
  </svg>
);
const Check = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="m5 12.5 4.4 4.4L19 7.3" />
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

/** The top bar's glass: the two presets of the liquid-glass2 fork's demo
 *  (romastefale/liquid-glass2, site/index.html › "Frosted Panel" and
 *  "Dark Glass"), unchanged. Light mode is the Frosted Panel, dark mode the
 *  Dark Glass. The demo adds `floating: true` only to make its preview
 *  draggable; a top bar isn't, so the documented snippet is used as is. */
const BAR_GLASS: Record<ThemeName, Partial<GlassConfig>> = {
  light: { blurAmount: 0.25, cornerRadius: 30 },
  dark: { brightness: -0.3, blurAmount: 0.25, cornerRadius: 50 },
};

// The site's press feedback on its round pills.
const pressDown = (e: React.PointerEvent) => ((e.currentTarget as HTMLElement).style.transform = "scale(0.96)");
const pressUp = (e: React.PointerEvent) => ((e.currentTarget as HTMLElement).style.transform = "scale(1)");

// The picker sits over running text: the reading panels' heavier frost (PANEL)
// and a denser tint than the pill, so its labels always read (no refraction).

const EDGE = 12; // px kept clear around an item scrolled into view

/**
 * The shared top menu (every page), the same at the top of the page and all
 * the way down: a floating pill inset under the safe area whose glass is
 * drawn by @ybouane/liquidglass (LiquidGlass.init: the pill is a glass
 * element, a direct child of the React root, and the shader refracts the
 * root's other children: the page background, the edge fade and the page).
 * It holds the fork demo-site header's parts (site/src/components/SiteHeader.tsx) minus
 * the wordmark: the ☰ page picker at the left end, the page's section links (the current one on a soft
 * selected pill that slides between them), then the links to the other pages and round 34px buttons for the light/dark mode
 * and the page search (magnifier). When the links don't fit they scroll
 * sideways (swipe, trackpad, Shift + wheel), the scrollbar hidden and a soft
 * fade on the side with more. The magnifier turns the pill itself into the
 * search bar; the magnifier again, Esc or a tap outside turns it back.
 */
export const SiteHeader: React.FC<{ items: NavItem[]; current: PageKey; label?: string; searchScope?: string }> = ({
  items,
  current,
  label = "Seções desta página",
  searchScope = "conteudo",
}) => {
  const { theme, toggle } = useTheme();
  const barRef = useRef<HTMLElement>(null);
  const reduceTransparency = useMediaQuery("(prefers-reduced-transparency: reduce)");
  const searchBtn = useRef<HTMLButtonElement>(null);
  const searchInput = useRef<HTMLInputElement>(null);
  const searchId = `busca-${useId().replace(/:/g, "")}`;
  const [searchOpen, setSearchOpen] = useState(false);
  // The page picker (☰): a frosted popover under the pill listing every page.
  const pickerId = `paginas-${useId().replace(/:/g, "")}`;
  const [pickerOpen, setPickerOpen] = useState(false);
  const pickerBtn = useRef<HTMLButtonElement>(null);
  const pickerRef = useRef<HTMLDivElement>(null);
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
    setPickerOpen(false);
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

  const closePicker = useCallback((refocus = true) => {
    setPickerOpen(false);
    if (refocus) pickerBtn.current?.focus({ preventScroll: true });
  }, []);
  // Open: focus moves to the current page's item. Esc (focus back on ☰), a tap
  // outside the pill and picker, or focus leaving them closes it; ↑/↓, Home and
  // End move between the items.
  useEffect(() => {
    if (!pickerOpen) return;
    const root = pickerRef.current;
    const links = () => [...(root?.querySelectorAll<HTMLAnchorElement>("a") ?? [])];
    (root?.querySelector<HTMLAnchorElement>('a[aria-current="page"]') ?? links()[0])?.focus({ preventScroll: true });
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        closePicker();
        return;
      }
      if (!root?.contains(document.activeElement)) return;
      const all = links();
      const i = all.indexOf(document.activeElement as HTMLAnchorElement);
      const to =
        e.key === "ArrowDown" ? (i + 1) % all.length
        : e.key === "ArrowUp" ? (i - 1 + all.length) % all.length
        : e.key === "Home" ? 0
        : e.key === "End" ? all.length - 1
        : -1;
      if (to >= 0) {
        e.preventDefault();
        all[to].focus({ preventScroll: true });
      }
    };
    const onClick = (e: MouseEvent) => {
      if (!barRef.current?.contains(e.target as Node)) closePicker(false);
    };
    const onFocusOut = (e: FocusEvent) => {
      const to = e.relatedTarget as Node | null;
      if (to && !barRef.current?.contains(to)) closePicker(false);
    };
    document.addEventListener("keydown", onKey);
    document.addEventListener("click", onClick);
    barRef.current?.addEventListener("focusout", onFocusOut);
    const bar = barRef.current;
    return () => {
      document.removeEventListener("keydown", onKey);
      document.removeEventListener("click", onClick);
      bar?.removeEventListener("focusout", onFocusOut);
    };
  }, [pickerOpen, closePicker]);

  // With the on-screen keyboard up, iOS can pan the visual viewport inside the
  // layout one; keep the menu (and the open field) pinned to what's visible.
  useEffect(() => {
    const vv = window.visualViewport;
    const el = barRef.current;
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

  // The bar's glass (LiquidGlass.init on the React root, the bar as its
  // glass element). The library rasterises the root's other children once,
  // so a theme change (new background and text colours) starts a fresh
  // instance. With reduced transparency, or if WebGL is missing, it isn't
  // started and the bar keeps its solid fill (SiteHeader.css).
  useEffect(() => {
    const bar = barRef.current;
    const root = bar?.parentElement;
    if (!bar || !root || reduceTransparency) return;
    let alive = true;
    let glass: LiquidGlass | null = null;
    LiquidGlass.init({ root, glassElements: [bar] }).then(
      (g) => {
        if (!alive) return g.destroy();
        glass = g;
        bar.dataset.glass = "on";
      },
      () => {},
    );
    return () => {
      alive = false;
      glass?.destroy();
      delete bar.dataset.glass;
    };
  }, [theme, reduceTransparency]);

  const dark = theme === "dark";
  return (
    <>
      {/* The page background and the top edge fade, as children of the React
          root: the glass samples only the root's children (the library
          README: "Put backgrounds in a sibling element inside the root";
          its example background is an <img>, drawn from its pixels). */}
      <img className="page-bg" src={dark ? fundoEscuro : fundoClaro} alt="" aria-hidden="true" />
      <div className="page-fade-top" aria-hidden="true" />
      <header
        ref={barRef}
        className="site-header"
        data-mode={searchOpen ? "search" : "menu"}
        data-config={JSON.stringify(BAR_GLASS[theme])}
      >
        {/* The page picker (☰), at the LEFT end of the pill on every page: every
            page of the portal, Início included, in a frosted popover. */}
        <button
          ref={pickerBtn}
          type="button"
          className="sh-pill sh-pages-btn"
          onClick={() => (pickerOpen ? closePicker() : setPickerOpen(true))}
          aria-label={pickerOpen ? "Fechar lista de páginas" : "Abrir lista de páginas"}
          aria-expanded={pickerOpen}
          aria-controls={pickerId}
          title="Páginas"
          inert={searchOpen}
          onPointerDown={pressDown}
          onPointerUp={pressUp}
          onPointerLeave={pressUp}
        >
          <Burger />
        </button>
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
        {pickerOpen && (
          <Frost ref={pickerRef} id={pickerId} className="glass sh-picker tint-bar" optics={PANEL} style={{ position: "absolute" }}>
            <nav aria-label="Páginas do site">
              <ul>
                {PAGES.map((p) => {
                  const here = p.key === current;
                  return (
                    <li key={p.key}>
                      <a
                        href={p.href}
                        aria-current={here ? "page" : undefined}
                        onClick={(e) => {
                          if (here) {
                            e.preventDefault();
                            closePicker();
                          } else setPickerOpen(false);
                        }}
                      >
                        <span className="sh-pick-title">{p.pick}</span>
                        {/* Not colour only: the current page is bold, on the selected
                            pill, with a check (aria-current="page" for readers). */}
                        {/* The check's slot is on every item, so the list keeps its width
                            whichever page is current. */}
                        <span className="sh-pick-here">{here && <Check />}</span>
                      </a>
                    </li>
                  );
                })}
              </ul>
            </nav>
          </Frost>
        )}
      </header>
    </>
  );
};
