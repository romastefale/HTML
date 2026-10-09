# Contrato de design

Este documento fixa a linguagem visual do projeto. Os valores foram copiados de `src/styles/global.css`, `src/components/SiteHeader.css`, `src/components/PageSearch.css`, `src/pages/*.css` e `src/lib/optics.ts` no PR #12 (a partir de `5838a71`) e atualizados até o PR #15 (lentes sem brilho, foco neutro, WebGL 2 e lupa sem re-render, a partir de `4748463`).

## 1. Princípios

**A translucidez e o vídeo são o foco do projeto** (decisão do usuário, registrada no PR #15). Quando duas escolhas disputarem, vence a que deixa o vidro mais translúcido e a refração mais viva sobre imagem em movimento. Hoje o vídeo aparece como a apresentação da Galeria (fotos com zoom lento desenhadas pelo WebGL); um recurso de vídeo de verdade (`<Glass src>` com um arquivo de vídeo) fica para um PR próprio.

1. **As bordas vêm do vidro,** não de linhas desenhadas: fosco, tinta translúcida, refração onde ela aparece e uma sombra de flutuação suave. A única linha é uma hairline uniforme, fina e quase transparente.
2. **O fundo é cor desfocada:** campos de cor orgânicos e muito desfocados, sem bordas nítidas, discos ou fotos de fundo. Ele termina, em cima e embaixo, na cor das barras do navegador.
3. **Os controles flutuam:** nada sólido encosta nas bordas da tela.
4. **Uma coisa por lugar:** o menu é a pesquisa, e a lupa abre e fecha. Não há painéis extras, "…", barra de baixo nem marca. Componentes de exemplo dentro de uma página (a barra de abas do painel, os chips da galeria) são conteúdo: eles não substituem a pílula, que continua igual no topo.
5. **O texto é em pt-BR,** e o texto das fotos é creditado.

## 2. Fundo

- **D1. O fundo da página DEVE ser uma imagem SVG estática de campos de cor orgânicos e muito desfocados** (`--page-bg`: `src/assets/fundo-claro.svg` e `fundo-escuro.svg`, embutidas como data URL no CSS). Ela fica num `html::before` fixo, da altura da viewport grande (`100lvh`), com `z-index: -1` e `pointer-events: none`.
  - Os campos são curvas fechadas irregulares (7 pontos em raios e ângulos sorteados, com semente fixa), nunca círculos nem elipses limpas. Eles se sobrepõem, e o `feGaussianBlur` (`stdDeviation` 70 numa caixa de 1000×1600) tira qualquer borda.
  - Quem muda o desenho edita e roda `scripts/make-organic-bg.py` e faz commit dos dois SVGs. O build não gera nada.
  *Por quê:* pedido de design no PR #14, que substitui o "fundo sem formas" do PR #3. O que o PR #3 proibia eram formas de **borda nítida**: sob o vidro, elas viram manchas distorcidas. Campos desfocados passam pelo fosco só como variação de cor, e esse era o motivo da regra.
- **D2. O fundo DEVE começar e terminar em `--page-edge`, a cor das barras do navegador** (o `theme-color` do modo).
  - A base é um degradê vertical que sai de `--page-edge` e volta a ela.
  - Uma máscara vertical tira os campos dos 14% de cima e dos 14% de baixo, então as duas bordas são a cor sólida exata.
  - `html` NÃO tem fundo. O `background-color` do `body` é `--page-edge` e vira a cor do canvas, que também preenche o overscroll (o "elástico" do iOS) e aparece antes de o CSS carregar (inline no `<head>`).
  *Por quê:* a barra de status, a barra de baixo do Safari e o overscroll mostram essa cor. Se o fundo terminar nela, a borda da página não aparece. Veja [TELA-CHEIA-E-BARRAS.md](TELA-CHEIA-E-BARRAS.md).
- **D2.1. O conteúdo que rola DEVE se dissolver em `--page-edge` no topo da viewport e no fim da página.**
  - No topo, uma camada fixa faz isso: `body::before` (altura `safe-area-inset-top + 64px`). Embaixo, desde o PR #18, NÃO há camada fixa: o `body::after` fica no fluxo, no fim da página (`88px + safe-area-inset-bottom`, de transparente a `--page-edge` sólido). O esmaecido só aparece quando se rola até o fim.
  - Cada uma é sólida em `--page-edge` na área segura e depois desce até transparente, com paradas em 72% e 30%.
  - Elas usam `z-index: 50` e `pointer-events: none`, e são só `background-image`: nada de `background-color` nem `backdrop-filter`.
  - O menu (`.site-header`, z 70) e a barra de abas do painel (`.tabbar-wrap`, z 60) ficam **acima** das camadas e continuam nítidos. Os ancestrais deles não criam contexto de empilhamento. A folha da galeria é um `<dialog>` modal, que fica na camada do topo.
  *Por quê:* o texto que passa por baixo da status bar ou vai para a barra de baixo some na cor da barra, em vez de ser cortado por ela.
- **D2.2. O fundo e as camadas NÃO DEVEM ter animação, JS nem mudar de tamanho durante a rolagem.** O `100lvh` não muda quando as barras do iPhone recolhem, então o SVG é rasterizado uma vez só. A rolagem só move o conteúdo por cima.
- **D2.3. Nenhuma sombra de elemento flutuante pode alcançar a borda da viewport.** Por exemplo, a barra de abas fica a 12px da borda, então a sombra dela chega no máximo a 10px (`0 2px 8px`). A sombra padrão (`0 10px 28px`) escurecia a última linha da tela.

| Token | Claro | Escuro |
|---|---|---|
| `--page-edge` (= `theme-color` = canvas) | `#8b82e6` | `#1b1646` |
| Base vertical do SVG | `edge 0` → `#c4bbf6 12%` → `#f2ebfb 28%` → `#eef2ff 50%` → `#fbecf3 72%` → `#c4bbf6 88%` → `edge 100%` | `edge 0` → `#281f6a 12%` → `#1d2a60 28%` → `#16304d 50%` → `#2b1e58 72%` → `#281f6a 88%` → `edge 100%` |
| 7 campos orgânicos (opacidade) | rosa `#ff9ecd` .70 · azul `#7fcfff` .68 · pêssego `#ffd49a` .66 · menta `#8ef0d2` .60 · lilás `#c9a6ff` .62 · salmão `#ffb8a8` .50 · azul-claro `#a9c8ff` .55 | `#d646a0` .42 · `#28a0dc` .40 · `#e68c3c` .28 · `#28c8aa` .30 · `#7850e6` .40 · `#c8508c` .26 · `#3c78dc` .32 |
| Máscara dos campos | 0 até 14% · cheia de 30% a 70% · 0 a partir de 86% | igual |
| Camadas de borda | topo `safe-top + 64px`, embaixo `safe-bottom + 56px`: `edge` → 72% → 30% → transparente | igual |
| `--text` / `--text-dim` / `--faint` | `#1c1c1e` / `#3a3a3c` / `#5d5b6e` | `#f5f5f7` / `#d1d1d6` / `#b3b0c8` |
| `--link` | `#0a6cff` | `#64d2ff` |

A faixa dos cartões da amostra (`--band-bg`) tem um gradiente próprio: 5 radiais (`#ffb3d9`, `#9ecbff`, `#c9a4ff`, `#8ff0d0`, `#ffe1a8`) sobre `linear-gradient(135deg, #fbe3f1, #e4dcff)`. A cor de borda é `--band-edge: #eadcf6`, e é ela que entra no `behind` do `refract`.

## 3. Hairline (a única linha do vidro)

```css
:root { --rim-w: 1px; --rim: rgba(255,255,255,.18); }
:root[data-theme="dark"] { --rim: rgba(255,255,255,.14); }
@media (min-resolution: 2dppx) { :root { --rim-w: .5px; } }

.glass { box-shadow: var(--glass-float); }
.glass::after {
  content: ""; position: absolute; inset: 0; border-radius: inherit; pointer-events: none;
  box-shadow: 0 0 0 var(--rim-w) var(--rim);   /* logo FORA da borda */
}
```

- **D3. Todo vidro DEVE ter exatamente uma hairline, com uma cor só em volta toda,** desenhada em camada própria (`::after`). O `box-shadow` do elemento fica reservado para a sombra de flutuação.
  - **Exceção: o menu e a lista ☰.** O vidro é o `<Glass>` material do `@samasante/liquid-glass` (D9.1), com os valores de `vidro.ini`.
  *Por quê:* é o mesmo princípio do fork, que desenha a borda "as its own inset layer so it never fights a box-shadow". O PR #6 fixou a linha uniforme.
- **D4. A espessura DEVE ser `1px` em telas 1× e `0.5px` em telas ≥ 2dppx** (um pixel físico).
- **D5. A linha DEVE ficar logo fora da borda** (`0 0 0 var(--rim-w)`, sem `inset`).
  *Por quê:* por fora, ela aparece contra o fundo nos dois temas. Por dentro, uma linha branca some nos preenchimentos claros e foscos.
  - **Exceção:** um elemento que recorta o próprio conteúdo (`overflow: hidden` ou `clip-path`) cortaria a linha de fora. Nesse caso, a mesma linha DEVE ir por dentro (`inset`). Hoje isso acontece só no `.hero-ring` (`box-shadow: inset 0 0 0 var(--rim-w) var(--rim)`), o anel que acompanha a lente.
- **D6. É PROIBIDO:**
  - um realce mais claro no topo (o `specular` > 0 da biblioteca);
  - "luz interna" em CSS;
  - linha escura ou bisel;
  - pilhas de bordas.

  *Por quê:*
  - O PR #5 voltou com o aro padrão da biblioteca, mas ele sempre traz o realce de topo (`inset 0 1px 0 rgba(255,255,255,.55·g)`). O PR #6 trocou por uma linha uniforme, que é o pedido de design.
  - Nos cartões `refract`, a pilha de bordas do `GlassNotification` (brilho no topo, realce branco interno, glow e linha escura) foi reduzida à mesma hairline: `.gcard-body { box-shadow: 0 0 0 var(--rim-w) var(--rim), 0 14px 36px rgba(0,0,0,.22), 0 2px 5px rgba(0,0,0,.14) }`.
- **D7. Toda ótica DEVE usar `specular: 0`, e junto `sheen: 0` e `glow: 0`:** o objeto `NO_SHINE` de `src/lib/optics.ts`, espalhado em `CONTROL`, `FROST`, `PANEL`, `HERO_LENS`, `PANEL_LENS`, nas lentes do Painel (segmentado, widgets, `common.lens` do switch e do slider) e nas da Galeria (`PLAYER_OPTICS`, `SCRUB_OPTICS`, `LOUPE_LENS`).
  *Por quê:* com `specular: 0` o ganho do brilho já é zero, mas a biblioteca só pula as duas primitivas do brilho (`feColorMatrix` + `feComposite`) quando `glow` e `sheen` também são 0 (`hasSpecular = glow > 0 || sheen > 0`, `src/Glass.tsx`). No PR #15 as 96 capturas de antes e depois (3 contextos, 2 temas, 4 páginas, 4 posições) ficaram idênticas pixel a pixel, o filtro da lente do título da Amostra caiu de 19 para 17 primitivas e o fps dela subiu de 10,3 para 13,7 no iPhone emulado no Chromium ([DESEMPENHO.md](DESEMPENHO.md) §3.4).

**Sombra de flutuação:** `--glass-float: 0 10px 28px rgba(30,20,90,.16), 0 2px 6px rgba(30,20,90,.08)`, igual nos dois modos.

## 4. Fosco e tintas

O desfoque de todo vidro das páginas é o `frost` da seção `[vidro]` do `vidro.ini` (ele vira `--vidro-frost` e o `frost` de `FROST`, `PANEL` e `CONTROL`, em `src/lib/vidro.ts` e `src/lib/optics.ts`). As lentes de refração (`<Glass>` com cópia) ficam fora: nelas o `frost` da biblioteca é dividido pelo tamanho da lente, não é um blur em px.

| Uso | Ótica / CSS | `backdrop-filter` resultante |
|---|---|---|
| Legendas de foto | `FROST` | `blur(frost) saturate(1.15)` |
| Cartões, introdução, notas e rodapés | `PANEL` | `blur(frost) saturate(1.4)` |
| Botões de vidro fora do Blink | `CONTROL` | `blur(frost) saturate(1.15)` |

- **D8. A tinta DEVE ser o `background` translúcido do próprio elemento** (classe `tint-*`). É PROIBIDO tinta opaca, exceto em `prefers-reduced-transparency`.
  *Por quê:* é a regra da biblioteca ("the background is the tint"). O fosco só aparece se o fundo deixar passar luz.

| Classe | Claro | Escuro | Transparência reduzida |
|---|---|---|---|
| `.tint-bar` (barra de abas, chips), `.tint-frost` (painéis), `.tint-control`, `.tint-soft`, `.tint-white` | `tintClaro` de `[vidro]` no `vidro.ini` (`--vidro-tint`) | `tintEscuro` de `[vidro]` | `.tint-bar`: `#eef0f5` / `#060607`; os outros: `rgba(255,255,255,.95)` / `rgba(28,24,60,.96)` |
| `.tint-ink` (legendas) | `rgba(24,20,56,.46)`, texto `#fff` | igual | `rgba(24,20,56,.94)` |
| `.tint-blue` | `rgba(10,132,255,.52)`, texto `#fff` | igual | `rgba(10,110,230,.96)` |
| `.tint-red` / `.tint-green` | `rgba(248,113,113,.40)` / `rgba(48,209,88,.36)` | igual | `rgba(255,255,255,.95)` |

As tintas de cor (`.tint-ink`, `.tint-blue`, `.tint-red`, `.tint-green`) mantêm a cor própria, porque a cor é o significado delas; o desfoque delas é o `frost` do `vidro.ini`.

**Raios:**

| Elemento | Raio |
|---|---|
| Pílula do menu | 26px (CSS; o `<Glass>` lê o raio do CSS) |
| Cartões e introdução (Início) | 22px |
| Notas | 20px |
| Rodapé da amostra | 22px |
| Foto (Início) | 16px |
| Legenda (Início) | 14px |
| Lugar (amostra) | 26px |
| Legenda (amostra) | 18px |
| Faixa | 28px |
| Cartão refract | 22px |
| Botões | 999px |

## 5. Menu flutuante

```text
┌────────────────── 12px + safe-area-inset-top ──────────────────┐
│ (≡)  Lente  Componentes  Lugares  Suporte  C...  (tema) (lupa) │  ← 52px de altura, raio 26px
└────────────────────────────────────────────────────────────────┘
   ↑ 12px ou a safe area lateral (o maior)                       ↑
   (≡) = ☰, lista de páginas (em toda página) · depois, só as seções
 ┌──────────────────────┐
 │ Início               │ ← lista de páginas (☰): vidro do liquid-glass
 │ Amostra              │   ancorado sob a ponta esquerda da pílula
 │ [Painel]       atual │
 │ Galeria ...          │
 └──────────────────────┘
```

| Propriedade | Valor |
|---|---|
| Pílula | `.site-header`, um `<Glass>` material: `position: fixed; z-index: 70`, `top: var(--bar-top)`, `left: var(--bar-l)`, `right: var(--bar-r)` (12px ou a safe area, centrada em no máximo 1040px), `height: 52px`, `border-radius: 26px`. Dentro dele, `<header class="sh-bar">`: `padding: 0 var(--bar-pad)` (9px; 8px em telas ≤ 760px), `gap: var(--pill-gap)` (6px). Os botões ocupam `.sh-slot` de 34px |
| Vidro | `<Glass>` material de `@samasante/liquid-glass` (D9.1). Os valores ficam só em `vidro.ini`, cada um uma vez: `[vidro]` (`frost`, `tintClaro`, `tintEscuro`, os mesmos do vidro das páginas) e `[menu]` (as outras optics da biblioteca, um parâmetro por linha) |
| Links | `height: 34px`, `padding: 0 13px` (12px em telas ≤ 760px), raio 17px, 13,5px/500, cor `--bar-sub`. O link atual usa 600 e `--bar-text` |
| Botões ☰, tema e lupa | `.sh-glass`: um `<Glass>` material por botão, 34×34, raio 17px, `position: fixed`, `z-index: 72`, sobre os `.sh-slot` da pílula (`left`/`right` a partir de `--bar-l`/`--bar-r` e `--bar-pad`); o `<button class="sh-btn">` preenche o vidro |
| Degradê lateral | máscara de 22px só no lado em que há mais links (`data-fade-start` / `data-fade-end`) |
| Rolagem de borda | `.sh-band`: uma faixa fixa sem cor, só `backdrop-filter: blur(var(--vidro-frost))` com máscara em degradê, de 10px acima a 20px abaixo da pílula (nunca encosta na borda de cima, T11) |
| Seleção | `.sh-indicator`: pílula de cor (a tinta de `[vidro]`, `--vidro-tint`), dentro do `<nav>` e atrás dos links (`position: absolute; z-index: 0`), por isso rola junto com eles; do tamanho do link atual (`offsetLeft`, `offsetTop`, `offsetWidth`, `offsetHeight`) e movida por `transform` só quando a seção ativa muda (`transition: transform .45s cubic-bezier(.65,0,.35,1)`). Não é um `<Glass>`: um `backdrop-filter` dentro de outro só enxerga o conteúdo do pai |
| Lista de páginas | `.sh-picker`: um `<Glass>` material, mostrado com `data-open` (`visibility`); `position: fixed`, `z-index: 73`, `top: calc(var(--bar-top) + 60px)`, `left: var(--bar-l)`, raio 22px, `padding: 6px` (no `<nav>` de dentro), `width: max-content` (mínimo 180px). Itens de 44px de altura, em grade `auto 15px` com `gap: 14px`; a página atual em 600 e com um ✓ |
| Fonte | `system-ui, -apple-system, sans-serif` (a primeira família sempre existe; veja [DESEMPENHO.md](DESEMPENHO.md) P7) |

Paleta do menu (a mesma do `site/src/theme.ts` do fork):

| Token | Claro | Escuro |
|---|---|---|
| `--bar-bg` (`.tint-bar`) | `tintClaro` de `[vidro]` | `tintEscuro` de `[vidro]` |
| `--bar-text` / `--bar-sub` | `#0a0b0d` / `rgba(0,0,0,.6)` | `#fff` / `rgba(255,255,255,.6)` |
| `--sel-bg` (barra de abas do Painel, chips da Galeria) | `rgba(255,255,255,.9)` | `rgba(255,255,255,.16)` |
| `--sel-shadow` | `0 1px 2px rgba(20,16,60,.1), 0 3px 10px rgba(20,16,60,.1)` | `0 2px 10px rgba(0,0,0,.3)` |

- **D9. O menu DEVE ser uma pílula flutuante, afastada 12px das laterais e 12px abaixo da safe area. Ela NÃO DEVE encostar no topo.**
  *Por quê:* o Safari 26 leva a cor de elementos fixos que encostam na borda para a barra do navegador. A barra de largura total do PR #7 foi revertida no PR #8. Veja [TELA-CHEIA-E-BARRAS.md](TELA-CHEIA-E-BARRAS.md).
- **D9.1. O vidro do menu e da lista ☰ DEVE ser o `<Glass>` de `@samasante/liquid-glass` no modo material** (o `<Glass>` envolve o elemento, sem `refract`, `size` ou `center`), com os valores de `vidro.ini`:
  - o `backdrop-filter` refrata a página ao vivo no Chrome e no Edge; no Safari e no Firefox, a biblioteca aplica só o desfoque, a saturação e a tinta (`src/GlassMaterial.tsx` do fork);
  - a tinta é o `background` translúcido do `<Glass>`, escolhido pelo modo.
- **D10. O menu DEVE ser o mesmo em todas as páginas e em qualquer posição de rolagem:** a pílula não encolhe nem vira "…".
  *Por quê:* o menu que virava "…" com popover (PRs #3–#6) foi removido no PR #7.
- **D11. O menu NÃO DEVE ter palavra de marca.** O menu contém só:
  - o botão ☰ da lista de páginas, **o primeiro à esquerda**;
  - os links de seção;
  - o botão de tema;
  - a lupa, que é **o último botão à direita**.

  *Por quê:* pedido de design do PR #8.
- **D11.1. Os itens da pílula DEVEM ter um espaçamento só, `--pill-gap: 6px`** (definido em `.site-header`): entre o ☰ e o primeiro link, entre os links, entre o último link visível e o tema, e entre o tema e a lupa. Os links mantêm o `padding` deles (a pílula de seleção não muda); NÃO use outro `gap` nem `margin` nos itens. A única exceção é o `.sh-nav`, que rola e por isso corta o que passa da borda: ele tem `padding: 9px var(--pill-gap)` com `margin: 0 calc(-1 * var(--pill-gap))`, para ocupar a altura da pílula e deixar espaço para a sombra da pílula de seleção sem mover nenhum item. A sombra (`--sel-shadow`) é curta, até 8px, para caber nesse espaço.
  *Por quê:* pedido de design no PR #16: o espaço entre o tema e a lupa era o certo e passou a valer para o menu todo. Antes eram 14px (8px no celular) entre os blocos e 2px entre os links.
- **D12. Os links da pílula DEVEM ser só as seções da página** (os que rolam dentro dela). Os links para outras páginas NÃO DEVEM ficar na pílula: eles ficam na lista de páginas (D12.2). Cada página passa a lista de seções em `items`; a lista de páginas vem de `PAGES`. Só seções recebem seleção e scroll-spy.
  *Por quê:* no PR #12 as outras páginas ficavam no fim da pílula, depois de um ponto; no PR #13 elas saíram da pílula, a pedido, para que ela role só pelas seções e a navegação entre páginas fique num lugar próprio.
- **D12.1. NÃO DEVE haver botão Início (casa) nem link para a página inicial na pílula.** O Início é só um item da lista ☰, como as outras páginas. (Na própria página inicial, o link de seção "Início" leva ao `#topo` dela: é uma seção, não uma página.)
- **D12.2. O botão ☰ DEVE ficar na ponta esquerda da pílula, em todas as páginas (inclusive no Início), e abrir a lista de páginas.** À direita ficam só o tema e a lupa. A lista:
  - é um popover de vidro fosco ancorado sob a ponta esquerda da pílula, NÃO uma tela cheia;
  - lista as seis páginas na ordem de `PAGES` (Início, Amostra, Painel, Galeria, Contrato de design, Arquitetura e operação);
  - marca a página atual com `aria-current="page"`, peso 600 e um ✓ (não só cor);
  - fecha com Esc (o foco volta ao ☰), com um toque fora, ao escolher uma página e ao tocar no ☰ de novo; fecha também quando o foco sai dela;
  - ao abrir, leva o foco para a página atual; ↑/↓, Home e End andam entre os itens; o ☰ tem `aria-expanded` e `aria-controls`;
  - usa um anel de foco neutro (`inset 0 0 0 1.5px var(--bar-sub)`), NUNCA o azul;
  - no modo pesquisa, o ☰ some como o botão de tema, e abrir a pesquisa fecha a lista.
- **D13. Os links que não cabem DEVEM rolar para o lado,** com a barra de rolagem oculta e degradê no lado em que há mais itens. Isso vale para toque, trackpad e Shift + roda.
- **D14. O item atual DEVE ter uma pílula de cor atrás (`.sh-indicator`),** que desliza e muda de largura entre os links.
  Cada rótulo reserva a largura em negrito com `.sh-label::after { content: attr(data-text); font-weight: 600; height: 0; visibility: hidden }`.

## 6. Pesquisa na lupa

- **D15. A lupa DEVE transformar a própria pílula na barra de pesquisa, no mesmo lugar e do mesmo tamanho.**
  - Os links e o botão de tema somem (opacidade 0, `visibility: hidden`, `inert`), mas **continuam no layout**.
  - O formulário cobre a pílula da borda esquerda até a lupa (`right: 49px`, ou 48px em telas ≤ 760px).

  *Por quê:* nada se mexe nem muda de tamanho ao abrir. Um painel ou barra separada (a barra fixa embaixo dos PRs #3–#7) foi removido no PR #8.
- **D16. A lupa DEVE ficar no mesmo lugar** (`aria-expanded="true"` com a pesquisa aberta). **Um novo toque nela DEVE fechar a pesquisa.**
- **D17. No modo pesquisa, é PROIBIDO anel ou contorno de foco na pílula e no campo** (`.site-header[data-mode="search"], .page-search input:focus, .page-search input:focus-visible { outline: none }`). A pílula fica só com o próprio vidro. O cursor de texto (`caret-color: var(--bar-text)`, neutro desde o PR #15) mostra onde se digita.
  *Por quê:* o anel azul `0 0 0 2px rgba(76,154,255,.55)` via `:has(input:focus)` foi removido no PR #9, a pedido. Os anéis de teclado dos links, dos botões redondos e dos botões ▲▼✕ (`.ps-btn:focus-visible`) continuam, neutros (D31).
- **D18. O campo DEVE ter `font-size` ≥ 16px** (17px aqui).
  *Por quê:* abaixo de 16px, o iOS dá zoom ao focar.
- **D19. Destaques:**
  - todas as ocorrências: `rgba(255,204,0,.5)`;
  - a atual: `#ff9f0a`, com texto `#1c1c1e`;
  - no fallback: caixas `rgba(255,204,0,.45)` / `rgba(255,159,10,.75)` com `mix-blend-mode: multiply`.
- **Transições:** a troca menu ↔ pesquisa leva 0,16–0,22s de opacidade e 0,3–0,42s de deslocamento em `--glass-ease`. Com `prefers-reduced-motion`, é instantânea.

## 7. Tema claro/escuro

- **D20. O padrão DEVE ser o tema do sistema.** A escolha manual DEVE ser salva em `localStorage["lg-theme"]` (`"light"` ou `"dark"`), a mesma chave do site do fork.
- **D21. O tema DEVE ser aplicado antes da primeira pintura,** por um script inline no `<head>`. Esse script define `data-theme`, `color-scheme` e o `theme-color`.
  *Por quê:* sem flash de tema errado. O teste do PR #7 atrasou o bundle em 1,5 s, com modo escuro salvo e sistema claro, e a página já estava escura.
- **D22. O CSS escuro DEVE usar `:root[data-theme="dark"]`, NÃO `@media (prefers-color-scheme: dark)`.**
  *Por quê:* com escolha manual, o que vale é a escolha do usuário, não a do sistema (PR #7).
- **D23. O botão de tema DEVE usar os ícones sol e lua do site do fork**, com `aria-label` "Ativar modo claro" ou "Ativar modo escuro" e `title` "Alternar modo claro / escuro". No modo pesquisa, ele fica oculto para dar espaço ao campo (~320px no iPhone 15).

## 8. Fotos

- **D24. As fotos DEVEM ter licença livre** (CC0, domínio público, CC BY ou CC BY-SA; nas duas últimas, autor e licença na legenda) e vir de uma fonte verificável (Wikimedia Commons). Cada foto DEVE ter uma linha em `public/img/CREDITS.md` (arquivo, onde aparece, lugar, autor, licença e fonte) e crédito na legenda.
  *Por quê:* a CC BY-SA 4.0 (Santorini) exige atribuição, e a versão redimensionada continua sob a mesma licença. As outras também recebem crédito, por consistência.
- **D25. O `alt` DEVE ser descritivo e em pt-BR.**
- **D26. As fotos DEVEM ser servidas como `<picture>` responsivo** (AVIF, WebP e o JPEG de fallback). Veja [DESEMPENHO.md](DESEMPENHO.md).

## 9. Texto e idioma

- **D27. `lang="pt-BR"` DEVE estar em todo HTML, e todo texto visível DEVE estar em pt-BR:** rótulos, `aria-label`, `title`, placeholder, contador ("N de M", "Nenhum resultado") e `noscript`.
- **D28. Os textos DEVEM descrever o que a página realmente faz.** Se a implementação mudar, o texto muda no mesmo PR. Exemplo: quando os cartões e as legendas passaram a ser `<Frost>` (PR #9), os textos que diziam "usa o `<Glass>`" e "a foto se curva atrás da legenda" tiveram de ser corrigidos logo depois do PR #10.
- **D29. Nas páginas de contrato, o corpo de cada documento DEVE ser uma coluna de cartões de vidro fosco,** não um painel único. O título do documento (a âncora do menu), a fonte e os chips ficam na página; cada título `##` fica na página, acima dos seus cartões. `scripts/vite-docs.ts` monta os cartões no build:
  - cada `###` abre um cartão e é o título dele;
  - cada tabela e cada diagrama mermaid tem um cartão só seu (`.md-card-wide`), e a tabela rola para o lado dentro dele;
  - cada regra (`- **D12. …**`) é um cartão (`.md-rule`);
  - cada PR do histórico é um cartão (`.md-entry`);
  - o resto entre dois desses fica num cartão só.

  Todos os cartões têm o mesmo raio (20px), padding (18px × 16–24px), espaço (12px), tinta (`tint-frost`), fosco (`frost` do `vidro.ini`, saturate 1,4) e a hairline de `.glass::after`.
- **D30. Nenhum texto DEVE passar da largura da tela ou do seu cartão:** ele quebra a linha.
  - `body` tem `overflow-wrap: break-word`; `code` e `kbd`, `overflow-wrap: anywhere`; `p`, `li`, `dd`, `dt`, títulos e `figcaption` têm `min-width: 0` (dentro de flex e grid eles podem encolher).
  - Blocos de código quebram dentro do cartão (`white-space: break-spaces`, `overflow-wrap: anywhere`), mantendo a indentação. No celular (≤ 700px), o código em linha usa `word-break: break-all`, porque o WebKit deixava o padding de 6px de um trecho no fim da linha passar 2–4px do cartão.
  - Células de tabela quebram, com coluna de no mínimo 5,5em. Só uma tabela realmente larga (5 colunas ou mais no celular) rola para o lado, dentro do cartão. Os desenhos em texto (```` ```text ````: o desenho do menu e a árvore de pastas) mantêm as linhas e rolam para o lado dentro do cartão. Nada é cortado.
  - O teste (`CHECKLIST`) confere 320px, 393px e paisagem em todas as páginas, no WebKit e no Chromium.

## 10. Foco de teclado

- **D31. É PROIBIDO foco azul em qualquer lugar.** O foco de teclado DEVE ser uma indicação neutra e translúcida, do mesmo vidro:
  - na pílula do menu, na lista ☰, na pesquisa (▲▼✕), nos chips da Galeria e na barra de abas do Painel: um aro interno `inset 0 0 0 1.5px var(--bar-sub)`, sem `outline`; num item já selecionado, o aro se soma a `--sel-shadow` (a pílula de seleção);
  - no resto (links do texto, controle segmentado, switch, slider, cartões da Galeria, foto da lupa, botões): `outline: 2px solid var(--focus)` (3px nos cartões e na foto), com `outline-offset`;
  - sobre foto (os botões do visor da Galeria): `--focus-on-photo`, branco translúcido;
  - o anel só aparece com `:focus-visible` (teclado), nunca num toque.

  *Por quê:* pedido de design no PR #15 ("remove contorno azul de tudo"). Até o PR #14 o `--focus` era `#0a84ff` e a pílula, os chips e a barra de abas usavam `#4c9aff`. O teste do PR #15 passa com Tab por todas as páginas, nos dois temas, no Chromium e no WebKit: 703 elementos focados, nenhum anel azul e nenhum sem anel.

| Token | Claro | Escuro |
|---|---|---|
| `--focus` | `rgba(28,28,30,.5)` | `rgba(245,245,247,.62)` |
| `--focus-on-photo` | `rgba(255,255,255,.85)` | igual |
| Aro da pílula (`--bar-sub`) | `rgba(0,0,0,.6)` | `rgba(255,255,255,.6)` |

O azul que continua no site é preenchimento, não foco: o trilho ligado do switch e do slider (`activeColor #0a84ff`), a tinta `.tint-blue` ("Ver no visor", "Desenhar diagrama"), os avatares, o anel "Relógio" e o `accent-color` da lista de tarefas.

## 11. O que NÃO fazer (lições das iterações)

| # | Proibido | Motivo | Onde se aprendeu |
|---|---|---|---|
| N1 | Script caseiro que "transforma" elementos em vidro, ou bundle vendorizado da biblioteca | Não é o uso que a biblioteca orienta, e é difícil de manter. Use componentes React com `<Glass>` | PRs #1–#3 → #4 |
| N2 | Dependência GitHub da biblioteca | O fork não versiona `dist/` e não tem `prepare`, então o pacote viria vazio | PR #4 |
| N3 | Tirar toda a borda do vidro | O vidro perde a forma. Deve haver exatamente uma hairline | PR #2 → #5 |
| N4 | Realce de topo na hairline (`specular` > 0) ou luz interna em CSS | A linha deve ser uniforme em volta toda | PR #5 → #6 |
| N5 | Manchas ou discos de **borda nítida**, círculos limpos ou wallpapers no fundo (campos orgânicos desfocados são permitidos desde o PR #14, D1) | Viram formas distorcidas sob o vidro | PRs #1–#2 → #3, revisto no #14 |
| N6 | Menu que recolhe em "…" com popover | O menu deve ser igual em toda a página | PRs #3–#6 → #7 |
| N7 | Barra de pesquisa fixa embaixo, ou painel separado de pesquisa | A pesquisa é a própria pílula | PRs #3–#7 → #8 |
| N8 | Barra de menu de largura total encostada no topo | O Safari 26 pinta a barra com a cor dela | PR #7 → #8 |
| N9 | Palavra de marca no menu | Pedido de design | PR #8 |
| N10 | Foco azul em qualquer lugar: anel ou contorno azul na pílula, no campo de pesquisa, nos chips, na barra de abas, no controle segmentado, no switch, no slider ou em qualquer outro elemento (inclusive o cursor de texto `#4c9aff`) | Pedido de design. Use a indicação neutra de D31 | PR #9, estendido a tudo no PR #15 |
| N11 | `text-shadow` no texto refratado | Com dispersão, o halo vira névoa cinza | PR #5 |
| N12 | Lente cobrindo o hero ou a viewport inteira | Passa por baixo do menu e da status bar, é cortada na borda e custa GPU | PR #5 |
| N13 | `<mark>` para destacar ocorrências | O React é dono dos nós de texto. Use a Highlight API com overlay de fallback | PR #4 |
| N14 | `<Glass>` material em superfície só de fosco | Gera mapas e filtros inúteis. Use `<Frost>` | PR #9 |
| N15 | Servir o JPEG de 1600 px direto | No iPhone 15, a foto de Hong Kong cai de 373 KB (JPEG) para 112 KB (AVIF de 1080 px) | PR #9 |
| N18 | Estilos escuros por `prefers-color-scheme` | Ignoram a escolha manual | PR #7 |
| N19 | `filterResolution={2}` sempre ligado | Quadruplica os pixels do filtro. Use só em tela 1× e em máquina forte | PRs #5, #9 |
| N20 | Merge da troca para Vite antes de mudar a fonte do Pages para Actions | O site fica em branco (os fontes sem build seriam publicados) | PR #4 |
| N21 | "‹ Início" e outras páginas antes das seções no menu | As seções, que são o uso principal, ficavam fora da tela | PR #12 |
| N22 | Copiar o texto de `docs/` para dentro de um componente | Dois textos envelhecem separados. Importe `docs/X.md?doc` | PR #12 |
| N23 | Laço WebGL contínuo quando o WebGL roda no processador | No Lighthouse, TBT de ~147 s. Use `softwareGL()` e o fosco | PR #12 |
| N24 | Links de outras páginas no fim da pílula, depois de um ponto | Misturava a navegação entre páginas com as seções. Use a lista ☰ | PR #12 → #13 |
| N27 | Botão Início (casa) na pílula | Pedido de design: o Início é um item da lista ☰, e o ☰ fica na ponta esquerda | PR #13 |
| N25 | Um documento inteiro num painel fosco só | Um bloco contínuo, difícil de ler e de achar. Use os cartões de D29 | PR #12 → #13 |
| N26 | Seleção do controle segmentado com tinta fina e sombra dentro da lente | O filtro da lente deixava a pílula cinza, e o recorte da lente cortava a sombra numa borda escura. Use tinta quase opaca e a sombra no aro, fora da lente | PR #13 |
| N28 | Fundo animado, gerado por JS ou do tamanho do documento (`background-attachment: fixed`, imagem esticada na página inteira) | Custa pintura a cada quadro ou rasteriza uma imagem de milhares de pixels; o iOS ignora o `fixed`. Use a camada fixa `html::before` de `100lvh` (D1, D2.2) | PR #14 |
| N29 | Sombra, faixa ou fundo que escureça a primeira ou a última linha da viewport | A borda deixa de ser a cor da barra e a emenda aparece (D2.3) | PR #14 |
| N30 | Lente de lupa que re-renderiza o React a cada movimento do dedo, ou `transform` no elemento filtrado | Um render por evento travava o arrasto no WebKit, e o Safari descarta o `filter: url()` de um elemento filtrado com `transform`. Guarde a posição num ref, escreva uma vez por quadro (`requestAnimationFrame`) e mova o invólucro | PR #15 |
| N31 | Vidro do menu ou da lista ☰ feito fora da biblioteca (`<Frost>`, `.tint-bar`, `backdrop-filter` próprio, hairline `.glass::after`) | O vidro deles é o `<Glass>` material (D9.1) | menu no `<Glass>` |
