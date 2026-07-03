/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_URL?: string;
  // "true" habilita a área de Prompts da IA (nav + rotas). Ausente/"false" => oculta (produção).
  readonly VITE_FEATURE_PROMPTS_IA?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
