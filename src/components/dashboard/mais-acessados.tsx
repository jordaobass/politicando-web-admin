import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { Eye, EyeOff } from "lucide-react";

import { buscarMaisAcessados } from "@/lib/api";
import { formatarNumero } from "@/lib/format";
import { CARGOS } from "@/lib/types";
import { Card, CardContent } from "@/components/ui/card";
import { Select } from "@/components/ui/select";
import { Carregando, ErroEstado, Vazio } from "@/components/ui/estados";

const PERIODOS = [
  { valor: 7, rotulo: "Últimos 7 dias" },
  { valor: 30, rotulo: "Últimos 30 dias" },
  { valor: 90, rotulo: "Últimos 90 dias" },
];

const rotuloCargo = (cargo: string) => CARGOS.find((c) => c.valor === cargo)?.rotulo ?? cargo;

/**
 * Perfis de candidato mais abertos no período.
 *
 * A contagem vem do backend, não do Google Analytics: o GA só carrega depois do "Aceitar
 * todos" no banner de cookies, então mediria apenas quem consente — e o ranking sairia
 * enviesado sem que desse para estimar o quanto. Aqui todo acesso conta, e nada sobre o
 * visitante é guardado.
 */
export function MaisAcessados() {
  const [dias, setDias] = useState(7);
  const { data, isLoading, isError } = useQuery({
    queryKey: ["mais-acessados", dias],
    queryFn: () => buscarMaisAcessados(dias),
  });

  const maximo = data?.maisAcessados[0]?.acessos ?? 0;

  return (
    <Card>
      <CardContent className="space-y-4 p-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h3 className="text-sm font-semibold">Perfis mais acessados</h3>
            {data && (
              <p className="text-xs text-muted-foreground">
                {formatarNumero(data.totalAcessos)} aberturas em{" "}
                {formatarNumero(data.candidatosAcessados)} perfis distintos.
              </p>
            )}
          </div>
          <Select
            className="h-8 w-auto"
            value={dias}
            onChange={(e) => setDias(Number(e.target.value))}
            aria-label="Período do ranking"
          >
            {PERIODOS.map((p) => (
              <option key={p.valor} value={p.valor}>
                {p.rotulo}
              </option>
            ))}
          </Select>
        </div>

        {isLoading && <Carregando />}
        {isError && <ErroEstado mensagem="Falha ao carregar o ranking de acessos." />}
        {data && data.maisAcessados.length === 0 && (
          <Vazio texto="Nenhum acesso registrado no período." />
        )}

        {data && data.maisAcessados.length > 0 && (
          <ol className="-mx-2 divide-y">
            {data.maisAcessados.map((c, i) => (
              <li key={c.candidaturaId}>
                <Link
                  to={`/candidaturas/${c.candidaturaId}`}
                  className="flex items-center gap-3 rounded-md px-2 py-2.5 transition-colors hover:bg-muted/50"
                >
                  <span className="w-4 shrink-0 text-sm font-semibold tabular-nums text-muted-foreground">
                    {i + 1}
                  </span>

                  <span className="min-w-0 flex-1">
                    <span className="flex items-center gap-2">
                      <span className="truncate text-sm font-medium">{c.nomeUrna}</span>
                      {/* Despublicado com muito acesso é justamente o caso que o curador
                          precisa ver — por isso o ranking não filtra por visibilidade. */}
                      {c.publicado ? (
                        <Eye className="size-3.5 shrink-0 text-muted-foreground/60" aria-label="Publicado" />
                      ) : (
                        <EyeOff className="size-3.5 shrink-0 text-warning" aria-label="Despublicado" />
                      )}
                    </span>
                    <span className="block truncate text-xs text-muted-foreground">
                      {[c.partidoSigla, rotuloCargo(c.cargo), c.uf].filter(Boolean).join(" · ")}
                    </span>
                    {/* Barra proporcional ao líder: dá a escala relativa sem eixo nem legenda. */}
                    <span className="mt-1.5 block h-1 w-full overflow-hidden rounded-full bg-muted">
                      <span
                        className="block h-full rounded-full"
                        style={{
                          width: `${maximo > 0 ? (c.acessos / maximo) * 100 : 0}%`,
                          background: "var(--grafico-1)",
                        }}
                      />
                    </span>
                  </span>

                  <span className="shrink-0 text-sm font-semibold tabular-nums">
                    {formatarNumero(c.acessos)}
                  </span>
                </Link>
              </li>
            ))}
          </ol>
        )}
      </CardContent>
    </Card>
  );
}
