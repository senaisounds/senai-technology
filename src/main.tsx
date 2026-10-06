import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import "./styles.css";
import { App } from "./App";
import { DJShowcase } from "./pages/DJShowcase";

const rootEl = document.getElementById("root")!;
const prerenderEl = document.getElementById("prerender");

createRoot(rootEl).render(
  <StrictMode>
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<App />} />
        <Route path="/work/dj" element={<DJShowcase />} />
      </Routes>
    </BrowserRouter>
  </StrictMode>,
);

if (prerenderEl) {
  prerenderEl.remove();
}
