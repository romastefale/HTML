import { useLayoutEffect, useEffect, useMemo, useState, type RefObject } from "react";
import { useMediaQuery } from "./useMedia";

/** ≤ 4 cores or ≤ 4 GB (deviceMemory is missing in Safari/Firefox: assume 8). */
const weakDevice = () => {
  const nav = navigator as Navigator & { deviceMemory?: number };
  return (nav.hardwareConcurrency ?? 8) <= 4 || (nav.deviceMemory ?? 8) <= 4;
};

/** docs/DESEMPENHO.md P4: filterResolution 2 only on ≤ 1.5dppx screens of
 *  strong machines (the library forces 1 in WebKit anyway). */
export const useFilterResolution = () => {
  const lowDpi = useMediaQuery("(max-resolution: 1.5dppx)");
  const strong = useMemo(() => !weakDevice(), []);
  return lowDpi && strong ? 2 : 1;
};

/** The element's border-box size, kept current with a ResizeObserver. */
export const useBox = (ref: RefObject<HTMLElement | null>) => {
  const [box, setBox] = useState({ w: 0, h: 0 });
  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    const measure = () => {
      const r = el.getBoundingClientRect();
      const w = Math.round(r.width);
      const h = Math.round(r.height);
      setBox((p) => (p.w === w && p.h === h ? p : { w, h }));
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, [ref]);
  return box;
};

/** docs/DESEMPENHO.md P5: true while the element is on screen AND the tab is
 *  visible. A continuous loop (e.g. a WebGL <Glass draw>) runs only then. */
export const useOnScreen = (ref: RefObject<HTMLElement | null>, margin = "0px") => {
  const [inView, setInView] = useState(false);
  const [shown, setShown] = useState(() => typeof document === "undefined" || !document.hidden);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(([en]) => setInView(en.isIntersecting), { rootMargin: margin });
    io.observe(el);
    const onVis = () => setShown(!document.hidden);
    document.addEventListener("visibilitychange", onVis);
    return () => {
      io.disconnect();
      document.removeEventListener("visibilitychange", onVis);
    };
  }, [ref, margin]);
  return inView && shown;
};

/** Section spy for an in-page menu (the tab bar): the last section whose top
 *  has passed `line` (a fraction of the viewport); the last one at the end. */
export const useSectionSpy = (ids: string[], line = 0.42) => {
  const [active, setActive] = useState(ids[0]);
  const key = ids.join(",");
  useEffect(() => {
    const els = key.split(",").map((id) => document.getElementById(id));
    let raf = 0;
    const compute = () => {
      raf = 0;
      const y = innerHeight * line;
      let cur = els[0]?.id ?? "";
      for (const el of els) if (el && el.getBoundingClientRect().top <= y) cur = el.id;
      if (innerHeight + scrollY >= document.documentElement.scrollHeight - 2) cur = els[els.length - 1]?.id ?? cur;
      setActive(cur);
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
  }, [key, line]);
  return [active, setActive] as const;
};

/** docs/DESEMPENHO.md P6: a lens that isn't needed for the first paint mounts
 *  later, one per idle slot, so the first task only lays out the page (each
 *  <Glass> builds its maps and filter when it mounts). Returns false first. */
const queue: (() => void)[] = [];
let pumping = false;
const idle = (fn: () => void) =>
  typeof requestIdleCallback === "function" ? requestIdleCallback(fn, { timeout: 700 }) : setTimeout(fn, 32);
const pump = () => {
  const next = queue.shift();
  if (!next) {
    pumping = false;
    return;
  }
  next();
  // Wait a frame before the next one, so each mount commits and lays out in
  // its own task (back-to-back idle callbacks would be batched into one render).
  requestAnimationFrame(() => setTimeout(() => idle(pump), 0));
};
export const useDeferredMount = (enabled = true) => {
  const [ready, setReady] = useState(false);
  useEffect(() => {
    if (!enabled || ready) return;
    let alive = true;
    queue.push(() => {
      if (alive) setReady(true);
    });
    if (!pumping) {
      pumping = true;
      requestAnimationFrame(() => setTimeout(() => idle(pump), 0));
    }
    return () => {
      alive = false;
    };
  }, [enabled, ready]);
  return ready;
};

/** True once the element has come within `margin` of the viewport (sticky). */
export const useNear = (ref: RefObject<HTMLElement | null>, margin = "300px") => {
  const [near, setNear] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el || near) return;
    const io = new IntersectionObserver(([en]) => en.isIntersecting && setNear(true), { rootMargin: margin });
    io.observe(el);
    return () => io.disconnect();
  }, [ref, margin, near]);
  return near;
};

/** docs/DESEMPENHO.md P5: WebGL drawn on the CPU (SwiftShader, llvmpipe,
 *  "Basic Render") can't keep a continuous loop smooth, so the galeria keeps
 *  its frost controls there. `?webgl=forcar` overrides it (tests). */
export const softwareGL = (() => {
  let v: boolean | null = null;
  return () => {
    if (v !== null) return v;
    v = false;
    try {
      if (new URLSearchParams(location.search).get("webgl") === "forcar") return v;
      // WebGL 2, the context the library renders with (src/glassWebGL.ts).
      const gl = document.createElement("canvas").getContext("webgl2");
      if (gl) {
        const ext = gl.getExtension("WEBGL_debug_renderer_info");
        const name = String(gl.getParameter(ext ? ext.UNMASKED_RENDERER_WEBGL : gl.RENDERER));
        v = /swiftshader|llvmpipe|softpipe|software|basic render/i.test(name);
        gl.getExtension("WEBGL_lose_context")?.loseContext();
      }
    } catch {
      v = false;
    }
    return v;
  };
})();
