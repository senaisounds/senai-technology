import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import "./styles.css";
import { App } from "./App";

const rootEl = document.getElementById("root")!;
const prerenderEl = document.getElementById("prerender");

createRoot(rootEl).render(
  <StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </StrictMode>,
);

if (prerenderEl) {
  prerenderEl.remove();
}
