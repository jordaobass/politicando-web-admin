import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Play, RefreshCw, Sparkles, Layers } from "lucide-react";
import { toast } from "sonner";

import {
  buscarIntegracoes,
  buscarExecucoes,
  executarIntegracao,
  recalcularScores,
  classificarPartidos,
  aplicarBasePartido,
} from "@/lib/api";
import { formatarDataHora, formatarNumero } from "@/lib/format";
import { Cabecalho } from "@/components/layout/cabecalho";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Carregando, ErroEstado, Vazio } from "@/components/ui/estados";

function badgeStatus(status: string | null) {
  switch (status) {
    case "Sucesso":
      return "success" as const;
    case "Parcial":
      return "warning" as const;
    case "Erro":
      return "destructive" as const;
    default:
      return "neutral" as const;
  }
}

export default function IntegracoesPage() {
  const qc = useQueryClient();
  const integracoes = useQuery({ queryKey: ["integracoes"], queryFn: buscarIntegracoes });
  const execucoes = useQuery({ queryKey: ["execucoes"], queryFn: () => buscarExecucoes(50) });

  function aoDisparar(promessa: Promise<unknown>, msg: string) {
    promessa
      .then(() => {
        toast.success(msg);
        setTimeout(() => {
          qc.invalidateQueries({ queryKey: ["integracoes"] });
          qc.invalidateQueries({ queryKey: ["execucoes"] });
        }, 1500);
      })
      .catch((e) => toast.error(e instanceof Error ? e.message : "Falha ao iniciar."));
  }

  const executar = useMutation({
    mutationFn: (tipo: string) => executarIntegracao(tipo),
    onSuccess: () => aoDisparar(Promise.resolve(), "Ingestão iniciada."),
    onError: (e) => toast.error(e instanceof Error ? e.message : "Falha ao iniciar."),
  });

  return (
    <>
      <Cabecalho titulo="Integrações" descricao="Ingestões de dados e jobs de scoring por IA." />

      <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <AcaoCard
          icone={RefreshCw}
          titulo="Recalcular scores"
          texto="Reprocessa scores sem score (IA)."
          onClick={() => aoDisparar(recalcularScores(), "Recálculo de scores iniciado.")}
        />
        <AcaoCard
          icone={Sparkles}
          titulo="Classificar partidos"
          texto="Posiciona partidos por categoria (IA)."
          onClick={() => aoDisparar(classificarPartidos(), "Classificação iniciada.")}
        />
        <AcaoCard
          icone={Layers}
          titulo="Aplicar base de partido"
          texto="Herda o score do partido nos candidatos."
          onClick={() => aoDisparar(aplicarBasePartido(), "Aplicação iniciada.")}
        />
      </div>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Fontes de dados</CardTitle>
          <CardDescription>Dispare manualmente uma ingestão.</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          {integracoes.isLoading && <Carregando />}
          {integracoes.isError && <ErroEstado mensagem="Falha ao carregar integrações." />}
          {integracoes.data && (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Integração</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Última execução</TableHead>
                  <TableHead className="text-right">Ação</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {integracoes.data.map((i) => (
                  <TableRow key={i.id}>
                    <TableCell className="font-medium">{i.nome}</TableCell>
                    <TableCell>
                      <Badge variant={badgeStatus(i.ultimoStatus)}>{i.ultimoStatus ?? "—"}</Badge>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {formatarDataHora(i.ultimaExecucaoEm)}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={executar.isPending}
                        onClick={() => executar.mutate(i.tipo)}
                      >
                        <Play /> Executar
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Log de execuções</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {execucoes.isLoading && <Carregando />}
          {execucoes.isError && <ErroEstado mensagem="Falha ao carregar execuções." />}
          {execucoes.data && execucoes.data.length === 0 && <Vazio texto="Sem execuções ainda." />}
          {execucoes.data && execucoes.data.length > 0 && (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Integração</TableHead>
                  <TableHead>Início</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-center">Processados</TableHead>
                  <TableHead className="text-center">Erros</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {execucoes.data.map((e) => (
                  <TableRow key={e.id}>
                    <TableCell className="font-medium">{e.integracao}</TableCell>
                    <TableCell className="text-muted-foreground">{formatarDataHora(e.iniciadoEm)}</TableCell>
                    <TableCell>
                      <Badge variant={badgeStatus(e.status)}>{e.status}</Badge>
                    </TableCell>
                    <TableCell className="text-center tabular-nums">
                      {formatarNumero(e.registrosProcessados)}
                    </TableCell>
                    <TableCell className="text-center tabular-nums">
                      {formatarNumero(e.registrosComErro)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </>
  );
}

function AcaoCard({
  icone: Icone,
  titulo,
  texto,
  onClick,
}: {
  icone: typeof Play;
  titulo: string;
  texto: string;
  onClick: () => void;
}) {
  return (
    <Card>
      <CardContent className="space-y-3 p-5">
        <div className="flex size-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
          <Icone className="size-5" />
        </div>
        <div>
          <p className="font-medium">{titulo}</p>
          <p className="text-xs text-muted-foreground">{texto}</p>
        </div>
        <Button variant="outline" size="sm" className="w-full" onClick={onClick}>
          Iniciar
        </Button>
      </CardContent>
    </Card>
  );
}
