// In-page word search for the bottom glass search bar.
// Highlights every match inside <main> (CSS Custom Highlight API, with a <mark>
// fallback), shows "2 de 5", Enter / Shift+Enter / ▲▼ jump between matches,
// Esc clears. Case- and accent-insensitive ("acucar" finds "Açúcar").
(() => {
  const form = document.querySelector("[data-page-search]");
  const scope = document.querySelector("main");
  if (!form || !scope) return;
  const input = form.querySelector("input[type=search]");
  const out = form.querySelector("output");
  const prevBtn = form.querySelector("[data-search-prev]");
  const nextBtn = form.querySelector("[data-search-next]");
  const clearBtn = form.querySelector("[data-search-clear]");
  form.hidden = false; // only offered when it can work
  document.documentElement.classList.add("has-page-search");

  const HL = typeof CSS !== "undefined" && CSS.highlights && typeof Highlight === "function";
  const reduceMotion = matchMedia("(prefers-reduced-motion: reduce)");
  const MIN = 2;
  let ranges = [];      // Range[] (highlight mode) or HTMLElement[] (mark mode)
  let current = -1;
  let lastQuery = "";

  // Fold case + accents, keeping a map from folded index → original index.
  const fold = (str) => {
    let text = "", map = [];
    for (let i = 0; i < str.length; i++) {
      const f = str[i].normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
      for (const ch of f) { text += ch; map.push(i); }
    }
    map.push(str.length);
    return { text, map };
  };

  const textNodes = () => {
    const walker = document.createTreeWalker(scope, NodeFilter.SHOW_TEXT, {
      acceptNode(n) {
        if (!n.nodeValue.trim()) return NodeFilter.FILTER_REJECT;
        const el = n.parentElement;
        if (!el || el.closest("script,style,noscript,svg,[aria-hidden=true],[hidden],[data-search-skip]"))
          return NodeFilter.FILTER_REJECT;
        if (!el.getClientRects().length) return NodeFilter.FILTER_REJECT; // not rendered
        return NodeFilter.FILTER_ACCEPT;
      },
    });
    const list = [];
    while (walker.nextNode()) list.push(walker.currentNode);
    return list;
  };

  const unmark = () => {
    for (const m of scope.querySelectorAll("mark[data-ps]")) {
      const parent = m.parentNode;
      parent.replaceChild(document.createTextNode(m.textContent), m);
      parent.normalize();
    }
  };

  const clearAll = () => {
    if (HL) { CSS.highlights.delete("page-search"); CSS.highlights.delete("page-search-current"); }
    else unmark();
    ranges = []; current = -1;
  };

  const run = (query) => {
    clearAll();
    const q = fold(query.trim()).text;
    if (q.length < MIN) { render(); return; }
    const found = [];
    for (const node of textNodes()) {
      const { text, map } = fold(node.nodeValue);
      let from = 0, at;
      while ((at = text.indexOf(q, from)) !== -1) {
        found.push([node, map[at], map[at + q.length]]);
        from = at + q.length;
      }
    }
    if (HL) {
      ranges = found.map(([node, s, e]) => {
        const r = new Range(); r.setStart(node, s); r.setEnd(node, e); return r;
      });
      if (ranges.length) CSS.highlights.set("page-search", new Highlight(...ranges));
    } else {
      // Wrap from the end so earlier offsets in the same node stay valid.
      const marks = [];
      for (let i = found.length - 1; i >= 0; i--) {
        const [node, s, e] = found[i];
        const r = document.createRange(); r.setStart(node, s); r.setEnd(node, e);
        const m = document.createElement("mark"); m.dataset.ps = "";
        r.surroundContents(m); marks.unshift(m);
      }
      ranges = marks;
    }
    go(ranges.length ? 0 : -1);
  };

  const rectOf = (item) => item.getBoundingClientRect();

  const go = (i) => {
    if (!ranges.length) { current = -1; render(); return; }
    current = (i + ranges.length) % ranges.length;
    if (HL) CSS.highlights.set("page-search-current", new Highlight(ranges[current]));
    else ranges.forEach((m, k) => m.toggleAttribute("data-current", k === current));
    const r = rectOf(ranges[current]);
    const target = window.scrollY + r.top - window.innerHeight * 0.4;
    window.scrollTo({ top: Math.max(0, target), behavior: reduceMotion.matches ? "auto" : "smooth" });
    render();
  };

  const render = () => {
    const q = input.value.trim();
    form.classList.toggle("has-query", q.length > 0);
    const n = ranges.length;
    out.value = q.length < MIN ? "" : n ? `${current + 1} de ${n}` : "Nenhum resultado";
    prevBtn.disabled = nextBtn.disabled = n < 2;
  };

  let timer = 0;
  input.addEventListener("input", () => {
    clearTimeout(timer);
    timer = setTimeout(() => { lastQuery = input.value; run(input.value); }, 160);
  });
  const step = (d) => {
    if (input.value !== lastQuery) { lastQuery = input.value; run(input.value); return; }
    go(current + d);
  };
  form.addEventListener("submit", (e) => { e.preventDefault(); step(1); });
  input.addEventListener("keydown", (e) => {
    if (e.key === "Enter") { e.preventDefault(); step(e.shiftKey ? -1 : 1); }
    else if (e.key === "Escape") { e.preventDefault(); reset(); }
  });
  const reset = () => { clearTimeout(timer); input.value = ""; lastQuery = ""; clearAll(); render(); };
  prevBtn.addEventListener("click", () => step(-1));
  nextBtn.addEventListener("click", () => step(1));
  clearBtn.addEventListener("click", () => { reset(); input.focus(); });
  // Any link to the field (e.g. "Pesquisar" in the nav) focuses it.
  document.addEventListener("click", (e) => {
    const a = e.target.closest(`a[href="#${input.id}"]`);
    if (a) { e.preventDefault(); input.focus(); }
  });
  render();
})();
