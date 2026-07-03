import * as React from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigate, useParams } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { ArrowLeft } from "lucide-react";
import { toast } from "sonner";

import { atualizarPartido, criarPartido, listarPartidos } from "@/lib/api";
import { Cabecalho } from "@/components/layout/cabecalho";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { Carregando, ErroEstado, Spinner } from "@/components/ui/estados";

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

const VAZIO: FormPartido = {
  sigla: "",
  nome: "",
  numero: undefined,
  logoUrl: "",
  siteOficial: "",
  programaUrl: "",
  programaResumo: "",
};

export default function PartidoFormPage() {
  const { id } = useParams();
  const editando = Boolean(id);
  const navigate = useNavigate();
  const qc = useQueryClient();

  // Para edição, reaproveita a lista já carregada (poucos partidos) em vez de um GET por id.
  const { data, isLoading, isError } = useQuery({
    queryKey: ["partidos"],
    queryFn: listarPartidos,
    enabled: editando,
  });
  const partido = editando ? data?.find((p) => p.id === id) : undefined;

  const form = useForm<FormPartido>({ resolver: zodResolver(schema), defaultValues: VAZIO });

  // Preenche o formulário quando o partido em edição termina de carregar.
  React.useEffect(() => {
    if (!partido) return;
    form.reset({
      sigla: partido.sigla,
      nome: partido.nome,
      numero: partido.numero ?? undefined,
      logoUrl: partido.logoUrl ?? "",
      siteOficial: partido.siteOficial ?? "",
      programaUrl: partido.programaUrl ?? "",
      programaResumo: partido.programaResumo ?? "",
    });
  }, [partido, form]);

  const salvar = useMutation({
    mutationFn: (dados: FormPartido) => {
      const corpo = schema.parse(dados);
      return editando && id ? atualizarPartido(id, corpo) : criarPartido(corpo);
    },
    onSuccess: () => {
      toast.success(editando ? "Partido atualizado." : "Partido criado.");
      qc.invalidateQueries({ queryKey: ["partidos"] });
      navigate("/partidos");
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Falha ao salvar."),
  });

  const erro = Object.values(form.formState.errors)[0];

  return (
    <>
      <Cabecalho
        titulo={editando ? `Editar ${partido?.sigla ?? "partido"}` : "Novo partido"}
        descricao="Sigla, número, logo, site oficial e programa partidário."
        acao={
          <Button variant="outline" onClick={() => navigate("/partidos")}>
            <ArrowLeft /> Voltar
          </Button>
        }
      />

      {editando && isLoading && <Carregando />}
      {editando && isError && <ErroEstado mensagem="Falha ao carregar o partido." />}
      {editando && !isLoading && !isError && !partido && (
        <ErroEstado mensagem="Partido não encontrado." />
      )}

      {(!editando || partido) && (
        <Card className="max-w-2xl">
          <CardContent className="p-6">
            <form onSubmit={form.handleSubmit((d) => salvar.mutate(d))} className="space-y-5">
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
                <Label htmlFor="programaUrl">URL do programa (referência, opcional)</Label>
                <Input id="programaUrl" {...form.register("programaUrl")} />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="programaResumo">Resumo do programa</Label>
                <Textarea id="programaResumo" rows={8} {...form.register("programaResumo")} />
                <p className="text-xs text-muted-foreground">
                  Texto que alimenta a análise da IA. Escreva ou cole o resumo do programa partidário.
                </p>
              </div>

              {erro && <p className="text-xs text-destructive">{String(erro?.message)}</p>}

              <div className="flex justify-end gap-2 border-t pt-4">
                <Button type="button" variant="outline" onClick={() => navigate("/partidos")}>
                  Cancelar
                </Button>
                <Button type="submit" disabled={salvar.isPending}>
                  {salvar.isPending && <Spinner />} Salvar
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}
    </>
  );
}
