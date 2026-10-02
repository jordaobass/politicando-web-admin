import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Area,
  AreaChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { buscarSerieUso } from "@/lib/api";
import { formatarNumero } from "@/lib/format";
import type { PontoSerie } from "@/lib/types";
import { Card, CardContent } from "@/components/ui/card";
import { Select } from "@/components/ui/select";
import { Carregando, ErroEstado } from "@/components/ui/estados";

const PERIODOS = [
  { valor: 14, rotulo: "Últimos 14 dias" },
  { valor: 30, rotulo: "Últimos 30 dias" },
  { valor: 90, rotulo: "Últimos 90 dias" },
];

/** Séries do gráfico. A cor sai de variável CSS — nunca literal no componente. */
const SERIES = [
  { chave: "quizzesAnonimos", rotulo: "Quiz (anônimo)", cor: "var(--grafico-1)" },
  { chave: "quizzesLogados", rotulo: "Quiz (logado)", cor: "var(--grafico-2)" },
  { chave: "cadastros", rotulo: "Cadastros", cor: "var(--grafico-4)" },
  { chave: "comparacoes", rotulo: "Comparações", cor: "var(--grafico-3)" },
] as const;

const diaCurto = (iso: string) => {
  const [, mes, dia] = iso.split("-");
  return `${dia}/${mes}`;
};

const diaLongo = (iso: string) =>
  new Date(`${iso}T12:00:00Z`).toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "long",
    weekday: "short",
  });

/**
 * Pulso da plataforma: uso dia a dia.
 *
 * Clicar num dia fixa o detalhe abaixo do gráfico — o tooltip some quando o mouse sai, e
 * comparar dois dias exige poder parar num deles.
 */
export function GraficoUso() {
  const [dias, setDias] = useState(30);
  const [selecionado, setSelecionado] = useState<PontoSerie | null>(null);
  const { data, isLoading, isError } = useQuery({
    queryKey: ["serie-uso", dias],
    queryFn: () => buscarSerieUso(dias),
  });

  const totais = data?.pontos.reduce(
    (acc, p) => ({
      quizzes: acc.quizzes + p.quizzesAnonimos + p.quizzesLogados,
      cadastros: acc.cadastros + p.cadastros,
      comparacoes: acc.comparacoes + p.comparacoes,
    }),
    { quizzes: 0, cadastros: 0, comparacoes: 0 },
  );

  const detalhe = selecionado ?? data?.pontos.at(-1) ?? null;

  return (
    <section className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-sm font-semibold text-muted-foreground">Pulso da plataforma</h2>
          {totais && (
            <p className="text-xs text-muted-foreground/80">
              {formatarNumero(totais.quizzes)} quizzes · {formatarNumero(totais.cadastros)} cadastros ·{" "}
              {formatarNumero(totais.comparacoes)} comparações no período.
            </p>
          )}
        </div>
        <Select
          className="h-8 w-auto"
          value={dias}
          onChange={(e) => {
            setDias(Number(e.target.value));
            setSelecionado(null);
          }}
          aria-label="Período da série"
        >
          {PERIODOS.map((p) => (
            <option key={p.valor} value={p.valor}>
              {p.rotulo}
            </option>
          ))}
        </Select>
      </div>

      <Card>
        <CardContent className="space-y-4 p-5">
          {isLoading && <Carregando />}
          {isError && <ErroEstado mensagem="Falha ao carregar a série de uso." />}

          {data && (
            <>
              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart
                    data={data.pontos}
                    margin={{ top: 4, right: 8, bottom: 0, left: -18 }}
                    onClick={(evento: unknown) => {
                      // O recharts entrega o ponto clicado em activePayload; o tipo exportado
                      // não o declara, então a leitura é feita de forma defensiva.
                      const ponto = (evento as { activePayload?: { payload?: PontoSerie }[] })
                        ?.activePayload?.[0]?.payload;
                      if (ponto) setSelecionado(ponto);
                    }}
                  >
                    <defs>
                      {SERIES.map((s) => (
                        <linearGradient key={s.chave} id={`g-${s.chave}`} x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor={s.cor} stopOpacity={0.35} />
                          <stop offset="100%" stopColor={s.cor} stopOpacity={0.02} />
                        </linearGradient>
                      ))}
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                    <XAxis
                      dataKey="dia"
                      tickFormatter={diaCurto}
                      tick={{ fontSize: 11, fill: "var(--muted-foreground)" }}
                      tickLine={false}
                      axisLine={{ stroke: "var(--border)" }}
                      minTickGap={16}
                    />
                    <YAxis
                      tick={{ fontSize: 11, fill: "var(--muted-foreground)" }}
                      tickLine={false}
                      axisLine={false}
                      allowDecimals={false}
                      width={44}
                    />
                    <Tooltip
                      labelFormatter={(v) => diaLongo(String(v))}
                      formatter={(valor, nome) => [formatarNumero(Number(valor)), nome]}
                      contentStyle={{
                        background: "var(--card)",
                        border: "1px solid var(--border)",
                        borderRadius: "var(--radius-md)",
                        fontSize: 12,
                      }}
                    />
                    <Legend wrapperStyle={{ fontSize: 12 }} iconType="circle" />
                    {SERIES.map((s) => (
                      <Area
                        key={s.chave}
                        type="monotone"
                        dataKey={s.chave}
                        name={s.rotulo}
                        stroke={s.cor}
                        strokeWidth={2}
                        fill={`url(#g-${s.chave})`}
                        activeDot={{ r: 4 }}
                      />
                    ))}
                  </AreaChart>
                </ResponsiveContainer>
              </div>

              {detalhe && (
                <div className="rounded-lg bg-muted/50 p-3">
                  <p className="mb-2 text-xs font-medium text-muted-foreground">
                    {selecionado ? "Dia selecionado" : "Último dia"} · {diaLongo(detalhe.dia)}
                  </p>
                  <dl className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                    {SERIES.map((s) => (
                      <div key={s.chave}>
                        <dt className="flex items-center gap-1.5 text-xs text-muted-foreground">
                          <span
                            className="size-2 shrink-0 rounded-full"
                            style={{ background: s.cor }}
                            aria-hidden="true"
                          />
                          {s.rotulo}
                        </dt>
                        <dd className="text-lg font-semibold tabular-nums">
                          {formatarNumero(detalhe[s.chave])}
                        </dd>
                      </div>
                    ))}
                  </dl>
                </div>
              )}

              <p className="text-xs text-muted-foreground/70">
                Clique em um ponto do gráfico para fixar o detalhe daquele dia.
              </p>
            </>
          )}
        </CardContent>
      </Card>
    </section>
  );
}
