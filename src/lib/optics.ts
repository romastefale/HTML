import type { GlassOptics } from "@samasante/liquid-glass";

// Looks for the material <Glass> (a bare wrap that frosts + tints the page
// behind it). `specular: 0` turns the library's edge layer off: it always draws
// a brighter 1px top highlight on top of the all-round rim (src/GlassMaterial.tsx
// in the fork, `edgeShadow`), and `specular` is the only knob. The hairline is
// one uniform line drawn by `.glass::after` instead (src/styles/global.css).
const FLAT_RIM: Partial<GlassOptics> = { specular: 0 };

/** Content-sized controls (buttons, the search step pill): the library's
 *  default material look (bends the live page in Chrome/Edge). */
export const CONTROL: Partial<GlassOptics> = { ...FLAT_RIM };

/** Wide bars (nav pill, search bar) + caption pills: frost only. BROWSERS.md:
 *  "Very wide panels shouldn't use a single stretched displacement lens … use a
 *  frost-only treatment". */
export const FROST: Partial<GlassOptics> = { ...FLAT_RIM, strength: 0, dispersion: 0 };

/** Reading panels (notes, footer, menu): frost only, heavier blur. */
export const PANEL: Partial<GlassOptics> = { ...FLAT_RIM, strength: 0, dispersion: 0, frost: 22, saturate: 1.4 };
