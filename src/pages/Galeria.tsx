import React, { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { Glass, type GlassOptics, type GlassSurfaceLens } from "@samasante/liquid-glass";
import { SiteHeader, type NavItem } from "../components/SiteHeader";
import { Frost } from "../components/Frost";
import { GlassCaption, GlassPanel, Picture, CREDITS_URL, WIDTHS, asset } from "../components/Surfaces";
import { FROST, PANEL } from "../lib/optics";
import { pageNav } from "../lib/pages";
import { useReducedMotion } from "../lib/useMedia";
import { softwareGL, useBox, useFilterResolution, useOnScreen } from "../lib/device";
import "./Galeria.css";

/*
 * Galeria: a media page. Liquid-glass methods used here (none of them is on
 * the sample or the painel):
 *  1. a slideshow viewer drawn by ONE WebGL renderer: <Glass draw lenses>
 *     paints the current photo into a canvas every frame (a slow Ken Burns
 *     zoom + a crossfade) and draws every transport control as its own lens
 *     over it (the fork's examples/GlassVideoControls pattern, with `draw`
 *     instead of a video `src`). Mounted only while the viewer is on screen,
 *     the tab is visible and the slideshow plays; otherwise the same photo is a
 *     plain <picture> and the controls are frost in CSS (no loop at all);
 *  2. a sticky filter toolbar of chips (frost in CSS);
 *  3. a sheet (<dialog>) with a loupe: <Glass refract> on a MAGNIFIED copy of
 *     the photo, moved by pointer, touch or the arrow keys.
 */

const SECTIONS = [
  { href: "#visor", label: "Visor" },
  { href: "#colecao", label: "Coleção" },
  { href: "#como", label: "Como funciona" },
  { href: "#creditos", label: "Créditos" },
];
const NAV: NavItem[] = pageNav("galeria", SECTIONS);

type Tag = "brasil" | "mundo" | "noite";
interface Photo {
  name: string; w: number; h: number; title: string; alt: string; tags: Tag[];
  author: string; page: string; lic: string; licHref?: string; note: string;
}
const CC0 = "https://creativecommons.org/publicdomain/zero/1.0/";
const BYSA4 = "https://creativecommons.org/licenses/by-sa/4.0/";
const PHOTOS: Photo[] = [
  { name: "santorini-oia", w: 1600, h: 1067, title: "Oia, Santorini", tags: ["mundo"],
    alt: "Três cúpulas azuis de igrejas brancas em Oia, Santorini, acima do mar Egeu azul-escuro",
    author: "Giles Laurent", page: "https://commons.wikimedia.org/wiki/File:1000_Three_domes_of_Oia_in_Santorini_Photo_by_Giles_Laurent.jpg", lic: "CC BY-SA 4.0", licHref: BYSA4,
    note: "Cúpulas azuis sobre a caldeira, no norte da ilha." },
  { name: "cataratas-do-iguacu", w: 1600, h: 1200, title: "Cataratas do Iguaçu", tags: ["brasil"],
    alt: "Arco-íris sobre as Cataratas do Iguaçu, vistas do lado argentino, cercadas de mata verde",
    author: "Tabetabe", page: "https://commons.wikimedia.org/wiki/File:Iguazu_Falls_with_Rainbow.JPG", lic: "domínio público",
    note: "Na fronteira do Brasil com a Argentina; a foto é do lado argentino." },
  { name: "sao-paulo-copan-italia", w: 1600, h: 900, title: "Centro de São Paulo", tags: ["brasil", "noite"],
    alt: "Centro de São Paulo à noite, com o Edifício Itália e o Copan entre prédios iluminados sob um céu rosado de nuvens",
    author: "Webysther Nunes", page: "https://commons.wikimedia.org/wiki/File:Webysther_20150427002640_-_Edif%C3%ADcios_Terra%C3%A7o_It%C3%A1lia_e_Copan.jpg", lic: "CC BY-SA 4.0", licHref: BYSA4,
    note: "O Edifício Itália e o Copan à noite." },
  { name: "hong-kong-victoria-harbour", w: 1600, h: 1063, title: "Porto de Victoria, Hong Kong", tags: ["mundo", "noite"],
    alt: "Arranha-céus iluminados às margens do Porto de Victoria, em Hong Kong, ao entardecer",
    author: "Wilfredor", page: "https://commons.wikimedia.org/wiki/File:Victoria_Harbour_skyscrapers.jpg", lic: "CC0", licHref: CC0,
    note: "A orla da Ilha de Hong Kong, vista de Kowloon." },
  { name: "lencois-maranhenses", w: 1600, h: 1200, title: "Lençóis Maranhenses", tags: ["brasil"],
    alt: "Lagoa azul entre dunas brancas e curvas nos Lençóis Maranhenses, sob céu azul",
    author: "Gerda Arendt", page: "https://commons.wikimedia.org/wiki/File:Lagoon_in_curved_sanddunes,_Len%C3%A7%C3%B3is_Maranhenses.jpg", lic: "CC0", licHref: CC0,
    note: "Lagoas de chuva entre as dunas, no Maranhão." },
  { name: "toquio-torre-minato", w: 1600, h: 900, title: "Torre de Tóquio", tags: ["mundo", "noite"],
    alt: "Tóquio à noite vista do alto, com a Torre de Tóquio iluminada em laranja entre os prédios de Minato",
    author: "David Kernan", page: "https://commons.wikimedia.org/wiki/File:Tokyo_Tower,_Minato_City.jpg", lic: "CC BY 4.0", licHref: "https://creativecommons.org/licenses/by/4.0/",
    note: "A torre iluminada no bairro de Minato." },
  { name: "rio-pao-de-acucar", w: 1600, h: 990, title: "Pão de Açúcar, Rio de Janeiro", tags: ["brasil"],
    alt: "Pão de Açúcar sobre a Baía de Guanabara, no Rio de Janeiro, com mata verde e céu azul",
    author: "Wilfredor", page: "https://commons.wikimedia.org/wiki/File:Sugarloaf_Mountain,_Rio_de_Janeiro,_Brazil.jpg", lic: "CC0", licHref: CC0,
    note: "O morro sobre a Baía de Guanabara." },
  { name: "singapura-entardecer", w: 1600, h: 900, title: "Marina Bay, Singapura", tags: ["mundo", "noite"],
    alt: "Centro financeiro de Singapura ao entardecer, com a Marina Bay, o museu em forma de flor de lótus e prédios iluminados",
    author: "Basile Morin", page: "https://commons.wikimedia.org/wiki/File:Skylines_of_the_Central_Business_District,_Singapore_at_dusk.jpg", lic: "CC BY-SA 4.0", licHref: BYSA4,
    note: "O centro financeiro e a baía, ao entardecer." },
  { name: "aurora-boreal-alasca", w: 1600, h: 1043, title: "Aurora boreal, Alasca", tags: ["mundo", "noite"],
    alt: "Aurora boreal verde e roxa no céu noturno sobre a neve, no Alasca",
    author: "Senior Airman Joshua Strang (USAF)", page: "https://commons.wikimedia.org/wiki/File:Aurora_borealis_over_Eielson_Air_Force_Base,_Alaska.jpg", lic: "domínio público",
    note: "Sobre a Base Aérea de Eielson." },
];
const SLIDE_MS = 6000;
const FADE_MS = 700;

const Credit: React.FC<{ p: Photo }> = ({ p }) => (
  <>
    Foto: <a href={p.page}>{p.author}</a>, {p.licHref ? <a href={p.licHref}>{p.lic}</a> : p.lic}
  </>
);

// ── 1. The viewer ─────────────────────────────────────────────────────────
// examples/GlassVideoControls.tsx › PLAYER_OPTICS / SCRUB_OPTICS, with
// specular 0 (the uniform hairline is the .vw-ring overlays instead).
const PLAYER_OPTICS: Partial<GlassOptics> = {
  mapSize: 512, clipToShape: true, softEdge: true,
  strength: 0.16, depth: 0.2, curvature: 0.55, bend: 0.25, bendWidth: 0.08, dispersion: 0.15,
  specular: 0, sheenAngle: 50, glow: 0.15, glowSpread: 1, glowFalloff: 1.5, sheen: 0.95, sheenWidth: 2, sheenFalloff: 1.5,
  frost: 3, brightness: 0,
};
const SCRUB_OPTICS: Partial<GlassOptics> = {
  strength: 0.03, depth: 0.3, curvature: 0.25, dispersion: 0.2, bend: 0.05, bendWidth: 0.06,
  specular: 0, sheenAngle: 45, sheen: 0.35, sheenWidth: 3, sheenFalloff: 1.5, glow: 0.1, glowSpread: 1, glowFalloff: 1.5,
  frost: 6, brightness: 0,
};
const PLAY = 72; // CSS px
const SKIP = 52;
const GAP = 0.23; // skip centre offset (fraction of the width)
const ROW = 78; // controls-row centre, px from the bottom
const SCRUB_H = 22;
const SCRUB_BOTTOM = 22;
const SCRUB_INSET = 0.07;

const hasWebGL = (() => {
  let v: boolean | null = null;
  return () => {
    if (v === null) {
      try {
        const c = document.createElement("canvas");
        v = !!(c.getContext("webgl2") || c.getContext("webgl"));
      } catch {
        v = false;
      }
    }
    return v;
  };
})();

/** The canvas source uses the same variant (width + format) the poster
 *  <picture> picked, so a photo is never downloaded twice. */
const variantFor = (name: string, pick: { w: number; ext: string } | null, px: number) => {
  const w = pick?.w ?? WIDTHS.find((x) => x >= px) ?? WIDTHS[WIDTHS.length - 1];
  return asset(`img/r/${name}-${w}.${pick?.ext ?? "webp"}`);
};
const loadImage = (src: string) =>
  new Promise<HTMLImageElement>((ok, fail) => {
    const im = new Image();
    im.decoding = "async";
    im.onload = () => ok(im);
    im.onerror = fail;
    im.src = src;
  });

const Icon = {
  prev: <svg viewBox="0 0 24 24" width="24" height="24" aria-hidden="true"><path d="M15.5 5 8.5 12l7 7" fill="none" stroke="#fff" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" /></svg>,
  next: <svg viewBox="0 0 24 24" width="24" height="24" aria-hidden="true"><path d="m8.5 5 7 7-7 7" fill="none" stroke="#fff" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" /></svg>,
  play: <svg viewBox="0 0 24 24" width="30" height="30" aria-hidden="true"><path d="M8.5 5.8v12.4c0 .7.8 1.1 1.4.7l9.4-6.2a.8.8 0 0 0 0-1.4L9.9 5.1c-.6-.4-1.4 0-1.4.7Z" fill="#fff" /></svg>,
  pause: <svg viewBox="0 0 24 24" width="30" height="30" aria-hidden="true"><rect x="6.5" y="5" width="4" height="14" rx="1.2" fill="#fff" /><rect x="13.5" y="5" width="4" height="14" rx="1.2" fill="#fff" /></svg>,
};

const Viewer: React.FC<{ index: number; setIndex: (i: number) => void }> = ({ index, setIndex }) => {
  const boxRef = useRef<HTMLDivElement>(null);
  const { w, h } = useBox(boxRef);
  const reduce = useReducedMotion();
  // The lens loop needs a GPU: with no WebGL, or WebGL drawn on the CPU, the
  // controls stay frost and the show waits for play (docs/DESEMPENHO.md P5).
  const [gl] = useState(() => typeof document !== "undefined" && hasWebGL() && !softwareGL());
  const [playing, setPlaying] = useState(!reduce && gl);
  useEffect(() => setPlaying((p) => p && !reduce), [reduce]);
  const onScreen = useOnScreen(boxRef);
  // The first photo must be decoded before the (opaque) canvas replaces the poster.
  const [firstReady, setFirstReady] = useState(false);
  const live = gl && onScreen && playing && w > 0 && firstReady;
  // Render the canvas at up to 2× CSS size, then scale it down: the library's
  // canvas source is sized in CSS px, which looks soft on 2×/3× screens.
  const S = typeof window !== "undefined" ? Math.min(2, Math.max(1, Math.round(window.devicePixelRatio || 1))) : 1;
  const fillRef = useRef<HTMLDivElement>(null);
  const photo = PHOTOS[index];

  // Slideshow clock (advanced by the draw loop while live; kept when paused).
  const clock = useRef({ elapsed: 0, last: 0, from: -1, fadeAt: -1e9, advancing: false });
  const [pick, setPick] = useState<{ w: number; ext: string } | null>(null);
  const images = useRef(new Map<string, HTMLImageElement>());
  const idxRef = useRef(index);
  const reduceRef = useRef(reduce);
  reduceRef.current = reduce;
  useEffect(() => {
    if (idxRef.current !== index) {
      clock.current.from = idxRef.current;
      clock.current.fadeAt = performance.now();
      clock.current.elapsed = 0;
    }
    clock.current.advancing = false;
    idxRef.current = index;
    if (fillRef.current) fillRef.current.style.transform = "scaleX(0)";
  }, [index]);

  // What the poster picked from its srcset (e.g. …-1080.avif).
  useLayoutEffect(() => {
    const img = boxRef.current?.querySelector<HTMLImageElement>("img.vw-poster");
    if (!img) return;
    const sync = () => {
      const m = /-(\d+)\.(avif|webp)$/.exec(img.currentSrc);
      if (m) setPick((p) => (p && p.w === +m[1] && p.ext === m[2] ? p : { w: +m[1], ext: m[2] }));
    };
    if (img.complete) sync();
    img.addEventListener("load", sync);
    return () => img.removeEventListener("load", sync);
  }, [index]);

  // Decode the current, previous (for the crossfade) and next photos.
  useEffect(() => {
    if (!gl || !w || !pick) return;
    const px = w * S;
    const want = [index, (index + 1) % PHOTOS.length, clock.current.from].filter((i) => i >= 0);
    let cancelled = false;
    for (const i of want) {
      const n = PHOTOS[i].name;
      if (images.current.has(n)) continue;
      loadImage(variantFor(n, pick, px)).then((im) => {
        images.current.set(n, im);
        if (!cancelled && i === index) setFirstReady(true);
      }, () => {});
    }
    return () => {
      cancelled = true;
    };
  }, [index, w, S, gl, pick]);

  const advance = useRef<() => void>(() => {});
  advance.current = () => setIndex((idxRef.current + 1) % PHOTOS.length);

  const cover = (ctx: CanvasRenderingContext2D, im: HTMLImageElement, cw: number, ch: number, zoom: number, alpha: number) => {
    const s = Math.max(cw / im.naturalWidth, ch / im.naturalHeight) * zoom;
    const dw = im.naturalWidth * s;
    const dh = im.naturalHeight * s;
    ctx.globalAlpha = alpha;
    ctx.drawImage(im, (cw - dw) / 2, (ch - dh) / 2, dw, dh);
    ctx.globalAlpha = 1;
  };
  const draw = useCallback((ctx: CanvasRenderingContext2D) => {
    const now = performance.now();
    const c = clock.current;
    const dt = c.last ? Math.min(100, now - c.last) : 0;
    c.last = now;
    c.elapsed += dt;
    const { width: cw, height: ch } = ctx.canvas;
    const cur = images.current.get(PHOTOS[idxRef.current].name);
    const zoomOf = (e: number) => (reduceRef.current ? 1.02 : 1.02 + 0.06 * Math.min(1, e / SLIDE_MS));
    ctx.fillStyle = "#1b1646";
    ctx.fillRect(0, 0, cw, ch);
    const fade = Math.min(1, (now - c.fadeAt) / FADE_MS);
    const before = c.from >= 0 ? images.current.get(PHOTOS[c.from].name) : undefined;
    const prev = fade < 1 || !cur ? before : undefined;
    if (prev) cover(ctx, prev, cw, ch, zoomOf(SLIDE_MS), 1);
    if (cur) cover(ctx, cur, cw, ch, zoomOf(c.elapsed), prev ? fade : 1);
    else {
      c.elapsed = 0; // not decoded yet: hold the clock (the previous photo stays)
      c.fadeAt = now;
    }
    if (fillRef.current) fillRef.current.style.transform = `scaleX(${Math.min(1, c.elapsed / SLIDE_MS)})`;
    if (c.elapsed >= SLIDE_MS && !c.advancing) {
      c.elapsed = SLIDE_MS;
      c.advancing = true;
      queueMicrotask(() => advance.current());
    }
  }, []);
  // Without the lens loop, a plain timer runs the show and a CSS transition fills the bar.
  useEffect(() => {
    if (gl || !playing || !onScreen) return;
    const c = clock.current;
    const f = fillRef.current;
    const from = Math.min(0.98, c.elapsed / SLIDE_MS);
    const left = SLIDE_MS * (1 - from);
    if (f) {
      f.style.transition = "none";
      f.style.transform = `scaleX(${from})`;
      void f.offsetWidth;
      f.style.transition = `transform ${left}ms linear`;
      f.style.transform = "scaleX(1)";
    }
    const t0 = performance.now();
    const id = setTimeout(() => advance.current(), left);
    return () => {
      clearTimeout(id);
      c.elapsed = Math.min(SLIDE_MS * 0.98, c.elapsed + performance.now() - t0);
      if (f) {
        f.style.transition = "none";
        f.style.transform = `scaleX(${c.elapsed / SLIDE_MS})`;
      }
    };
  }, [gl, playing, onScreen, index]);
  // A fresh start of the loop mustn't count the paused time.
  useEffect(() => {
    if (live) clock.current.last = 0;
  }, [live]);

  // Lens geometry, in the (S×) canvas container's px; centres as 0..1 fractions.
  const lenses: GlassSurfaceLens[] = useMemo(() => {
    if (!(w > 0 && h > 0)) return [];
    const y = 1 - ROW / h;
    return [
      { x: 0.5, y, w: PLAY * S, h: PLAY * S, radius: (PLAY * S) / 2 },
      { x: 0.5 - GAP, y, w: SKIP * S, h: SKIP * S, radius: (SKIP * S) / 2 },
      { x: 0.5 + GAP, y, w: SKIP * S, h: SKIP * S, radius: (SKIP * S) / 2 },
      {
        x: 0.5, y: 1 - (SCRUB_BOTTOM + SCRUB_H / 2) / h,
        w: w * (1 - 2 * SCRUB_INSET) * S, h: SCRUB_H * S, radius: 7 * S,
        optics: SCRUB_OPTICS,
      },
    ];
  }, [w, h, S]);

  const go = (d: number) => setIndex((index + d + PHOTOS.length) % PHOTOS.length);
  const seek = (e: React.PointerEvent) => {
    const r = (e.currentTarget as HTMLElement).getBoundingClientRect();
    const f = Math.min(1, Math.max(0, (e.clientX - r.left) / r.width));
    clock.current.elapsed = f * SLIDE_MS * 0.98;
    if (fillRef.current) fillRef.current.style.transform = `scaleX(${f})`;
  };
  const ctl = (x: number, d: number): React.CSSProperties => ({ left: `${x * 100}%`, bottom: ROW - d / 2, width: d, height: d });

  return (
    <div ref={boxRef} className="vw" data-live={live || undefined} onKeyDown={(e) => {
      if (e.key === "ArrowLeft") go(-1);
      if (e.key === "ArrowRight") go(1);
    }}>
      <Picture
        key={photo.name}
        name={photo.name}
        alt={photo.alt}
        w={photo.w}
        h={photo.h}
        priority={index === 0}
        className="vw-poster"
        sizes="(max-width: 700px) calc(125vw - 50px), 1040px"
      />
      {live && (
        <div className="vw-gl" style={{ width: `${S * 100}%`, height: `${S * 100}%`, transform: `scale(${1 / S})` }} aria-hidden="true">
          <Glass draw={draw} optics={PLAYER_OPTICS} lenses={lenses} maxDpr={1} style={{ position: "absolute", inset: 0 }} />
        </div>
      )}
      {/* Paused / off screen / no WebGL: the same controls as frost in CSS. */}
      {!live && (
        <div className="vw-frost" aria-hidden="true">
          {([[0.5, PLAY], [0.5 - GAP, SKIP], [0.5 + GAP, SKIP]] as const).map(([x, d]) => (
            <Frost key={x} className="vw-disc tint-ink" optics={FROST} style={{ position: "absolute", ...ctl(x, d) }} />
          ))}
          <Frost className="vw-bar tint-ink" optics={FROST} style={{ position: "absolute" }} />
        </div>
      )}
      <div className="vw-top">
        <GlassCaption>
          <span className="cap">
            <strong>{photo.title}</strong>
            <small><Credit p={photo} /></small>
          </span>
        </GlassCaption>
        <span className="vw-count" aria-live="polite">
          {index + 1} de {PHOTOS.length}
        </span>
      </div>
      {/* Crisp controls over the lenses (+ the uniform hairline rings). */}
      <button type="button" className="vw-btn" style={ctl(0.5 - GAP, SKIP)} onClick={() => go(-1)} aria-label="Foto anterior">
        {Icon.prev}
      </button>
      <button type="button" className="vw-btn" style={ctl(0.5, PLAY)} onClick={() => setPlaying((p) => !p)} aria-label={playing ? "Pausar a apresentação" : "Reproduzir a apresentação"} aria-pressed={playing}>
        {playing ? Icon.pause : Icon.play}
      </button>
      <button type="button" className="vw-btn" style={ctl(0.5 + GAP, SKIP)} onClick={() => go(1)} aria-label="Próxima foto">
        {Icon.next}
      </button>
      <div className="vw-scrub" onPointerDown={seek} aria-hidden="true">
        <div className="vw-track">
          <div ref={fillRef} className="vw-fill" />
        </div>
      </div>
    </div>
  );
};

// ── 2. Collection with a sticky chip toolbar ──────────────────────────────
const FILTERS: { key: "todas" | Tag; label: string }[] = [
  { key: "todas", label: "Todas" },
  { key: "brasil", label: "Brasil" },
  { key: "mundo", label: "Mundo" },
  { key: "noite", label: "À noite" },
];

// ── 3. The sheet, with a loupe (<Glass refract> on a magnified copy) ──────
const LOUPE = 116;
const ZOOM = 1.8;
const LOUPE_LENS: Partial<GlassOptics> = {
  mapSize: 256, clipToShape: true, softEdge: true,
  strength: 0.2, depth: 0.9, curvature: 0.6, dispersion: 0.3, bend: 0.5, bendWidth: 0.1,
  frost: 0, brightness: 0.04, specular: 0, glow: 0.2, glowSpread: 1, glowFalloff: 1,
};

/** The sheet's content, mounted with the photo (so its measurements start with it). */
const SheetBody: React.FC<{ photo: Photo; onClose: () => void; onView: () => void; closeRef: React.Ref<HTMLButtonElement> }> = ({
  photo, onClose, onView, closeRef,
}) => {
  const stageRef = useRef<HTMLDivElement>(null);
  const { w, h } = useBox(stageRef);
  const [pos, setPos] = useState({ x: 0.62, y: 0.46 });
  const [src, setSrc] = useState("");
  const fr = useFilterResolution();
  useLayoutEffect(() => {
    const img = stageRef.current?.querySelector<HTMLImageElement>("img");
    if (!img) return;
    const sync = () => img.currentSrc && setSrc(img.currentSrc);
    if (img.complete) sync();
    img.addEventListener("load", sync);
    return () => img.removeEventListener("load", sync);
  }, []);

  const move = (e: React.PointerEvent) => {
    const r = stageRef.current!.getBoundingClientRect();
    setPos({ x: Math.min(1, Math.max(0, (e.clientX - r.left) / r.width)), y: Math.min(1, Math.max(0, (e.clientY - r.top) / r.height)) });
  };
  const key = (e: React.KeyboardEvent) => {
    const step = e.shiftKey ? 0.1 : 0.04;
    const d = ({ ArrowLeft: [-step, 0], ArrowRight: [step, 0], ArrowUp: [0, -step], ArrowDown: [0, step] } as Record<string, number[]>)[e.key];
    if (!d) return;
    e.preventDefault();
    setPos((p) => ({ x: Math.min(1, Math.max(0, p.x + d[0])), y: Math.min(1, Math.max(0, p.y + d[1])) }));
  };

  // The loupe stays inside the photo; the copy is the photo, cover-fitted like
  // the <img>, scaled ZOOM× around the point under the loupe's centre.
  const r = LOUPE / 2;
  const cx = Math.min(w - r - 6, Math.max(r + 6, pos.x * w));
  const cy = Math.min(h - r - 6, Math.max(r + 6, pos.y * h));
  const ar = photo.w / photo.h;
  const coverW = w / h > ar ? w : h * ar;
  const coverH = w / h > ar ? w / ar : h;
  const offX = (w - coverW) / 2;
  const offY = (h - coverH) / 2;

  return (
    <Frost className="glass sheet-glass tint-frost" optics={PANEL}>
      <div className="sheet-grip" aria-hidden="true" />
      <div
        ref={stageRef}
        className="sheet-photo"
        tabIndex={0}
        role="group"
        aria-label="Foto com lupa: arraste ou use as setas para mover a lupa"
        onPointerDown={(e) => {
          (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
          move(e);
        }}
        onPointerMove={(e) => (e.pointerType === "mouse" || e.buttons ? move(e) : undefined)}
        onKeyDown={key}
      >
        <Picture name={photo.name} alt={photo.alt} w={photo.w} h={photo.h} sizes="(max-width: 700px) calc(100vw - 48px), 656px" />
        {w > 0 && h > 0 && src && (
          <div className="loupe" style={{ transform: `translate(${cx - r}px, ${cy - r}px)`, width: LOUPE, height: LOUPE }}>
            <Glass
              optics={LOUPE_LENS}
              width={LOUPE}
              height={LOUPE}
              radius={r}
              filterResolution={fr}
              behind="#222"
              refract={
                <img
                  alt=""
                  aria-hidden
                  src={src}
                  style={{
                    position: "absolute", maxWidth: "none",
                    width: coverW * ZOOM, height: coverH * ZOOM,
                    left: r - (cx - offX) * ZOOM, top: r - (cy - offY) * ZOOM,
                  }}
                />
              }
              style={{ position: "absolute", inset: 0, borderRadius: r }}
            />
            <span className="loupe-ring" aria-hidden="true" />
          </div>
        )}
      </div>
      <div className="sheet-body">
        <h2 id="sheet-title">{photo.title}</h2>
        <p>{photo.note}</p>
        <p className="sheet-credit"><Credit p={photo} /></p>
        <div className="sheet-actions">
          <Frost className="glass pill-btn tint-blue" optics={FROST}>
            <button type="button" onClick={onView}>Ver no visor</button>
          </Frost>
          <Frost className="glass pill-btn tint-control" optics={FROST}>
            <button ref={closeRef} type="button" onClick={onClose}>Fechar</button>
          </Frost>
        </div>
      </div>
    </Frost>
  );
};

const Sheet: React.FC<{ photo: Photo | null; onClose: () => void; onView: () => void }> = ({ photo, onClose, onView }) => {
  const ref = useRef<HTMLDialogElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    const d = ref.current;
    if (!d) return;
    if (photo && !d.open) {
      d.showModal();
      closeRef.current?.focus();
    }
    if (!photo && d.open) d.close();
  }, [photo]);
  return (
    <dialog ref={ref} className="sheet" aria-labelledby="sheet-title" onClose={onClose} onClick={(e) => e.target === ref.current && onClose()}>
      {photo && <SheetBody key={photo.name} photo={photo} onClose={onClose} onView={onView} closeRef={closeRef} />}
    </dialog>
  );
};

export const Galeria: React.FC = () => {
  const [index, setIndex] = useState(0);
  const [filter, setFilter] = useState<(typeof FILTERS)[number]["key"]>("todas");
  const [open, setOpen] = useState<number | null>(null);
  const opener = useRef<HTMLElement | null>(null);
  const list = PHOTOS.map((p, i) => ({ p, i })).filter(({ p }) => filter === "todas" || p.tags.includes(filter));
  const close = () => {
    setOpen(null);
    opener.current?.focus({ preventScroll: true });
  };
  return (
    <>
      <a className="skip" href="#conteudo">
        Pular para o conteúdo
      </a>
      <SiteHeader items={NAV} />
      <main id="conteudo" className="gl">
        <section id="visor" className="gl-section gl-first" aria-labelledby="gl-title">
          <div className="gl-intro">
            <p className="gl-eyebrow">Exemplo · mídia</p>
            <h1 id="gl-title">Galeria de lugares</h1>
            <p className="gl-lead">
              Um visor de fotos em que cada controle é uma lente de vidro sobre a própria imagem, desenhada em WebGL. A
              apresentação avança sozinha; pause, volte ou avance, ou toque numa foto da coleção para abrir a folha com
              a lupa.
            </p>
          </div>
          <Viewer index={index} setIndex={setIndex} />
        </section>

        <section id="colecao" className="gl-section" aria-labelledby="col-title">
          <h2 id="col-title">Coleção</h2>
          <p className="sub">
            Filtre pelos chips da barra (ela acompanha a rolagem logo abaixo do menu) e toque numa foto para abrir a
            folha. As legendas são vidro fosco em CSS.
          </p>
          <div className="gl-toolbar-wrap" data-search-skip="">
            <Frost className="glass gl-toolbar tint-bar" optics={FROST} role="toolbar" aria-label="Filtrar a coleção">
              {FILTERS.map((f) => (
                <button key={f.key} type="button" className="chip" aria-pressed={filter === f.key} onClick={() => setFilter(f.key)}>
                  {f.label}
                </button>
              ))}
              <span className="gl-count" aria-live="polite">
                {list.length} {list.length === 1 ? "foto" : "fotos"}
              </span>
            </Frost>
          </div>
          <ul className="gl-grid">
            {list.map(({ p, i }) => (
              <li key={p.name}>
                <button
                  type="button"
                  className="tile"
                  onClick={(e) => {
                    opener.current = e.currentTarget;
                    setOpen(i);
                  }}
                  aria-label={`Abrir ${p.title}`}
                >
                  <Picture name={p.name} alt={p.alt} w={p.w} h={p.h} lazy sizes="(max-width: 700px) calc(62vw - 20px), 360px" />
                  <span className="tile-cap">
                    <GlassCaption>
                      <span className="cap">{p.title}</span>
                    </GlassCaption>
                  </span>
                </button>
              </li>
            ))}
          </ul>
        </section>

        <section id="como" className="gl-section" aria-labelledby="como-title">
          <h2 id="como-title">Como funciona</h2>
          <div className="gl-notes">
            <GlassPanel className="gl-note">
              <div>
                <h3>Um renderizador, quatro lentes</h3>
                <p>
                  O visor é um <code>&lt;Glass draw lenses&gt;</code>: a cada quadro, a foto é pintada num canvas (com um
                  zoom lento e a transição) e o WebGL desenha as quatro lentes (voltar, reproduzir, avançar e a barra de
                  progresso) a partir dele. É o padrão do <code>examples/GlassVideoControls</code>, com uma pintura em vez
                  de um vídeo.
                </p>
              </div>
            </GlassPanel>
            <GlassPanel className="gl-note">
              <div>
                <h3>Laço só quando vale</h3>
                <p>
                  O WebGL só existe enquanto o visor está na tela, a aba está visível e a apresentação está tocando.
                  Pausado (ou com movimento reduzido), o visor é um <code>&lt;picture&gt;</code> comum e os controles viram
                  vidro fosco em CSS, sem nenhum laço de animação. Sem placa de vídeo (WebGL desenhado pelo processador),
                  a apresentação começa pausada e, ao tocar, troca as fotos com um temporizador simples.
                </p>
              </div>
            </GlassPanel>
            <GlassPanel className="gl-note">
              <div>
                <h3>Folha com lupa</h3>
                <p>
                  A folha é um <code>&lt;dialog&gt;</code> de vidro fosco. A lupa é um <code>&lt;Glass refract&gt;</code>{" "}
                  sobre uma cópia ampliada da foto, alinhada ao ponto sob ela: ampliação e curvatura de verdade, em todo
                  navegador. Arraste, ou use as setas.
                </p>
              </div>
            </GlassPanel>
          </div>
        </section>

        <GlassPanel className="gl-foot-glass">
          <footer className="gl-foot" id="creditos">
            <strong>Créditos.</strong> Fotos do Wikimedia Commons; licenças em <a href={CREDITS_URL}>CREDITS.md</a>.{" "}
            {PHOTOS.map((p, i) => (
              <React.Fragment key={p.name}>
                {i > 0 && " · "}
                {p.title}: <Credit p={p} />
              </React.Fragment>
            ))}
            . Óticas do visor: <code>examples/GlassVideoControls</code> do{" "}
            <a href="https://github.com/romastefale/liquid-glass">liquid-glass</a> (MIT © Sam Asante).
          </footer>
        </GlassPanel>
      </main>
      <Sheet
        photo={open === null ? null : PHOTOS[open]}
        onClose={close}
        onView={() => {
          if (open !== null) setIndex(open);
          setOpen(null);
          document.getElementById("visor")?.scrollIntoView();
        }}
      />
    </>
  );
};
