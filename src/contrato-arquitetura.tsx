import React from "react";
import { createRoot } from "react-dom/client";
import "./styles/global.css";
import { ContratoArquitetura } from "./pages/ContratoArquitetura";

createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <ContratoArquitetura />
  </React.StrictMode>,
);
