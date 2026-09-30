# Contrato técnico: interface de vidro líquido (romastefale/HTML)

Esta pasta descreve **como o projeto foi construído e por quê**. Ela é escrita como um **contrato normativo**: um projeto futuro que queira repetir este resultado (páginas React com vidro líquido, menu flutuante, pesquisa na página, modo claro/escuro, tela cheia e carregamento leve) deve seguir estas regras, a menos que tenha um motivo documentado para não seguir.

| | |
|---|---|
| **Site ao vivo** | <https://romastefale.github.io/HTML/> |
| **Páginas** | [Amostra](https://romastefale.github.io/HTML/liquid-glass-sample.html) · [Painel](https://romastefale.github.io/HTML/painel.html) · [Galeria](https://romastefale.github.io/HTML/galeria.html) · [Contrato de design](https://romastefale.github.io/HTML/contrato-design.html) · [Arquitetura e operação](https://romastefale.github.io/HTML/contrato-arquitetura.html) |
| **Repositório** | [`romastefale/HTML`](https://github.com/romastefale/HTML) |
| **Biblioteca de vidro** | [`@samasante/liquid-glass`](https://www.npmjs.com/package/@samasante/liquid-glass) 0.1.1, idêntica ao fork [`romastefale/liquid-glass`](https://github.com/romastefale/liquid-glass) no commit `4e7b769` |
| **Estado descrito** | `main` depois do PR #13 (`testes-pos-pr12`), que parte de `9280565` (merge do PR #12) |

## Resumo do projeto

Um site estático de seis páginas, em pt-BR, feito como app **React 19 + Vite + TypeScript**. É publicado no **GitHub Pages** por um workflow do GitHub Actions. Este contrato também é conteúdo do site: as duas páginas de contrato mostram estes arquivos, compilados no build.

- **`index.html` (Início):** o portal. Um feed de cartões de vidro fosco sobre um fundo em gradiente suave, com cartões que levam às outras cinco páginas e três fotos de lugares.
- **`liquid-glass-sample.html` (Amostra):**
  - no topo, uma lente de vidro líquido que refrata o título ao vivo;
  - cartões com `refract` sobre uma faixa em gradiente;
  - botões de vidro com curvatura ao vivo (só no Chromium);
  - fotos com legendas de vidro;
  - notas de suporte a navegadores.
- **`painel.html` (Painel):** um painel no estilo de app:
  - controle segmentado cuja seleção é uma lente;
  - widgets que refratam o papel de parede;
  - central de controles com as chaves e o controle deslizante do fork;
  - avisos, widgets foscos e uma barra de abas flutuante embaixo.
- **`galeria.html` (Galeria de lugares):**
  - um visor de fotos em que os controles são lentes desenhadas em WebGL sobre a própria foto;
  - uma coleção com barra de filtros fixa;
  - uma folha (`<dialog>`) com lupa de vidro.
- **`contrato-design.html` e `contrato-arquitetura.html` (Contrato):** estes documentos como páginas do site, com fotos de skylines de livre acesso.
- **Em comum a todas as páginas:**
  - um menu flutuante em forma de pílula de vidro, com rolagem lateral só pelas seções da página (a atual fica selecionada), e um botão ☰ na ponta esquerda que abre a lista de todas as páginas (o Início também);
  - um botão de modo claro/escuro;
  - uma lupa que transforma a própria pílula na barra de pesquisa da página.

## Como usar este contrato

1. **Leia na ordem da tabela abaixo.** A arquitetura vem primeiro, depois o design e o resto.
2. **As palavras normativas têm sentido fixo** (inspirado na RFC 2119):

   | Termo | Significado |
   |---|---|
   | **DEVE** / **OBRIGATÓRIO** | Requisito absoluto. Descumprir quebra o resultado visual, o desempenho ou a acessibilidade que este projeto já validou. |
   | **NÃO DEVE** / **PROIBIDO** | Proibição absoluta. Quase sempre é algo que já foi tentado aqui e revertido (veja [HISTORICO.md](HISTORICO.md)). |
   | **RECOMENDADO** | Deve ser seguido, salvo motivo documentado no PR. |
   | **OPCIONAL** | Fica a critério do projeto. |

3. **Toda regra tem uma justificativa** ("Por quê"). Se a justificativa não valer para o seu projeto, registre a exceção no PR em vez de ignorar a regra em silêncio.
4. **Os valores citados** (cores, tamanhos, versões, números de desempenho) foram copiados do código em `main` ou medidos nos PRs #9 e #12. Se o código mudar, **atualize o documento no mesmo PR**.
5. **Antes de cada merge**, passe pelo [CHECKLIST-VERIFICACAO.md](CHECKLIST-VERIFICACAO.md).

## Índice

| Documento | Conteúdo |
|---|---|
| [ARQUITETURA.md](ARQUITETURA.md) | Stack e versões exatas, estrutura de pastas, entradas do Vite, componentes, fluxo de dados, como a biblioteca entra e onde `<Glass>` é usado |
| [DESIGN-CONTRATO.md](DESIGN-CONTRATO.md) | Linguagem visual com os valores do código: fundo, hairline, fosco, tintas, menu, pesquisa, tema, fotos, texto e o que **não** fazer |
| [TELA-CHEIA-E-BARRAS.md](TELA-CHEIA-E-BARRAS.md) | Tela de ponta a ponta, safe areas, `dvh`/`svh`, `theme-color`, cor antes da primeira pintura, Safari 26 e Android |
| [DESEMPENHO.md](DESEMPENHO.md) | Diagnóstico e números dos PRs #9 e #12, regras de desempenho, limites conhecidos e orçamento por página |
| [DEPLOY.md](DEPLOY.md) | GitHub Pages via Actions, passos do workflow, cache, como verificar um deploy e como regenerar as imagens |
| [ACESSIBILIDADE-E-INTERACAO.md](ACESSIBILIDADE-E-INTERACAO.md) | Teclado, ARIA, Esc e toque fora, movimento e transparência reduzidos, anéis de foco e o algoritmo da pesquisa |
| [CHECKLIST-VERIFICACAO.md](CHECKLIST-VERIFICACAO.md) | Checklist antes do merge, matriz de testes e comandos |
| [HISTORICO.md](HISTORICO.md) | Linha do tempo dos PRs #1 a #13, com a decisão e o motivo de cada um |

## Textos do site

Os textos das páginas, os comentários do CSS e o `public/img/CREDITS.md` foram conferidos contra o código no PR #13 e não há pendências conhecidas. Os documentos desta pasta são a fonte única do conteúdo das páginas de contrato: edite o `.md`, e o build atualiza o site. Se a implementação mudar, o texto DEVE mudar no mesmo PR (regra D28 em [DESIGN-CONTRATO.md](DESIGN-CONTRATO.md)).
