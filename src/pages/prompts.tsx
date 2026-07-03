import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { ChevronRight } from "lucide-react";

import { listarPrompts } from "@/lib/api";
import { formatarDataHora } from "@/lib/format";
import { Cabecalho } from "@/components/layout/cabecalho";
import { Card, CardContent } from "@/components/ui/card";
import { Carregando, ErroEstado } from "@/components/ui/estados";

export default function PromptsPage() {
  const { data, isLoading, isError } = useQuery({ queryKey: ["prompts"], queryFn: listarPrompts });

  return (
    <>
      <Cabecalho
        titulo="Prompts da IA"
        descricao="Instruções de sistema do scoring (um por cargo + partido). Clique para editar."
      />
      {isLoading && <Carregando />}
      {isError && <ErroEstado mensagem="Falha ao carregar os prompts." />}
      {data && (
        <Card>
          <CardContent className="divide-y p-0">
            {data.map((p) => (
              <Link
                key={p.chave}
                to={`/prompts/${p.chave}`}
                className="flex items-center justify-between gap-3 px-5 py-4 transition-colors hover:bg-muted/50"
              >
                <div className="min-w-0">
                  <p className="font-medium">{p.nome}</p>
                  {p.descricao && <p className="truncate text-sm text-muted-foreground">{p.descricao}</p>}
                </div>
                <div className="flex shrink-0 items-center gap-3 text-xs text-muted-foreground">
                  <span>{p.atualizadoEm ? `Editado ${formatarDataHora(p.atualizadoEm)}` : "Padrão"}</span>
                  <ChevronRight className="size-4" />
                </div>
              </Link>
            ))}
          </CardContent>
        </Card>
      )}
    </>
  );
}
