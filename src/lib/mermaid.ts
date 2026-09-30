/**
 * Draws the ```mermaid blocks of the docs pages ON DEMAND: the page ships the
 * diagram source as a readable fallback (scripts/vite-docs.ts) and a button;
 * the renderer (mermaid, a large lazy chunk) is fetched only when the button is
 * pressed, never on page load. Colours follow the light/dark mode at draw time.
 */
let seq = 0;
export async function drawMermaid(figure: HTMLElement) {
  const code = figure.querySelector("pre code")?.textContent ?? "";
  const btn = figure.querySelector<HTMLButtonElement>("[data-mermaid-draw]");
  if (!code.trim() || !btn) return;
  btn.disabled = true;
  btn.textContent = "Desenhando…";
  try {
    const { default: mermaid } = await import("mermaid");
    const dark = document.documentElement.getAttribute("data-theme") === "dark";
    mermaid.initialize({ startOnLoad: false, theme: dark ? "dark" : "neutral", securityLevel: "strict", fontFamily: "inherit" });
    const { svg } = await mermaid.render(`md-mermaid-${++seq}`, code);
    let out = figure.querySelector<HTMLElement>(".md-diagram");
    if (!out) {
      out = document.createElement("div");
      out.className = "md-diagram";
      out.setAttribute("role", "img");
      out.setAttribute("aria-label", "Diagrama desenhado a partir do código acima");
      figure.insertBefore(out, figure.querySelector("figcaption"));
    }
    out.innerHTML = svg;
    figure.dataset.drawn = "";
    btn.textContent = "Desenhar de novo";
  } catch {
    btn.textContent = "Não foi possível desenhar";
  } finally {
    btn.disabled = false;
  }
}
