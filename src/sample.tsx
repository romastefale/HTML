import React from "react";
import { createRoot } from "react-dom/client";
import "./styles/global.css";
import { Sample } from "./pages/Sample";

createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <Sample />
  </React.StrictMode>,
);
