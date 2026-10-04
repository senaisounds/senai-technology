import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "@fontsource-variable/bricolage-grotesque/wdth.css";
import "@fontsource-variable/inter";
import "./styles.css";
import { App } from "./App";

const rootEl = document.getElementById("root")!;
const prerenderEl = document.getElementById("prerender");

createRoot(rootEl).render(
  <StrictMode>
    <App />
  </StrictMode>,
);

if (prerenderEl) {
  prerenderEl.remove();
}
