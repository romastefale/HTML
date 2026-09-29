import React from "react";
import { SiteHeader, type NavItem } from "../components/SiteHeader";
import { GlassCaption, GlassPanel, asset, CREDITS_URL, SAMPLE_URL } from "../components/Surfaces";
import "./Home.css";

// Every section of the page, in order (plus the sample page).
const NAV: NavItem[] = [
  { href: "#topo", label: "Início" },
  { href: SAMPLE_URL, label: "Amostra" },
  { href: "#menu", label: "Menu" },
  { href: "#busca", label: "Busca" },
  { href: "#gradiente", label: "Gradiente" },
  { href: "#cartoes", label: "Cartões" },
  { href: "#ceu", label: "Céu noturno" },
  { href: "#creditos", label: "Créditos" },
];

const Photo: React.FC<{ src: string; alt: string; w: number; h: number; lazy?: boolean; children: React.ReactNode }> = ({
  src,
  alt,
  w,
  h,
  lazy,
  children,
}) => (
  <figure className="photo">
    <img src={asset(src)} alt={alt} width={w} height={h} loading={lazy ? "lazy" : undefined} decoding="async" />
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
      <SiteHeader items={NAV} />
      <main className="feed" id="conteudo">
        <GlassPanel className="card-glass">
          <section className="intro" id="topo" aria-labelledby="home-title">
            <h1 id="home-title">Interface de vidro</h1>
            <p>
              O menu de vidro flutuante no topo reúne todas as seções desta página: deslize-o para o lado para ver o
              resto. A lupa transforma o menu na pesquisa da página e o botão ao lado troca o modo claro e escuro.
            </p>
          </section>
        </GlassPanel>

        <Card avatar="alt2" title="Amostra Liquid Glass" subtitle="Nova página">
          <p className="card-body">
            Vidro líquido que refrata o conteúdo ao vivo, com fallback em blur.{" "}
            <a className="card-link" href={SAMPLE_URL}>
              Abrir a amostra →
            </a>
          </p>
        </Card>

        <Card id="menu" title="Menu com rolagem lateral" subtitle="Navegação">
          <p className="card-body">
            O menu é uma pílula de vidro que flutua no topo, igual do início ao fim da página e em todas as páginas.
            Quando as seções não cabem, deslize-o para o lado (no computador, use o trackpad ou <kbd>Shift</kbd> + roda
            do mouse). A seção que você está lendo fica em negrito e sempre visível no menu. O botão com a lua ou o sol
            troca o modo claro e escuro, e a escolha fica salva.
          </p>
          <Photo
            src="img/hong-kong-victoria-harbour.jpg"
            alt="Arranha-céus iluminados às margens do Porto de Victoria, em Hong Kong, ao entardecer"
            w={1600}
            h={1063}
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
            src="img/rio-pao-de-acucar.jpg"
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
            Cada cartão é um componente React que usa o <code>&lt;Glass&gt;</code> da biblioteca liquid-glass: vidro
            fosco sobre o gradiente, com uma linha fina, uniforme e bem transparente na borda.
          </p>
        </Card>

        <Card id="ceu" avatar="alt" title="Céu noturno" subtitle="Foto">
          <p className="card-body">
            A coluna usa a largura disponível e se limita a 564px em telas maiores; os controles de vidro ficam por cima
            enquanto a página rola.
          </p>
          <Photo
            src="img/aurora-boreal-alasca.jpg"
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
            Fotos do Wikimedia Commons; créditos e licenças em <a href={CREDITS_URL}>CREDITS.md</a>. Efeito:{" "}
            <a href="https://github.com/romastefale/liquid-glass">liquid-glass</a> (MIT © Sam Asante), via o pacote{" "}
            <code>@samasante/liquid-glass</code>.
          </footer>
        </GlassPanel>
      </main>
    </>
  );
};
