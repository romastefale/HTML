import type { GlassOptics } from "@samasante/liquid-glass";

// Looks for the material <Glass> (a bare wrap that frosts + tints the page
// behind it). `specular: 0` switches off the library's edge layer (a 1px
// white rim + 1px top line, both scaled by `specular`): the no-hairline rule.
// The soft light comes from the `.glass` class instead (src/styles/global.css).
const NO_RIM: Partial<GlassOptics> = { specular: 0 };

/** Content-sized controls (buttons, caption pills): the library's default
 *  material look (bends the live page in Chrome/Edge), minus the rim. */
export const CONTROL: Partial<GlassOptics> = { ...NO_RIM };

/** Wide bars (nav pill, search bar): frost only. BROWSERS.md: "Very wide panels
 *  shouldn't use a single stretched displacement lens … use a frost-only
 *  treatment". */
export const FROST: Partial<GlassOptics> = { ...NO_RIM, strength: 0, dispersion: 0 };

/** Reading panels (cards, notes, footer, menu): frost only, heavier blur. */
export const PANEL: Partial<GlassOptics> = { ...NO_RIM, strength: 0, dispersion: 0, frost: 22, saturate: 1.4 };
