import { useCallback, useEffect, useState } from "react";

/**
 * Light / dark theme, the fork's site way (site/src/theme.ts › useTheme):
 * one toggle, persisted in localStorage under the same key. Two changes: it
 * DEFAULTS to the system setting (the site defaults to dark), and the choice is
 * applied before first paint by the inline script in each HTML <head>, so
 * there's no flash. The CSS keys off <html data-theme>.
 */
type ThemeName = "light" | "dark";
const THEME_KEY = "lg-theme";

/** Browser-bar colour per mode = --page-edge in global.css and PAGE_EDGE here. */
const PAGE_EDGE: Record<ThemeName, string> = { light: "#8b82e6", dark: "#1b1646" };

let chromeSampleRefreshScheduled = false;

/**
 * Safari 26 can keep a stale cached edge tint after a CSS variable/theme change.
 * Insert one real (not pseudo-) fixed element so WebKit has a solid colour to
 * sample. global.css clips its background to text; because it is empty, it
 * paints no visible pixels. This uses a reverse-engineered Safari behaviour,
 * not a public browser API.
 */
const ensureSafariChromeSample = (): HTMLDivElement | null => {
  if (typeof document === "undefined" || !document.body) return null;

  const existing = document.querySelector<HTMLDivElement>("[data-safari-chrome-sample]");
  if (existing) return existing;

  const sample = document.createElement("div");
  sample.className = "safari-chrome-sample";
  sample.dataset.safariChromeSample = "";
  sample.setAttribute("aria-hidden", "true");
  document.body.prepend(sample);
  return sample;
};

/**
 * Nudge Safari's cached edge sample after a theme change: 11px → 12px → 11px
 * across two animation frames. On other browsers the CSS keeps the element at
 * zero height, so this refresh attribute has no visual effect.
 */
const refreshSafariChromeSample = (): void => {
  if (!ensureSafariChromeSample() || chromeSampleRefreshScheduled) return;

  const root = document.documentElement;
  chromeSampleRefreshScheduled = true;
  root.dataset.chromeSampleRefresh = "";

  window.requestAnimationFrame(() => {
    window.requestAnimationFrame(() => {
      delete root.dataset.chromeSampleRefresh;
      chromeSampleRefreshScheduled = false;
    });
  });
};

const stored = (): ThemeName | null => {
  try {
    const v = localStorage.getItem(THEME_KEY);
    return v === "light" || v === "dark" ? v : null;
  } catch {
    return null;
  }
};
const system = (): ThemeName => (matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light");

const applyTheme = (t: ThemeName) => {
  const d = document.documentElement;
  d.dataset.theme = t;
  d.style.colorScheme = t;
  document.querySelectorAll('meta[name="theme-color"]').forEach((m) => m.setAttribute("content", PAGE_EDGE[t]));
  refreshSafariChromeSample();
};

export const useTheme = () => {
  const [theme, setTheme] = useState<ThemeName>(() =>
    typeof document !== "undefined" && document.documentElement.dataset.theme === "dark" ? "dark" : "light",
  );
  // Create the sampler for the initial theme too; follow the system setting
  // until the user picks a mode.
  useEffect(() => {
    refreshSafariChromeSample();
    const mq = matchMedia("(prefers-color-scheme: dark)");
    const sync = () => {
      if (stored()) return;
      const t = system();
      applyTheme(t);
      setTheme(t);
    };
    mq.addEventListener("change", sync);
    return () => mq.removeEventListener("change", sync);
  }, []);
  const toggle = useCallback(() => {
    setTheme((cur) => {
      const next: ThemeName = cur === "dark" ? "light" : "dark";
      try {
        localStorage.setItem(THEME_KEY, next);
      } catch {
        /* ignore */
      }
      applyTheme(next);
      return next;
    });
  }, []);
  return { theme, toggle };
};

/** The current mode for components other than the toggle (it follows
 *  <html data-theme>, whoever changes it). */
export const useThemeName = (): ThemeName => {
  const read = (): ThemeName => (document.documentElement.dataset.theme === "dark" ? "dark" : "light");
  const [t, setT] = useState<ThemeName>(() => (typeof document !== "undefined" ? read() : "light"));
  useEffect(() => {
    const mo = new MutationObserver(() => setT(read()));
    mo.observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });
    setT(read());
    return () => mo.disconnect();
  }, []);
  return t;
};
