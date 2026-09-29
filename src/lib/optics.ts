import type { GlassOptics } from "@samasante/liquid-glass";

// Looks for the material <Glass> (a bare wrap that frosts + tints the page
// behind it). No `specular` override: the library's default (1, MATERIAL_OPTICS
// in src/GlassMaterial.tsx of the fork) draws its own edge layer, "a soft
// bright top highlight + a faint all-round hairline. No dark line anywhere":
//   inset 0 1px 0 rgba(255,255,255,.55), inset 0 0 0 1px rgba(255,255,255,.12)
// That layer is the hairline; nothing in our CSS replaces or doubles it.

/** Content-sized controls (buttons, the search step pill): the library's
 *  default material look (bends the live page in Chrome/Edge) with its rim. */
export const CONTROL: Partial<GlassOptics> = {};

/** Wide bars (nav pill, search bar) + caption pills: frost only. BROWSERS.md:
 *  "Very wide panels shouldn't use a single stretched displacement lens … use a
 *  frost-only treatment". The rim stays at the default. */
export const FROST: Partial<GlassOptics> = { strength: 0, dispersion: 0 };

/** Reading panels (notes, footer, menu): frost only, heavier blur, default rim. */
export const PANEL: Partial<GlassOptics> = { strength: 0, dispersion: 0, frost: 22, saturate: 1.4 };
