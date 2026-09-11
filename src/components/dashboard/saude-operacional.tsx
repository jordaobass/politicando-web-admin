import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { AlertTriangle, CheckCircle2, ChevronDown, CircleSlash, XCircle } from "lucide-react";

import { buscarSaudeOperacional } from "@/lib/api";
import { formatarDataHora } from "@/lib/format";
import { Card, CardContent } from "@/components/ui/card";
import { Carregando, ErroEstado } from "@/components/ui/estados";

/** Acima disso a integração é tratada como parada, não como "rodou faz tempo". */
const DIAS_PARA_PARADA = 30;

const ESTILO_STATUS: Record<string, string> = {
  Sucesso: "text-success",
  Parcial: "text-warning",
  Erro: "text-destructive",
};

/**
 * Semáforo das fontes de dados.
 *
 * Fica recolhido quando está tudo certo e só se abre sozinho quando há o que olhar: painel de
 * operação que grita todo dia deixa de ser lido no dia em que importa.
 */
export function SaudeOperacional() {
  const { data, isLoading, isError } = useQuery({
    queryKey: ["saude-operacional"],
    queryFn: buscarSaudeOperacional,
  });

  const problemas = data ? data.comErro + data.nuncaExecutaram + data.parciais : 0;
  const [aberto, setAberto] = useState(false);
  const expandido = aberto || problemas > 0;

  return (
    <Card>
      <CardContent className="space-y-3 p-5">
        <button
          type="button"
          onClick={() => setAberto((v) => !v)}
          className="flex w-full items-center justify-between gap-3 text-left"
          aria-expanded={expandido}
        >
          <span>
            <span className="block text-sm font-semibold">Integrações</span>
            {data && (
              <span className="block text-xs text-muted-foreground">
                {problemas === 0
                  ? `${data.total} fontes, todas saudáveis.`
                  : `${problemas} de ${data.total} pedem atenção · ${data.errosUltimos30Dias} erro(s) em 30 dias.`}
              </span>
            )}
          </span>
          <ChevronDown
            className={`size-4 shrink-0 text-muted-foreground transition-transform ${expandido ? "rotate-180" : ""}`}
            aria-hidden="true"
          />
        </button>

        {isLoading && <Carregando />}
        {isError && <ErroEstado mensagem="Falha ao carregar a saúde das integrações." />}

        {data && expandido && (
          <ul className="divide-y rounded-md border text-sm">
            {data.integracoes.map((i) => {
              const nunca = i.ultimaExecucaoEm === null;
              const parada = !nunca && i.diasParada > DIAS_PARA_PARADA;
              return (
                <li key={i.nome} className="flex items-center justify-between gap-3 px-3 py-2">
                  <span className="flex min-w-0 items-center gap-2">
                    <Icone status={i.status} nunca={nunca} parada={parada} />
                    <span className="truncate">{i.nome}</span>
                  </span>
                  <span className="shrink-0 text-xs text-muted-foreground">
                    {nunca
                      ? "nunca executou"
                      : parada
                        ? `parada há ${i.diasParada} dias`
                        : formatarDataHora(i.ultimaExecucaoEm)}
                  </span>
                </li>
              );
            })}
          </ul>
        )}

        {expandido && (
          <Link to="/integracoes" className="inline-block text-xs font-medium text-primary hover:underline">
            Abrir integrações →
          </Link>
        )}
      </CardContent>
    </Card>
  );
}

function Icone({
  status,
  nunca,
  parada,
}: {
  status: string | null;
  nunca: boolean;
  parada: boolean;
}) {
  if (nunca) return <CircleSlash className="size-4 shrink-0 text-muted-foreground" aria-label="Nunca executou" />;
  if (status === "Erro") return <XCircle className="size-4 shrink-0 text-destructive" aria-label="Erro" />;
  if (parada || status === "Parcial")
    return <AlertTriangle className="size-4 shrink-0 text-warning" aria-label="Atenção" />;
  return <CheckCircle2 className={`size-4 shrink-0 ${ESTILO_STATUS[status ?? ""] ?? "text-muted-foreground"}`} aria-label="Ok" />;
}
