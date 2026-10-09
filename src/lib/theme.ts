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

/** Browser-bar colour per mode = the page's top/bottom edge (--page-edge in
 *  src/styles/global.css), also html/body background-color: the menu floats,
 *  nothing solid touches the edge, so the browser bars read as the page.
 *  Keep in sync with the inline <head> script in index.html / liquid-glass-sample.html. */
const PAGE_EDGE: Record<ThemeName, string> = { light: "#8b82e6", dark: "#1b1646" };

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
