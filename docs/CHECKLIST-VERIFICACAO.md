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
- [ ] **Nenhum foco azul** (DESIGN D31, N10): com Tab (no WebKit, Alt+Tab) por todas as páginas, nos dois temas, cada elemento focado tem um anel visível (`outline` ou um `box-shadow` `inset`), e nenhuma cor desse anel tem matiz entre 190° e 250° (saturada, alfa ≥ 0,1). No PR #15: 703 elementos, 0 azuis, 0 sem anel.

### Menu
- [ ] A pílula flutua: 12px abaixo da safe area e 12px das laterais, sem encostar no topo. Ela é igual no topo e rolando, em todas as páginas.
- [ ] O menu não tem marca. Os links da pílula são só seções (`href="#…"`), sem separador. Em toda página (inclusive no Início), o primeiro item da pílula é o ☰; não há botão Início.
- [ ] ☰ abre a lista de páginas (6 itens, dentro da tela, com `.glass`), com `aria-expanded="true"`, o foco na página atual e só ela com `aria-current="page"`. ↓ move o foco; Esc fecha e devolve o foco ao ☰; ☰ de novo fecha; um toque fora fecha; escolher outra página navega.
- [ ] No modo pesquisa, o ☰ e o tema ficam ocultos e `inert`.
- [ ] Todo `href="#…"` da página tem um alvo com esse id (inclui os índices de chips dos documentos).
- [ ] Os links rolam para o lado, e o degradê só aparece no lado em que há mais itens. Shift + roda funciona no Chromium e no WebKit.
- [ ] A seleção inicial é a primeira seção da página ("Início" no Início, "Lente" na amostra, "Tela" no painel, "Visor" na galeria, "Visão geral" e "Arquitetura" nos contratos).
- [ ] Ao tocar num link do meio (Fundo / Lugares), `aria-current` fica **só** nele durante toda a rolagem. A pílula de seleção coincide com o link (±1,5px) e fica visível.
- [ ] A pílula do menu não muda de tamanho quando a seleção troca.
- [ ] Tab percorre todos os links com o anel visível, e cada link focado aparece dentro da barra.

### Pesquisa
- [ ] A lupa abre a pesquisa na própria pílula, que mantém a mesma posição e o mesmo tamanho (compare o `getBoundingClientRect` da pílula antes e depois).
- [ ] O campo fica em foco, e a lupa fica no mesmo ponto com `aria-expanded="true"`.
- [ ] "vidro" encontra resultados em todas as páginas (no PR #15: **1 de 11** no Início, **1 de 7** na amostra, **1 de 5** no painel, **1 de 4** na galeria, **1 de 26** no contrato de design e **1 de 16** em arquitetura; nos contratos o número segue o texto de `docs/`). Enter leva a 2 de N.
- [ ] "acucar" e "Açúcar" dão 1 de 1; "liquido" e "LÍQUIDO" dão 1 de 1.
- [ ] Fechar pela lupa, por Esc ou por um toque fora deixa o campo vazio, zera os destaques (`CSS.highlights.get("page-search")` vazio) e traz o menu de volta. Com Esc, o foco volta à lupa.
- [ ] Rolar a página com a pesquisa aberta não a fecha.
- [ ] **Sem anel no modo pesquisa:** o `box-shadow` calculado de `.sh-bar[data-mode=search]` não contém `rgba(76, 154, 255`, e `outline-style` é `none` na barra, no campo e no formulário.
- [ ] Com `prefers-reduced-motion: reduce`, a troca é instantânea (`transition-duration: 0s`).

### Tema
- [ ] O botão alterna o tema, salva `lg-theme` e atualiza `data-theme`, `color-scheme`, `theme-color` e o fundo do `body`, que é a cor do canvas (`#8b82e6` / `#1b1646`); o `html` não tem fundo.
- [ ] A escolha continua depois de recarregar.
- [ ] **Sem flash:** com o bundle atrasado (por exemplo, com uma rota que segura o `.js` por 1,5 s), modo escuro salvo e sistema claro, a primeira pintura já é escura.
- [ ] Sem escolha salva, mudar o tema do sistema muda a página.

### Fundo e bordas (todas as páginas, claro e escuro)
- [ ] O fundo são campos de cor orgânicos e desfocados, sem bordas nítidas nem círculos (`html::before`, fixo, `z-index: -1`, sem animação).
- [ ] A primeira e a última linha da viewport são `--page-edge` sólido (`#8b82e6` / `#1b1646`, iguais ao `theme-color`) no topo, no meio e no fim da página, em retrato e em paisagem.
- [ ] Ao rolar, o conteúdo se dissolve nessa cor sob a status bar e perto da barra de baixo (`body::before` e `body::after`, fixos, `z-index: 50`, `pointer-events: none`, sem `background-color` e sem `backdrop-filter`).
- [ ] O menu e a barra de abas do painel ficam acima das camadas de borda e continuam nítidos. Teste: pinte as camadas de vermelho opaco; o vermelho só pode aparecer através do vidro, e nunca por cima dele.
- [ ] Sem o conteúdo, o fundo sozinho começa e termina na cor de borda, e o canvas (o que o overscroll mostra) é essa cor.
- [ ] Nenhuma sombra alcança a borda. Por exemplo, a barra de abas do painel usa `0 2px 8px` a 12px da borda.

### Imagens e desempenho
- [ ] Cada foto é um `<picture>`, e o `currentSrc` escolhido é AVIF (no iPhone 15: variantes de 1080 no Início e de 1440 na amostra), com no máximo 150 KB por foto.
- [ ] As fotos fora da primeira dobra estão com `loading="lazy"`.
- [ ] No `pnpm build`, a biblioteca fica no chunk `dist-*.js`, e só `liquid-glass-sample.html`, `painel.html` e `galeria.html` o carregam (confira os `<script>`/`modulepreload` em `dist/*.html`). Nenhum chunk do mermaid aparece nos HTML.
- [ ] Os números de [DESEMPENHO.md §3](DESEMPENHO.md#3-orçamento-de-desempenho) continuam dentro do orçamento (Lighthouse mobile), ou o PR justifica o estouro.

### Lente (amostra)
- [ ] A lente fica inteira dentro do palco do título, sem passar sob o menu nem ser cortada.
- [ ] O mouse move a lente. Um toque posiciona e segura por ~1,6 s. Rolando com o mouse parado, a lente segue o cursor.
- [ ] A animação pausa com o hero fora da tela e com a aba oculta.
- [ ] O filtro da lente não tem as primitivas do brilho: 17 filhos no `<filter>` de `.hero-stage` (eram 19 com `sheen`/`glow` ligados), e as capturas com movimento reduzido são iguais às da `main` pixel a pixel.

### Painel
- [ ] O segmentado troca o papel de parede; setas movem a seleção; a lente acompanha com a mola.
- [ ] As chaves escondem os widgets e a legenda; o controle deslizante muda o brilho da foto e da refração dos widgets.
- [ ] "Limpar avisos" esvazia a lista; a barra de abas marca a seção atual e fica acima da safe area de baixo.

### Galeria
- [ ] Com GPU (ou `?webgl=forcar`), o visor tocando tem `.vw[data-live]` e um canvas; pausar tira o canvas.
- [ ] Sem GPU (Chromium headless sem o parâmetro), o visor começa pausado com os controles foscos, e "Reproduzir" troca a foto depois de ~6 s.
- [ ] Os chips filtram (Brasil = 4 fotos); a folha abre com a lupa, as setas movem a lupa, e Esc fecha.
- [ ] A lupa se move sem render do React: um arrasto de 120 movimentos e 10 setas fazem 0 commits (conte com um `__REACT_DEVTOOLS_GLOBAL_HOOK__` falso que soma `onCommitFiberRoot`), o `transform` fica no `.loupe` (nunca no elemento com `filter: url()`), e a lente mostra a cópia ampliada no WebKit do iPhone 15 (compare o disco com e sem a lupa: tem de haver diferença).
- [ ] Sem WebGL 2 (`getContext("webgl2")` devolvendo `null` num init script, com `?webgl=forcar`), o visor usa os controles foscos, sem o texto "WebGL unavailable" e sem erro, e "Reproduzir" troca a foto.

### Contratos
- [ ] Todos os corpos montam (nenhum `.md-wait` depois de ~2 s), e um link direto para uma seção (`contrato-arquitetura.html#checklist-…`) põe o título a 84px do topo (o `scroll-padding`). O alvo do teste DEVE ser um título que consegue chegar ao topo: os do fim da página param antes.
- [ ] O corpo é uma coluna de cartões (D29): nenhum parágrafo, lista, código ou tabela fora de um `.md-card`; toda tabela dentro de um cartão; um raio só; nenhum cartão passa da largura da tela.

### Quebra de linha (todas as páginas)
- [ ] Em 320px, 393px e paisagem (852×393), no WebKit e no Chromium, nenhum `pre`, `code`, `p`, `li`, `td`, `th`, `dd`, `dt`, título, legenda ou `small` tem conteúdo mais largo que ele mesmo (`scrollWidth ≤ clientWidth`) nem passa do seu cartão ou da tela; a página não rola para o lado (D30). Ficam de fora só os contêineres que podem rolar: tabela larga (`.md-table`), desenho em texto (`pre[data-lang="text"]`) e os links do menu.
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
