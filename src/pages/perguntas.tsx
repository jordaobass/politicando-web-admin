import * as React from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { toast } from "sonner";

import {
  listarPerguntas,
  listarCategorias,
  buscarMetricasPerguntas,
  salvarPergunta,
  removerPergunta,
} from "@/lib/api";
import type { Pergunta, PerguntaMetrica } from "@/lib/types";
import { formatarNumero, formatarPercentual } from "@/lib/format";
import { Cabecalho } from "@/components/layout/cabecalho";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Modal } from "@/components/ui/modal";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Carregando, ErroEstado, Spinner, Vazio } from "@/components/ui/estados";

const VALORES = [-2, -1, 0, 1, 2] as const;

const schema = z.object({
  texto: z.string().min(5, "Texto muito curto"),
  categoriaId: z.string().uuid("Selecione a categoria"),
  peso: z.coerce.number().min(0.1).max(5).default(1),
  direcaoPositiva: z.coerce.boolean().default(true),
});

type FormPergunta = z.input<typeof schema>;

/** Mini-histograma da distribuição -2..+2 das respostas. */
function Distribuicao({ m }: { m: PerguntaMetrica }) {
  const max = Math.max(1, ...VALORES.map((v) => m.distribuicao[String(v)] ?? 0));
  return (
    <div className="flex items-end gap-0.5" title="Distribuição -2 → +2">
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
  const [editando, setEditando] = React.useState<Pergunta | null>(null);
  const [aberto, setAberto] = React.useState(false);

  const perguntas = useQuery({ queryKey: ["perguntas"], queryFn: listarPerguntas });
  const categorias = useQuery({ queryKey: ["categorias"], queryFn: listarCategorias });
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

  const form = useForm<FormPergunta>({ resolver: zodResolver(schema) });

  function abrirNovo() {
    setEditando(null);
    form.reset({ texto: "", categoriaId: categorias.data?.[0]?.id ?? "", peso: 1, direcaoPositiva: true });
    setAberto(true);
  }

  function abrirEdicao(p: Pergunta) {
    setEditando(p);
    form.reset({
      texto: p.texto,
      categoriaId: p.categoriaId,
      peso: p.peso ?? 1,
      direcaoPositiva: p.direcaoPositiva ?? true,
    });
    setAberto(true);
  }

  const salvar = useMutation({
    mutationFn: (dados: FormPergunta) => salvarPergunta(editando?.id ?? null, schema.parse(dados)),
    onSuccess: () => {
      toast.success(editando ? "Pergunta atualizada." : "Pergunta criada.");
      qc.invalidateQueries({ queryKey: ["perguntas"] });
      setAberto(false);
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Falha ao salvar."),
  });

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
          <Button onClick={abrirNovo}>
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
                  <TableHead>Afirmação</TableHead>
                  <TableHead>Categoria</TableHead>
                  <TableHead className="text-center">Respostas</TableHead>
                  <TableHead className="text-center">Pulo</TableHead>
                  <TableHead className="text-center">Distribuição</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {perguntas.data.map((p) => {
                  const m = mapaMetricas.get(p.id);
                  return (
                    <TableRow key={p.id}>
                      <TableCell className="max-w-md">
                        <span className="line-clamp-2">{p.texto}</span>
                      </TableCell>
                      <TableCell>
                        <Badge variant="neutral">{p.categoria}</Badge>
                      </TableCell>
                      <TableCell className="text-center tabular-nums">
                        {m ? formatarNumero(m.totalRespostas) : "—"}
                      </TableCell>
                      <TableCell className="text-center tabular-nums">
                        {m ? formatarPercentual(m.taxaPulo) : "—"}
                      </TableCell>
                      <TableCell>
                        <div className="flex justify-center">{m ? <Distribuicao m={m} /> : "—"}</div>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                          <Button variant="ghost" size="icon" onClick={() => abrirEdicao(p)} aria-label="Editar">
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
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Modal
        aberto={aberto}
        onFechar={() => setAberto(false)}
        titulo={editando ? "Editar pergunta" : "Nova pergunta"}
        descricao="Direção positiva = concordar empurra o eleitor para o polo 100 da categoria."
      >
        <form onSubmit={form.handleSubmit((d) => salvar.mutate(d))} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="texto">Afirmação</Label>
            <Textarea id="texto" {...form.register("texto")} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="categoriaId">Categoria</Label>
              <Select id="categoriaId" {...form.register("categoriaId")}>
                {categorias.data?.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.nome}
                  </option>
                ))}
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="peso">Peso (0.1–5)</Label>
              <Input id="peso" type="number" step="0.1" {...form.register("peso")} />
            </div>
          </div>
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" {...form.register("direcaoPositiva")} className="size-4" />
            Direção positiva (concordar = polo 100)
          </label>
          {Object.values(form.formState.errors)[0] && (
            <p className="text-xs text-destructive">
              {String(Object.values(form.formState.errors)[0]?.message)}
            </p>
          )}
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => setAberto(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={salvar.isPending}>
              {salvar.isPending && <Spinner />} Salvar
            </Button>
          </div>
        </form>
      </Modal>
    </>
  );
}
