import React from "react";
import { DocsPage, type Skyline } from "./Docs";
import readme from "../../docs/README.md?doc";
import design from "../../docs/DESIGN-CONTRATO.md?doc";
import tela from "../../docs/TELA-CHEIA-E-BARRAS.md?doc";
import a11y from "../../docs/ACESSIBILIDADE-E-INTERACAO.md?doc";


const SAO_PAULO: Skyline = {
  name: "sao-paulo-copan-italia",
  alt: "Centro de São Paulo à noite, com o Edifício Itália e o Copan entre prédios iluminados sob um céu rosado de nuvens",
  place: "Centro de São Paulo",
  pos: "50% 88%",
  over: "top", // the towers stand in the lower half: the title sits on the sky
};
const NOVA_YORK: Skyline = {
  name: "nova-york-midtown-noite",
  alt: "Arranha-céus iluminados de Midtown Manhattan à noite, vistos do alto do Empire State",
  place: "Midtown, Nova York",
};
const TOQUIO: Skyline = {
  name: "toquio-torre-minato",
  alt: "Tóquio à noite vista do alto, com a Torre de Tóquio iluminada em laranja entre os prédios de Minato",
  place: "Torre de Tóquio, Minato",
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
