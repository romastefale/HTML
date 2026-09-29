// Shared liquid-glass enhancer for the static pages. The HTML is the source of
// content; this upgrades `[data-lg="material"]` slots into <Glass> materials.
//
//   <div class="lg-slot" data-lg="material" data-lg-optics="frost" data-lg-block>
//     <div class="glass tint-frost">…content…</div>
//   </div>
//
// The inner box's className moves onto <Glass>, its child nodes are adopted
// (moved, not copied). If this module never runs, the inner box keeps the CSS
// frost fallback from assets/glass.css.
import {
  React,
  createRoot,
  flushSync,
  Glass,
} from "./liquid-glass/liquid-glass.bundle.js";

export const h = React.createElement;

// A softer, wider sheen than the default 3px rim so no edge reads as a hairline.
export const SOFT_SHEEN = { sheenWidth: 9, sheenFalloff: 2.2 };

export const OPTICS = {
  // Content-sized controls: the library's default look + a soft sheen.
  default: { ...SOFT_SHEEN },
  // Wide panels (nav bar, search, feed cards): frost-only, no displacement,
  // per BROWSERS.md ("very wide panels shouldn't use a stretched lens").
  frost: { ...SOFT_SHEEN, strength: 0, dispersion: 0 },
  // Frost-only reading panel: heavier blur for text legibility.
  panel: { ...SOFT_SHEEN, strength: 0, dispersion: 0, frost: 22, saturate: 1.4 },
};

/** Moves existing DOM nodes into a React-owned box (display: contents). */
export function Adopt({ nodes }) {
  const ref = React.useRef(null);
  React.useLayoutEffect(() => {
    ref.current.append(...nodes);
  }, []);
  return h("div", { ref, style: { display: "contents" } });
}

export function enhanceMaterials(scope = document) {
  for (const slot of scope.querySelectorAll('[data-lg="material"]')) {
    const box = slot.firstElementChild;
    if (!box) continue;
    try {
      const nodes = [...box.childNodes];
      const optics = OPTICS[slot.dataset.lgOptics || "default"] || OPTICS.default;
      // <Glass> material defaults to inline-block; block slots fill their row.
      const style = "lgBlock" in slot.dataset ? { display: "block", width: "100%" } : undefined;
      const root = createRoot(slot);
      flushSync(() =>
        root.render(h(Glass, { className: box.className, optics, style }, h(Adopt, { nodes }))),
      );
    } catch (err) {
      console.error("[glass-ui]", err);
    }
  }
}

export function markReady() {
  document.documentElement.classList.add("lg-ready");
}
