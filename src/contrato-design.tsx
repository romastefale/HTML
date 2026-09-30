import React from "react";
import { createRoot } from "react-dom/client";
import "./styles/global.css";
import { ContratoDesign } from "./pages/ContratoDesign";

createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <ContratoDesign />
  </React.StrictMode>,
);
