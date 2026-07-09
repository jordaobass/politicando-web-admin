import { NavLink, Outlet } from "react-router-dom";
import {
  LayoutDashboard,
  Users,
  Vote,
  Flag,
  ListChecks,
  Plug,
  Sparkles,
  LogOut,
} from "lucide-react";

import { cn } from "@/lib/utils";
import { useAuth } from "@/lib/auth";
import { PROMPTS_IA_HABILITADO, INTEGRACOES_HABILITADO } from "@/lib/features";
import { Button } from "@/components/ui/button";

// `perm` = permissão granular exigida para ver o item (undefined = qualquer staff).
const ITENS = [
  { para: "/", rotulo: "Dashboard", icone: LayoutDashboard, fim: true, perm: undefined },
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

export function AdminShell() {
  const { usuario, sair, temPermissao } = useAuth();
  const itens = ITENS.filter((i) => !i.perm || temPermissao(i.perm));

  return (
    <div className="flex h-full min-h-screen">
      <aside className="flex w-60 shrink-0 flex-col bg-sidebar text-sidebar-foreground">
        <div className="flex h-14 items-center gap-2 px-5 text-lg font-semibold text-white">
          <span className="text-xl">🗳️</span> Politicando
        </div>
        <nav className="flex-1 space-y-1 p-3">
          {itens.map((item) => (
            <NavLink
              key={item.para}
              to={item.para}
              end={item.fim}
              className={({ isActive }) =>
                cn(
                  "flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors",
                  isActive
                    ? "bg-sidebar-accent text-white"
                    : "text-sidebar-foreground hover:bg-sidebar-accent/60 hover:text-white",
                )
              }
            >
              <item.icone className="size-4" />
              {item.rotulo}
            </NavLink>
          ))}
        </nav>
        <div className="border-t border-white/10 p-3">
          <div className="mb-2 px-2 text-xs text-sidebar-foreground/70">
            <p className="truncate font-medium text-white">{usuario?.nome}</p>
            <p className="truncate">{usuario?.email}</p>
          </div>
          <Button
            variant="ghost"
            className="w-full justify-start text-sidebar-foreground hover:bg-sidebar-accent/60 hover:text-white"
            onClick={sair}
          >
            <LogOut className="size-4" /> Sair
          </Button>
        </div>
      </aside>

      <main className="flex-1 overflow-y-auto bg-background">
        <div className="mx-auto max-w-7xl px-6 py-8">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
