# --- build ---
FROM node:22-alpine AS build
WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .
# A URL da API é resolvida em build-time (SPA estática). Sem default em produção.
ARG VITE_API_URL
ENV VITE_API_URL=$VITE_API_URL
RUN if [ -z "$VITE_API_URL" ]; then echo "ERRO: VITE_API_URL não informado no build." && exit 1; fi
# Feature flag da área de Prompts da IA (default oculto; passe "true" só em dev/interno).
ARG VITE_FEATURE_PROMPTS_IA
ENV VITE_FEATURE_PROMPTS_IA=$VITE_FEATURE_PROMPTS_IA
ARG VITE_FEATURE_INTEGRACOES
ENV VITE_FEATURE_INTEGRACOES=$VITE_FEATURE_INTEGRACOES
RUN npm run build

# --- runtime (servidor estático; NÃO é reverse-proxy) ---
FROM nginx:alpine AS runtime
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist /usr/share/nginx/html
EXPOSE 80
