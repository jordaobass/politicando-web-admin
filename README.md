# Politicando · Admin

Painel administrativo (SPA) — **Vite + React 19 + TypeScript + Tailwind v4 + React Query + RHF/Zod**.
App separado do site público (Next), publicado em `admin-politicando.infinitybit.com.br`.

## O que faz
- **Login** restrito a `Papel = Admin` (JWT da mesma API .NET).
- **Dashboard** com métricas (candidatos, quizzes, scores, usuários, comparações).
- **Candidaturas** — curadoria: publica/oculta no site e no ranking (individual e em massa).
- **Partidos** — CRUD (sigla, número, logo, site, programa).
- **Perguntas** — banco de afirmações do quiz + peso/direção + métricas de resposta (distribuição/skip).
- **Usuários** — lista e atividade no quiz.
- **Integrações** — dispara ingestões (Câmara/Senado/TSE) e jobs de IA, com log de execuções.

## Rodar local
```bash
npm install
cp .env.example .env          # ajuste VITE_API_URL (default http://localhost:5080/api)
npm run dev                   # http://localhost:11602
```

## Build / Docker
```bash
npm run build                 # tsc --noEmit + vite build -> dist/
docker build --build-arg VITE_API_URL=https://politicando-api.infinitybit.com.br/api -t politicando-admin .
```

> A API precisa liberar a origem do admin no CORS (`Cors__Origins`) e expor
> `/api/admin/*` com `[Authorize(Roles="Admin")]`. Endpoints esperados em `docs/handoff-backend.md`.
