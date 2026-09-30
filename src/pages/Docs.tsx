import React, { useEffect, useLayoutEffect, useMemo, useRef } from "react";
import { SiteHeader, type NavItem } from "../components/SiteHeader";
import { GlassCaption, GlassPanel, Picture, CREDITS_URL } from "../components/Surfaces";
import { pageNav, page, type PageKey } from "../lib/pages";
import { useThemeName } from "../lib/theme";
import { drawMermaid } from "../lib/mermaid";
import { useDeferredMount } from "../lib/device";
import "./Docs.css";

/** A docs/*.md file compiled at build time (scripts/vite-docs.ts). */
export type Doc = typeof import("../../docs/README.md?doc").default;

export interface Skyline {
  name: string;
  alt: string;
  place: string;
  /** Author + licence, as JSX (links). */
  credit: React.ReactNode;
  /** object-position of the hero crop (the phone box is taller than 16:9). */
  pos?: string;
  /** Where the hero's glass panel sits: over the sky ("top") or the default bottom. */
  over?: "top";
}

const REPO = "https://github.com/romastefale/HTML/blob/main/";
// A 16:9 photo drawn at the reading column's width (≤ 880px − gutters) or,
// on phones, cover-cropped to a taller box: ~1.4× the width.
const HERO_SIZES = "(max-width: 700px) calc(140vw - 56px), 880px";
const FIG_SIZES = "(max-width: 700px) calc(100vw - 40px), 880px";

const Figure: React.FC<{ s: Skyline }> = ({ s }) => (
  <figure className="doc-fig">
    <Picture name={s.name} alt={s.alt} w={1600} h={900} lazy sizes={FIG_SIZES} />
    <figcaption>
      <GlassCaption>
        <span className="cap">
          <strong>{s.place}</strong>
          <small>{s.credit}</small>
        </span>
      </GlassCaption>
    </figcaption>
  </figure>
);

/** A link straight to a heading inside a body scrolls once that part exists. */
let pendingHash = typeof location !== "undefined" ? decodeURIComponent(location.hash.slice(1)) : "";
const Part: React.FC<{ html: string }> = ({ html }) => {
  const ready = useDeferredMount();
  const ref = useRef<HTMLDivElement>(null);
  useLayoutEffect(() => {
    if (!ready || !pendingHash) return;
    const el = ref.current?.querySelector(`[id="${CSS.escape(pendingHash)}"]`);
    if (el) {
      pendingHash = "";
      el.scrollIntoView();
    }
  }, [ready]);
  return ready ? (
    <div ref={ref} className="md-part" dangerouslySetInnerHTML={{ __html: html }} />
  ) : (
    <div className="md-part md-wait" style={{ minHeight: Math.round(html.length / 9) }} />
  );
};

/** One document: its own heading (the pill links here), the h2 chips, the body (cards). */
const DocSection: React.FC<{ doc: Doc }> = ({ doc }) => {
  const h2 = doc.headings.filter((h) => h.depth === 2);
  // P6: the titles render at once (the pill's links); the body is split at
  // its sections, each mounted in its own idle slot in page order, so no
  // single task lays out a whole document.
  const parts = useMemo(() => doc.html.split(/(?=<h3[\s>])/), [doc.html]);
  return (
    // D29: the document's title, source and chips sit on the page; its
    // body is a column of frosted cards (built by scripts/vite-docs.ts).
    <article className="doc" aria-labelledby={doc.id}>
        <p className="doc-src">
          Fonte: <a href={REPO + doc.file}>{doc.file}</a>
        </p>
        <h2 id={doc.id} className="md-title" dangerouslySetInnerHTML={{ __html: doc.titleHtml }} />
        {h2.length > 2 && (
          <nav className="doc-toc" aria-label={`Seções de ${doc.title}`} data-search-skip="">
            {h2.map((h) => (
              <a key={h.id} href={`#${h.id}`}>
                {h.text}
              </a>
            ))}
          </nav>
        )}
        {/* Trusted HTML: our own docs, compiled by scripts/vite-docs.ts at build time. */}
        <div className="md">
          {parts.map((html, i) => (
            <Part key={i} html={html} />
          ))}
        </div>
    </article>
  );
};

/**
 * The contract pages: docs/*.md rendered as site content (single source of
 * truth: the markdown is compiled at build time, no parser in the browser).
 * Each document is a heading (the pill's section link) over a column of
 * frosted cards, one per subsection, rule, table, diagram or PR; freely licensed skyline photos sit between documents with glass
 * captions. No <Glass> here: every surface is flat (frost in CSS), so the
 * library isn't downloaded.
 */
export const DocsPage: React.FC<{
  self: PageKey;
  eyebrow: string;
  lead: React.ReactNode;
  docs: { doc: Doc; label: string; before?: Skyline }[];
  hero: Skyline;
}> = ({ self, eyebrow, lead, docs, hero }) => {
  const info = page(self);
  const nav: NavItem[] = pageNav(self, [
    ...docs.map(({ doc, label }) => ({ href: `#${doc.id}`, label })),
    { href: "#creditos", label: "Créditos" },
  ]);
  const mainRef = useRef<HTMLElement>(null);
  const theme = useThemeName();

  // Mermaid: drawn on demand (button), redrawn in the new colours on a theme change.
  const onClick = (e: React.MouseEvent) => {
    const btn = (e.target as HTMLElement).closest("[data-mermaid-draw]");
    const fig = btn?.closest<HTMLElement>("[data-mermaid]");
    if (fig) void drawMermaid(fig);
  };
  const firstTheme = useRef(true);
  useEffect(() => {
    if (firstTheme.current) {
      firstTheme.current = false;
      return;
    }
    mainRef.current?.querySelectorAll<HTMLElement>("[data-mermaid][data-drawn]").forEach((f) => void drawMermaid(f));
  }, [theme]);

  const skylines = [hero, ...docs.flatMap((d) => (d.before ? [d.before] : []))];
  return (
    <>
      <a className="skip" href="#conteudo">
        Pular para o conteúdo
      </a>
      <SiteHeader items={nav} current={self} />
      <main id="conteudo" className="docs-main" ref={mainRef} onClick={onClick}>
        <header className="doc-hero">
          <Picture name={hero.name} alt={hero.alt} w={1600} h={900} priority sizes={HERO_SIZES} className="doc-hero-img" position={hero.pos} />
          <div className="doc-hero-over" data-at={hero.over}>
          <GlassPanel className="doc-hero-glass" tint="tint-ink">
            <div className="doc-hero-text">
              <p className="doc-eyebrow">{eyebrow}</p>
              <h1>{info.title}</h1>
              <p className="doc-lead">{lead}</p>
              <p className="doc-hero-credit">
                {hero.place} · {hero.credit}
              </p>
            </div>
          </GlassPanel>
          </div>
        </header>

        {docs.map(({ doc, before }) => (
          <React.Fragment key={doc.id}>
            {before && <Figure s={before} />}
            <DocSection doc={doc} />
          </React.Fragment>
        ))}

        <GlassPanel className="doc-glass">
          <footer className="doc-foot" id="creditos">
            <h2>Créditos</h2>
            <p>
              O texto desta página é o conteúdo de <code>docs/</code> no repositório, convertido no build
              (<code>scripts/vite-docs.ts</code>): mudou o arquivo, mudou a página. Fotos de horizontes do Wikimedia
              Commons, recortadas em 16:9 e redimensionadas; licenças em <a href={CREDITS_URL}>CREDITS.md</a>.
            </p>
            <ul>
              {skylines.map((s) => (
                <li key={s.name}>
                  <strong>{s.place}</strong>: {s.credit}
                </li>
              ))}
            </ul>
          </footer>
        </GlassPanel>
      </main>
    </>
  );
};
