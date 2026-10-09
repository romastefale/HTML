import { readFileSync } from "node:fs";
import path from "node:path";
import { Marked, type Tokens } from "marked";
import type { Plugin } from "vite";

/**
 * docs/*.md as site content, compiled at BUILD time (no markdown parser in the
 * browser). `import doc from "../../docs/X.md?doc"` gives
 * `{ id, title, titleHtml, file, html, headings }`: docs/ stays the single source of
 * truth and the pages render the result.
 *
 * - Headings get GitHub-style slugs, prefixed per document (`design-3-a-borda-do-vidro…`),
 *   so the anchors the docs already use (`ARQUITETURA.md#6-onde-há-glass…`)
 *   still resolve; the document's own `#` title gets the bare prefix and is
 *   returned apart (`titleHtml`: the page shows it, then the section chips).
 *   Levels shift down by one (the page has its own <h1>).
 * - Links to another doc go to the site page that shows it (same page: just
 *   the anchor); links to other repository files go to GitHub.
 * - ```mermaid blocks become a readable source fallback plus a button that
 *   draws the diagram on demand (the renderer is a lazy chunk; src/lib/mermaid.ts).
 * - Tables and code blocks sit in keyboard-scrollable wrappers.
 * - The body is grouped into frosted cards (see "Cards" in compileDoc).
 */

/** Which site page shows each document, and the id prefix of its headings. */
export const DOC_PAGES: Record<string, { page: string; prefix: string }> = {
  "README.md": { page: "contrato-design.html", prefix: "visao-geral" },
  "DESIGN-CONTRATO.md": { page: "contrato-design.html", prefix: "design" },
  "TELA-CHEIA-E-BARRAS.md": { page: "contrato-design.html", prefix: "tela-cheia" },
  "ACESSIBILIDADE-E-INTERACAO.md": { page: "contrato-design.html", prefix: "acessibilidade" },
  "ARQUITETURA.md": { page: "contrato-arquitetura.html", prefix: "arquitetura" },
  "DESEMPENHO.md": { page: "contrato-arquitetura.html", prefix: "desempenho" },
  "DEPLOY.md": { page: "contrato-arquitetura.html", prefix: "deploy" },
  "CHECKLIST-VERIFICACAO.md": { page: "contrato-arquitetura.html", prefix: "checklist" },
  "HISTORICO.md": { page: "contrato-arquitetura.html", prefix: "historico" },
};
const REPO_BLOB = "https://github.com/romastefale/HTML/blob/main/";
const SUFFIX = "?doc";

const esc = (s: string) =>
  s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
const unesc = (s: string) =>
  s.replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&amp;/g, "&");
const plain = (html: string) => unesc(html.replace(/<[^>]+>/g, "")).trim();

/** github-slugger: lower-case, drop punctuation (keep letters, digits, space, -, _), spaces → "-". */
export const slug = (text: string) =>
  text.toLowerCase().trim().replace(/[^\p{L}\p{M}\p{N}\s_-]/gu, "").replace(/\s/g, "-");

export interface DocHeading { id: string; text: string; depth: number }
export interface CompiledDoc {
  id: string;
  title: string;
  titleHtml: string;
  file: string;
  html: string;
  headings: DocHeading[];
}

export function compileDoc(file: string, source: string, base: string): CompiledDoc {
  const name = path.basename(file);
  const self = DOC_PAGES[name];
  if (!self) throw new Error(`docs plugin: ${name} has no entry in DOC_PAGES`);
  const headings: DocHeading[] = [];
  const seen = new Map<string, number>();
  let title = "";
  let titleHtml = "";

  const href = (raw: string) => {
    if (/^(https?:|mailto:|#)/.test(raw)) return raw.startsWith("#") ? `#${self.prefix}-${raw.slice(1)}` : raw;
    const [p, hash] = raw.split("#");
    const target = DOC_PAGES[path.basename(p)];
    if (target && path.dirname(p) === ".") {
      const anchor = hash ? `${target.prefix}-${decodeURIComponent(hash)}` : target.prefix;
      return target.page === self.page ? `#${anchor}` : `${base}${target.page}#${anchor}`;
    }
    // Any other repository path: the file on GitHub.
    return REPO_BLOB + path.posix.normalize(path.posix.join("docs", p)) + (hash ? `#${hash}` : "");
  };

  const marked = new Marked({ gfm: true });
  marked.use({
    renderer: {
      heading(this: { parser: { parseInline(t: Tokens.Generic[]): string } }, { tokens, depth }: Tokens.Heading) {
        const inner = this.parser.parseInline(tokens);
        const text = plain(inner);
        let id: string;
        if (depth === 1 && !title) {
          // The document title is rendered by the page (then its section chips).
          title = text;
          titleHtml = inner;
          headings.push({ id: self.prefix, text, depth });
          return "";
        } else {
          const s = slug(text);
          const n = seen.get(s) ?? 0;
          seen.set(s, n + 1);
          id = `${self.prefix}-${n ? `${s}-${n}` : s}`;
        }
        headings.push({ id, text, depth });
        const level = Math.min(6, depth + 1);
        return `<h${level} id="${esc(id)}" class="md-h md-h${depth}">${inner}</h${level}>\n`;
      },
      code({ text, lang }: Tokens.Code) {
        const l = (lang || "").trim().split(/\s+/)[0];
        if (l === "mermaid") {
          return (
            `<figure class="md-mermaid" data-mermaid="">` +
            `<pre class="md-code" tabindex="0" aria-label="Diagrama (código mermaid)"><code>${esc(text)}</code></pre>` +
            `<figcaption><button type="button" class="md-btn" data-mermaid-draw="">Desenhar diagrama</button>` +
            `<span class="md-note">Código do diagrama em mermaid; o desenho carrega sob demanda.</span></figcaption></figure>\n`
          );
        }
        return `<pre class="md-code" tabindex="0"${l ? ` data-lang="${esc(l)}"` : ""} aria-label="Código${l ? ` ${esc(l)}` : ""}"><code>${esc(text)}</code></pre>\n`;
      },
      link(this: { parser: { parseInline(t: Tokens.Generic[]): string } }, { href: raw, title: t, tokens }: Tokens.Link) {
        const inner = this.parser.parseInline(tokens);
        return `<a href="${esc(href(raw))}"${t ? ` title="${esc(t)}"` : ""}>${inner}</a>`;
      },
    },
  });
  // Cards: the body is laid out as frosted cards (DESIGN-CONTRATO D29). The
  // top-level tokens are rendered one by one, in order (so heading slugs stay
  // the same), and grouped:
  // - a `##` section heading (<h3>) stays on the page, above its cards;
  // - a `###` subsection (<h4>) opens a card and is its title;
  // - a table or a mermaid diagram gets a card of its own (a heading just
  //   before it goes in with it), so wide content scrolls inside its card;
  // - a list of rules ("- **D12. …**") becomes one card per rule;
  // - the history table (HISTORICO.md, first column "PR") becomes one card
  //   per PR;
  // - everything else in between shares a card.
  const tokens = marked.lexer(source);
  const render = (toks: Tokens.Generic[]) =>
    marked.parser(Object.assign(toks, { links: tokens.links }) as unknown as Parameters<typeof marked.parser>[0]);
  const wrapTables = (h: string) =>
    h
      .replace(/<table>/g, '<div class="md-table" tabindex="0" role="region" aria-label="Tabela"><table>')
      .replace(/<\/table>/g, "</table></div>");
  const out: string[] = [];
  let card: string[] = [];
  let cardHasBody = false;
  const flush = () => {
    if (card.length) out.push(`<div class="glass tint-frost md-card">${card.join("")}</div>\n`);
    card = [];
    cardHasBody = false;
  };
  const ruleRe = /^\*\*[A-Z]{1,2}\d+(?:\.\d+)*\.\s/;
  const isRuleList = (t: Tokens.Generic) =>
    t.type === "list" && (t as Tokens.List).items.length > 0 &&
    (t as Tokens.List).items.every((it) => ruleRe.test(it.text.trim()));
  for (const t of tokens as Tokens.Generic[]) {
    if (t.type === "space") continue;
    if (t.type === "heading") {
      const h = render([t]);
      if (!h) continue; // the document title (returned apart)
      if ((t as Tokens.Heading).depth === 2) {
        flush();
        out.push(h);
      } else {
        flush();
        card.push(h);
      }
      continue;
    }
    const table = t.type === "table" ? (t as Tokens.Table) : null;
    if (table && name === "HISTORICO.md" && plain(table.header[0]?.text ?? "") === "PR") {
      flush();
      const cell = (c: Tokens.TableCell) => marked.parseInline(c.text, { async: false }) as string;
      out.push('<div class="md-entries">');
      for (const row of table.rows) {
        const head = row.slice(0, 3).map(cell);
        const rest = row.slice(3).map((c, i) => `<dt>${cell(table.header[i + 3])}</dt><dd>${cell(c)}</dd>`);
        out.push(
          `<article class="glass tint-frost md-card md-entry"><p class="md-entry-head">` +
            `<strong>${head[0]}</strong><span>${head[1]}</span><span>${head[2]}</span></p>` +
            `<dl>${rest.join("")}</dl></article>\n`,
        );
      }
      out.push("</div>\n");
      continue;
    }
    const wide = !!table || (t.type === "code" && /^mermaid\b/.test(((t as Tokens.Code).lang ?? "").trim()));
    if (wide) {
      if (cardHasBody) flush();
      card.push(wrapTables(render([t])));
      out.push(`<div class="glass tint-frost md-card md-card-wide">${card.join("")}</div>\n`);
      card = [];
      cardHasBody = false;
      continue;
    }
    if (isRuleList(t)) {
      if (cardHasBody) flush();
      const lead = card.join("");
      card = [];
      (t as Tokens.List).items.forEach((it, i) => {
        out.push(`<div class="glass tint-frost md-card md-rule">${i === 0 ? lead : ""}${render(it.tokens as Tokens.Generic[])}</div>\n`);
      });
      continue;
    }
    card.push(wrapTables(render([t])));
    cardHasBody = true;
  }
  flush();
  const html = out.join("");
  return { id: self.prefix, title, titleHtml, file: `docs/${name}`, html, headings };
}

export function docsPlugin(): Plugin {
  let base = "/";
  return {
    name: "lg-docs",
    configResolved(c) {
      base = c.base;
    },
    load(id) {
      if (!id.endsWith(SUFFIX)) return null;
      const file = id.slice(0, -SUFFIX.length);
      this.addWatchFile(file);
      const doc = compileDoc(file, readFileSync(file, "utf8"), base);
      return `export default ${JSON.stringify(doc)};`;
    },
  };
}
