import { useQuery } from "@tanstack/react-query";
import {
  Vote,
  ImageOff,
  ClipboardCheck,
  Gauge,
  GitCompare,
  Users,
  Tags,
} from "lucide-react";

import { buscarDashboard } from "@/lib/api";
import { formatarNumero } from "@/lib/format";
import { Cabecalho } from "@/components/layout/cabecalho";
import { Card, CardContent } from "@/components/ui/card";
import { Carregando, ErroEstado } from "@/components/ui/estados";

const CARTOES = [
  { chave: "totalCandidatos", rotulo: "Candidatos (pleito atual)", icone: Vote },
  { chave: "candidatosSemFoto", rotulo: "Sem foto", icone: ImageOff },
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

  return (
    <>
      <Cabecalho
        titulo="Dashboard"
        descricao="Visão geral: candidatos, quizzes, scores e usuários."
      />

      {isLoading && <Carregando />}
      {isError && <ErroEstado mensagem="Falha ao carregar as métricas." />}

      {data && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {CARTOES.map((c) => (
            <Card key={c.chave}>
              <CardContent className="flex items-center gap-4 p-5">
                <div className="flex size-11 items-center justify-center rounded-lg bg-primary/10 text-primary">
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
      )}
    </>
  );
}
