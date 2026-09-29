import React, { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Glass } from "@samasante/liquid-glass";
import { FROST } from "../lib/optics";
import { useReducedMotion } from "../lib/useMedia";
import "./PageSearch.css";

const MIN = 2;
const HL_ALL = "page-search";
const HL_CURRENT = "page-search-current";

const hasHighlightApi = () =>
  typeof CSS !== "undefined" && "highlights" in CSS && !!CSS.highlights && typeof Highlight === "function";

/** Fold case + accents ("Açúcar" → "acucar"), with a map back to the original offsets. */
const fold = (str: string) => {
  let text = "";
  const map: number[] = [];
  for (let i = 0; i < str.length; i++) {
    const f = str[i].normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
    for (const ch of f) {
      text += ch;
      map.push(i);
    }
  }
  map.push(str.length);
  return { text, map };
};

const textNodes = (scope: HTMLElement) => {
  const walker = document.createTreeWalker(scope, NodeFilter.SHOW_TEXT, {
    acceptNode(n) {
      if (!n.nodeValue?.trim()) return NodeFilter.FILTER_REJECT;
      const el = n.parentElement;
      if (!el || el.closest("script,style,noscript,svg,[aria-hidden=true],[hidden],[data-search-skip]"))
        return NodeFilter.FILTER_REJECT;
      if (!el.getClientRects().length) return NodeFilter.FILTER_REJECT; // not rendered
      return NodeFilter.FILTER_ACCEPT;
    },
  });
  const out: Text[] = [];
  while (walker.nextNode()) out.push(walker.currentNode as Text);
  return out;
};

const findRanges = (scope: HTMLElement, query: string) => {
  const q = fold(query.trim()).text;
  if (q.length < MIN) return [];
  const ranges: Range[] = [];
  for (const node of textNodes(scope)) {
    const { text, map } = fold(node.nodeValue ?? "");
    let from = 0;
    let at: number;
    while ((at = text.indexOf(q, from)) !== -1) {
      const r = document.createRange();
      r.setStart(node, map[at]);
      r.setEnd(node, map[at + q.length]);
      ranges.push(r);
      from = at + q.length;
    }
  }
  return ranges;
};

type Box = { x: number; y: number; w: number; h: number; current: boolean };

/** Magnifier, drawn like the fork site's header icons (24-unit box, 2px
 *  round stroke; site/src/components/SiteHeader.tsx › SunIcon). */
export const Magnifier: React.FC<{ size?: number }> = ({ size = 15 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <circle cx="11" cy="11" r="7" />
    <path d="m20 20-3.6-3.6" />
  </svg>
);

/**
 * In-page word search, opened from the magnifier button in the top menu
 * (SiteHeader): a glass panel under the menu with the field, "2 de 5" and
 * ▲▼. Highlights every match inside #`scopeId`; Enter / Shift+Enter / ▲▼
 * jump and scroll. Case- and accent-insensitive. Closing it (Esc, the button,
 * a tap outside) unmounts it, which clears every highlight.
 */
export const PageSearch: React.FC<{
  scopeId: string;
  id: string;
  inputRef: React.RefObject<HTMLInputElement | null>;
  onClose: () => void;
}> = ({ scopeId, id, inputRef, onClose }) => {
  const [query, setQuery] = useState("");
  const [count, setCount] = useState(0);
  const [current, setCurrent] = useState(-1);
  const [boxes, setBoxes] = useState<Box[]>([]);
  const ranges = useRef<Range[]>([]);
  const searched = useRef("");
  const reduceMotion = useReducedMotion();
  const useHL = useRef(hasHighlightApi()).current;

  const paint = useCallback(
    (idx: number) => {
      const list = ranges.current;
      if (useHL) {
        CSS.highlights.delete(HL_ALL);
        CSS.highlights.delete(HL_CURRENT);
        if (list.length) CSS.highlights.set(HL_ALL, new Highlight(...list));
        if (list[idx]) CSS.highlights.set(HL_CURRENT, new Highlight(list[idx]));
      } else {
        const sx = window.scrollX;
        const sy = window.scrollY;
        setBoxes(
          list.flatMap((r, k) =>
            [...r.getClientRects()].map((b) => ({ x: b.left + sx, y: b.top + sy, w: b.width, h: b.height, current: k === idx })),
          ),
        );
      }
    },
    [useHL],
  );

  const go = useCallback(
    (idx: number) => {
      const list = ranges.current;
      if (!list.length) {
        setCurrent(-1);
        paint(-1);
        return;
      }
      const i = (idx + list.length) % list.length;
      setCurrent(i);
      paint(i);
      const r = list[i].getBoundingClientRect();
      window.scrollTo({
        top: Math.max(0, window.scrollY + r.top - window.innerHeight * 0.4),
        behavior: reduceMotion ? "auto" : "smooth",
      });
    },
    [paint, reduceMotion],
  );

  const run = useCallback(
    (q: string) => {
      searched.current = q;
      const scope = document.getElementById(scopeId);
      ranges.current = scope ? findRanges(scope, q) : [];
      setCount(ranges.current.length);
      go(0);
    },
    [scopeId, go],
  );

  // Search as you type (debounced).
  useEffect(() => {
    const t = setTimeout(() => run(query), 160);
    return () => clearTimeout(t);
  }, [query, run]);

  // Fallback boxes follow layout changes.
  useLayoutEffect(() => {
    if (useHL) return;
    const onResize = () => paint(current);
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, [useHL, paint, current]);

  // Closing (unmount) clears the highlights.
  useEffect(
    () => () => {
      if (hasHighlightApi()) {
        CSS.highlights.delete(HL_ALL);
        CSS.highlights.delete(HL_CURRENT);
      }
    },
    [],
  );

  const step = (d: number) => {
    if (query !== searched.current) run(query);
    else go(current + d);
  };
  const clear = () => {
    setQuery("");
    searched.current = "";
    ranges.current = [];
    setCount(0);
    setCurrent(-1);
    paint(-1);
    inputRef.current?.focus();
  };

  const q = query.trim();
  const status = q.length < MIN ? "" : count ? `${current + 1} de ${count}` : "Nenhum resultado";
  const inputId = `${id}-input`;

  return (
    <>
      {!useHL &&
        boxes.length > 0 &&
        createPortal(
          <div className="ps-overlay" aria-hidden="true">
            {boxes.map((b, i) => (
              <span key={i} className={b.current ? "is-current" : undefined} style={{ left: b.x - 1, top: b.y, width: b.w + 2, height: b.h }} />
            ))}
          </div>,
          document.body,
        )}
      <form
        id={id}
        className="page-search"
        role="search"
        aria-label="Pesquisar na página"
        onSubmit={(e) => {
          e.preventDefault();
          step(1);
        }}
      >
        <Glass className="glass ps-glass tint-bar" optics={FROST} style={{ display: "block" }}>
          <div className="search">
            <Magnifier size={19} />
            <input
              ref={inputRef}
              id={inputId}
              type="search"
              placeholder="Pesquisar na página"
              aria-label="Pesquisar na página"
              autoComplete="off"
              autoCapitalize="off"
              spellCheck={false}
              enterKeyHint="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  step(e.shiftKey ? -1 : 1);
                } else if (e.key === "Escape") {
                  e.preventDefault();
                  e.stopPropagation();
                  onClose();
                }
              }}
            />
            <output htmlFor={inputId} aria-live="polite">
              {status}
            </output>
            {q.length > 0 && (
              <button className="ps-btn" type="button" aria-label="Limpar pesquisa" onClick={clear}>
                <svg viewBox="0 0 24 24" aria-hidden="true">
                  <path d="M7 7l10 10M17 7 7 17" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
                </svg>
              </button>
            )}
            <span className="ps-sep" aria-hidden="true" />
            <button className="ps-btn" type="button" aria-label="Resultado anterior" disabled={count < 2} onClick={() => step(-1)}>
              <svg viewBox="0 0 24 24" aria-hidden="true">
                <path d="m6 14.5 6-6 6 6" fill="none" stroke="currentColor" strokeWidth="2.3" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
            <button className="ps-btn" type="button" aria-label="Próximo resultado" disabled={count < 2} onClick={() => step(1)}>
              <svg viewBox="0 0 24 24" aria-hidden="true">
                <path d="m6 9.5 6 6 6-6" fill="none" stroke="currentColor" strokeWidth="2.3" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
          </div>
        </Glass>
      </form>
    </>
  );
};
