import React, { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { Glass, glassValue, type GlassOptics } from "@samasante/liquid-glass";
import { NO_SHINE } from "../lib/optics";
import { SiteHeader, type NavItem } from "../components/SiteHeader";
import { GlassCaption, GlassPanel, Picture, CREDITS_URL, HOME_URL } from "../components/Surfaces";
import { GlassPill } from "../components/GlassPill";
import { useMediaQuery, useReducedMotion } from "../lib/useMedia";
import "./Sample.css";

// Every section of the page, in order (the other pages are in the ☰ picker).
const NAV: NavItem[] = [
  { href: "#topo", label: "Lente" },
  { href: "#componentes", label: "Componentes" },
  { href: "#lugares", label: "Lugares" },
  { href: "#suporte", label: "Suporte" },
  { href: "#creditos", label: "Créditos" },
];

// ── Hero: an IN-PLACE lens (geometry + children), the fork's docs hero
//    (site/src/views/Docs.tsx › LiveHero): it bends its own children in every
//    browser. Optics = HERO_LENS from that file.
const HERO_LENS: Partial<GlassOptics> = {
  mapSize: 512, clipToShape: true, softEdge: true,
  strength: 0.06, depth: 0.7, curvature: 0.62, dispersion: 1,
  bend: 0, bendWidth: 0.16, splay: 0, frost: 0.5, brightness: 0.06,
  // specular 0 (docs: 1.3): no sheen/glow pooling at the top; the uniform
  // hairline is the .hero-ring overlay instead. sheen 0 + glow 0 too: with a
  // zero gain they add nothing, and at 0 the library skips the two specular
  // filter primitives (hasSpecular = glow > 0 || sheen > 0, src/Glass.tsx).
  ...NO_SHINE,
};
const REST = { x: 0.3, y: 0.42 };
const ORBIT = { cx: 0.5, cy: 0.5, rx: 0.26, ry: 0.14, speed: 0.5 };
const clamp = (v: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, v));

const Hero: React.FC = () => {
  const heroRef = useRef<HTMLElement>(null);
  // The lens STAGE: a content-sized box (the headline block), not the whole
  // full-viewport hero. BROWSERS.md › Known limitations: "keep lenses
  // content-sized"; the docs hero is a bounded box too. It also keeps the lens
  // off the nav, the status bar / safe area and the hero buttons.
  const stageRef = useRef<HTMLDivElement>(null);
  const x = useMemo(() => glassValue(REST.x), []);
  const y = useMemo(() => glassValue(REST.y), []);
  const target = useRef<{ x: number; y: number } | null>(null);
  const pointer = useRef<{ cx: number; cy: number } | null>(null);
  const release = useRef(0);
  const reduceMotion = useReducedMotion();
  // BROWSERS.md: Chromium "opt into filterResolution={2} for crisper edges"
  // (the library forces 1 in WebKit). Only on 1x screens, where the stair-steps
  // show; on 2x/3x screens the filter already rasterizes at device pixels.
  // Not on weaker machines either (≤4 cores or ≤4 GB): 2× is 4× the filter
  // pixels for a lens that moves every frame.
  const lowDpi = useMediaQuery("(max-resolution: 1.5dppx)");
  const strong = useMemo(() => {
    const nav = navigator as Navigator & { deviceMemory?: number };
    return (nav.hardwareConcurrency ?? 8) > 4 && (nav.deviceMemory ?? 8) > 4;
  }, []);
  const [box, setBox] = useState({ w: 0, h: 0 });

  useLayoutEffect(() => {
    const el = stageRef.current;
    if (!el) return;
    const measure = () => {
      const r = el.getBoundingClientRect();
      setBox((p) => (p.w === r.width && p.h === r.height ? p : { w: r.width, h: r.height }));
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const size = box.w ? Math.round(Math.max(130, Math.min(200, box.w * 0.42))) : 200;

  // Keep the hairline ring on the lens: same centre fraction × stage box.
  const ringRef = useRef<HTMLDivElement>(null);
  useLayoutEffect(() => {
    const place = () => {
      const el = ringRef.current;
      if (el) el.style.transform = `translate(${x.get() * box.w - size / 2}px, ${y.get() * box.h - size / 2}px)`;
    };
    place();
    const offX = x.on("change", place);
    const offY = y.on("change", place);
    return () => {
      offX();
      offY();
    };
  }, [x, y, box, size]);

  // De-oval the objectBoundingBox bend on a non-square box (same as the docs hero).
  const optics = useMemo(() => {
    const { w, h } = box;
    const s = HERO_LENS.strength ?? 0.06;
    if (!(w > 0 && h > 0)) return HERO_LENS;
    const m = Math.min(w, h);
    return { ...HERO_LENS, scaleX: (s * m) / w, scaleY: (s * m) / h };
  }, [box]);

  // Keep the whole disc inside the stage (site/src/components/GlassDemo.tsx ›
  // clampBox): an in-place lens is clipped at its element's edge, so a lens that
  // runs past it shows a cut, flat edge.
  const bounds = useRef({ xlo: 0.5, xhi: 0.5, ylo: 0.5, yhi: 0.5 });
  bounds.current = useMemo(() => {
    const { w, h } = box;
    if (!(w > 0 && h > 0)) return { xlo: 0.5, xhi: 0.5, ylo: 0.5, yhi: 0.5 };
    const px = Math.min(0.5, (size / 2 + 2) / w);
    const py = Math.min(0.5, (size / 2 + 2) / h);
    return { xlo: px, xhi: 1 - px, ylo: py, yhi: 1 - py };
  }, [box, size]);

  // Pointer drives the lens; otherwise a slow orbit (still if reduced motion).
  // Paused off-screen / in a hidden tab.
  useEffect(() => {
    const el = heroRef.current;
    if (!el) return;
    let raf = 0;
    let visible = true;
    const start = performance.now();
    // Weaker devices (≤4 cores or ≤4 GB) run the idle orbit at 30 fps: every
    // orbit frame re-rasterises the lens filter over the whole headline block.
    // The easing step is doubled to match (1 − (1 − e)²), so the path is the
    // same; a pointer/touch still drives it at full rate.
    const nav = navigator as Navigator & { deviceMemory?: number };
    const weak = (nav.hardwareConcurrency ?? 8) <= 4 || (nav.deviceMemory ?? 8) <= 4;
    let lastStep = 0;
    const tick = (now: number) => {
      raf = requestAnimationFrame(tick);
      const orbiting = !target.current;
      if (weak && orbiting && now - lastStep < 30) return;
      lastStep = now;
      const c = bounds.current;
      let tx = REST.x;
      let ty = REST.y;
      if (target.current) ({ x: tx, y: ty } = target.current);
      else if (!reduceMotion) {
        const a = ((now - start) / 1000) * ORBIT.speed;
        tx = ORBIT.cx + ORBIT.rx * Math.cos(a);
        ty = ORBIT.cy + ORBIT.ry * Math.sin(a);
      }
      tx = clamp(tx, c.xlo, c.xhi);
      ty = clamp(ty, c.ylo, c.yhi);
      const e = target.current ? 0.28 : weak ? 1 - (1 - 0.12) ** 2 : 0.12;
      const dx = tx - x.get();
      const dy = ty - y.get();
      if (Math.abs(dx) > 3e-4) x.set(x.get() + dx * e);
      if (Math.abs(dy) > 3e-4) y.set(y.get() + dy * e);
    };
    const run = () => {
      if (!raf && visible && !document.hidden) raf = requestAnimationFrame(tick);
    };
    const stop = () => {
      cancelAnimationFrame(raf);
      raf = 0;
    };
    const io = new IntersectionObserver(([en]) => {
      visible = en.isIntersecting;
      if (visible) run();
      else stop();
    });
    io.observe(el);
    const onVis = () => (document.hidden ? stop() : run());
    document.addEventListener("visibilitychange", onVis);
    // The page scrolls under a still mouse: re-aim at the cursor, or the lens
    // rides away with the content and drifts off the pointer.
    const onScroll = () => {
      const p = pointer.current;
      const r = stageRef.current?.getBoundingClientRect();
      if (p && r && target.current) target.current = { x: (p.cx - r.left) / r.width, y: (p.cy - r.top) / r.height };
    };
    addEventListener("scroll", onScroll, { passive: true });
    run();
    return () => {
      stop();
      io.disconnect();
      document.removeEventListener("visibilitychange", onVis);
      removeEventListener("scroll", onScroll);
      clearTimeout(release.current);
    };
  }, [x, y, reduceMotion]);

  const aim = (e: React.PointerEvent) => {
    clearTimeout(release.current);
    const r = stageRef.current?.getBoundingClientRect();
    if (!r) return;
    pointer.current = { cx: e.clientX, cy: e.clientY };
    target.current = { x: (e.clientX - r.left) / r.width, y: (e.clientY - r.top) / r.height };
  };
  const drop = (e: React.PointerEvent, now = false) => {
    clearTimeout(release.current);
    const clear = () => {
      target.current = null;
      pointer.current = null;
    };
    // A tap on touch places the lens and holds it a moment before the orbit resumes.
    if (e.pointerType === "mouse" || now) clear();
    else release.current = window.setTimeout(clear, 1600);
  };

  return (
    <section
      ref={heroRef}
      className="hero"
      id="topo"
      aria-labelledby="hero-title"
      onPointerDown={aim}
      onPointerMove={aim}
      onPointerLeave={(e) => drop(e)}
      onPointerCancel={(e) => drop(e, true)}
    >
      <div ref={stageRef} className="hero-stage">
        <Glass
          optics={optics}
          center={{ x, y }}
          size={size}
          radius={size / 2}
          filterResolution={lowDpi && strong ? 2 : 1}
          style={{ position: "absolute", inset: 0 }}
        >
          {/* Sized inner box: gives the absolute scene a flow height. */}
          <div style={{ position: "relative", width: "100%", height: box.h || "100%" }}>
            <div className="hero-scene">
              <p className="eyebrow">Amostra · liquid-glass</p>
              <h1 id="hero-title">
                Vidro líquido,
                <br />
                de verdade.
              </h1>
              <p className="lead">
                Uma lente que refrata o DOM ao vivo: o texto continua selecionável e os links continuam clicáveis.
              </p>
            </div>
          </div>
        </Glass>
        {box.w > 0 && <div ref={ringRef} className="hero-ring" aria-hidden="true" style={{ width: size, height: size }} />}
      </div>
      <div className="hero-actions">
        <GlassPill tint="tint-blue">
          <a className="btn" href="#componentes">
            Ver componentes
          </a>
        </GlassPill>
        <GlassPill tint="tint-soft">
          <a className="btn" href="#lugares">
            Ver fotos
          </a>
        </GlassPill>
      </div>
      <p className="hero-hint">
        {typeof window !== "undefined" && window.matchMedia("(hover: none)").matches
          ? "Toque no título para guiar a lente."
          : "Mova o cursor sobre o título para guiar a lente."}
      </p>
    </section>
  );
};

// ── Cards over the band: <Glass refract> on a position-matched copy of the
//    band's gradient, crisp content on top (examples/GlassNotification.tsx).
const PANEL_LENS: Partial<GlassOptics> = {
  mapSize: 256, clipToShape: true, softEdge: true,
  depth: 1, curvature: 0.5, dispersion: 0.6, strength: 0.17,
  bend: 0.7, bendWidth: 0.12, frost: 3, brightness: 0.22,
  ...NO_SHINE, // example: specular 1.3; uniform CSS hairline instead
};
const BAND_BG = "var(--band-bg)";

type Geo = { w: number; h: number; left: number; top: number; bw: number; bh: number; r: number };

const BandCard: React.FC<{ band: React.RefObject<HTMLDivElement | null>; children: React.ReactNode }> = ({ band, children }) => {
  const card = useRef<HTMLElement>(null);
  const [g, setG] = useState<Geo | null>(null);
  const [edge, setEdge] = useState("#eadcf6");
  useLayoutEffect(() => {
    const b = band.current;
    const c = card.current;
    if (!b || !c) return;
    setEdge(getComputedStyle(document.documentElement).getPropertyValue("--band-edge").trim() || "#eadcf6");
    const measure = () => {
      const br = b.getBoundingClientRect();
      const cr = c.getBoundingClientRect();
      const next: Geo = {
        w: Math.round(cr.width), h: Math.round(cr.height),
        left: Math.round(cr.left - br.left), top: Math.round(cr.top - br.top),
        bw: Math.round(br.width), bh: Math.round(br.height),
        r: parseFloat(getComputedStyle(c).borderTopLeftRadius) || 22,
      };
      setG((p) => (p && (Object.keys(next) as (keyof Geo)[]).every((k) => p[k] === next[k]) ? p : next));
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(b);
    ro.observe(c);
    return () => ro.disconnect();
  }, [band]);

  return (
    <article ref={card} className="gcard">
      {g && g.w > 0 && g.h > 0 && (
        <Glass
          optics={PANEL_LENS}
          brightnessInFilter
          width={g.w}
          height={g.h}
          radius={g.r}
          refract={
            <div aria-hidden style={{ position: "absolute", left: -g.left, top: -g.top, width: g.bw, height: g.bh, background: BAND_BG }} />
          }
          behind={edge}
          style={{ position: "absolute", left: 0, top: 0, width: g.w, height: g.h, borderRadius: g.r }}
        />
      )}
      <div className="gcard-body">{children}</div>
    </article>
  );
};

// object-fit: cover fills a 4:5 box (3 columns) or a 4:3 box (≤860px), so a
// landscape photo is drawn wider than its box: ~1.875× the column on desktop,
// ~1.125× the full width on phones. `sizes` says so, so 2x/3x screens get enough pixels.
const PLACE_SIZES = "(max-width: 860px) calc(112.5vw - 45px), 650px";
const Place: React.FC<{ name: string; alt: string; w: number; h: number; title: string; children: React.ReactNode }> = ({
  name, alt, w, h, title, children,
}) => (
  <figure className="place">
    <Picture name={name} alt={alt} w={w} h={h} lazy sizes={PLACE_SIZES} />
    <figcaption>
      <GlassCaption>
        <span className="cap">
          <strong>{title}</strong>
          <small>{children}</small>
        </span>
      </GlassCaption>
    </figcaption>
  </figure>
);

const Note: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => (
  <GlassPanel className="note-glass">
    <div className="note">
      <h3>{title}</h3>
      {children}
    </div>
  </GlassPanel>
);

export const Sample: React.FC = () => {
  const band = useRef<HTMLDivElement>(null);
  return (
    <>
      <a className="skip" href="#conteudo">
        Pular para o conteúdo
      </a>
      <SiteHeader items={NAV} current={"amostra"} />
      <main id="conteudo">
        <Hero />

        <section className="section" id="componentes" aria-labelledby="comp-title">
          <div className="wrap">
            <h2 id="comp-title">Cartões sobre um gradiente</h2>
            <p className="sub">
              Cada cartão é um <code>&lt;Glass refract&gt;</code>: ele refrata uma cópia alinhada do gradiente suave da
              faixa (sem formas, só cor), e o conteúdo fica nítido por cima. Os botões abaixo são o modo material.
            </p>
            <div className="band" ref={band}>
              <div className="cards">
                <BandCard band={band}>
                  <span className="icon" aria-hidden="true">
                    <svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="7" fill="none" stroke="currentColor" strokeWidth="2" /><circle cx="9.5" cy="9.5" r="2" fill="currentColor" /></svg>
                  </span>
                  <h3>Material</h3>
                  <p>Envolva uma caixa com fundo translúcido: ela vira vidro. Fosco, tonalizado e com borda clara em todo navegador; a curvatura ao vivo aparece no Chrome e no Edge.</p>
                </BandCard>
                <BandCard band={band}>
                  <span className="icon alt" aria-hidden="true">
                    <svg viewBox="0 0 24 24"><path d="M4 12h16M12 4v16" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" /></svg>
                  </span>
                  <h3>No lugar</h3>
                  <p>Dê geometria (<code>size</code> + <code>center</code>) e a lente dobra os próprios filhos, como o título no topo desta página. Funciona no Chrome, Safari e Firefox.</p>
                </BandCard>
                <BandCard band={band}>
                  <span className="icon alt2" aria-hidden="true">
                    <svg viewBox="0 0 24 24"><rect x="4" y="6" width="16" height="12" rx="3" fill="none" stroke="currentColor" strokeWidth="2" /><path d="m7 15 3.5-3.5 2.5 2.5 2-2 2 3" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" /></svg>
                  </span>
                  <h3>Cópia com refract</h3>
                  <p>Para flutuar sobre conteúdo que não é seu, passe uma cópia em <code>refract</code> e uma cor de borda em <code>behind</code>. Aqui a cópia é o mesmo gradiente da faixa: como ele é suave, o vidro aparece como variação de cor e brilho, não como formas distorcidas.</p>
                </BandCard>
              </div>
              <div className="band-actions">
                <GlassPill tint="tint-red"><button className="btn" type="button">Salvar</button></GlassPill>
                <GlassPill tint="tint-green"><button className="btn" type="button">Compartilhar</button></GlassPill>
                <GlassPill tint="tint-white"><button className="btn" type="button">Cancelar</button></GlassPill>
              </div>
            </div>
          </div>
        </section>

        <section className="section" id="lugares" aria-labelledby="lug-title">
          <div className="wrap">
            <h2 id="lug-title">Vidro sobre fotos</h2>
            <p className="sub">
              Legendas de vidro fosco sobre fotos de lugares famosos: atrás da legenda, a foto fica desfocada e
              tonalizada, igual em todos os navegadores. Como uma legenda pode ser larga, ela usa só o fosco, sem curvatura.
            </p>
            <div className="places">
              <Place name="santorini-oia" alt="Três cúpulas azuis de igrejas brancas em Oia, Santorini, acima do mar Egeu azul-escuro" w={1600} h={1067} title="Oia, Santorini">
                Foto: <a href="https://commons.wikimedia.org/wiki/File:1000_Three_domes_of_Oia_in_Santorini_Photo_by_Giles_Laurent.jpg">Giles Laurent</a>,{" "}
                <a href="https://creativecommons.org/licenses/by-sa/4.0/">CC BY-SA 4.0</a>
              </Place>
              <Place name="cataratas-do-iguacu" alt="Arco-íris sobre as Cataratas do Iguaçu, vistas do lado argentino, cercadas de mata verde" w={1600} h={1200} title="Cataratas do Iguaçu">
                Foto: <a href="https://commons.wikimedia.org/wiki/File:Iguazu_Falls_with_Rainbow.JPG">Tabetabe</a>, domínio público
              </Place>
              <Place name="lencois-maranhenses" alt="Lagoa azul entre dunas brancas e curvas nos Lençóis Maranhenses, sob céu azul" w={1600} h={1200} title="Lençóis Maranhenses">
                Foto: <a href="https://commons.wikimedia.org/wiki/File:Lagoon_in_curved_sanddunes,_Len%C3%A7%C3%B3is_Maranhenses.jpg">Gerda Arendt</a>, CC0
              </Place>
            </div>
          </div>
        </section>

        <section className="section" id="suporte" aria-labelledby="sup-title">
          <div className="wrap">
            <h2 id="sup-title">Suporte a navegadores</h2>
            <p className="sub">
              Resumo do <code>BROWSERS.md</code> da biblioteca.
            </p>
            <div className="notes">
              <Note title="Chrome, Edge e outros Chromium">
                <p>Fidelidade total. O modo material também curva a página ao vivo atrás do vidro (<code>backdrop-filter: url()</code> só existe no Blink).</p>
              </Note>
              <Note title="Safari (inclusive iOS) e Firefox">
                <p>Lente no lugar e <code>refract</code> refratam de verdade, com aberração cromática e brilho. O modo material fica fosco + tonalizado, sem curvatura. O Safari roda sempre em 1×.</p>
              </Note>
              <Note title="Limitações">
                <ul>
                  <li>Barras muito largas usam só o fosco (a lente esticada vira oval).</li>
                  <li>Filtros SVG pesam na GPU: poucas lentes, do tamanho do conteúdo.</li>
                </ul>
              </Note>
              <Note title="Arquitetura">
                <p>Esta página é um app React (Vite + TypeScript), como o site de demonstração da biblioteca. O <code>&lt;Glass&gt;</code> de <code>@samasante/liquid-glass</code> fica onde há refração: a lente do título, os cartões com <code>refract</code> e, no Chrome e no Edge, os botões. O menu do topo é o vidro do <a href="https://github.com/romastefale/liquid-glass2">liquid-glass2</a> (WebGL), e legendas, notas e rodapé são vidro fosco em CSS.</p>
              </Note>
            </div>
          </div>
        </section>
      </main>

      <footer className="site-footer" id="creditos">
        <div className="wrap">
          <GlassPanel className="foot-glass">
            <div className="foot">
              <a href={HOME_URL}>← Voltar para a página inicial</a>
              <span>
                Efeito: <a href="https://github.com/romastefale/liquid-glass">liquid-glass</a> (MIT © Sam Asante), pacote{" "}
                <code>@samasante/liquid-glass</code> 0.1.1. Menu: <a href="https://github.com/romastefale/liquid-glass2">liquid-glass2</a> (MIT, @ybouane), pacote{" "}
                <code>@ybouane/liquidglass</code> 1.0.3. Fotos: Wikimedia Commons, créditos e licenças em{" "}
                <a href={CREDITS_URL}>CREDITS.md</a>.
              </span>
            </div>
          </GlassPanel>
        </div>
      </footer>
    </>
  );
};
