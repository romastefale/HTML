import React from "react";
import { createRoot } from "react-dom/client";
import "./styles/global.css";
import { Fundo } from "./pages/Fundo";

createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <Fundo />
  </React.StrictMode>,
);
