import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import path from "node:path";

const PORTA = 11602;

// Admin SPA (React 19 + Tailwind v4). Roda na 11602; o tunnel ia-stack expõe em
// admin-politicando.infinitybit.com.br. A API vem de VITE_API_URL (build-time).
export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: { alias: { "@": path.resolve(__dirname, "src") } },
  server: { port: PORTA, host: true, strictPort: true },
  preview: { port: PORTA, host: true, strictPort: true },
});
