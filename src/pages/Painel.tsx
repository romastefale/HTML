import React, { useEffect, useId, useLayoutEffect, useMemo, useRef, useState } from "react";
import { Glass, animateGlassValue, cubicBezier, glassValue, type GlassOptics } from "@samasante/liquid-glass";
import { SiteHeader, type NavItem } from "../components/SiteHeader";
import { Frost } from "../components/Frost";
import { GlassCaption, GlassPanel, Picture, CREDITS_URL } from "../components/Surfaces";
import { GlassSwitch } from "../components/examples/GlassSwitch";
import { GlassSlider } from "../components/examples/GlassSlider";
import { FROST } from "../lib/optics";
import { pageNav } from "../lib/pages";
import { useThemeName } from "../lib/theme";
import { useReducedMotion } from "../lib/useMedia";
import { useBox, useDeferredMount, useFilterResolution, useNear, useSectionSpy } from "../lib/device";
import "./Painel.css";

/*
 * Painel: an app-style dashboard. Liquid-glass methods used here (none of them
 * is on the sample page):
 *  1. a segmented control whose selection is an IN-PLACE lens animated with
 *     animateGlassValue (it bends the labels as it slides);
 *  2. widgets over the wallpaper photo as <Glass refract> on a position-matched
 *     copy of that photo (the GlassNotification recipe, over a real image);
 *  3. the fork's GlassSwitch and GlassSlider recipes (examples/, copied
 *     unchanged): a white puck that turns into a lens while you press or drag;
 *  4. a floating bottom tab bar (frost in CSS) as the in-page section menu.
 * Everything else (control centre, notifications, widgets) is flat: frost in CSS.
 * No continuous animation: the lenses move only while you interact.
 */

const SECTIONS = [
  { id: "tela", label: "Tela" },
  { id: "controles", label: "Controles" },
  { id: "avisos", label: "Avisos" },
  { id: "widgets", label: "Widgets" },
] as const;
const NAV: NavItem[] = pageNav("painel", [
  ...SECTIONS.map((s) => ({ href: `#${s.id}`, label: s.label })),
  { href: "#creditos", label: "Créditos" },
]);

type Period = "manha" | "tarde" | "noite";
const PERIODS: { key: Period; label: string }[] = [
  { key: "manha", label: "Manhã" },
  { key: "tarde", label: "Tarde" },
  { key: "noite", label: "Noite" },
];
interface Wall {
  name: string; w: number; h: number; alt: string; place: string; credit: React.ReactNode;
  time: string; temp: string; cond: string; range: string; edge: string; note: string;
}
const CC0 = <a href="https://creativecommons.org/publicdomain/zero/1.0/">CC0</a>;
const WALLS: Record<Period, Wall> = {
  manha: {
    name: "lencois-maranhenses", w: 1600, h: 1200,
    alt: "Lagoa azul entre dunas brancas e curvas nos Lençóis Maranhenses, sob céu azul",
    place: "Lençóis Maranhenses",
    credit: <>Foto: <a href="https://commons.wikimedia.org/wiki/File:Lagoon_in_curved_sanddunes,_Len%C3%A7%C3%B3is_Maranhenses.jpg">Gerda Arendt</a>, {CC0}</>,
    time: "07:40", temp: "27°", cond: "Ensolarado", range: "Máx. 31° · Mín. 24°", edge: "#9fb8cf",
    note: "Maré baixa às 10h: bom horário para as lagoas.",
  },
  tarde: {
    name: "rio-pao-de-acucar", w: 1600, h: 990,
    alt: "Pão de Açúcar sobre a Baía de Guanabara, no Rio de Janeiro, com mata verde e céu azul",
    place: "Pão de Açúcar, Rio de Janeiro",
    credit: <>Foto: <a href="https://commons.wikimedia.org/wiki/File:Sugarloaf_Mountain,_Rio_de_Janeiro,_Brazil.jpg">Wilfredor</a>, {CC0}</>,
    time: "15:20", temp: "29°", cond: "Poucas nuvens", range: "Máx. 30° · Mín. 22°", edge: "#7d97a8",
    note: "Último bondinho às 19h50.",
  },
  noite: {
    name: "aurora-boreal-alasca", w: 1600, h: 1043,
    alt: "Aurora boreal verde e roxa no céu noturno sobre a neve, no Alasca",
    place: "Aurora boreal, Alasca",
    credit: <>Foto: <a href="https://commons.wikimedia.org/wiki/File:Aurora_borealis_over_Eielson_Air_Force_Base,_Alaska.jpg">Senior Airman Joshua Strang (USAF)</a>, domínio público</>,
    time: "22:45", temp: "−12°", cond: "Céu limpo", range: "Máx. −6° · Mín. −15°", edge: "#1d3a3a",
    note: "Índice de aurora alto até a meia-noite.",
  },
};

const EASE = cubicBezier(0.34, 1.36, 0.42, 1); // the library's spring curve (glassEase)

// ── 1. Segmented control: the selection is an in-place lens ────────────────
const SEG_LENS: Partial<GlassOptics> = {
  mapSize: 256, clipToShape: true, softEdge: true,
  // A short, wide lens: the bend is relative to the row, so a small strength
  // (~3 px of displacement on a 32 px lens) magnifies the label without folding it.
  strength: 0.022, depth: 0.5, curvature: 0.55, dispersion: 0.35,
  bend: 0.15, bendWidth: 0.12, splay: 0, frost: 0, brightness: 0.05,
  specular: 0, glow: 0.2, glowSpread: 1, glowFalloff: 0.8, // uniform hairline = .seg-ring
};
/** The segmented row's scene, inside the lens once it has mounted (P6). */
const SegLens: React.FC<{
  on: boolean; optics: Partial<GlassOptics>; x: ReturnType<typeof glassValue>;
  lensW: number; lensH: number; fr: number; children: React.ReactNode;
}> = ({ on, optics, x, lensW, lensH, fr, children }) =>
  on ? (
    <Glass optics={optics} center={{ x, y: 0.5 }} size={[lensW, lensH]} radius={lensH / 2} filterResolution={fr} style={{ position: "absolute", inset: 0 }}>
      {children}
    </Glass>
  ) : (
    <div style={{ position: "absolute", inset: 0 }}>{children}</div>
  );

const Segmented: React.FC<{ value: Period; onChange: (p: Period) => void }> = ({ value, onChange }) => {
  const rowRef = useRef<HTMLDivElement>(null);
  const box = useBox(rowRef);
  const n = PERIODS.length;
  const idx = PERIODS.findIndex((p) => p.key === value);
  const x = useMemo(() => glassValue((idx + 0.5) / n), []); // eslint-disable-line react-hooks/exhaustive-deps
  const reduce = useReducedMotion();
  const fr = useFilterResolution();
  const btns = useRef<(HTMLButtonElement | null)[]>([]);
  const indRef = useRef<HTMLSpanElement>(null);
  const ringRef = useRef<HTMLSpanElement>(null);
  // The lens mounts after the first paint (P6); until then the same scene sits flat.
  const lensOn = useDeferredMount();
  const segW = box.w / n;
  const lensW = Math.max(0, segW - 6);
  const lensH = Math.max(0, box.h - 6);

  useEffect(() => {
    const to = (idx + 0.5) / n;
    if (reduce) {
      x.set(to);
      return;
    }
    const a = animateGlassValue(x, to, { ease: EASE, duration: 0.55 });
    return () => a.stop();
  }, [idx, n, reduce, x]);

  // The flat selected pill and the hairline ring ride the lens centre.
  useLayoutEffect(() => {
    const place = () => {
      const left = x.get() * box.w - lensW / 2;
      if (indRef.current) indRef.current.style.transform = `translateX(${left}px)`;
      if (ringRef.current) ringRef.current.style.transform = `translateX(${left}px)`;
    };
    place();
    return x.on("change", place);
  }, [x, box.w, lensW, lensOn]);

  // De-oval the objectBoundingBox bend on the wide row (as the sample's hero).
  const optics = useMemo(() => {
    const { w, h } = box;
    if (!(w > 0 && h > 0)) return SEG_LENS;
    const s = SEG_LENS.strength ?? 0.022;
    const m = Math.min(w, h);
    return { ...SEG_LENS, scaleX: (s * m) / w, scaleY: (s * m) / h };
  }, [box]);

  const onKey = (e: React.KeyboardEvent) => {
    const d = e.key === "ArrowRight" || e.key === "ArrowDown" ? 1 : e.key === "ArrowLeft" || e.key === "ArrowUp" ? -1 : 0;
    if (!d) return;
    e.preventDefault();
    const next = (idx + d + n) % n;
    onChange(PERIODS[next].key);
    btns.current[next]?.focus();
  };

  return (
    <Frost className="glass seg tint-control" optics={FROST}>
      <div ref={rowRef} className="seg-row" role="radiogroup" aria-label="Hora do dia" onKeyDown={onKey}>
        {box.w > 0 && (
          <SegLens on={lensOn} optics={optics} x={x} lensW={lensW} lensH={lensH} fr={fr}>
            <div className="seg-scene" style={{ height: box.h }}>
              <span ref={indRef} className="seg-ind" aria-hidden="true" style={{ width: lensW, height: lensH }} />
              {PERIODS.map((p, i) => (
                <button
                  key={p.key}
                  ref={(el) => {
                    btns.current[i] = el;
                  }}
                  type="button"
                  role="radio"
                  aria-checked={i === idx}
                  tabIndex={i === idx ? 0 : -1}
                  className="seg-btn"
                  onClick={() => onChange(p.key)}
                >
                  {p.label}
                </button>
              ))}
            </div>
          </SegLens>
        )}
        {box.w > 0 && <span ref={ringRef} className="seg-ring" aria-hidden="true" style={{ width: lensW, height: lensH }} />}
      </div>
    </Frost>
  );
};

// ── 2. Widgets over the photo: <Glass refract> on a copy of the wallpaper ──
const WIDGET_LENS: Partial<GlassOptics> = {
  mapSize: 256, clipToShape: true, softEdge: true,
  depth: 1, curvature: 0.5, dispersion: 0.6, strength: 0.17,
  bend: 0.7, bendWidth: 0.12, frost: 4, brightness: 0.2,
  specular: 0, // examples/GlassNotification.tsx: 1.3; the uniform CSS hairline instead
  sheenAngle: 50, glow: 0.32, glowSpread: 1, glowFalloff: 1, sheen: 1.3, sheenWidth: 3,
};
const WIDGET_LENS_DARK: Partial<GlassOptics> = { ...WIDGET_LENS, brightness: -0.12, glow: 0.2 };

type Geo = { w: number; h: number; left: number; top: number; bw: number; bh: number; r: number };
const RefractCard: React.FC<{
  stage: React.RefObject<HTMLDivElement | null>;
  src: string;
  wall: Wall;
  dim: number;
  className?: string;
  label: string;
  children: React.ReactNode;
}> = ({ stage, src, wall, dim, className = "", label, children }) => {
  const card = useRef<HTMLElement>(null);
  const [g, setG] = useState<Geo | null>(null);
  const dark = useThemeName() === "dark";
  const fr = useFilterResolution();
  const lensOn = useDeferredMount();
  useLayoutEffect(() => {
    const b = stage.current;
    const c = card.current;
    if (!b || !c) return;
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
  }, [stage]);
  return (
    <article ref={card} className={`rcard ${className}`} aria-label={label} data-lens={lensOn || undefined}>
      {lensOn && g && g.w > 0 && src && (
        <Glass
          optics={dark ? WIDGET_LENS_DARK : WIDGET_LENS}
          brightnessInFilter
          width={g.w}
          height={g.h}
          radius={g.r}
          filterResolution={fr}
          refract={
            <img
              alt=""
              aria-hidden
              src={src}
              decoding="async"
              style={{
                position: "absolute", left: -g.left, top: -g.top, width: g.bw, height: g.bh,
                objectFit: "cover", filter: dim < 1 ? `brightness(${dim})` : undefined, maxWidth: "none",
              }}
            />
          }
          behind={wall.edge}
          style={{ position: "absolute", left: 0, top: 0, width: g.w, height: g.h, borderRadius: g.r }}
        />
      )}
      <div className="rcard-body">{children}</div>
    </article>
  );
};

const Sun = () => (
  <svg viewBox="0 0 24 24" width="30" height="30" aria-hidden="true">
    <circle cx="12" cy="12" r="4.6" fill="#ffcc33" />
    <path d="M12 2.5v2.4M12 19.1v2.4M2.5 12h2.4M19.1 12h2.4M5.3 5.3 7 7M17 17l1.7 1.7M5.3 18.7 7 17M17 7l1.7-1.7" stroke="#ffcc33" strokeWidth="1.8" strokeLinecap="round" />
  </svg>
);
const Cloud = () => (
  <svg viewBox="0 0 24 24" width="30" height="30" aria-hidden="true">
    <circle cx="15.5" cy="8.5" r="3.6" fill="#ffcc33" />
    <path d="M7.5 18.5h9a3.6 3.6 0 0 0 .3-7.2 5 5 0 0 0-9.6 1.2 3 3 0 0 0 .3 6Z" fill="#fff" />
  </svg>
);
const Moon = () => (
  <svg viewBox="0 0 24 24" width="30" height="30" aria-hidden="true">
    <path d="M20 14.5A8 8 0 1 1 9.5 4a6.4 6.4 0 0 0 10.5 10.5Z" fill="#e8e6ff" />
  </svg>
);
const WeatherIcon: React.FC<{ p: Period }> = ({ p }) => (p === "manha" ? <Sun /> : p === "tarde" ? <Cloud /> : <Moon />);

const Stage: React.FC<{
  period: Period;
  setPeriod: (p: Period) => void;
  dim: number;
  showWidgets: boolean;
  showCaption: boolean;
}> = ({ period, setPeriod, dim, showWidgets, showCaption }) => {
  const stageRef = useRef<HTMLDivElement>(null);
  const wall = WALLS[period];
  // The refract copies use exactly the image the browser picked from the srcset.
  const [src, setSrc] = useState("");
  useLayoutEffect(() => {
    const img = stageRef.current?.querySelector<HTMLImageElement>("img.stage-img");
    if (!img) return;
    const sync = () => img.currentSrc && setSrc(img.currentSrc);
    if (img.complete) sync();
    img.addEventListener("load", sync);
    return () => img.removeEventListener("load", sync);
  }, [period]);
  return (
    <div ref={stageRef} className="stage" data-period={period} style={{ "--dim": dim } as React.CSSProperties}>
      <Picture
        key={wall.name}
        name={wall.name}
        alt={wall.alt}
        w={wall.w}
        h={wall.h}
        priority={period === "manha"}
        className="stage-img"
        sizes="(max-width: 700px) calc(150vw - 60px), (max-width: 1100px) calc(100vw - 40px), 1040px"
      />
      <div className="stage-top">
        <Segmented value={period} onChange={setPeriod} />
      </div>
      <div className="stage-clock" aria-hidden="true">
        <span className="stage-time">{wall.time}</span>
        <span className="stage-date">{wall.place}</span>
      </div>
      {showCaption && (
        <div className="stage-cap">
          <GlassCaption>
            <span className="cap">{wall.credit}</span>
          </GlassCaption>
        </div>
      )}
      {showWidgets && (
        <div className="stage-widgets">
          <RefractCard stage={stageRef} src={src} wall={wall} dim={dim} className="w-weather" label="Clima">
            <div className="wx">
              <div className="wx-main">
                <span className="wx-temp">{wall.temp}</span>
                <WeatherIcon p={period} />
              </div>
              <div className="wx-side">
                <strong>{wall.cond}</strong>
                <span>{wall.range}</span>
              </div>
            </div>
          </RefractCard>
          <RefractCard stage={stageRef} src={src} wall={wall} dim={dim} className="w-note" label="Aviso">
            <div className="nt-row">
              <span className="nt-icon" aria-hidden="true">
                <svg viewBox="0 0 24 24"><path d="M12 3v9l5 3" fill="none" stroke="#fff" strokeWidth="2.2" strokeLinecap="round" /></svg>
              </span>
              <div className="nt-text">
                <div className="nt-head"><strong>Lembrete</strong><span>agora</span></div>
                <p>{wall.note}</p>
              </div>
            </div>
          </RefractCard>
        </div>
      )}
    </div>
  );
};

// ── 3. Control centre: flat frost panel with the fork's switch + slider ────
const Tile: React.FC<{ icon: React.ReactNode; title: string; sub: string; children: React.ReactNode; wide?: boolean; tileRef?: React.Ref<HTMLDivElement> }> = ({
  icon, title, sub, children, wide, tileRef,
}) => (
  <div ref={tileRef} className={`cc-tile${wide ? " cc-wide" : ""}`}>
    <div className="cc-head">
      <span className="cc-icon" aria-hidden="true">{icon}</span>
      <span className="cc-text">
        <strong>{title}</strong>
        <small>{sub}</small>
      </span>
    </div>
    <div className="cc-ctl">{children}</div>
  </div>
);

/** Same-size flat switch until the lens one mounts (P6); it already works. */
const StandIn: React.FC<{ on: boolean; color: string; label: string; onToggle: (v: boolean) => void }> = ({ on, color, label, onToggle }) => (
  <button type="button" role="switch" aria-checked={on} aria-label={label} className="cc-standin" data-on={on || undefined} style={{ ["--on" as string]: color }} onClick={() => onToggle(!on)} />
);

const ControlCenter: React.FC<{
  showWidgets: boolean; setShowWidgets: (v: boolean) => void;
  showCaption: boolean; setShowCaption: (v: boolean) => void;
  bright: number; setBright: (v: number) => void;
}> = ({ showWidgets, setShowWidgets, showCaption, setShowCaption, bright, setBright }) => {
  const dark = useThemeName() === "dark";
  const fr = useFilterResolution();
  const sliderTile = useRef<HTMLDivElement>(null);
  const { w } = useBox(sliderTile);
  // Tile width − its padding (32) − the % readout and gap (~70) − the slider's own inset (16).
  const sliderW = Math.max(140, Math.min(420, w - 118));
  const brightId = useId();
  // The switches and the slider are lenses too: they mount when the panel
  // nears the screen, one per idle slot (P6), over a same-size flat stand-in.
  const panelRef = useRef<HTMLDivElement>(null);
  const near = useNear(panelRef);
  const on1 = useDeferredMount(near);
  const on2 = useDeferredMount(near);
  const on3 = useDeferredMount(near);
  const common = {
    scheme: (dark ? "dark" : "light") as "dark" | "light",
    surface: dark ? "#221e4c" : "#f3eefb",
    trackColor: dark ? "#3a3569" : "#d9d4e8",
    filterResolution: fr,
    lens: { specular: 0 },
  };
  return (
    <GlassPanel className="cc">
      <div className="cc-grid" ref={panelRef}>
        <Tile
          icon={<svg viewBox="0 0 24 24"><rect x="3.5" y="4" width="17" height="16" rx="4" fill="none" stroke="currentColor" strokeWidth="2" /><path d="M8 14h8M8 10h5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" /></svg>}
          title="Widgets na tela"
          sub={showWidgets ? "Clima e lembrete visíveis" : "Ocultos"}
        >
          {on1 ? <GlassSwitch {...common} checked={showWidgets} onCheckedChange={setShowWidgets} ariaLabel="Widgets na tela" activeColor="#30d158" /> : <StandIn on={showWidgets} color="#30d158" label="Widgets na tela" onToggle={setShowWidgets} />}
        </Tile>
        <Tile
          icon={<svg viewBox="0 0 24 24"><rect x="3.5" y="6" width="17" height="12" rx="3" fill="none" stroke="currentColor" strokeWidth="2" /><path d="M7 14.5h6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" /></svg>}
          title="Crédito da foto"
          sub={showCaption ? "Legenda sobre a foto" : "Só no rodapé"}
        >
          {on2 ? <GlassSwitch {...common} checked={showCaption} onCheckedChange={setShowCaption} ariaLabel="Crédito da foto na tela" activeColor="#0a84ff" /> : <StandIn on={showCaption} color="#0a84ff" label="Crédito da foto na tela" onToggle={setShowCaption} />}
        </Tile>
        <Tile
          wide
          tileRef={sliderTile}
          icon={<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="4" fill="currentColor" /><path d="M12 2.5v2.5M12 19v2.5M2.5 12H5M19 12h2.5M5.2 5.2 7 7M17 17l1.8 1.8M5.2 18.8 7 17M17 7l1.8-1.8" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" /></svg>}
          title="Brilho do papel de parede"
          sub="Os widgets refratam a foto com o mesmo brilho"
        >
          <div className="cc-slider">
            {on3 ? <GlassSlider {...common} value={bright} onValueChange={setBright} min={40} max={100} step={1} width={sliderW} ariaLabel="Brilho do papel de parede" activeColor="#0a84ff" name={brightId} /> : <span className="cc-standin cc-standin-slider" style={{ width: sliderW }} aria-hidden="true" />}
            <output className="cc-out" aria-live="polite">{bright}%</output>
          </div>
        </Tile>
      </div>
    </GlassPanel>
  );
};

// ── Flat frost notifications and widgets ──────────────────────────────────
const NOTES = [
  { app: "Mensagens", icon: "#30d158", title: "Ana", body: "Chego às 19h. Guarda um lugar perto da janela?", time: "2 min" },
  { app: "Agenda", icon: "#ff9f0a", title: "Reunião de design", body: "Revisar o contrato de vidro · 16h, sala 3", time: "15 min" },
  { app: "Fotos", icon: "#5e5ce6", title: "Memórias", body: "Horizontes de 2026: 12 fotos novas na galeria.", time: "1 h" },
];

const Notifications: React.FC = () => {
  const [open, setOpen] = useState(true);
  return (
    <>
      <ul className="nt-list" aria-live="polite">
        {open &&
          NOTES.map((n) => (
            <li key={n.title}>
              <GlassPanel className="nt">
                <div className="nt-row">
                  <span className="nt-icon" style={{ background: n.icon }} aria-hidden="true">
                    <svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="4.5" fill="#fff" /></svg>
                  </span>
                  <div className="nt-text">
                    <div className="nt-head"><strong>{n.app}</strong><span>{n.time}</span></div>
                    <p><b>{n.title}:</b> {n.body}</p>
                  </div>
                </div>
              </GlassPanel>
            </li>
          ))}
        {!open && (
          <li>
            <GlassPanel className="nt nt-empty"><p>Nenhum aviso. Tudo em dia.</p></GlassPanel>
          </li>
        )}
      </ul>
      <Frost className="glass pn-btn tint-control" optics={FROST}>
        <button type="button" onClick={() => setOpen((o) => !o)}>
          {open ? "Limpar avisos" : "Mostrar os avisos de novo"}
        </button>
      </Frost>
    </>
  );
};

const Ring: React.FC<{ v: number; color: string; label: string }> = ({ v, color, label }) => (
  <div className="ring" role="img" aria-label={`${label}: ${v}%`} style={{ "--v": v, "--c": color } as React.CSSProperties}>
    <span>{v}%</span>
  </div>
);

const Widgets: React.FC = () => {
  const today = useMemo(() => new Date(), []);
  const cap = (t: string) => t.charAt(0).toUpperCase() + t.slice(1);
  const wd = cap(today.toLocaleDateString("pt-BR", { weekday: "long" }));
  // The next five days, named from today's date (the forecast itself is an example).
  const week = [28, 26, 24, 30, 27].map((t, i) => {
    const d = new Date(today);
    d.setDate(today.getDate() + i + 1);
    return [cap(d.toLocaleDateString("pt-BR", { weekday: "short" }).replace(".", "")), `${t}°`, i % 3 ? "tarde" : "manha"];
  });
  const [todo, setTodo] = useState([
    { t: "Conferir o checklist", d: true },
    { t: "Gerar as imagens AVIF", d: false },
    { t: "Abrir o PR", d: false },
  ]);
  return (
    <div className="wg-grid">
      <GlassPanel className="wg">
        <div className="wg-cal">
          <span className="wg-kicker">{wd}</span>
          <span className="wg-day">{today.getDate()}</span>
          <span className="wg-sub">{today.toLocaleDateString("pt-BR", { month: "long", year: "numeric" })}</span>
        </div>
      </GlassPanel>
      <GlassPanel className="wg">
        <div className="wg-bat">
          <span className="wg-kicker">Baterias</span>
          <div className="wg-rings">
            <Ring v={82} color="#30d158" label="Telefone" />
            <Ring v={46} color="#ff9f0a" label="Fones" />
            <Ring v={100} color="#0a84ff" label="Relógio" />
          </div>
        </div>
      </GlassPanel>
      <GlassPanel className="wg wg-wide">
        <div className="wg-todo">
          <span className="wg-kicker">Lembretes</span>
          <ul>
            {todo.map((it, i) => (
              <li key={it.t}>
                <label>
                  <input
                    type="checkbox"
                    checked={it.d}
                    onChange={() => setTodo((l) => l.map((x, j) => (j === i ? { ...x, d: !x.d } : x)))}
                  />
                  <span>{it.t}</span>
                </label>
              </li>
            ))}
          </ul>
        </div>
      </GlassPanel>
      <GlassPanel className="wg wg-wide">
        <div className="wg-week">
          <span className="wg-kicker">Próximos dias</span>
          <ol>
            {week.map(([d, t, p]) => (
              <li key={d}>
                <span>{d}</span>
                <WeatherIcon p={p as Period} />
                <strong>{t}</strong>
              </li>
            ))}
          </ol>
        </div>
      </GlassPanel>
    </div>
  );
};

// ── 4. Bottom tab bar: the in-page menu of an app ─────────────────────────
const TAB_ICONS: Record<string, React.ReactNode> = {
  tela: <svg viewBox="0 0 24 24"><rect x="6" y="2.8" width="12" height="18.4" rx="3.2" fill="none" stroke="currentColor" strokeWidth="2" /><path d="M10.5 18h3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" /></svg>,
  controles: <svg viewBox="0 0 24 24"><path d="M5 8h9M18 8h1M5 16h1M10 16h9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" /><circle cx="16" cy="8" r="2.2" fill="none" stroke="currentColor" strokeWidth="2" /><circle cx="8" cy="16" r="2.2" fill="none" stroke="currentColor" strokeWidth="2" /></svg>,
  avisos: <svg viewBox="0 0 24 24"><path d="M6 16.5V11a6 6 0 0 1 12 0v5.5l1.5 1.5h-15Z" fill="none" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" /><path d="M10 20.5a2.2 2.2 0 0 0 4 0" stroke="currentColor" strokeWidth="2" strokeLinecap="round" /></svg>,
  widgets: <svg viewBox="0 0 24 24"><rect x="3.5" y="3.5" width="7" height="7" rx="2" fill="none" stroke="currentColor" strokeWidth="2" /><rect x="13.5" y="3.5" width="7" height="7" rx="2" fill="none" stroke="currentColor" strokeWidth="2" /><rect x="3.5" y="13.5" width="17" height="7" rx="2" fill="none" stroke="currentColor" strokeWidth="2" /></svg>,
};
const TabBar: React.FC = () => {
  const ids = useMemo(() => SECTIONS.map((s) => s.id), []);
  const [active, setActive] = useSectionSpy(ids);
  const idx = Math.max(0, ids.indexOf(active as (typeof ids)[number]));
  return (
    <nav className="tabbar-wrap" aria-label="Seções do painel (barra de abas)" data-search-skip="">
      <Frost className="glass tabbar tint-bar" optics={FROST} style={{ "--n": SECTIONS.length, "--i": idx } as React.CSSProperties}>
        <span className="tab-ind" aria-hidden="true" />
        {SECTIONS.map((s) => (
          <a key={s.id} href={`#${s.id}`} aria-current={active === s.id ? "location" : undefined} onClick={() => setActive(s.id)}>
            {TAB_ICONS[s.id]}
            <span>{s.label}</span>
          </a>
        ))}
      </Frost>
    </nav>
  );
};

export const Painel: React.FC = () => {
  const [period, setPeriod] = useState<Period>("manha");
  const [showWidgets, setShowWidgets] = useState(true);
  const [showCaption, setShowCaption] = useState(true);
  const [bright, setBright] = useState(100);
  return (
    <>
      <a className="skip" href="#conteudo">
        Pular para o conteúdo
      </a>
      <SiteHeader items={NAV} current={"painel"} />
      <main id="conteudo" className="pn">
        <section id="tela" className="pn-section pn-first" aria-labelledby="pn-title">
          <div className="pn-intro">
            <p className="pn-eyebrow">Exemplo · widgets</p>
            <h1 id="pn-title">Painel de widgets</h1>
            <p className="pn-lead">
              Uma tela de celular em vidro líquido. O seletor de hora do dia é uma lente que desliza e dobra os rótulos;
              o clima e o lembrete refratam a própria foto. Troque a hora, desligue os widgets ou mude o brilho na
              central de controle.
            </p>
          </div>
          <Stage period={period} setPeriod={setPeriod} dim={bright / 100} showWidgets={showWidgets} showCaption={showCaption} />
        </section>

        <section id="controles" className="pn-section" aria-labelledby="cc-title">
          <h2 id="cc-title">Central de controle</h2>
          <p className="sub">
            Chaves e controle deslizante das receitas do fork (<code>examples/GlassSwitch</code> e{" "}
            <code>examples/GlassSlider</code>): em repouso, uma pastilha branca; ao tocar ou arrastar, ela vira uma lente
            que refrata a trilha. Por baixo há um <code>checkbox</code> e um <code>range</code> de verdade, para teclado
            e leitor de tela. O painel em volta é vidro fosco em CSS.
          </p>
          <ControlCenter
            showWidgets={showWidgets} setShowWidgets={setShowWidgets}
            showCaption={showCaption} setShowCaption={setShowCaption}
            bright={bright} setBright={setBright}
          />
        </section>

        <section id="avisos" className="pn-section" aria-labelledby="nt-title">
          <h2 id="nt-title">Avisos</h2>
          <p className="sub">
            Notificações sobre o gradiente da página: como atrás delas não há nada para curvar, são vidro fosco em CSS,
            com a mesma linha fina de todo vidro. As da tela, acima, refratam a foto.
          </p>
          <Notifications />
        </section>

        <section id="widgets" className="pn-section" aria-labelledby="wg-title">
          <h2 id="wg-title">Widgets</h2>
          <p className="sub">Calendário, baterias, lembretes e previsão: superfícies planas, todas em fosco CSS.</p>
          <Widgets />
        </section>

        <GlassPanel className="pn-foot-glass">
          <footer className="pn-foot" id="creditos">
            Fotos do Wikimedia Commons (créditos e licenças em <a href={CREDITS_URL}>CREDITS.md</a>):{" "}
            {PERIODS.map((p, i) => (
              <React.Fragment key={p.key}>
                {i > 0 && "; "}
                {WALLS[p.key].place}, {WALLS[p.key].credit}
              </React.Fragment>
            ))}
            . Chave e controle deslizante: receitas do <a href="https://github.com/romastefale/liquid-glass">liquid-glass</a>{" "}
            (MIT © Sam Asante), copiadas sem alteração.
          </footer>
        </GlassPanel>
      </main>
      <TabBar />
    </>
  );
};
