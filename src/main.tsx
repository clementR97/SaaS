import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App.tsx";
import { ErrorBoundary } from "./components/ErrorBoundary";

/** En dev, le navigateur met souvent le favicon en cache : on force une URL unique. */
if (import.meta.env.DEV) {
  const bust = `?t=${Date.now()}`;
  document.querySelectorAll('link[rel="icon"], link[rel="apple-touch-icon"]').forEach((el) => {
    const href = el.getAttribute("href");
    if (href?.includes("favicon.ico") || href?.includes("logo.png")) {
      const base = href.split("?")[0];
      el.setAttribute("href", `${base}${bust}`);
    }
  });
}

const root = document.getElementById("root");
if (root) {
  createRoot(root).render(
    <StrictMode>
      <ErrorBoundary>
        <App />
      </ErrorBoundary>
    </StrictMode>,
  );
}
