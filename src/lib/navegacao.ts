import {
  LayoutDashboard,
  Users,
  Vote,
  Flag,
  ListChecks,
  Plug,
  Sparkles,
  type LucideIcon,
} from "lucide-react";

import { PROMPTS_IA_HABILITADO, INTEGRACOES_HABILITADO } from "@/lib/features";

export interface ItemNav {
  para: string;
  rotulo: string;
  icone: LucideIcon;
  /** `end` do NavLink: casa a rota exata (evita o Dashboard "/" ficar sempre ativo). */
  fim: boolean;
  /** Permissão granular exigida (undefined = qualquer staff). */
  perm?: string;
}

// Fonte ÚNICA de verdade da navegação: o menu (shell) e o gating por rota (App/auth)
// derivam daqui — mudar um item aqui reflete nos dois sem duplicar o mapa rota→permissão.
export const ITENS_NAV: ItemNav[] = [
  { para: "/", rotulo: "Dashboard", icone: LayoutDashboard, fim: true },
  { para: "/candidaturas", rotulo: "Candidaturas", icone: Vote, fim: false, perm: "candidaturas.gerir" },
  { para: "/partidos", rotulo: "Partidos", icone: Flag, fim: false, perm: "partidos.gerir" },
  { para: "/perguntas", rotulo: "Perguntas", icone: ListChecks, fim: false, perm: "perguntas.gerir" },
  // Prompts da IA só entra na navegação quando a feature está habilitada (ver features.ts).
  ...(PROMPTS_IA_HABILITADO
    ? [{ para: "/prompts", rotulo: "Prompts IA", icone: Sparkles, fim: false, perm: "prompts.gerir" }]
    : []),
  { para: "/usuarios", rotulo: "Usuários", icone: Users, fim: false, perm: "usuarios.gerir" },
  // Integrações só entra na navegação quando a feature está habilitada (ver features.ts).
  ...(INTEGRACOES_HABILITADO
    ? [{ para: "/integracoes", rotulo: "Integrações", icone: Plug, fim: false, perm: "scoring.executar" }]
    : []),
];

/**
 * Encontra o item de navegação "dono" de um caminho — o de maior prefixo que casa
 * (ex.: `/candidaturas/123` herda a permissão de `/candidaturas`). `/` só casa exato.
 */
export function itemDaRota(pathname: string): ItemNav | undefined {
  return ITENS_NAV
    .filter((i) =>
      i.para === "/" ? pathname === "/" : pathname === i.para || pathname.startsWith(`${i.para}/`),
    )
    .sort((a, b) => b.para.length - a.para.length)[0];
}
