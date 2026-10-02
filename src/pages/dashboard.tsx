import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { Vote, ImageOff, ImageUp, ArrowRight } from "lucide-react";

import { buscarDashboard } from "@/lib/api";
import { formatarNumero } from "@/lib/format";
import { Cabecalho } from "@/components/layout/cabecalho";
import { Card, CardContent } from "@/components/ui/card";
import { Carregando, ErroEstado } from "@/components/ui/estados";
import { GraficoUso } from "@/components/dashboard/grafico-uso";
import { FunilPublicacao } from "@/components/dashboard/funil-publicacao";
import { CoberturaDados } from "@/components/dashboard/cobertura-dados";
import { MaisAcessados } from "@/components/dashboard/mais-acessados";
import { AcessosRegiao } from "@/components/dashboard/acessos-regiao";
import { SaudeScoring } from "@/components/dashboard/saude-scoring";
import { SaudeOperacional } from "@/components/dashboard/saude-operacional";

/**
 * Dashboard em quatro faixas, da pergunta mais frequente para a menos:
 * o que mudou (Pulso) → o que falta fazer (Curadoria) → a IA está útil? (Scoring) →
 * algo quebrou? (Operação).
 *
 * Contador solto só sobrevive aqui quando não tem leitura melhor em gráfico.
 */
export default function DashboardPage() {
  const { data, isLoading, isError } = useQuery({
    queryKey: ["dashboard"],
    queryFn: buscarDashboard,
  });

  const semFoto = data?.candidatosSemFoto ?? 0;

  return (
    <>
      <Cabecalho
        titulo="Dashboard"
        descricao="Uso da plataforma, curadoria da base, saúde da IA e das integrações."
      />

      {isLoading && <Carregando />}
      {isError && <ErroEstado mensagem="Falha ao carregar as métricas." />}

      {data && (
        <div className="space-y-10">
          {/* Faixa 1 — Pulso: o que mudou no período. */}
          <GraficoUso />

          {/* Faixa 2 — Curadoria: o trabalho que a base ainda pede. */}
          <section className="space-y-3">
            <h2 className="text-sm font-semibold text-muted-foreground">Curadoria da base</h2>

            <div className="grid gap-4 lg:grid-cols-3">
              <Card className="lg:col-span-2">
                <CardContent className="flex h-full flex-col justify-between gap-6 p-6">
                  <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                    <Vote className="size-4 text-primary" />
                    Candidaturas no pleito atual
                  </div>
                  <div>
                    <p className="text-5xl font-bold tracking-tight tabular-nums">
                      {formatarNumero(data.totalCandidatos)}
                    </p>
                    {/* O número grande é a BASE; quanto disso o eleitor vê está no funil ao lado. */}
                    <p className="mt-1 text-sm text-muted-foreground">
                      Total cadastrado, publicado ou não. Veja abaixo quanto está no ar.
                    </p>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="flex h-full flex-col justify-between gap-6 p-6">
                  <div
                    className={
                      "flex size-11 items-center justify-center rounded-lg " +
                      (semFoto > 0 ? "bg-warning/15 text-warning" : "bg-success/15 text-success")
                    }
                  >
                    {semFoto > 0 ? <ImageOff className="size-5" /> : <ImageUp className="size-5" />}
                  </div>
                  <div>
                    <p className="text-2xl font-bold tabular-nums">{formatarNumero(semFoto)}</p>
                    <p className="text-xs text-muted-foreground">Candidatos sem foto</p>
                    {semFoto > 0 && (
                      <Link
                        to="/candidaturas"
                        className="mt-3 inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline"
                      >
                        Revisar candidaturas <ArrowRight className="size-3.5" />
                      </Link>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="grid gap-4 lg:grid-cols-2">
              <FunilPublicacao />
              <CoberturaDados />
            </div>
          </section>

          {/* Faixa 3 — Audiência: quem é visto e de onde vêm os acessos. */}
          <section className="space-y-3">
            <h2 className="text-sm font-semibold text-muted-foreground">Audiência</h2>
            <div className="grid gap-4 lg:grid-cols-2">
              <MaisAcessados />
              <AcessosRegiao />
            </div>
          </section>

          {/* Faixa 4 — Saúde: a IA está útil, e as fontes estão vivas? */}
          <section className="space-y-3">
            <h2 className="text-sm font-semibold text-muted-foreground">Saúde do sistema</h2>
            <div className="grid gap-4 lg:grid-cols-2">
              <SaudeScoring />
              <SaudeOperacional />
            </div>
          </section>
        </div>
      )}
    </>
  );
}
