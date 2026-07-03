// Feature flags do admin, resolvidas em build-time (Vite injeta as VITE_*).
//
// PROMPTS_IA_HABILITADO controla a área de "Prompts da IA" (nav + rotas). Fica
// DESLIGADA por padrão: só aparece quando VITE_FEATURE_PROMPTS_IA === "true".
// Assim, em produção (build sem a env, ou com "false"), a área some por completo —
// sem nav, sem rota — mesmo que alguém acesse /prompts direto na URL.
export const PROMPTS_IA_HABILITADO =
  import.meta.env.VITE_FEATURE_PROMPTS_IA === "true";
