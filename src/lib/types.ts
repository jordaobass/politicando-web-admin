// Tipos que espelham os contratos da API .NET (base /api).

export type Papel = "Usuario" | "Admin";

export interface UsuarioSessao {
  id: string;
  nome: string;
  email: string;
  papel: Papel;
  fotoUrl: string | null;
}

export interface AuthResponse {
  token: string;
  usuario: UsuarioSessao;
}

export interface PagedResult<T> {
  itens: T[];
  total: number;
  pagina: number;
  tamanho: number;
}

// --- Cargos / origens (espelham os enums do backend) ---
export const CARGOS = [
  { valor: "Presidente", rotulo: "Presidente", uf: "BR" },
  { valor: "Governador", rotulo: "Governador", uf: "UF" },
  { valor: "Senador", rotulo: "Senador", uf: "UF" },
  { valor: "DeputadoFederal", rotulo: "Dep. Federal", uf: "UF" },
  { valor: "DeputadoEstadual", rotulo: "Dep. Estadual", uf: "UF" },
  { valor: "DeputadoDistrital", rotulo: "Dep. Distrital", uf: "UF" },
] as const;

export type Cargo = (typeof CARGOS)[number]["valor"];

export const ORIGENS = [
  { valor: "Mandatario", rotulo: "Mandatário" },
  { valor: "TseHistorico", rotulo: "Histórico TSE" },
  { valor: "PreCandidato", rotulo: "Pré-candidato" },
  { valor: "TseOficial", rotulo: "Oficial TSE" },
] as const;

export type Origem = (typeof ORIGENS)[number]["valor"];

export const UFS = [
  "AC", "AL", "AP", "AM", "BA", "CE", "DF", "ES", "GO", "MA",
  "MT", "MS", "MG", "PA", "PB", "PR", "PE", "PI", "RJ", "RN",
  "RS", "RO", "RR", "SC", "SP", "SE", "TO",
] as const;

// --- Dashboard / integrações ---
export interface DashboardAdmin {
  totalCandidatos: number;
  candidatosSemFoto: number;
  quizCompletados: number;
  scoresCalculados: number;
  comparacoes: number;
  usuarios: number;
  categorias: number;
}

export interface IntegracaoAdmin {
  id: string;
  nome: string;
  tipo: string;
  ativa: boolean;
  ultimoStatus: string | null;
  ultimaExecucaoEm: string | null;
  proximaExecucaoEm: string | null;
}

export interface ExecucaoLog {
  id: string;
  integracao: string;
  iniciadoEm: string;
  finalizadoEm: string | null;
  status: string;
  registrosProcessados: number;
  registrosComErro: number;
  mensagem: string | null;
}

// --- Curadoria de candidaturas ---
export interface ScoreResumo {
  categoria: string;
  slug: string;
  /** Posição no eixo (0..100, esq↔dir) — o que casa com o quiz. */
  posicao: number | null;
  /** Engajamento (0..5): o quanto o candidato prioriza o tema. */
  engajamento: number | null;
}

export interface CandidaturaAdmin {
  id: string;
  nomeUrna: string;
  partidoSigla: string | null;
  partidoLogoUrl?: string | null;
  cargo: string;
  uf: string;
  numeroUrna: number | null;
  fotoUrl: string | null;
  origem: Origem;
  publicado?: boolean;
  scores: ScoreResumo[];
}

// --- Detalhe completo da candidatura (perfil + scores com justificativa) ---
export interface PoliticoDetalhe {
  id: string;
  nomeCivil: string;
  nomeUrna: string;
  fotoUrl: string | null;
  biografia: string | null;
  ocupacao: string | null;
  escolaridade: string | null;
  instagram: string | null;
  twitter: string | null;
  siteOficial: string | null;
  dataNascimento: string | null;
  sexo: string | null;
  ufNaturalidade: string | null;
}

export interface ScoreDetalhe {
  categoriaId: string;
  categoria: string;
  /** Posição no eixo (0..100, esq↔dir) — entra no cálculo do match. */
  posicao: number | null;
  /** Engajamento (0..5): o quanto o candidato prioriza o tema. */
  engajamento: number | null;
  /** Síntese curta da posição (texto). */
  posicaoSintese: string | null;
  justificativa: string | null;
  /** Confiança da IA (0..1) — quão sólida é a evidência. */
  confianca: number;
}

export interface CandidaturaDetalhe {
  id: string;
  politico: PoliticoDetalhe;
  partidoSigla: string | null;
  partidoLogoUrl: string | null;
  partidoNome: string | null;
  cargo: string;
  uf: string;
  origem: Origem;
  situacao: string;
  propostasResumo: string | null;
  scores: ScoreDetalhe[];
  numeroUrna: number | null;
  financiamentoTotal: number | null;
  votosRecebidos: number | null;
  eleito: boolean;
  analisadoEm: string | null;
  observacaoIa: string | null;
  analiseTokens: number | null;
  analiseDuracaoMs: number | null;
}

// --- Atividade legislativa ---
export interface ResumoAtividade {
  projetosTotal: number;
  projetosAprovados: number;
  projetosEmTramitacao: number;
  votacoes: number;
  relatorias: number;
  presencaPercentual: number | null;
}

export interface Proposicao {
  idExterno: string;
  rotulo: string;
  tipo: string;
  numero: number;
  ano: number;
  ementa: string;
  tema: string | null;
  dataApresentacao: string | null;
  status: string;
  situacao: string | null;
  urlPortal: string;
  urlInteiroTeor: string | null;
  legislatura: number;
}

export interface Voto {
  descricao: string;
  tema: string | null;
  data: string | null;
  voto: string;
  urlPortal: string;
  legislatura: number;
}

export interface PresencaMes {
  mes: string;
  percentual: number;
}

export interface Presenca {
  ano: number;
  percentual: number;
  sessoesTotais: number;
  sessoesPresente: number;
  porMes: PresencaMes[];
}

export interface GabineteTipo {
  tipo: string;
  total: number;
  quantidade: number;
}

export interface GabineteMes {
  mes: string;
  total: number;
}

export interface Gabinete {
  ano: number;
  total: number;
  porTipo: GabineteTipo[];
  porMes: GabineteMes[];
  urlPortal: string | null;
}

export interface AtividadeLegislativa {
  resumo: ResumoAtividade;
  projetos: Proposicao[];
  votacoes: Voto[];
  relatorias: Proposicao[];
  presenca: Presenca | null;
  gabinete: Gabinete | null;
  portalNome: string | null;
  portalUrl: string | null;
}

// --- Análise IA (resultado unitário) ---
export interface AnaliseResultado {
  sucesso: boolean;
  mensagem: string;
  categorias: number;
  tokensEntrada: number;
  tokensSaida: number;
  tokensTotal: number;
  duracaoMs: number;
}

// --- Fontes de scraping (evidência p/ a IA) ---
export interface FonteScraping {
  id: string;
  url: string;
  rotulo: string | null;
  conteudo: string | null;
  status: string; // Pendente | Ok | Erro
  erro: string | null;
  raspadoEm: string | null;
}

// --- Prompts de IA ---
export interface PromptIa {
  chave: string;
  nome: string;
  descricao: string | null;
  conteudo: string;
  padrao: string | null;
  atualizadoEm: string | null;
}

// --- Partidos ---
export interface Partido {
  id: string;
  sigla: string;
  nome: string;
  numero: number | null;
  logoUrl: string | null;
  siteOficial?: string | null;
  programaUrl?: string | null;
  programaResumo?: string | null;
}

// --- Categorias e perguntas ---
export interface Categoria {
  id: string;
  nome: string;
  slug: string;
  icone: string | null;
  descricao: string | null;
  poloMin?: string | null;
  poloMax?: string | null;
  ordem?: number;
  ativa?: boolean;
}

export interface Pergunta {
  id: string;
  texto: string;
  categoriaId: string;
  categoria: string;
  peso?: number;
  direcaoPositiva?: boolean;
  ordem: number;
  ativa?: boolean;
}

/** Métrica de resposta por pergunta (distribuição -2..+2 + taxa de pulo). */
export interface PerguntaMetrica {
  perguntaId: string;
  texto: string;
  categoria: string;
  totalRespostas: number;
  distribuicao: Record<string, number>; // "-2".."2" -> contagem
  taxaPulo: number; // 0..1
}

// --- Usuários ---
export interface UsuarioAdmin {
  id: string;
  nome: string;
  email: string;
  papel: Papel;
  provedor?: string;
  criadoEm?: string;
  quizzes?: number;
}
