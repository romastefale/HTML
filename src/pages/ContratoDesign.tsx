import React from "react";
import { DocsPage, type Skyline } from "./Docs";
import readme from "../../docs/README.md?doc";
import design from "../../docs/DESIGN-CONTRATO.md?doc";
import tela from "../../docs/TELA-CHEIA-E-BARRAS.md?doc";
import a11y from "../../docs/ACESSIBILIDADE-E-INTERACAO.md?doc";

const C = (href: string, author: string, lic: string, licHref: string) => (
  <>
    Foto: <a href={href}>{author}</a>, <a href={licHref}>{lic}</a>
  </>
);

const SAO_PAULO: Skyline = {
  name: "sao-paulo-copan-italia",
  alt: "Centro de São Paulo à noite, com o Edifício Itália e o Copan entre prédios iluminados sob um céu rosado de nuvens",
  place: "Centro de São Paulo",
  pos: "50% 88%",
  over: "top", // the towers stand in the lower half: the title sits on the sky
  credit: C(
    "https://commons.wikimedia.org/wiki/File:Webysther_20150427002640_-_Edif%C3%ADcios_Terra%C3%A7o_It%C3%A1lia_e_Copan.jpg",
    "Webysther Nunes", "CC BY-SA 4.0", "https://creativecommons.org/licenses/by-sa/4.0/",
  ),
};
const NOVA_YORK: Skyline = {
  name: "nova-york-midtown-noite",
  alt: "Arranha-céus iluminados de Midtown Manhattan à noite, vistos do alto do Empire State",
  place: "Midtown, Nova York",
  credit: C(
    "https://commons.wikimedia.org/wiki/File:New_York_Midtown_Skyline_at_night_-_Jan_2006_edit1.jpg",
    "Diliff", "CC BY-SA 3.0", "https://creativecommons.org/licenses/by-sa/3.0/",
  ),
};
const TOQUIO: Skyline = {
  name: "toquio-torre-minato",
  alt: "Tóquio à noite vista do alto, com a Torre de Tóquio iluminada em laranja entre os prédios de Minato",
  place: "Torre de Tóquio, Minato",
  credit: C(
    "https://commons.wikimedia.org/wiki/File:Tokyo_Tower,_Minato_City.jpg",
    "David Kernan", "CC BY 4.0", "https://creativecommons.org/licenses/by/4.0/",
  ),
};

export const ContratoDesign: React.FC = () => (
  <DocsPage
    self="contrato"
    eyebrow="Contrato · docs/"
    lead={
      <>
        As regras de design desta interface, escritas como contrato: fundo, hairline, fosco, menu, pesquisa, tema, tela
        cheia e acessibilidade. O texto vem direto da pasta <code>docs/</code> do repositório.
      </>
    }
    hero={SAO_PAULO}
    docs={[
      { doc: readme, label: "Visão geral" },
      { doc: design, label: "Design" },
      { doc: tela, label: "Tela cheia", before: NOVA_YORK },
      { doc: a11y, label: "Acessibilidade", before: TOQUIO },
    ]}
  />
);
