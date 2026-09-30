# Checklist de verificação (antes de todo merge)

## 1. Comandos

```bash
pnpm install --frozen-lockfile   # igual ao CI
pnpm typecheck                   # tsc --noEmit -p tsconfig.json
pnpm build                       # typecheck + vite build → dist/
pnpm preview                     # http://127.0.0.1:4179/HTML/ (serve o dist/)
pnpm dev                         # http://127.0.0.1:4178/HTML/ (desenvolvimento)
```

- **V1. `pnpm typecheck` e `pnpm build` DEVEM passar sem erros.** A verificação DEVE ser feita sobre o `pnpm preview` (o build de produção, com `base /HTML/`), e não só sobre o `pnpm dev`.
  *Por quê:* os caminhos com `BASE_URL`, os chunks e o código dividido só aparecem de verdade no build.

## 2. Matriz de testes

**48 casos:** 6 páginas × 2 motores × 2 viewports × 2 modos.

| Motor | Viewport | Observação |
|---|---|---|
| Chromium | desktop 1280×800 | curvatura ao vivo dos botões (`backdrop-filter: url()`) |
| Chromium | iPhone 15 (descritor do Playwright: viewport 393×659, tela 393×852, DPR 3, toque) | safe areas simuladas via CDP (`top: 59, bottom: 34`) |
| WebKit | desktop 1280×800 | aproxima o Safari. O WebKit headless no Linux pode não pintar o `backdrop-filter`, mas o estilo é aplicado |
| WebKit | iPhone 15 | o motor do iOS. Não simula safe areas |

Cada combinação roda em **claro e escuro**, em `index.html`, `liquid-glass-sample.html`, `painel.html`, `galeria.html`, `contrato-design.html` e `contrato-arquitetura.html`. Na galeria, o Chromium headless abre com `?webgl=forcar` para testar o visor com lentes (o WebGL dele é SwiftShader, e sem o parâmetro a página cai no fosco, que também DEVE ser testado uma vez).

**RECOMENDADO:** testar também num iPhone e num Android físicos antes de mudanças em barras, safe areas ou teclado. Os testes headless não reproduzem a tinta das barras do Safari 26 nem o `theme-color` do Chrome no Android.

## 3. Checklist

### Geral
- [ ] 0 erros e 0 avisos no console nos 48 casos (inclui `pageerror`).
- [ ] 0 respostas ≥ 400 na rede (inclui o favicon).
- [ ] Nenhuma mudança visual não intencional. **RECOMENDADO:** comparar capturas de antes e depois.
- [ ] Textos novos em pt-BR, e textos antigos ainda verdadeiros.

### Menu
- [ ] A pílula flutua: 12px abaixo da safe area e 12px das laterais, sem encostar no topo. Ela é igual no topo e rolando, em todas as páginas.
- [ ] O menu não tem marca. Em toda página, as seções vêm primeiro; depois um ponto (`[data-sep]` em um link só) e os links de saída: "‹ Início" (menos no Início) e as outras cinco páginas.
- [ ] `aria-current` nunca aparece num link de outra página, em nenhuma posição de rolagem.
- [ ] Todo `href="#…"` da página tem um alvo com esse id (inclui os índices de chips dos documentos).
- [ ] Os links rolam para o lado, e o degradê só aparece no lado em que há mais itens. Shift + roda funciona no Chromium e no WebKit.
- [ ] A seleção inicial é a primeira seção da página ("Início" no Início, "Lente" na amostra, "Tela" no painel, "Visor" na galeria, "Visão geral" e "Arquitetura" nos contratos).
- [ ] Ao tocar num link do meio (Gradiente / Lugares), `aria-current` fica **só** nele durante toda a rolagem. A pílula de seleção coincide com o link (±1,5px) e fica visível.
- [ ] A pílula do menu não muda de tamanho quando a seleção troca.
- [ ] Tab percorre todos os links com o anel visível, e cada link focado aparece dentro da barra.

### Pesquisa
- [ ] A lupa abre a pesquisa na própria pílula, que mantém a mesma posição e o mesmo tamanho (compare o `getBoundingClientRect` da pílula antes e depois).
- [ ] O campo fica em foco, e a lupa fica no mesmo ponto com `aria-expanded="true"`.
- [ ] "vidro" encontra resultados em todas as páginas (no PR #12: **1 de 10** no Início, **1 de 7** na amostra, **1 de 5** no painel, **1 de 4** na galeria; nos contratos o número segue o texto de `docs/`). Enter leva a 2 de N.
- [ ] "acucar" e "Açúcar" dão 1 de 1; "liquido" e "LÍQUIDO" dão 1 de 1.
- [ ] Fechar pela lupa, por Esc ou por um toque fora deixa o campo vazio, zera os destaques (`CSS.highlights.get("page-search")` vazio) e traz o menu de volta. Com Esc, o foco volta à lupa.
- [ ] Rolar a página com a pesquisa aberta não a fecha.
- [ ] **Sem anel no modo pesquisa:** o `box-shadow` calculado de `.sh-bar[data-mode=search]` não contém `rgba(76, 154, 255`, e `outline-style` é `none` na barra, no campo e no formulário.
- [ ] Com `prefers-reduced-motion: reduce`, a troca é instantânea (`transition-duration: 0s`).

### Tema
- [ ] O botão alterna o tema, salva `lg-theme` e atualiza `data-theme`, `color-scheme`, `theme-color` e o fundo de `html`/`body` (`#8b82e6` / `#1b1646`).
- [ ] A escolha continua depois de recarregar.
- [ ] **Sem flash:** com o bundle atrasado (por exemplo, com uma rota que segura o `.js` por 1,5 s), modo escuro salvo e sistema claro, a primeira pintura já é escura.
- [ ] Sem escolha salva, mudar o tema do sistema muda a página.

### Imagens e desempenho
- [ ] Cada foto é um `<picture>`, e o `currentSrc` escolhido é AVIF (no iPhone 15: variantes de 1080 no Início e de 1440 na amostra), com no máximo 150 KB por foto.
- [ ] As fotos fora da primeira dobra estão com `loading="lazy"`.
- [ ] No `pnpm build`, a biblioteca fica no chunk `dist-*.js`, e só `liquid-glass-sample.html`, `painel.html` e `galeria.html` o carregam (confira os `<script>`/`modulepreload` em `dist/*.html`). Nenhum chunk do mermaid aparece nos HTML.
- [ ] Os números de [DESEMPENHO.md §3](DESEMPENHO.md#3-orçamento-de-desempenho) continuam dentro do orçamento (Lighthouse mobile), ou o PR justifica o estouro.

### Lente (amostra)
- [ ] A lente fica inteira dentro do palco do título, sem passar sob o menu nem ser cortada.
- [ ] O mouse move a lente. Um toque posiciona e segura por ~1,6 s. Rolando com o mouse parado, a lente segue o cursor.
- [ ] A animação pausa com o hero fora da tela e com a aba oculta.

### Painel
- [ ] O segmentado troca o papel de parede; setas movem a seleção; a lente acompanha com a mola.
- [ ] As chaves escondem os widgets e a legenda; o controle deslizante muda o brilho da foto e da refração dos widgets.
- [ ] "Limpar avisos" esvazia a lista; a barra de abas marca a seção atual e fica acima da safe area de baixo.

### Galeria
- [ ] Com GPU (ou `?webgl=forcar`), o visor tocando tem `.vw[data-live]` e um canvas; pausar tira o canvas.
- [ ] Sem GPU (Chromium headless sem o parâmetro), o visor começa pausado com os controles foscos, e "Reproduzir" troca a foto depois de ~6 s.
- [ ] Os chips filtram (Brasil = 4 fotos); a folha abre com a lupa, as setas movem a lupa, e Esc fecha.

### Contratos
- [ ] Todos os corpos montam (nenhum `.md-wait` depois de ~2 s), e um link direto para uma seção (`contrato-arquitetura.html#historico-…`) rola até ela.
- [ ] "Desenhar diagrama" desenha o mermaid; trocar o tema redesenha.
- [ ] Depois de mexer num diagrama de `docs/`, desenhar esse diagrama na página e conferir que não há erro no console.

### Deploy (depois do merge)
- [ ] Seguir [DEPLOY.md §4](DEPLOY.md#4-como-verificar-um-deploy).

## 4. Exemplo de verificação automatizada

Os scripts de Playwright usados nos PRs **não fazem parte do repositório**. O trecho abaixo é só um ponto de partida (requer `npm i -D playwright` e `npx playwright install chromium webkit`):

```js
import { chromium, webkit, devices } from "playwright";
const iphone = { ...devices["iPhone 15"] }; delete iphone.defaultBrowserType;
for (const engine of [chromium, webkit]) {
  const browser = await engine.launch();
  for (const colorScheme of ["light", "dark"]) {
    const ctx = await browser.newContext({ ...iphone, colorScheme });
    const page = await ctx.newPage();
    const problems = [];
    page.on("console", (m) => ["error", "warning"].includes(m.type()) && problems.push(m.text()));
    page.on("pageerror", (e) => problems.push(String(e)));
    page.on("response", (r) => r.status() >= 400 && problems.push(`${r.status()} ${r.url()}`));
    await page.goto("http://127.0.0.1:4179/HTML/", { waitUntil: "networkidle" });
    await page.click(".sh-search-btn");
    await page.type(".page-search input", "vidro");
    await page.waitForTimeout(400);
    console.log(engine.name(), colorScheme, await page.textContent(".page-search output"), problems);
    await ctx.close();
  }
  await browser.close();
}
```
