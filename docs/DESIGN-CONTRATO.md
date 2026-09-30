# Contrato de design

Este documento fixa a linguagem visual do projeto. Os valores foram copiados de `src/styles/global.css`, `src/components/SiteHeader.css`, `src/components/PageSearch.css`, `src/pages/*.css` e `src/lib/optics.ts` no PR #12 (a partir de `5838a71`).

## 1. Princípios

1. **As bordas vêm do vidro,** não de linhas desenhadas: fosco, tinta translúcida, refração onde ela aparece e uma sombra de flutuação suave. A única linha é uma hairline uniforme, fina e quase transparente.
2. **O fundo é cor, não forma:** um gradiente suave, sem manchas, discos ou fotos de fundo.
3. **Os controles flutuam:** nada sólido encosta nas bordas da tela.
4. **Uma coisa por lugar:** o menu é a pesquisa, e a lupa abre e fecha. Não há painéis extras, "…", barra de baixo nem marca. Componentes de exemplo dentro de uma página (a barra de abas do painel, os chips da galeria) são conteúdo: eles não substituem a pílula, que continua igual no topo.
5. **O texto é em pt-BR,** e o texto das fotos é creditado.

## 2. Fundo

- **D1. O fundo da página DEVE ser um gradiente CSS em `body`, sem imagens e sem formas de borda nítida** (`--page-bg`).
  *Por quê:* os discos de borda nítida (PR #2) e os wallpapers fotográficos (PR #1) foram trocados no PR #3 por um gradiente suave. Com vidro por cima, formas nítidas viram "manchas" distorcidas, e o gradiente deixa o fosco aparecer só como variação de cor.
- **D2. O gradiente DEVE começar e terminar na cor de borda do modo** (`--page-edge`), e essa mesma cor DEVE ser o `background-color` de `html` e `body`.
  *Por quê:* a barra do navegador e o overscroll mostram essa cor. Veja [TELA-CHEIA-E-BARRAS.md](TELA-CHEIA-E-BARRAS.md).

| Token | Claro | Escuro |
|---|---|---|
| `--page-edge` | `#8b82e6` | `#1b1646` |
| Faixa linear (180°) | `edge 0%` → `#c3b9f7 12%` → `#f1e7fb 30%` → `#eaf3ff 50%` → `#fbe9f1 70%` → `#c3b9f7 88%` → `edge 100%` | `edge 0%` → `#2a2170 12%` → `#1d2b63 30%` → `#16324f 50%` → `#2c1f5a 70%` → `#2a2170 88%` → `edge 100%` |
| 4 radiais suaves (até transparente) | rosa `rgba(255,158,205,.75)` a 10% 34% · azul `rgba(120,205,255,.75)` a 92% 44% · pêssego `rgba(255,210,150,.70)` a 22% 64% · menta `rgba(140,240,210,.65)` a 84% 74% | `rgba(214,70,160,.45)` · `rgba(40,160,220,.42)` · `rgba(230,140,60,.30)` · `rgba(40,200,170,.32)`, nas mesmas posições |
| `--text` / `--text-dim` / `--faint` | `#1c1c1e` / `#3a3a3c` / `#5d5b6e` | `#f5f5f7` / `#d1d1d6` / `#b3b0c8` |
| `--link` | `#0a6cff` | `#64d2ff` |

O `body` usa `background-attachment: fixed`, `no-repeat` e `background-size: 100% 100%`. O iOS ignora o `fixed` e rola o fundo, mas as bordas continuam batendo.

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
  *Por quê:* é o mesmo princípio do fork, que desenha a borda "as its own inset layer so it never fights a box-shadow". O PR #6 fixou a linha uniforme.
- **D4. A espessura DEVE ser `1px` em telas 1× e `0.5px` em telas ≥ 2dppx** (um pixel físico).
- **D5. A linha DEVE ficar logo fora da borda** (`0 0 0 var(--rim-w)`, sem `inset`).
  *Por quê:* por fora, ela aparece contra o gradiente nos dois temas. Por dentro, uma linha branca some nos preenchimentos claros e foscos.
  - **Exceção:** um elemento que recorta o próprio conteúdo (`overflow: hidden` ou `clip-path`) cortaria a linha de fora. Nesse caso, a mesma linha DEVE ir por dentro (`inset`). Hoje isso acontece só no `.hero-ring` (`box-shadow: inset 0 0 0 var(--rim-w) var(--rim)`), o anel que acompanha a lente.
- **D6. É PROIBIDO:**
  - um realce mais claro no topo (o `specular` > 0 da biblioteca);
  - "luz interna" em CSS;
  - linha escura ou bisel;
  - pilhas de bordas.

  *Por quê:*
  - O PR #5 voltou com o aro padrão da biblioteca, mas ele sempre traz o realce de topo (`inset 0 1px 0 rgba(255,255,255,.55·g)`). O PR #6 trocou por uma linha uniforme, que é o pedido de design.
  - Nos cartões `refract`, a pilha de bordas do `GlassNotification` (brilho no topo, realce branco interno, glow e linha escura) foi reduzida à mesma hairline: `.gcard-body { box-shadow: 0 0 0 var(--rim-w) var(--rim), 0 14px 36px rgba(0,0,0,.22), 0 2px 5px rgba(0,0,0,.14) }`.
- **D7. Toda ótica DEVE usar `specular: 0`** (`src/lib/optics.ts`, `HERO_LENS` e `PANEL_LENS`).

**Sombra de flutuação:** `--glass-float: 0 10px 28px rgba(30,20,90,.16), 0 2px 6px rgba(30,20,90,.08)`, igual nos dois modos.

## 4. Fosco e tintas

| Uso | Ótica / CSS | `backdrop-filter` resultante |
|---|---|---|
| Pílula do menu, legendas de foto | `FROST` | `blur(6px) saturate(1.15)` |
| Cartões, introdução, notas e rodapés | `PANEL` | `blur(22px) saturate(1.4)` |
| Botões de vidro fora do Blink | `CONTROL` (padrão do material) | `blur(6px) saturate(1.15)` |
| Botões redondos do menu (`.sh-pill`) | CSS | `blur(14px)` |

- **D8. A tinta DEVE ser o `background` translúcido do próprio elemento** (classe `tint-*`). É PROIBIDO tinta opaca, exceto em `prefers-reduced-transparency`.
  *Por quê:* é a regra da biblioteca ("the background is the tint"). O fosco só aparece se o fundo deixar passar luz.

| Classe | Claro | Escuro | Transparência reduzida |
|---|---|---|---|
| `.tint-bar` (menu) | `rgba(238,240,245,.72)` | `rgba(6,6,7,.72)` | `#eef0f5` / `#060607` |
| `.tint-frost` (painéis) | `rgba(255,255,255,.52)` | `rgba(28,24,60,.5)` | `rgba(255,255,255,.95)` / `rgba(28,24,60,.96)` |
| `.tint-ink` (legendas) | `rgba(24,20,56,.46)`, texto `#fff` | igual | `rgba(24,20,56,.94)` |
| `.tint-blue` | `rgba(10,132,255,.52)`, texto `#fff` | igual | `rgba(10,110,230,.96)` |
| `.tint-red` / `.tint-green` / `.tint-white` | `rgba(248,113,113,.40)` / `rgba(48,209,88,.36)` / `rgba(255,255,255,.34)` | igual | `rgba(255,255,255,.95)` |
| `.tint-soft` | `rgba(255,255,255,.42)` | `rgba(255,255,255,.12)` | `.95` / `.96` como acima |

**Raios:**

| Elemento | Raio |
|---|---|
| Pílula do menu | 26px |
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
 │ Início               │ ← lista de páginas (☰): vidro fosco
 │ Amostra              │   ancorado sob a ponta esquerda da pílula
 │ [Painel]       atual │
 │ Galeria ...          │
 └──────────────────────┘
```

| Propriedade | Valor |
|---|---|
| Wrapper fixo | `.site-header`: `position: fixed; z-index: 70`, `top: calc(12px + env(safe-area-inset-top))`, lateral `max(12px, env(safe-area-inset-*))`, **transparente**, com `pointer-events: none` (só a pílula recebe eventos) |
| Largura | `max-width: min(100%, 1040px)`. Em telas ≤ 760px, `width: 100%` |
| Pílula | `.sh-bar`: `height: 52px`, `border-radius: 26px`, `padding: 0 9px`, `gap: 14px`. Em telas ≤ 760px, `padding: 0 8px` e `gap: 8px` |
| Links | `height: 34px`, `padding: 0 13px` (12px em telas ≤ 760px), raio 17px, 13,5px/500, cor `--bar-sub`. O link atual usa 600 e `--bar-text` |
| Botões redondos | 34×34, `border: 1px solid var(--chip-border)`, `background: var(--chip-bg)`, `blur(14px)`, `scale(.96)` ao tocar |
| Degradê lateral | máscara de 22px só no lado em que há mais links (`data-fade-start` / `data-fade-end`) |
| Pílula de seleção | `.sh-indicator`: 34px, raio 17px, `--sel-bg` e `--sel-shadow`, **sem borda**. Transição de 0,45s em `--glass-ease` = `cubic-bezier(.34,1.36,.42,1)` (a mola da biblioteca) |
| Lista de páginas | `.sh-picker`: vidro fosco (`<Frost>` com `PANEL`, 22px de blur) com tinta mais densa (`--picker-bg`: `rgba(242,243,247,.9)` / `rgba(22,22,26,.88)`), raio 22px, `padding: 6px`, a mesma hairline `.glass::after`; `top: 100% + 8px`, alinhada à esquerda da pílula (sob o ☰), largura pelo conteúdo (`width: max-content`, no máximo a largura da pílula, no mínimo 180px): o nome mais longo, "Arquitetura e operação", mais o padding e o lugar do ✓. Itens de 44px de altura, raio 16px, em grade `auto 15px` com `gap: 14px`, então o ✓ fica logo depois do texto; a página atual fica na pílula de seleção (`--sel-bg`), em 600 e com um ✓ |
| Rolagem de borda | `.site-header::before`: uma faixa sem cor, só `backdrop-filter: blur(6px)` com máscara em degradê, de 10px acima a 30px abaixo da pílula (nunca encosta na borda, T11) |
| Fonte | `system-ui, -apple-system, sans-serif` (a primeira família sempre existe; veja [DESEMPENHO.md](DESEMPENHO.md) P7) |

Paleta do menu (a mesma do `site/src/theme.ts` do fork):

| Token | Claro | Escuro |
|---|---|---|
| `--bar-bg` | `rgba(238,240,245,.72)` | `rgba(6,6,7,.72)` |
| `--bar-text` / `--bar-sub` | `#0a0b0d` / `rgba(0,0,0,.6)` | `#fff` / `rgba(255,255,255,.6)` |
| `--chip-bg` / `--chip-border` | `rgba(255,255,255,.66)` / `rgba(0,0,0,.12)` | `rgba(255,255,255,.05)` / `rgba(255,255,255,.14)` |
| `--sel-bg` | `rgba(255,255,255,.9)` | `rgba(255,255,255,.16)` |
| `--sel-shadow` | `0 1px 2px rgba(20,16,60,.1), 0 3px 10px rgba(20,16,60,.1)` | `0 2px 10px rgba(0,0,0,.3)` |
| `--hover-bg` | `rgba(0,0,0,.05)` | `rgba(255,255,255,.07)` |

- **D9. O menu DEVE ser uma pílula flutuante, afastada 12px das laterais e 12px abaixo da safe area. Ela NÃO DEVE encostar no topo.**
  *Por quê:* o Safari 26 leva a cor de elementos fixos que encostam na borda para a barra do navegador. A barra de largura total do PR #7 foi revertida no PR #8. Veja [TELA-CHEIA-E-BARRAS.md](TELA-CHEIA-E-BARRAS.md).
- **D10. O menu DEVE ser o mesmo em todas as páginas e em qualquer posição de rolagem:** a pílula não encolhe nem vira "…".
  *Por quê:* o menu que virava "…" com popover (PRs #3–#6) foi removido no PR #7.
- **D11. O menu NÃO DEVE ter palavra de marca.** O menu contém só:
  - o botão ☰ da lista de páginas, **o primeiro à esquerda**;
  - os links de seção;
  - o botão de tema;
  - a lupa, que é **o último botão à direita**.

  *Por quê:* pedido de design do PR #8.
- **D12. Os links da pílula DEVEM ser só as seções da página** (os que rolam dentro dela). Os links para outras páginas NÃO DEVEM ficar na pílula: eles ficam na lista de páginas (D12.2). `pageNav()` (`src/lib/pages.ts`) monta a lista de seções; a lista de páginas vem de `PAGES`. Só seções recebem seleção e scroll-spy.
  *Por quê:* no PR #12 as outras páginas ficavam no fim da pílula, depois de um ponto; no PR #13 elas saíram da pílula, a pedido, para que ela role só pelas seções e a navegação entre páginas fique num lugar próprio.
- **D12.1. NÃO DEVE haver botão Início (casa) nem link para a página inicial na pílula.** O Início é só um item da lista ☰, como as outras páginas. (Na própria página inicial, o link de seção "Início" leva ao `#topo` dela: é uma seção, não uma página.)
- **D12.2. O botão ☰ DEVE ficar na ponta esquerda da pílula, em todas as páginas (inclusive no Início), e abrir a lista de páginas.** À direita ficam só o tema e a lupa. A lista:
  - é um popover de vidro fosco ancorado sob a ponta esquerda da pílula, NÃO uma tela cheia;
  - lista as seis páginas na ordem de `PAGES` (Início, Amostra, Painel, Galeria, Contrato de design, Arquitetura e operação);
  - marca a página atual com `aria-current="page"`, a pílula de seleção, peso 600 e um ✓ (não só cor);
  - fecha com Esc (o foco volta ao ☰), com um toque fora, ao escolher uma página e ao tocar no ☰ de novo; fecha também quando o foco sai dela;
  - ao abrir, leva o foco para a página atual; ↑/↓, Home e End andam entre os itens; o ☰ tem `aria-expanded` e `aria-controls`;
  - usa um anel de foco neutro (`inset 0 0 0 1.5px var(--bar-sub)`), NUNCA o azul;
  - no modo pesquisa, o ☰ some como o botão de tema, e abrir a pesquisa fecha a lista.
- **D13. Os links que não cabem DEVEM rolar para o lado,** com a barra de rolagem oculta e degradê no lado em que há mais itens. Isso vale para toque, trackpad e Shift + roda.
- **D14. O item atual DEVE ter uma pílula suave atrás,** com uma só pílula que desliza e muda de largura entre os links, e sempre DEVE ficar visível no menu.
  *Por quê:* a pílula não pode mudar de tamanho quando o negrito muda. Por isso cada rótulo reserva a largura em negrito com `.sh-label::after { content: attr(data-text); font-weight: 600; height: 0; visibility: hidden }`.

## 6. Pesquisa na lupa

- **D15. A lupa DEVE transformar a própria pílula na barra de pesquisa, no mesmo lugar e do mesmo tamanho.**
  - Os links e o botão de tema somem (opacidade 0, `visibility: hidden`, `inert`), mas **continuam no layout**.
  - O formulário cobre a pílula da borda esquerda até a lupa (`right: 49px`, ou 48px em telas ≤ 760px).

  *Por quê:* nada se mexe nem muda de tamanho ao abrir. Um painel ou barra separada (a barra fixa embaixo dos PRs #3–#7) foi removido no PR #8.
- **D16. A lupa DEVE ficar no mesmo lugar, em estado ativo** (`aria-expanded="true"`, preenchida com `background: var(--bar-text)` e `color: var(--bar-bg-solid)`). **Um novo toque nela DEVE fechar a pesquisa.**
- **D17. No modo pesquisa, é PROIBIDO anel ou contorno de foco na pílula e no campo** (`.sh-bar[data-mode="search"], .page-search input:focus, .page-search input:focus-visible { outline: none }`). A pílula fica só com a hairline uniforme. O cursor de texto (`caret-color: #4c9aff`) mostra onde se digita.
  *Por quê:* o anel azul `0 0 0 2px rgba(76,154,255,.55)` via `:has(input:focus)` foi removido no PR #9, a pedido. Os anéis de teclado dos links, dos botões redondos e dos botões ▲▼✕ (`.ps-btn:focus-visible`) continuam.
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

  Todos os cartões têm o mesmo raio (20px), padding (18px × 16–24px), espaço (12px), tinta (`tint-frost`), fosco (22px, saturate 1,4) e a hairline de `.glass::after`.
- **D30. Nenhum texto DEVE passar da largura da tela ou do seu cartão:** ele quebra a linha.
  - `body` tem `overflow-wrap: break-word`; `code` e `kbd`, `overflow-wrap: anywhere`; `p`, `li`, `dd`, `dt`, títulos e `figcaption` têm `min-width: 0` (dentro de flex e grid eles podem encolher).
  - Blocos de código quebram dentro do cartão (`white-space: break-spaces`, `overflow-wrap: anywhere`), mantendo a indentação. No celular (≤ 700px), o código em linha usa `word-break: break-all`, porque o WebKit deixava o padding de 6px de um trecho no fim da linha passar 2–4px do cartão.
  - Células de tabela quebram, com coluna de no mínimo 5,5em. Só uma tabela realmente larga (5 colunas ou mais no celular) rola para o lado, dentro do cartão. Os desenhos em texto (```` ```text ````: o desenho do menu e a árvore de pastas) mantêm as linhas e rolam para o lado dentro do cartão. Nada é cortado.
  - O teste (`CHECKLIST`) confere 320px, 393px e paisagem em todas as páginas, no WebKit e no Chromium.

## 10. O que NÃO fazer (lições das iterações)

| # | Proibido | Motivo | Onde se aprendeu |
|---|---|---|---|
| N1 | Script caseiro que "transforma" elementos em vidro, ou bundle vendorizado da biblioteca | Não é o uso que a biblioteca orienta, e é difícil de manter. Use componentes React com `<Glass>` | PRs #1–#3 → #4 |
| N2 | Dependência GitHub da biblioteca | O fork não versiona `dist/` e não tem `prepare`, então o pacote viria vazio | PR #4 |
| N3 | Tirar toda a borda do vidro | O vidro perde a forma. Deve haver exatamente uma hairline | PR #2 → #5 |
| N4 | Realce de topo na hairline (`specular` > 0) ou luz interna em CSS | A linha deve ser uniforme em volta toda | PR #5 → #6 |
| N5 | Manchas, discos de borda nítida ou wallpapers no fundo | Viram formas distorcidas sob o vidro | PRs #1–#2 → #3 |
| N6 | Menu que recolhe em "…" com popover | O menu deve ser igual em toda a página | PRs #3–#6 → #7 |
| N7 | Barra de pesquisa fixa embaixo, ou painel separado de pesquisa | A pesquisa é a própria pílula | PRs #3–#7 → #8 |
| N8 | Barra de menu de largura total encostada no topo | O Safari 26 pinta a barra com a cor dela | PR #7 → #8 |
| N9 | Palavra de marca no menu | Pedido de design | PR #8 |
| N10 | Anel azul de foco na pílula ou no campo em modo pesquisa | Pedido de design, e o cursor já basta | PR #9 |
| N11 | `text-shadow` no texto refratado | Com dispersão, o halo vira névoa cinza | PR #5 |
| N12 | Lente cobrindo o hero ou a viewport inteira | Passa por baixo do menu e da status bar, é cortada na borda e custa GPU | PR #5 |
| N13 | `<mark>` para destacar ocorrências | O React é dono dos nós de texto. Use a Highlight API com overlay de fallback | PR #4 |
| N14 | `<Glass>` material em superfície só de fosco | Gera mapas e filtros inúteis. Use `<Frost>` | PR #9 |
| N15 | Servir o JPEG de 1600 px direto | No iPhone 15, a foto de Hong Kong cai de 373 KB (JPEG) para 112 KB (AVIF de 1080 px) | PR #9 |
| N16 | `interactive-widget=resizes-content` no viewport | Gerava erro no console do WebKit | PR #2 |
| N17 | `maximum-scale` / `user-scalable=no` | O zoom por pinça DEVE continuar permitido | PR #2 |
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
