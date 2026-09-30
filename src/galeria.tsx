import React from "react";
import { createRoot } from "react-dom/client";
import "./styles/global.css";
import { Galeria } from "./pages/Galeria";

createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <Galeria />
  </React.StrictMode>,
);
