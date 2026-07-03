import * as React from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { toast } from "sonner";

import {
  listarPartidos,
  criarPartido,
  atualizarPartido,
  removerPartido,
  rasparProgramaPartido,
} from "@/lib/api";
import type { Partido } from "@/lib/types";
import { Cabecalho } from "@/components/layout/cabecalho";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Modal } from "@/components/ui/modal";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Carregando, ErroEstado, Spinner, Vazio } from "@/components/ui/estados";

const schema = z.object({
  sigla: z.string().min(1, "Informe a sigla").max(20),
  nome: z.string().min(1, "Informe o nome"),
  numero: z.coerce.number().int().positive().optional().or(z.literal("").transform(() => undefined)),
  logoUrl: z.string().url("URL inválida").optional().or(z.literal("")),
  siteOficial: z.string().url("URL inválida").optional().or(z.literal("")),
  programaUrl: z.string().url("URL inválida").optional().or(z.literal("")),
  programaResumo: z.string().optional(),
});

type FormPartido = z.input<typeof schema>;

export default function PartidosPage() {
  const qc = useQueryClient();
  const [editando, setEditando] = React.useState<Partido | null>(null);
  const [aberto, setAberto] = React.useState(false);

  const { data, isLoading, isError } = useQuery({ queryKey: ["partidos"], queryFn: listarPartidos });

  const form = useForm<FormPartido>({ resolver: zodResolver(schema) });

  function abrirNovo() {
    setEditando(null);
    form.reset({ sigla: "", nome: "", numero: undefined, logoUrl: "", siteOficial: "", programaUrl: "", programaResumo: "" });
    setAberto(true);
  }

  function abrirEdicao(p: Partido) {
    setEditando(p);
    form.reset({
      sigla: p.sigla,
      nome: p.nome,
      numero: p.numero ?? undefined,
      logoUrl: p.logoUrl ?? "",
      siteOficial: p.siteOficial ?? "",
      programaUrl: p.programaUrl ?? "",
      programaResumo: p.programaResumo ?? "",
    });
    setAberto(true);
  }

  const salvar = useMutation({
    mutationFn: (dados: FormPartido) => {
      const corpo = schema.parse(dados);
      return editando ? atualizarPartido(editando.id, corpo) : criarPartido(corpo);
    },
    onSuccess: () => {
      toast.success(editando ? "Partido atualizado." : "Partido criado.");
      qc.invalidateQueries({ queryKey: ["partidos"] });
      setAberto(false);
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Falha ao salvar."),
  });

  const raspar = useMutation({
    mutationFn: (id: string) => rasparProgramaPartido(id),
    onSuccess: (p) => {
      toast.success(`Programa raspado (${(p.programaResumo ?? "").length} caracteres).`);
      form.setValue("programaResumo", p.programaResumo ?? "");
      qc.invalidateQueries({ queryKey: ["partidos"] });
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Falha ao raspar."),
  });

  const excluir = useMutation({
    mutationFn: (id: string) => removerPartido(id),
    onSuccess: () => {
      toast.success("Partido removido.");
      qc.invalidateQueries({ queryKey: ["partidos"] });
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Falha ao remover."),
  });

  return (
    <>
      <Cabecalho
        titulo="Partidos"
        descricao="Cadastro e ajuste de siglas, números, logos e programa."
        acao={
          <Button onClick={abrirNovo}>
            <Plus /> Novo partido
          </Button>
        }
      />

      <Card>
        <CardContent className="p-0">
          {isLoading && <Carregando />}
          {isError && <ErroEstado mensagem="Falha ao carregar partidos." />}
          {data && data.length === 0 && <Vazio texto="Nenhum partido cadastrado." />}

          {data && data.length > 0 && (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Sigla</TableHead>
                  <TableHead>Nome</TableHead>
                  <TableHead className="text-center">Número</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.map((p) => (
                  <TableRow key={p.id}>
                    <TableCell className="font-medium">{p.sigla}</TableCell>
                    <TableCell className="text-muted-foreground">{p.nome}</TableCell>
                    <TableCell className="text-center tabular-nums">{p.numero ?? "—"}</TableCell>
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
                            if (confirm(`Remover o partido ${p.sigla}?`)) excluir.mutate(p.id);
                          }}
                        >
                          <Trash2 className="text-destructive" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Modal
        aberto={aberto}
        onFechar={() => setAberto(false)}
        titulo={editando ? `Editar ${editando.sigla}` : "Novo partido"}
      >
        <form onSubmit={form.handleSubmit((d) => salvar.mutate(d))} className="space-y-4">
          <div className="grid grid-cols-3 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="sigla">Sigla</Label>
              <Input id="sigla" {...form.register("sigla")} />
            </div>
            <div className="col-span-2 space-y-1.5">
              <Label htmlFor="numero">Número</Label>
              <Input id="numero" type="number" {...form.register("numero")} />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="nome">Nome</Label>
            <Input id="nome" {...form.register("nome")} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="logoUrl">Logo (URL)</Label>
            <Input id="logoUrl" {...form.register("logoUrl")} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="siteOficial">Site oficial (URL)</Label>
            <Input id="siteOficial" {...form.register("siteOficial")} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="programaUrl">URL do programa (para raspar)</Label>
            <div className="flex gap-2">
              <Input id="programaUrl" {...form.register("programaUrl")} className="flex-1" />
              {editando && (
                <Button
                  type="button"
                  variant="outline"
                  disabled={raspar.isPending}
                  onClick={() => raspar.mutate(editando.id)}
                >
                  {raspar.isPending && <Spinner />} Raspar
                </Button>
              )}
            </div>
            {editando && <p className="text-xs text-muted-foreground">Salve a URL antes de raspar.</p>}
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="programaResumo">Resumo do programa (raspado ou curado)</Label>
            <Textarea id="programaResumo" rows={6} {...form.register("programaResumo")} />
          </div>
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
