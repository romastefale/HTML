# Tela cheia, safe areas e barras do navegador

O objetivo: a página vai de ponta a ponta, por baixo da barra de status e do indicador de início, e as barras do navegador parecem continuar a página nos dois modos e desde a primeira pintura.

## 1. Viewport

```html
<meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">
<meta name="color-scheme" content="light dark">
```

- **T1. `viewport-fit=cover` é OBRIGATÓRIO.**
  *Por quê:* sem ele, o iOS deixa faixas nas áreas da status bar e do indicador de início, e `env(safe-area-inset-*)` fica 0.
- **T2. O viewport DEVE ter `maximum-scale=1, user-scalable=no`, e o `html` DEVE ter `touch-action: pan-x pan-y`:** o zoom da página fica travado.
  *Por quê:* decisão do dono do projeto (commit `d9ddd1a`).
- **T3. `body` DEVE usar `touch-action: manipulation`**, que tira o atraso do duplo toque. O hero da amostra usa `touch-action: pan-y`, para arrastar na horizontal mover a lente.

## 2. Safe areas

| Elemento | Regra |
|---|---|
| Menu (`.site-header`) | `top: calc(12px + env(safe-area-inset-top, 0px))`; lateral `max(12px, env(safe-area-inset-left/right, 0px))` |
| Feed da página inicial | `padding: calc(84px + safe-top) max(18px, safe-right) calc(28px + safe-bottom) max(18px, safe-left)` |
| Margens da amostra | `--gutter-l/r: max(20px, env(safe-area-inset-left/right, 0px))` |
| Palco da lente | `top: calc(76px + safe-top)`, `bottom: calc(132px + safe-bottom)` |
| Botões e dica do hero | `bottom: calc(68px + safe-bottom)` / `calc(24px + safe-bottom)` |
| Rodapé da amostra | `padding-bottom: calc(28px + safe-bottom)` |
| Âncoras | `html { scroll-padding-top: calc(84px + safe-top); scroll-padding-bottom: calc(24px + safe-bottom) }`, para uma seção não ficar escondida sob o menu |
| Link "Pular para o conteúdo" | com foco, `top: calc(12px + safe-top)` |

- **T4. Todo conteúdo interativo e todo texto DEVEM respeitar `env(safe-area-inset-*)`.** Todo `env()` DEVE ter fallback `0px`. Só o **fundo** passa por baixo das áreas seguras.
- **T5. O deslocamento de 84px no topo** (12 de margem + 52 de pílula + 20 de folga) DEVE acompanhar a altura do menu. Se o menu mudar, `.feed` e `scroll-padding-top` mudam juntos.

## 3. Unidades de altura

```css
body { min-height: 100vh; min-height: 100dvh; }                 /* Início */
:root { --hero-h: max(560px, 100vh); }                          /* Amostra */
@supports (height: 100svh) { :root { --hero-h: max(560px, 100svh); } }
```

- **T6. O `body` DEVE usar `100dvh`, com `100vh` antes como fallback.**
  *Por quê:* o fundo cobre a altura visível atual, mesmo quando as barras recolhem.
- **T7. Seções "tela cheia" DEVEM usar `svh`, com `vh` como fallback, e uma altura mínima** (560px no hero).
  *Por quê:* `svh` é a menor viewport. Ela não muda quando as barras do navegador aparecem ou somem, e isso evita que o hero "pule" ao rolar.

## 4. Cor das barras e primeira pintura

Cada HTML de entrada traz, **nesta ordem**, no `<head>`:

```html
<meta name="theme-color" media="(prefers-color-scheme: light)" content="#8b82e6">
<meta name="theme-color" media="(prefers-color-scheme: dark)"  content="#1b1646">
<link rel="icon" href="data:,">
<meta name="mobile-web-app-capable" content="yes">
<meta name="apple-mobile-web-app-capable" content="yes">
<meta name="apple-mobile-web-app-status-bar-style" content="black-translucent">
<script>/* lê localStorage "lg-theme" (ou o sistema), define data-theme,
           color-scheme e o content das duas meta theme-color */</script>
<style>html,body{margin:0}body{background-color:#8b82e6}
       html[data-theme=dark] body{background-color:#1b1646}</style>
```

- **T8. O `body` DEVE ter `background-color` igual a `--page-edge` do modo, e o `html` NÃO DEVE ter fundo** (desde o PR #14). Assim, o fundo do `body` vira a cor do canvas. A cor é definida **inline no `<head>`** e repetida em `global.css`.
  *Por quê:* a cor vale antes do CSS e do JS carregarem, então não há faixa de outra cor na primeira pintura nem no overscroll. Sem fundo no `html`, a camada do fundo orgânico (`html::before`, `z-index: -1`) é pintada acima do canvas; se o `html` tivesse fundo, o do `body` cobriria a camada.
- **T9. O `theme-color` DEVE ser por esquema** (`media`) **e sobrescrito pelo modo escolhido,** pelo script inline e por `applyTheme()`. O valor DEVE ser `PAGE_EDGE[modo]`.
- **T10. Três lugares guardam as cores de borda e DEVEM ficar em sincronia:**
  - `--page-edge` em `global.css`;
  - `PAGE_EDGE` em `src/lib/theme.ts`;
  - o script e o `<style>` inline dos **seis** HTML.
- **T11. Nenhum elemento `fixed` ou `sticky` com `background-color` ou `backdrop-filter` pode encostar numa borda da viewport.** A pílula do menu é o próprio elemento fixo e fica afastada 12px da borda de cima e das laterais.
  - O mesmo vale para os componentes do PR #12: a **barra de abas** do painel é um wrapper fixo transparente a `calc(12px + env(safe-area-inset-bottom, 0px))` do fundo, com só a pílula em vidro; o `main` do painel reserva `112px + safe-bottom` embaixo e `scroll-padding-bottom` para as âncoras não caírem sob ela. A **barra de chips** da galeria é `sticky` abaixo da pílula (não encosta no topo). A **folha** da galeria fica a `12px + safe-bottom` do fundo, e sua altura máxima desconta as duas safe areas.
  - PR #13: a **faixa de desfoque** em volta da pílula (`.sh-band`) começa 2px abaixo da safe area e não tem cor, só `backdrop-filter` com máscara em degradê; a **lista de páginas** (☰) fica 8px abaixo da pílula. Nenhuma das duas encosta na borda.
  - PR #14: três camadas fixas encostam nas bordas **de propósito**, e nenhuma tem `background-color` nem `backdrop-filter`: o fundo orgânico (`html::before`, SVG) e as duas camadas de borda (`body::before` e `body::after`, só `linear-gradient`; desde o PR #18, o `body::after` fica no fluxo, no fim da página). A linha delas que encosta na borda é `--page-edge` sólido. Se o Safari 26 levar essa cor para a barra, é a cor certa; se ele mostrar a página por baixo, também. O teste confere os pixels da primeira e da última linha da viewport no topo, no meio e no fim de cada página (DESIGN-CONTRATO D2, D2.1).
  - PR #17: as duas camadas de borda passam **da borda** por `--fade-under` = `max(120px, 100lvh - 100svh)` (`top`/`bottom` negativos e altura maior), sólidas em `--page-edge` nesse trecho. No Safari 26 do iPhone, o `bottom: 0` de um `fixed` pode terminar acima da barra de endereço translúcida, e o texto que rolava por baixo dela aparecia nítido, depois de uma linha dura no fim do degradê. Agora a cor sólida continua por baixo de toda a barra, com a barra aberta ou recolhida e no modo standalone; quando a camada já encosta na borda, o trecho extra fica fora da tela e não cria rolagem.
  - PR #18: **não há mais camada fixa embaixo.** No meio da página, o conteúdo vai até a borda de baixo sem esmaecer. O `body::after` agora fica no fluxo, depois do último conteúdo: tem `88px + safe-bottom` de altura e vai de transparente a `--page-edge`, sólido nos últimos 24px e na safe area. O esmaecido só aparece quando você rola até o fim, e por baixo dele o canvas (`body`) é a mesma cor, inclusive sob a barra do Safari e no overscroll. Em cima continua a camada fixa do PR #17.

### Por que funciona assim

| Navegador | Comportamento | Consequência para o projeto |
|---|---|---|
| **Safari 26 (iOS/macOS)** | Ignora `theme-color`. Só estende para a barra a cor de fundo de um elemento `fixed`/`sticky` que **encosta** na borda; sem isso, no iOS, a barra fica translúcida e mostra a página ([arpit.blog, nov/2025](https://arpit.blog/articles/2025/11/safari-drops-support-theme-color/)) | Nada com `background-color` encosta na borda (T11). A viewport começa e termina em `--page-edge` (o fundo e as camadas de borda do PR #14), então a barra "é" a página. A barra de largura total do PR #7 encostava no topo e foi revertida no PR #8 |
| **Chrome no Android** | Pinta a barra de cima **sólida** na cor do `theme-color` | O `theme-color` é a cor das bordas do fundo, então a barra emenda com a página |
| **Tela de início (iOS)** | `black-translucent` põe a página por baixo da status bar | Só vale como web app adicionado à tela de início. No Safari normal, as barras do navegador continuam existindo |

**Fora do nosso controle** (registrado no PR #3):

- no Android, a barra é sempre sólida (só a cor é escolhida);
- o modo exato como o Safari amostra a cor em `scrollY = 0`;
- a opção do usuário "Permitir Tinta de Sites" no Safari;
- as opções limitadas de status bar no modo tela de início.

> **Não verificado em aparelho físico:** os comportamentos do Safari 26 e do Chrome no Android acima vêm das fontes citadas no PR #3 e da leitura do WebKit. Os testes do projeto rodaram em WebKit e Chromium headless (Playwright), com as safe areas simuladas via CDP no Chromium (`top: 59, bottom: 34`, como no iPhone 15).

## 5. Teclado na tela (iOS)

Com a pesquisa aberta, o `SiteHeader` escuta `visualViewport` (`resize` e `scroll`) e aplica `--vv-top = max(0, vv.offsetTop)px` à pílula (`transform: translateY(var(--vv-top, 0px))`).

- **T12. Um campo de entrada fixo RECOMENDA-SE acompanhar o `visualViewport`.**
  *Por quê:* com o teclado aberto, o iOS pode deslocar a viewport visual dentro da de layout, e um elemento `fixed` sairia da tela.
- **T13. O foco no campo DEVE acontecer de forma síncrona, dentro do gesto do usuário** (`flushSync(() => setSearchOpen(true))` e, logo depois, `input.focus({ preventScroll: true })`).
  *Por quê:* o iOS só abre o teclado quando o `focus()` acontece dentro de um evento de toque.
