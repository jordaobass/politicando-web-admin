// Cliente HTTP central do admin. Base em VITE_API_URL (default http://localhost:5080/api).
// O token JWT é lido do localStorage (gerido pelo contexto de auth).

import type {
  AtividadeLegislativa,
  AuthResponse,
  CandidaturaAdmin,
  CandidaturaDetalhe,
  FonteScraping,
  Categoria,
  DashboardAdmin,
  ExecucaoLog,
  IntegracaoAdmin,
  PagedResult,
  Partido,
  Pergunta,
  PerguntaMetrica,
  PromptIa,
  ResumoAcessos,
  SerieUso,
  FunilPublicacao,
  CoberturaDados,
  Faltante,
  SaudeScoring,
  SaudeOperacional,
  AcessosPorRegiao,
  UsuarioAdmin,
  PermissaoCatalogo,
  ConviteAdmin,
  ConviteCriado,
} from "@/lib/types";

export const API_BASE_URL = import.meta.env.VITE_API_URL ?? "http://localhost:11601/api";
export const TOKEN_KEY = "politicando:admin:token";

/**
 * Resolve um caminho servido pela API (foto de político, logo de partido) contra a origem
 * dela. A API devolve esses caminhos relativos — `/api/fotos/politico/{id}` —, o que só
 * funciona quando o admin e a API estão no mesmo host. Publicado na Vercel, o admin fala
 * com a API por URL absoluta, e o caminho relativo caía no domínio do próprio admin: toda
 * foto quebrava (Correções v8, item 4).
 */
export function urlDaApi(caminho: string | null | undefined): string | undefined {
  if (!caminho) return undefined;
  if (/^https?:\/\//i.test(caminho) || caminho.startsWith("data:")) return caminho;

  // API_BASE_URL termina em "/api" — o mesmo prefixo que o caminho já traz.
  const origem = API_BASE_URL.replace(/\/api\/?$/, "");
  return `${origem}${caminho.startsWith("/") ? "" : "/"}${caminho}`;
}

export class ApiError extends Error {
  constructor(
    public readonly status: number,
    message: string,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

function lerToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

async function request<T>(caminho: string, options: RequestInit = {}): Promise<T> {
  const token = lerToken();
  const resp = await fetch(`${API_BASE_URL}${caminho}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
  });

  if (!resp.ok) {
    let detalhe = `Falha na requisição (${resp.status})`;
    try {
      const corpo = await resp.json();
      detalhe = corpo?.detail ?? corpo?.title ?? detalhe;
    } catch {
      // resposta sem corpo JSON
    }
    throw new ApiError(resp.status, detalhe);
  }

  if (resp.status === 204) return undefined as T;
  return (await resp.json()) as T;
}

function montarQuery(params: Record<string, string | number | boolean | undefined | null>): string {
  const busca = new URLSearchParams();
  for (const [chave, valor] of Object.entries(params)) {
    if (valor !== undefined && valor !== null && valor !== "") busca.set(chave, String(valor));
  }
  const texto = busca.toString();
  return texto ? `?${texto}` : "";
}

// --- Auth ---
export function login(body: { email: string; senha: string }): Promise<AuthResponse> {
  return request<AuthResponse>("/auth/login", { method: "POST", body: JSON.stringify(body) });
}

// --- Dashboard / integrações ---
export function buscarDashboard(): Promise<DashboardAdmin> {
  return request<DashboardAdmin>("/admin/dashboard");
}

export function buscarIntegracoes(): Promise<IntegracaoAdmin[]> {
  return request<IntegracaoAdmin[]>("/admin/integracoes");
}

/** Perfis de candidato mais abertos no período (contagem feita no backend, não no GA). */
export function buscarMaisAcessados(dias: number): Promise<ResumoAcessos> {
  return request<ResumoAcessos>(`/admin/metricas/mais-acessados${montarQuery({ dias, limite: 10 })}`);
}

/** De onde vem a audiência (país/UF/cidade). Agregado por dia, sem IP. */
export function buscarRegioes(dias: number): Promise<AcessosPorRegiao> {
  return request<AcessosPorRegiao>(`/admin/metricas/regioes${montarQuery({ dias })}`);
}

export function buscarSerieUso(dias: number): Promise<SerieUso> {
  return request<SerieUso>(`/admin/metricas/serie-uso${montarQuery({ dias })}`);
}

export function buscarFunilPublicacao(): Promise<FunilPublicacao> {
  return request<FunilPublicacao>("/admin/metricas/funil-publicacao");
}

export function buscarCobertura(): Promise<CoberturaDados> {
  return request<CoberturaDados>("/admin/metricas/cobertura");
}

/** Drill-down: quem são os publicados que faltam determinado dado. */
export function buscarFaltantes(
  chave: string,
  pagina = 1,
  tamanho = 20,
): Promise<PagedResult<Faltante>> {
  return request<PagedResult<Faltante>>(
    `/admin/metricas/cobertura/${chave}/faltantes${montarQuery({ pagina, tamanho })}`,
  );
}

export function buscarSaudeScoring(): Promise<SaudeScoring> {
  return request<SaudeScoring>("/admin/metricas/scoring");
}

export function buscarSaudeOperacional(): Promise<SaudeOperacional> {
  return request<SaudeOperacional>("/admin/metricas/operacao");
}

export function buscarExecucoes(limite = 50): Promise<ExecucaoLog[]> {
  return request<ExecucaoLog[]>(`/admin/execucoes${montarQuery({ limite })}`);
}

export function executarIntegracao(tipo: string): Promise<void> {
  return request<void>(`/admin/integracoes/${tipo}/executar`, { method: "POST" });
}

export function recalcularScores(params: {
  limite?: number;
  somenteSemScore?: boolean;
  candidaturaId?: string;
  somenteComAtividade?: boolean;
} = {}): Promise<void> {
  return request<void>(`/admin/scores/recalcular${montarQuery(params)}`, { method: "POST" });
}

export function classificarPartidos(): Promise<void> {
  return request<void>("/admin/partidos/classificar", { method: "POST" });
}

export function aplicarBasePartido(): Promise<void> {
  return request<void>("/admin/scores/aplicar-base", { method: "POST" });
}

// --- Curadoria de candidaturas ---
export function listarCandidaturasAdmin(filtros: {
  cargo?: string;
  uf?: string;
  q?: string;
  pagina?: number;
  tamanho?: number;
}): Promise<PagedResult<CandidaturaAdmin>> {
  return request<PagedResult<CandidaturaAdmin>>(`/admin/candidaturas${montarQuery(filtros)}`);
}

// Detalhe completo (perfil + scores c/ justificativa) e atividade legislativa.
// Endpoints públicos em /candidaturas; o admin os consome via proxy same-origin.
export function obterCandidatura(id: string): Promise<CandidaturaDetalhe> {
  return request<CandidaturaDetalhe>(`/candidaturas/${id}`);
}

export function obterAtividade(id: string): Promise<AtividadeLegislativa> {
  return request<AtividadeLegislativa>(`/candidaturas/${id}/atividade`);
}

// --- Fontes de scraping (por candidatura → político) ---
export function listarFontes(candidaturaId: string): Promise<FonteScraping[]> {
  return request<FonteScraping[]>(`/admin/candidaturas/${candidaturaId}/fontes`);
}
export function criarFonte(candidaturaId: string, conteudo: string, rotulo?: string): Promise<FonteScraping> {
  return request<FonteScraping>(`/admin/candidaturas/${candidaturaId}/fontes`, {
    method: "POST",
    body: JSON.stringify({ conteudo, rotulo }),
  });
}
export function editarFonte(
  fonteId: string,
  body: { rotulo?: string; conteudo?: string },
): Promise<FonteScraping> {
  return request<FonteScraping>(`/admin/fontes/${fonteId}`, { method: "PUT", body: JSON.stringify(body) });
}
export function removerFonte(fonteId: string): Promise<unknown> {
  return request(`/admin/fontes/${fonteId}`, { method: "DELETE" });
}
export function definirNumeroUrna(candidaturaId: string, numeroUrna: number | null): Promise<unknown> {
  return request(`/admin/candidaturas/${candidaturaId}/numero`, {
    method: "PUT",
    body: JSON.stringify({ numeroUrna }),
  });
}

// Dispara a análise IA em background (202). A conclusão é detectada por polling do detalhe
// (campo analisadoEm); as métricas ficam em analiseTokens/analiseDuracaoMs.
export function analisarCandidatura(id: string): Promise<{ mensagem: string }> {
  return request<{ mensagem: string }>(`/admin/candidaturas/${id}/analisar`, { method: "POST" });
}

export function definirPublicacao(id: string, publicado: boolean): Promise<unknown> {
  return request(`/admin/candidaturas/${id}/publicacao${montarQuery({ publicado })}`, {
    method: "POST",
  });
}

export function definirPublicacaoEmMassa(params: {
  publicado: boolean;
  cargo?: string;
  uf?: string;
  origem?: string;
}): Promise<{ afetados: number }> {
  return request(`/admin/candidaturas/publicacao${montarQuery(params)}`, { method: "POST" });
}

// --- Partidos (leitura pública + CRUD admin) ---
export function listarPartidos(): Promise<Partido[]> {
  return request<Partido[]>("/partidos");
}

export function criarPartido(body: Partial<Partido>): Promise<Partido> {
  return request<Partido>("/admin/partidos", { method: "POST", body: JSON.stringify(body) });
}

export function atualizarPartido(id: string, body: Partial<Partido>): Promise<Partido> {
  return request<Partido>(`/admin/partidos/${id}`, { method: "PUT", body: JSON.stringify(body) });
}

export function removerPartido(id: string): Promise<void> {
  return request<void>(`/admin/partidos/${id}`, { method: "DELETE" });
}

export function rasparProgramaPartido(id: string): Promise<Partido> {
  return request<Partido>(`/admin/partidos/${id}/raspar-programa`, { method: "POST" });
}

// --- Categorias e perguntas ---
export function listarCategorias(): Promise<Categoria[]> {
  return request<Categoria[]>("/categorias");
}

export function listarPerguntas(): Promise<Pergunta[]> {
  // Endpoint admin: inclui perguntas INATIVAS e expõe peso/direção/ordem/ativa
  // (o /quiz/perguntas público só traz as ativas, como o site principal consome).
  return request<Pergunta[]>("/admin/perguntas");
}

export function salvarPergunta(id: string | null, body: Partial<Pergunta>): Promise<Pergunta> {
  return id
    ? request<Pergunta>(`/admin/perguntas/${id}`, { method: "PUT", body: JSON.stringify(body) })
    : request<Pergunta>("/admin/perguntas", { method: "POST", body: JSON.stringify(body) });
}

export function removerPergunta(id: string): Promise<void> {
  return request<void>(`/admin/perguntas/${id}`, { method: "DELETE" });
}

export function buscarMetricasPerguntas(): Promise<PerguntaMetrica[]> {
  return request<PerguntaMetrica[]>("/admin/perguntas/metricas");
}

// --- Prompts de IA ---
export function listarPrompts(): Promise<PromptIa[]> {
  return request<PromptIa[]>("/admin/prompts");
}

export function atualizarPrompt(chave: string, conteudo: string): Promise<PromptIa> {
  return request<PromptIa>(`/admin/prompts/${chave}`, {
    method: "PUT",
    body: JSON.stringify({ conteudo }),
  });
}

// --- Usuários / RBAC (item 7) ---
export function listarUsuarios(filtros: {
  q?: string;
  papel?: string;
  pagina?: number;
  tamanho?: number;
}): Promise<PagedResult<UsuarioAdmin>> {
  return request<PagedResult<UsuarioAdmin>>(`/admin/usuarios${montarQuery(filtros)}`);
}

export function listarCatalogoPermissoes(): Promise<PermissaoCatalogo[]> {
  return request<PermissaoCatalogo[]>("/admin/usuarios/permissoes");
}

export function permissoesDoUsuario(id: string): Promise<string[]> {
  return request<string[]>(`/admin/usuarios/${id}/permissoes`);
}

export function definirPermissoes(id: string, chaves: string[]): Promise<void> {
  return request<void>(`/admin/usuarios/${id}/permissoes`, {
    method: "PUT",
    body: JSON.stringify({ chaves }),
  });
}

export function alterarPapel(id: string, papel: string): Promise<void> {
  return request<void>(`/admin/usuarios/${id}/papel`, {
    method: "PUT",
    body: JSON.stringify({ papel }),
  });
}

export function revogarAdmin(id: string): Promise<void> {
  return request<void>(`/admin/usuarios/${id}`, { method: "DELETE" });
}

export function listarConvites(): Promise<ConviteAdmin[]> {
  return request<ConviteAdmin[]>("/admin/usuarios/convites");
}

export function criarConvite(body: { nome: string; email: string; papel: string }): Promise<ConviteCriado> {
  return request<ConviteCriado>("/admin/usuarios/convites", { method: "POST", body: JSON.stringify(body) });
}

export function revogarConvite(id: string): Promise<void> {
  return request<void>(`/admin/usuarios/convites/${id}`, { method: "DELETE" });
}

// --- Convite público (definir senha, item 7.5) ---
export function validarConvite(token: string): Promise<{ nome: string; email: string; papel: string }> {
  return request(`/auth/convite/${encodeURIComponent(token)}`);
}

export function aceitarConvite(body: { token: string; senha: string }): Promise<AuthResponse> {
  return request<AuthResponse>("/auth/convite/aceitar", { method: "POST", body: JSON.stringify(body) });
}
