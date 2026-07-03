import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import {
  Vote,
  ImageOff,
  ImageUp,
  ClipboardCheck,
  Gauge,
  GitCompare,
  Users,
  Tags,
  ArrowRight,
} from "lucide-react";

import { buscarDashboard } from "@/lib/api";
import { formatarNumero } from "@/lib/format";
import { Cabecalho } from "@/components/layout/cabecalho";
import { Card, CardContent } from "@/components/ui/card";
import { Carregando, ErroEstado } from "@/components/ui/estados";

// Contadores de atividade/uso da plataforma (secundários ao destaque de candidatos).
const ATIVIDADE = [
  { chave: "quizCompletados", rotulo: "Quizzes completados", icone: ClipboardCheck },
  { chave: "scoresCalculados", rotulo: "Scores calculados", icone: Gauge },
  { chave: "comparacoes", rotulo: "Comparações salvas", icone: GitCompare },
  { chave: "usuarios", rotulo: "Usuários", icone: Users },
  { chave: "categorias", rotulo: "Categorias ativas", icone: Tags },
] as const;

export default function DashboardPage() {
  const { data, isLoading, isError } = useQuery({
    queryKey: ["dashboard"],
    queryFn: buscarDashboard,
  });

  const semFoto = data?.candidatosSemFoto ?? 0;
  const pctSemFoto =
    data && data.totalCandidatos > 0
      ? Math.round((semFoto / data.totalCandidatos) * 100)
      : 0;

  return (
    <>
      <Cabecalho
        titulo="Dashboard"
        descricao="Visão geral: candidatos, quizzes, scores e usuários."
      />

      {isLoading && <Carregando />}
      {isError && <ErroEstado mensagem="Falha ao carregar as métricas." />}

      {data && (
        <div className="space-y-8">
          {/* Destaque: base de candidatos + qualidade de dados (fotos) */}
          <div className="grid gap-4 lg:grid-cols-3">
            <Card className="lg:col-span-2">
              <CardContent className="flex h-full flex-col justify-between gap-6 p-6">
                <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                  <Vote className="size-4 text-primary" />
                  Candidatos no pleito atual
                </div>
                <div>
                  <p className="text-5xl font-bold tracking-tight tabular-nums">
                    {formatarNumero(data.totalCandidatos)}
                  </p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {semFoto === 0
                      ? "Todos com foto de perfil."
                      : `${formatarNumero(semFoto)} sem foto (${pctSemFoto}% da base).`}
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Qualidade de dados: acionável quando há pendência de foto */}
            <Card>
              <CardContent className="flex h-full flex-col justify-between gap-6 p-6">
                <div
                  className={
                    "flex size-11 items-center justify-center rounded-lg " +
                    (semFoto > 0
                      ? "bg-warning/15 text-warning"
                      : "bg-success/15 text-success")
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

          {/* Atividade da plataforma */}
          <section className="space-y-3">
            <h2 className="text-sm font-semibold text-muted-foreground">Atividade</h2>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {ATIVIDADE.map((c) => (
                <Card key={c.chave}>
                  <CardContent className="flex items-center gap-4 p-5">
                    <div className="flex size-11 items-center justify-center rounded-lg bg-muted text-foreground/70">
                      <c.icone className="size-5" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold tabular-nums">
                        {formatarNumero(data[c.chave])}
                      </p>
                      <p className="text-xs text-muted-foreground">{c.rotulo}</p>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </section>
        </div>
      )}
    </>
  );
}
