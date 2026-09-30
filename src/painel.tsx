import React from "react";
import { createRoot } from "react-dom/client";
import "./styles/global.css";
import { Painel } from "./pages/Painel";

createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <Painel />
  </React.StrictMode>,
);
