import { useCallback, useEffect, useState } from "react";

/**
 * Light / dark theme, the fork's site way (site/src/theme.ts › useTheme):
 * one toggle, persisted in localStorage under the same key. Two changes: it
 * DEFAULTS to the system setting (the site defaults to dark), and the choice is
 * applied before first paint by the inline script in each HTML <head>, so
 * there's no flash. The CSS keys off <html data-theme>.
 */
export type ThemeName = "light" | "dark";
export const THEME_KEY = "lg-theme";

/** Browser-bar colour per mode: the header's translucent fill over the page's
 *  top edge (--bar-bg over --page-edge), so Android's solid bar matches it.
 *  Keep in sync with the inline <head> script in index.html / liquid-glass-sample.html. */
export const BAR_COLOR: Record<ThemeName, string> = { light: "#d2d1f1", dark: "#0c0a19" };

const stored = (): ThemeName | null => {
  try {
    const v = localStorage.getItem(THEME_KEY);
    return v === "light" || v === "dark" ? v : null;
  } catch {
    return null;
  }
};
const system = (): ThemeName => (matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light");

export const applyTheme = (t: ThemeName) => {
  const d = document.documentElement;
  d.dataset.theme = t;
  d.style.colorScheme = t;
  document.querySelectorAll('meta[name="theme-color"]').forEach((m) => m.setAttribute("content", BAR_COLOR[t]));
};

export const useTheme = () => {
  const [theme, setTheme] = useState<ThemeName>(() =>
    typeof document !== "undefined" && document.documentElement.dataset.theme === "dark" ? "dark" : "light",
  );
  // Follow the system setting until the user picks a mode.
  useEffect(() => {
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
