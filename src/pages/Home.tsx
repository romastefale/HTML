import React from "react";
import { SiteHeader, type NavItem } from "../components/SiteHeader";
import { GlassCaption, GlassPanel, Picture, CREDITS_URL, SAMPLE_URL } from "../components/Surfaces";
import { PAGES, pageNav } from "../lib/pages";
import "./Home.css";

// Every section of the page, in order (the other pages are in the ☰ picker).
const NAV: NavItem[] = pageNav("inicio", [
  { href: "#topo", label: "Início" },
  { href: "#paginas", label: "Páginas" },
  { href: "#menu", label: "Menu" },
  { href: "#busca", label: "Busca" },
  { href: "#gradiente", label: "Gradiente" },
  { href: "#cartoes", label: "Cartões" },
  { href: "#ceu", label: "Céu noturno" },
  { href: "#creditos", label: "Créditos" },
]);

// The portal: one card per page. Each page's accent is a CSS gradient disc
// (no photo here: the cards sit near the top, and the home stays light).
const ACCENT: Record<string, string> = { amostra: "", painel: "alt", galeria: "alt2", contrato: "alt3", arquitetura: "alt4" };
const KIND: Record<string, string> = {
  amostra: "Exemplo · lente no lugar",
  painel: "Exemplo · widgets",
  galeria: "Exemplo · mídia",
  contrato: "Contrato · docs/",
  arquitetura: "Contrato · docs/",
};

const Photo: React.FC<{ name: string; alt: string; w: number; h: number; lazy?: boolean; children: React.ReactNode }> = ({
  name,
  alt,
  w,
  h,
  lazy,
  children,
}) => (
  <figure className="photo">
    {/* Drawn at the card's inner width (column ≤ 564px − 2 × 18px padding). */}
    <Picture name={name} alt={alt} w={w} h={h} lazy={lazy} sizes="(min-width: 600px) 528px, calc(100vw - 72px)" />
    <figcaption>
      <GlassCaption>
        <span className="cap">{children}</span>
      </GlassCaption>
    </figcaption>
  </figure>
);

const Card: React.FC<{ id?: string; avatar?: string; title: string; subtitle: string; children: React.ReactNode }> = ({
  id,
  avatar = "",
  title,
  subtitle,
  children,
}) => (
  <GlassPanel className="card-glass">
    <article className="card" id={id}>
      <div className="card-header">
        <div className={`avatar ${avatar}`} />
        <div>
          <h2 className="card-title">{title}</h2>
          <p className="card-subtitle">{subtitle}</p>
        </div>
      </div>
      {children}
    </article>
  </GlassPanel>
);

export const Home: React.FC = () => {
  return (
    <>
      <a className="skip" href="#conteudo">
        Pular para o conteúdo
      </a>
      <SiteHeader items={NAV} current={"inicio"} />
      <main className="feed" id="conteudo">
        <GlassPanel className="card-glass">
          <section className="intro" id="topo" aria-labelledby="home-title">
            <h1 id="home-title">Interface de vidro</h1>
            <p>
              O menu de vidro flutuante no topo traz as seções desta página (deslize-o para o lado para ver o
              resto). O botão <span aria-hidden="true">☰</span> abre a lista de todas as páginas do portal, a lupa
              transforma o menu na pesquisa da página e o botão da lua ou do sol troca o modo claro e escuro.
            </p>
          </section>
        </GlassPanel>

        <section className="portal" id="paginas" aria-labelledby="paginas-title">
          <h2 id="paginas-title" className="portal-title">Páginas do portal</h2>
          <ul className="portal-grid">
            {PAGES.filter((p) => p.key !== "inicio").map((p) => (
              <li key={p.key}>
                <GlassPanel className="card-glass portal-card">
                  <a className="portal-link" href={p.href}>
                    <span className={`avatar ${ACCENT[p.key]}`} aria-hidden="true" />
                    <span className="portal-text">
                      <span className="card-subtitle">{KIND[p.key]}</span>
                      <strong className="card-title">{p.title}</strong>
                      <span className="card-body">{p.summary}</span>
                    </span>
                    <span className="portal-go" aria-hidden="true">›</span>
                  </a>
                </GlassPanel>
              </li>
            ))}
          </ul>
        </section>

        <Card id="menu" title="Menu com rolagem lateral" subtitle="Navegação">
          <p className="card-body">
            O menu é uma pílula de vidro que flutua no topo, igual do início ao fim da página e em todas as páginas.
            Nele ficam só as seções da página; quando não cabem, deslize-o para o lado (no computador, use o trackpad ou <kbd>Shift</kbd> + roda
            do mouse). Todas as páginas, o Início também, estão no botão <span aria-hidden="true">☰</span> na ponta esquerda da pílula,
            que abre uma lista de vidro fosco com a página atual marcada. A seção que você está lendo (ou a que você tocou) fica selecionada, com uma pílula clara atrás, e sempre visível no menu. O botão com a lua ou o sol
            troca o modo claro e escuro, e a escolha fica salva.
          </p>
          <Photo
            name="hong-kong-victoria-harbour"
            alt="Arranha-céus iluminados às margens do Porto de Victoria, em Hong Kong, ao entardecer"
            w={1600}
            h={1063}
            lazy
          >
            Porto de Victoria, Hong Kong · Foto:{" "}
            <a href="https://commons.wikimedia.org/wiki/File:Victoria_Harbour_skyscrapers.jpg">Wilfredor</a>, CC0
          </Photo>
        </Card>

        <Card id="busca" avatar="alt" title="Pesquisar na página" subtitle="Busca">
          <p className="card-body">
            Toque na lupa do menu: o próprio menu vira a barra de pesquisa. Digite uma palavra, como “vidro” ou
            “foto”: cada ocorrência fica destacada e o contador mostra “1 de N”. <kbd>Enter</kbd> ou as setas vão para
            a próxima e <kbd>Shift</kbd>+<kbd>Enter</kbd> volta. Toque na lupa de novo (ou use <kbd>Esc</kbd>) para
            fechar: os destaques somem e o menu volta. Acentos e maiúsculas não importam.
          </p>
        </Card>

        <Card id="gradiente" avatar="alt2" title="Fundo em gradiente suave" subtitle="Transparência">
          <p className="card-body">
            O fundo é um único gradiente translúcido, sem formas. Ele começa e termina na mesma cor, que também é a cor
            usada pelo navegador atrás das barras, então o topo da tela parece continuar a página.
          </p>
          <Photo
            name="rio-pao-de-acucar"
            alt="Pão de Açúcar sobre a Baía de Guanabara, no Rio de Janeiro, com mata verde e céu azul"
            w={1600}
            h={990}
            lazy
          >
            Pão de Açúcar, Rio de Janeiro · Foto:{" "}
            <a href="https://commons.wikimedia.org/wiki/File:Sugarloaf_Mountain,_Rio_de_Janeiro,_Brazil.jpg">Wilfredor</a>, CC0
          </Photo>
        </Card>

        <Card id="cartoes" title="Cartões de vidro" subtitle="Componentes React">
          <p className="card-body">
            Cada cartão é um componente React de vidro fosco feito em CSS, com o mesmo desfoque e a mesma saturação do
            material da biblioteca liquid-glass: vidro fosco sobre o gradiente, com uma linha fina, uniforme e bem
            transparente na borda. O <code>&lt;Glass&gt;</code> da biblioteca fica para a refração, na amostra.
          </p>
        </Card>

        <Card id="ceu" avatar="alt" title="Céu noturno" subtitle="Foto">
          <p className="card-body">
            A coluna usa a largura disponível e se limita a 564px em telas maiores; os controles de vidro ficam por cima
            enquanto a página rola.
          </p>
          <Photo
            name="aurora-boreal-alasca"
            alt="Aurora boreal verde e roxa no céu noturno sobre a neve, no Alasca"
            w={1600}
            h={1043}
            lazy
          >
            Aurora boreal, Alasca · Foto:{" "}
            <a href="https://commons.wikimedia.org/wiki/File:Aurora_borealis_over_Eielson_Air_Force_Base,_Alaska.jpg">
              Senior Airman Joshua Strang (USAF)
            </a>
            , domínio público
          </Photo>
        </Card>

        <GlassPanel className="card-glass">
          <footer className="foot" id="creditos">
            Fotos do Wikimedia Commons; créditos e licenças em <a href={CREDITS_URL}>CREDITS.md</a>. Vidro: o fosco
            desta página segue os valores do <a href="https://github.com/romastefale/liquid-glass">liquid-glass</a> (MIT ©
            Sam Asante), e o <code>&lt;Glass&gt;</code> do pacote <code>@samasante/liquid-glass</code> é usado na{" "}
            <a href={SAMPLE_URL}>amostra</a>, no painel e na galeria.
          </footer>
        </GlassPanel>
      </main>
    </>
  );
};
