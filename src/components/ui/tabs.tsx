import * as React from "react";

import { cn } from "@/lib/utils";

export interface Aba {
  id: string;
  label: React.ReactNode;
  conteudo: React.ReactNode;
}

/** Abas controladas, sem dependência externa (botões + painel condicional). */
export function Tabs({ abas, inicial }: { abas: Aba[]; inicial?: string }) {
  const [ativa, setAtiva] = React.useState(inicial ?? abas[0]?.id);
  const atual = abas.find((a) => a.id === ativa) ?? abas[0];

  return (
    <div className="space-y-4">
      <div role="tablist" className="flex flex-wrap gap-1 border-b">
        {abas.map((a) => (
          <button
            key={a.id}
            type="button"
            role="tab"
            aria-selected={a.id === ativa}
            onClick={() => setAtiva(a.id)}
            className={cn(
              "-mb-px border-b-2 px-3 py-2 text-sm font-medium transition-colors",
              a.id === ativa
                ? "border-primary text-foreground"
                : "border-transparent text-muted-foreground hover:text-foreground",
            )}
          >
            {a.label}
          </button>
        ))}
      </div>
      <div role="tabpanel">{atual?.conteudo}</div>
    </div>
  );
}
