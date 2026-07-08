import * as React from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigate, useParams } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { ArrowLeft } from "lucide-react";
import { toast } from "sonner";

import { listarPerguntas, listarCategorias, salvarPergunta } from "@/lib/api";
import { Cabecalho } from "@/components/layout/cabecalho";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { Carregando, ErroEstado, Spinner } from "@/components/ui/estados";

const schema = z.object({
  texto: z.string().min(5, "Texto muito curto"),
  categoriaId: z.string().uuid("Selecione a categoria"),
  peso: z.coerce.number().min(0.1).max(5).default(1),
  direcaoPositiva: z.coerce.boolean().default(true),
  // Ordem = posição na sequência do quiz do site. Ativa = se aparece no quiz.
  ordem: z.coerce.number().int().min(0).default(0),
  ativa: z.coerce.boolean().default(true),
});

type FormPergunta = z.input<typeof schema>;

export default function PerguntaFormPage() {
  const { id } = useParams();
  const editando = Boolean(id);
  const navigate = useNavigate();
  const qc = useQueryClient();

  const perguntas = useQuery({ queryKey: ["perguntas"], queryFn: listarPerguntas });
  const categorias = useQuery({ queryKey: ["categorias"], queryFn: listarCategorias });
  const pergunta = editando ? perguntas.data?.find((p) => p.id === id) : undefined;

  const form = useForm<FormPergunta>({
    resolver: zodResolver(schema),
    defaultValues: { texto: "", categoriaId: "", peso: 1, direcaoPositiva: true, ordem: 0, ativa: true },
  });

  // Inicializa o formulário UMA vez, quando as queries necessárias resolveram — nunca
  // depois, para não sobrescrever o que o operador já digitou (as queries carregam async).
  const inicializado = React.useRef(false);
  React.useEffect(() => {
    if (inicializado.current) return;
    if (editando) {
      if (!pergunta) return; // espera a pergunta carregar
      form.reset({
        texto: pergunta.texto,
        categoriaId: pergunta.categoriaId,
        peso: pergunta.peso ?? 1,
        direcaoPositiva: pergunta.direcaoPositiva ?? true,
        ordem: pergunta.ordem ?? 0,
        ativa: pergunta.ativa ?? true,
      });
    } else {
      if (!categorias.data) return; // espera as categorias para a default
      form.reset({
        texto: "",
        categoriaId: categorias.data[0]?.id ?? "",
        peso: 1,
        direcaoPositiva: true,
        ordem: 0, // sem ordem manual — o quiz agrupa por categoria
        ativa: true,
      });
    }
    inicializado.current = true;
  }, [editando, pergunta, categorias.data, form]);

  const salvar = useMutation({
    mutationFn: (dados: FormPergunta) => salvarPergunta(id ?? null, schema.parse(dados)),
    onSuccess: () => {
      toast.success(editando ? "Pergunta atualizada." : "Pergunta criada.");
      qc.invalidateQueries({ queryKey: ["perguntas"] });
      navigate("/perguntas");
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Falha ao salvar."),
  });

  const erro = Object.values(form.formState.errors)[0];
  const carregandoEdicao = editando && perguntas.isLoading;
  const naoEncontrada = editando && !perguntas.isLoading && !perguntas.isError && !pergunta;

  return (
    <>
      <Cabecalho
        titulo={editando ? "Editar pergunta" : "Nova pergunta"}
        descricao="Pergunta avaliada pelo eleitor na escala −2…+2. As perguntas são agrupadas por categoria no quiz."
        acao={
          <Button variant="outline" onClick={() => navigate("/perguntas")}>
            <ArrowLeft /> Voltar
          </Button>
        }
      />

      {carregandoEdicao && <Carregando />}
      {editando && perguntas.isError && <ErroEstado mensagem="Falha ao carregar a pergunta." />}
      {naoEncontrada && <ErroEstado mensagem="Pergunta não encontrada." />}

      {(!editando || pergunta) && (
        <Card className="max-w-2xl">
          <CardContent className="p-6">
            <form onSubmit={form.handleSubmit((d) => salvar.mutate(d))} className="space-y-5">
              <div className="space-y-1.5">
                <Label htmlFor="texto">Pergunta</Label>
                <Textarea id="texto" rows={3} {...form.register("texto")} />
                <p className="text-xs text-muted-foreground">
                  O eleitor responde de “Discordo totalmente” (−2) a “Concordo totalmente” (+2).
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label htmlFor="categoriaId">Categoria</Label>
                  <Select id="categoriaId" {...form.register("categoriaId")}>
                    <option value="">Selecione…</option>
                    {categorias.data?.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.nome}
                      </option>
                    ))}
                  </Select>
                  <p className="text-xs text-muted-foreground">Agrupa a pergunta no quiz.</p>
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="peso">Peso (0,1 a 5)</Label>
                  <Input id="peso" type="number" step="0.1" {...form.register("peso")} />
                  <p className="text-xs text-muted-foreground">
                    Importância da pergunta dentro da categoria (multiplica a resposta). Não é a
                    escala de resposta (−2 a +2): 1 = peso normal, &gt;1 = pesa mais, &lt;1 = pesa menos.
                  </p>
                </div>
              </div>

              <div className="space-y-1">
                <label className="flex items-center gap-2 text-sm">
                  <input type="checkbox" {...form.register("direcaoPositiva")} className="size-4" />
                  Concordar indica posição conservadora
                </label>
                <p className="pl-6 text-xs text-muted-foreground">
                  Marcado: <strong>concordar</strong> com a pergunta conta como posição mais
                  conservadora (polo 100). Desmarque quando concordar significar posição mais
                  progressista (polo 0).
                </p>
              </div>
              <label className="flex items-center gap-2 text-sm">
                <input type="checkbox" {...form.register("ativa")} className="size-4" />
                Ativa (aparece no quiz do site)
              </label>

              {erro && <p className="text-xs text-destructive">{String(erro?.message)}</p>}

              <div className="flex justify-end gap-2 border-t pt-4">
                <Button type="button" variant="outline" onClick={() => navigate("/perguntas")}>
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
