import { useQuery } from "@tanstack/react-query";
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";
import { AlertTriangle, Sparkles } from "lucide-react";

import { buscarSaudeScoring } from "@/lib/api";
import { formatarNumero, formatarDataHora } from "@/lib/format";
import { Card, CardContent } from "@/components/ui/card";
import { Carregando, ErroEstado } from "@/components/ui/estados";

/** Acima disso o scoring está velho o bastante para merecer alerta na tela. */
const DIAS_PARA_ALERTA = 30;

/**
 * Saúde do scoring da IA.
 *
 * A métrica central não é "quantos scores existem", e sim quantos deles de fato DIFERENCIAM
 * candidatos: score cravado em 50 conta como preenchido e não ajuda ninguém a escolher. Separar
 * os dois é o que impede a dash de dar por pronto um trabalho que não começou.
 */
export function SaudeScoring() {
  const { data, isLoading, isError } = useQuery({
    queryKey: ["saude-scoring"],
    queryFn: buscarSaudeScoring,
  });

  const informativos = data ? data.totalScores - data.scoresNeutros : 0;
  const pctInformativo =
    data && data.totalScores > 0 ? Math.round((informativos / data.totalScores) * 100) : 0;

  const diasDesdeAnalise = data?.ultimaAnaliseEm
    ? Math.floor((Date.now() - new Date(data.ultimaAnaliseEm).getTime()) / 86_400_000)
    : null;
  const analiseVelha = diasDesdeAnalise !== null && diasDesdeAnalise > DIAS_PARA_ALERTA;

  const fatias = [
    { nome: "Diferenciam", valor: informativos, cor: "var(--grafico-4)" },
    { nome: "Neutros (50)", valor: data?.scoresNeutros ?? 0, cor: "var(--grafico-vazio)" },
  ];

  return (
    <Card>
      <CardContent className="space-y-4 p-5">
        <div>
          <h3 className="text-sm font-semibold">Scoring da IA</h3>
          <p className="text-xs text-muted-foreground">
            Quantos scores realmente separam um candidato de outro.
          </p>
        </div>

        {isLoading && <Carregando />}
        {isError && <ErroEstado mensagem="Falha ao carregar a saúde do scoring." />}

        {data && (
          <>
            <div className="flex items-center gap-4">
              <div className="h-32 w-32 shrink-0">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={fatias}
                      dataKey="valor"
                      nameKey="nome"
                      innerRadius={38}
                      outerRadius={58}
                      paddingAngle={2}
                      stroke="none"
                    >
                      {fatias.map((f) => (
                        <Cell key={f.nome} fill={f.cor} />
                      ))}
                    </Pie>
                    <Tooltip
                      formatter={(valor, nome) => [formatarNumero(Number(valor)), nome]}
                      contentStyle={{
                        background: "var(--card)",
                        border: "1px solid var(--border)",
                        borderRadius: "var(--radius-md)",
                        fontSize: 12,
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>

              <div className="min-w-0 space-y-1">
                <p className="flex items-baseline gap-2">
                  <span className="text-3xl font-bold tabular-nums">{pctInformativo}%</span>
                  <span className="text-xs text-muted-foreground">dos scores diferenciam</span>
                </p>
                <p className="text-xs text-muted-foreground">
                  {formatarNumero(informativos)} de {formatarNumero(data.totalScores)} ·{" "}
                  {formatarNumero(data.scoresNeutros)} estão cravados em 50
                </p>
                <p className="text-xs text-muted-foreground">
                  Confiança média {data.confiancaMedia.toFixed(2)}
                </p>
              </div>
            </div>

            <dl className="grid grid-cols-2 gap-3 border-t pt-3 text-xs">
              <div>
                <dt className="flex items-center gap-1.5 text-muted-foreground">
                  {analiseVelha ? (
                    <AlertTriangle className="size-3.5 text-warning" aria-hidden="true" />
                  ) : (
                    <Sparkles className="size-3.5 text-success" aria-hidden="true" />
                  )}
                  Última análise
                </dt>
                <dd className={analiseVelha ? "font-medium text-warning" : "font-medium"}>
                  {diasDesdeAnalise === null
                    ? "nunca rodou"
                    : `há ${diasDesdeAnalise} dia(s)`}
                  {data.ultimaAnaliseEm && (
                    <span className="block font-normal text-muted-foreground">
                      {formatarDataHora(data.ultimaAnaliseEm)}
                    </span>
                  )}
                </dd>
              </div>
              <div>
                <dt className="text-muted-foreground">Candidaturas analisadas</dt>
                <dd className="font-medium tabular-nums">
                  {formatarNumero(data.candidaturasAnalisadas)} de{" "}
                  {formatarNumero(data.candidaturasAtuais)}
                  <span className="block font-normal text-muted-foreground">
                    {formatarNumero(data.tokensAcumulados)} tokens acumulados
                  </span>
                </dd>
              </div>
            </dl>
          </>
        )}
      </CardContent>
    </Card>
  );
}
