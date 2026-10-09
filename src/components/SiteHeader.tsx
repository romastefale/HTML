import React, { useCallback, useEffect, useId, useLayoutEffect, useRef, useState } from "react";
import { flushSync } from "react-dom";
import { LiquidGlass, type GlassConfig } from "@ybouane/liquidglass";
import { useReducedMotion } from "../lib/useMedia";
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
  spy?: boolean;
  onSelect?: (e: React.MouseEvent<HTMLAnchorElement>) => void;
}

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

const NO_EDGE: Partial<GlassConfig> = { edgeHighlight: 0, fresnel: 0, shadowOpacity: 0 };
const BAR_GLASS: Record<ThemeName, Partial<GlassConfig>> = {
  light: { blurAmount: 0.25, cornerRadius: 30, ...NO_EDGE },
  dark: { brightness: -0.3, blurAmount: 0.25, cornerRadius: 50, ...NO_EDGE },
};
const BUTTON_GLASS: Partial<GlassConfig> = { button: true, cornerRadius: 28, blurAmount: 0.3, brightness: -0.1, ...NO_EDGE };
const INDICATOR_GLASS: Partial<GlassConfig> = { cornerRadius: 16, zRadius: 16, blurAmount: 0, ...NO_EDGE };

const EDGE = 12;

export const SiteHeader: React.FC<{ items: NavItem[]; current: PageKey; label?: string; searchScope?: string }> = ({
  items,
  current,
  label = "Seções desta página",
  searchScope = "conteudo",
}) => {
  const { theme, toggle } = useTheme();
  const barRef = useRef<HTMLElement>(null);
  const indRef = useRef<HTMLDivElement>(null);
  const themeBtn = useRef<HTMLButtonElement>(null);
  const glass = useRef<LiquidGlass | null>(null);
  const searchBtn = useRef<HTMLButtonElement>(null);
  const searchInput = useRef<HTMLInputElement>(null);
  const searchId = `busca-${useId().replace(/:/g, "")}`;
  const [searchOpen, setSearchOpen] = useState(false);
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
  const pinned = useRef(false);
  const pinTimer = useRef(0);
  const pin = useCallback((ms: number) => {
    pinned.current = true;
    clearTimeout(pinTimer.current);
    pinTimer.current = window.setTimeout(() => (pinned.current = false), ms);
  }, []);
  useEffect(() => () => clearTimeout(pinTimer.current), []);

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
      if (pinned.current) return pin(220);
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

  useLayoutEffect(() => {
    if (active < 0) return;
    reveal(active, !first.current);
    first.current = false;
  }, [active, reveal]);


  const placed = useRef(false);
  const layout = useCallback(() => {
    const ind = indRef.current;
    const nav = navRef.current;
    const a = active >= 0 ? linkRefs.current[active] : null;
    if (!ind) return;
    if (!a || !nav || searchOpen) {
      ind.style.transform = "translate(-9999px, -9999px)";
      return;
    }
    const n = nav.getBoundingClientRect();
    const r = a.getBoundingClientRect();
    const x = Math.max(n.left, Math.min(r.left, n.right - r.width));
    if (!placed.current) ind.style.transition = "none";
    ind.style.width = `${r.width}px`;
    ind.style.height = `${r.height}px`;
    ind.style.transform = `translate(${x}px, ${r.top}px)`;
    if (!placed.current) {
      void ind.offsetHeight;
      ind.style.transition = "";
      placed.current = true;
    }
  }, [active, searchOpen]);
  useLayoutEffect(() => {
    layout();
    const bar = barRef.current;
    const nav = navRef.current;
    if (!bar || !nav) return;
    const ro = new ResizeObserver(layout);
    ro.observe(bar);
    nav.addEventListener("scroll", layout, { passive: true });
    addEventListener("resize", layout);
    return () => {
      ro.disconnect();
      nav.removeEventListener("scroll", layout);
      removeEventListener("resize", layout);
    };
  }, [layout]);

  const openSearch = () => {
    setPickerOpen(false);
    flushSync(() => setSearchOpen(true));
    searchInput.current?.focus({ preventScroll: true });
  };
  const closeSearch = useCallback((refocus = true) => {
    setSearchOpen(false);
    if (refocus) searchBtn.current?.focus({ preventScroll: true });
  }, []);

  useEffect(() => {
    if (!searchOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") closeSearch();
    };
    const onClick = (e: MouseEvent) => {
      const t = e.target as Node;
      if (barRef.current?.contains(t) || searchBtn.current?.contains(t)) return;
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
    const inside = (n: Node | null) =>
      !!n && (!!barRef.current?.contains(n) || !!root?.contains(n) || !!pickerBtn.current?.contains(n));
    const onClick = (e: MouseEvent) => {
      if (!inside(e.target as Node)) closePicker(false);
    };
    const onFocusOut = (e: FocusEvent) => {
      const to = e.relatedTarget as Node | null;
      if (to && !inside(to)) closePicker(false);
    };
    document.addEventListener("keydown", onKey);
    document.addEventListener("click", onClick);
    root?.addEventListener("focusout", onFocusOut);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.removeEventListener("click", onClick);
      root?.removeEventListener("focusout", onFocusOut);
    };
  }, [pickerOpen, closePicker]);

  useEffect(() => {
    const vv = window.visualViewport;
    const el = document.documentElement;
    if (!vv || !searchOpen) return;
    const update = () => {
      el.style.setProperty("--vv-top", `${Math.max(0, vv.offsetTop)}px`);
      layout();
    };
    update();
    vv.addEventListener("resize", update, { passive: true });
    vv.addEventListener("scroll", update, { passive: true });
    return () => {
      vv.removeEventListener("resize", update);
      vv.removeEventListener("scroll", update);
      el.style.removeProperty("--vv-top");
    };
  }, [searchOpen, layout]);

  useEffect(() => {
    const bar = barRef.current;
    const root = bar?.parentElement;
    const els = [pickerBtn.current, bar, indRef.current, themeBtn.current, searchBtn.current, pickerRef.current];
    if (!root || els.some((e) => !e)) return;
    let alive = true;
    (async () => {
      await document.fonts?.ready;
      if (!alive) return;
      layout();
      const g = await LiquidGlass.init({ root, glassElements: els as HTMLElement[] });
      if (alive) glass.current = g;
      else g.destroy();
    })();
    return () => {
      alive = false;
      glass.current?.destroy();
      glass.current = null;
    };
  }, []);

  useEffect(() => {
    const g = glass.current;
    if (!g) return;
    document.querySelectorAll<HTMLElement>(".page-bg, .page-fade-top").forEach((el) => {
      if (getComputedStyle(el).display !== "none") g.markChanged(el);
    });
  }, [theme]);

  const dark = theme === "dark";
  return (
    <>
      <img className="page-bg page-bg-claro" src={fundoClaro} alt="" aria-hidden="true" />
      <img className="page-bg page-bg-escuro" src={fundoEscuro} alt="" aria-hidden="true" />
      <div className="page-fade-top page-fade-claro" aria-hidden="true" />
      <div className="page-fade-top page-fade-escuro" aria-hidden="true" />
      <button
        ref={pickerBtn}
        type="button"
        className="sh-btn sh-btn-pages"
        onClick={() => (pickerOpen ? closePicker() : setPickerOpen(true))}
        aria-label={pickerOpen ? "Fechar lista de páginas" : "Abrir lista de páginas"}
        aria-expanded={pickerOpen}
        aria-controls={pickerId}
        title="Páginas"
        inert={searchOpen}
        data-hidden={searchOpen || undefined}
        data-config={JSON.stringify(BUTTON_GLASS)}
      >
        <span className="label">
          <Burger />
        </span>
      </button>
      <header
        ref={barRef}
        className="site-header"
        data-mode={searchOpen ? "search" : "menu"}
        data-config={JSON.stringify(BAR_GLASS[theme])}
      >
        <span className="sh-slot" />
        <nav
          ref={navRef}
          className="sh-nav"
          aria-label={label}
          data-fade-start={fade.start || undefined}
          data-fade-end={fade.end || undefined}
          onScroll={syncFade}
          inert={searchOpen}
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
              onFocus={() => reveal(i, false)}
              onClick={(e) => {
                it.onSelect?.(e);
                if (it.spy !== false && it.href.startsWith("#")) {
                  pin(700);
                  setActive(i);
                }
              }}
            >
              <span className="sh-label" data-text={it.label}>
                {it.label}
              </span>
            </a>
          ))}
        </nav>
        <PageSearch open={searchOpen} id={searchId} scopeId={searchScope} inputRef={searchInput} onClose={closeSearch} />
        <div className="sh-actions">
          <span className="sh-slot" />
          <span className="sh-slot" />
        </div>
      </header>
      <div ref={indRef} className="sh-indicator" aria-hidden="true" data-config={JSON.stringify(INDICATOR_GLASS)} />
      <button
        ref={themeBtn}
        type="button"
        className="sh-btn sh-btn-theme"
        onClick={toggle}
        aria-label={dark ? "Ativar modo claro" : "Ativar modo escuro"}
        title="Alternar modo claro / escuro"
        inert={searchOpen}
        data-hidden={searchOpen || undefined}
        data-config={JSON.stringify(BUTTON_GLASS)}
      >
        <span className="label">{dark ? <Sun /> : <Moon />}</span>
      </button>
      <button
        ref={searchBtn}
        type="button"
        className="sh-btn sh-btn-search"
        onClick={() => (searchOpen ? closeSearch() : openSearch())}
        aria-label={searchOpen ? "Fechar pesquisa" : "Pesquisar na página"}
        aria-expanded={searchOpen}
        aria-controls={searchId}
        title={searchOpen ? "Fechar pesquisa" : "Pesquisar na página"}
        data-config={JSON.stringify(BUTTON_GLASS)}
      >
        <span className="label">
          <Magnifier />
        </span>
      </button>
      <div
        ref={pickerRef}
        id={pickerId}
        className="sh-picker"
        data-open={pickerOpen || undefined}
        inert={!pickerOpen}
        data-config={JSON.stringify(BAR_GLASS[theme])}
      >
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
                    <span className="sh-pick-here">{here && <Check />}</span>
                  </a>
                </li>
              );
            })}
          </ul>
        </nav>
      </div>
    </>
  );
};
