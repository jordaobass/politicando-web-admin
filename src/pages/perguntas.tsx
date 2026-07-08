import * as React from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { toast } from "sonner";

import { listarPerguntas, buscarMetricasPerguntas, removerPergunta } from "@/lib/api";
import type { PerguntaMetrica } from "@/lib/types";
import { formatarNumero } from "@/lib/format";
import { Cabecalho } from "@/components/layout/cabecalho";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Carregando, ErroEstado, Vazio } from "@/components/ui/estados";

const VALORES = [-2, -1, 0, 1, 2] as const;

/** Mini-histograma da distribuição -2..+2 das respostas. */
function Distribuicao({ m }: { m: PerguntaMetrica }) {
  const max = Math.max(1, ...VALORES.map((v) => m.distribuicao[String(v)] ?? 0));
  return (
    <div
      className="flex items-end gap-0.5"
      title="Quantas respostas em cada nota, de −2 (discordo totalmente) a +2 (concordo totalmente)"
    >
      {VALORES.map((v) => {
        const n = m.distribuicao[String(v)] ?? 0;
        return (
          <div
            key={v}
            className="w-2 rounded-sm bg-primary/70"
            style={{ height: `${4 + (n / max) * 24}px` }}
            title={`${v}: ${n}`}
          />
        );
      })}
    </div>
  );
}

export default function PerguntasPage() {
  const qc = useQueryClient();
  const navigate = useNavigate();

  const perguntas = useQuery({ queryKey: ["perguntas"], queryFn: listarPerguntas });
  const metricas = useQuery({
    queryKey: ["perguntas-metricas"],
    queryFn: buscarMetricasPerguntas,
    retry: false, // endpoint pode ainda não existir no backend
  });

  const mapaMetricas = React.useMemo(() => {
    const m = new Map<string, PerguntaMetrica>();
    metricas.data?.forEach((x) => m.set(x.perguntaId, x));
    return m;
  }, [metricas.data]);

  // Agrupa por categoria (Correções v3, item 5). O backend já entrega ordenado por categoria,
  // então o Map preserva a ordem das categorias conforme aparecem.
  const porCategoria = React.useMemo(() => {
    const grupos = new Map<string, NonNullable<typeof perguntas.data>>();
    for (const p of perguntas.data ?? []) {
      const lista = grupos.get(p.categoria) ?? [];
      lista.push(p);
      grupos.set(p.categoria, lista);
    }
    return grupos;
  }, [perguntas.data]);

  const excluir = useMutation({
    mutationFn: (id: string) => removerPergunta(id),
    onSuccess: () => {
      toast.success("Pergunta removida.");
      qc.invalidateQueries({ queryKey: ["perguntas"] });
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Falha ao remover."),
  });

  return (
    <>
      <Cabecalho
        titulo="Perguntas"
        descricao="Banco de afirmações do quiz, peso, direção e métricas de resposta."
        acao={
          <Button onClick={() => navigate("/perguntas/novo")}>
            <Plus /> Nova pergunta
          </Button>
        }
      />

      <Card>
        <CardContent className="p-0">
          {perguntas.isLoading && <Carregando />}
          {perguntas.isError && <ErroEstado mensagem="Falha ao carregar perguntas." />}
          {perguntas.data && perguntas.data.length === 0 && <Vazio texto="Nenhuma pergunta cadastrada." />}

          {perguntas.data && perguntas.data.length > 0 && (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Pergunta</TableHead>
                  <TableHead className="text-center">Respostas</TableHead>
                  <TableHead className="text-center">Distribuição (−2 a +2)</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {[...porCategoria.entries()].map(([categoria, lista]) => (
                  <React.Fragment key={categoria}>
                    <TableRow className="bg-muted/40 hover:bg-muted/40">
                      <TableCell colSpan={4} className="py-2 text-sm font-semibold text-foreground">
                        {categoria}{" "}
                        <span className="font-normal text-muted-foreground">· {lista.length}</span>
                      </TableCell>
                    </TableRow>
                    {lista.map((p) => {
                      const m = mapaMetricas.get(p.id);
                      return (
                        <TableRow key={p.id}>
                          <TableCell className="max-w-md">
                            <div className="flex items-start gap-2">
                              <span className="line-clamp-2">{p.texto}</span>
                              {p.ativa === false && (
                                <Badge variant="neutral" className="shrink-0">
                                  Inativa
                                </Badge>
                              )}
                            </div>
                          </TableCell>
                          <TableCell className="text-center tabular-nums">
                            {m ? formatarNumero(m.totalRespostas) : "—"}
                          </TableCell>
                          <TableCell>
                            <div className="flex justify-center">{m ? <Distribuicao m={m} /> : "—"}</div>
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-1">
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => navigate(`/perguntas/${p.id}`)}
                                aria-label="Editar"
                              >
                                <Pencil />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                aria-label="Remover"
                                onClick={() => {
                                  if (confirm("Remover esta pergunta?")) excluir.mutate(p.id);
                                }}
                              >
                                <Trash2 className="text-destructive" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </React.Fragment>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </>
  );
}
