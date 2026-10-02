import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  LabelList,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { buscarFunilPublicacao } from "@/lib/api";
import { formatarNumero } from "@/lib/format";
import { CARGOS } from "@/lib/types";
import { Card, CardContent } from "@/components/ui/card";
import { Carregando, ErroEstado } from "@/components/ui/estados";

const rotuloCargo = (cargo: string) => CARGOS.find((c) => c.valor === cargo)?.rotulo ?? cargo;

/** O recharts tipa o alvo do clique de forma genérica; só o campo `cargo` interessa aqui. */
function cargoDoClique(alvo: unknown): string | null {
  const payload = (alvo as { payload?: { cargo?: string } })?.payload;
  return payload?.cargo ?? null;
}

/**
 * Quanto da base já passou pela curadoria e está no ar, por cargo.
 *
 * É a métrica que mede a distância entre o que o admin vê e o que o eleitor vê. Clicar numa
 * barra abre a listagem já filtrada por aquele cargo — o gráfico aponta o trabalho, e o
 * clique leva direto a ele.
 */
export function FunilPublicacao() {
  const navegar = useNavigate();
  const { data, isLoading, isError } = useQuery({
    queryKey: ["funil-publicacao"],
    queryFn: buscarFunilPublicacao,
  });

  // Eixo em PERCENTUAL, não em volume: Dep. Federal tem ~7.700 candidaturas e Presidente 16 —
  // na escala absoluta as barras dos cargos menores somem, e a pergunta aqui é "quanto deste
  // cargo já está no ar", não "qual cargo é maior". O volume vai no rótulo.
  const dados = data?.porCargo.map((c) => {
    const pct = c.total > 0 ? Math.round((c.publicados / c.total) * 100) : 0;
    return {
      ...c,
      rotulo: rotuloCargo(c.cargo),
      pctPublicado: pct,
      pctOculto: 100 - pct,
      legenda: `${formatarNumero(c.publicados)}/${formatarNumero(c.total)}`,
    };
  });

  const percentualGeral =
    data && data.total > 0 ? Math.round((data.publicados / data.total) * 100) : 0;

  return (
    <Card>
      <CardContent className="space-y-4 p-5">
        <div>
          <h3 className="text-sm font-semibold">Publicação por cargo</h3>
          {data && (
            <p className="text-xs text-muted-foreground">
              {formatarNumero(data.publicados)} de {formatarNumero(data.total)} candidaturas no ar
              ({percentualGeral}%). O eleitor só vê a parte publicada.
            </p>
          )}
        </div>

        {isLoading && <Carregando />}
        {isError && <ErroEstado mensagem="Falha ao carregar o funil de publicação." />}

        {dados && (
          <>
            <div className="h-56 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={dados}
                  layout="vertical"
                  margin={{ top: 0, right: 86, bottom: 0, left: 8 }}
                  barCategoryGap={10}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" horizontal={false} />
                  <XAxis
                    type="number"
                    domain={[0, 100]}
                    ticks={[0, 25, 50, 75, 100]}
                    tickFormatter={(v) => `${v}%`}
                    tick={{ fontSize: 11, fill: "var(--muted-foreground)" }}
                    tickLine={false}
                    axisLine={false}
                  />
                  <YAxis
                    type="category"
                    dataKey="rotulo"
                    tick={{ fontSize: 11, fill: "var(--muted-foreground)" }}
                    tickLine={false}
                    axisLine={false}
                    width={92}
                  />
                  <Tooltip
                    cursor={{ fill: "var(--muted)" }}
                    formatter={(valor, nome, item) => {
                      const d = item?.payload as { publicados: number; total: number } | undefined;
                      return nome === "Publicados"
                        ? [`${valor}% (${formatarNumero(d?.publicados ?? 0)} de ${formatarNumero(d?.total ?? 0)})`, "Publicados"]
                        : [`${valor}%`, "Ocultos"];
                    }}
                    contentStyle={{
                      background: "var(--card)",
                      border: "1px solid var(--border)",
                      borderRadius: "var(--radius-md)",
                      fontSize: 12,
                    }}
                  />
                  {/* Empilhado: publicado + oculto = total. Assim a barra inteira é a base e a
                      parte colorida é o que chegou ao eleitor. */}
                  <Bar
                    dataKey="pctPublicado"
                    name="Publicados"
                    stackId="base"
                    fill="var(--grafico-1)"
                    className="cursor-pointer"
                    onClick={(alvo) => {
                      const cargo = cargoDoClique(alvo);
                      if (cargo) navegar(`/candidaturas?cargo=${cargo}`);
                    }}
                  />
                  <Bar
                    dataKey="pctOculto"
                    name="Ocultos"
                    stackId="base"
                    fill="var(--grafico-vazio)"
                    radius={[0, 4, 4, 0]}
                    className="cursor-pointer"
                    onClick={(alvo) => {
                      const cargo = cargoDoClique(alvo);
                      if (cargo) navegar(`/candidaturas?cargo=${cargo}`);
                    }}
                  >
                    <LabelList
                      dataKey="legenda"
                      position="right"
                      style={{ fontSize: 11, fill: "var(--muted-foreground)" }}
                    />
                    {dados.map((d) => (
                      <Cell key={d.cargo} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
            <p className="text-xs text-muted-foreground/70">
              Clique numa barra para abrir a listagem daquele cargo.
            </p>
          </>
        )}
      </CardContent>
    </Card>
  );
}
