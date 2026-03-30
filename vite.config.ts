import fs from "node:fs";
import path from "node:path";
import { defineConfig, type Plugin } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

function syncLogoToPublic(): Plugin {
  const copy = () => {
    const root = process.cwd();
    const src = path.join(root, "src/assets/logo.png");
    if (!fs.existsSync(src)) return;
    const dir = path.join(root, "public");
    fs.mkdirSync(dir, { recursive: true });
    fs.copyFileSync(src, path.join(dir, "logo.png"));
    // Même fichier PNG : beaucoup de navigateurs demandent /favicon.ico en premier.
    fs.copyFileSync(src, path.join(dir, "favicon.ico"));
  };

  return {
    name: "sync-logo-to-public",
    buildStart: copy,
    configureServer: copy,
  };
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [syncLogoToPublic(), react(), tailwindcss()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  build: {
    target: "es2019",
  },
});
