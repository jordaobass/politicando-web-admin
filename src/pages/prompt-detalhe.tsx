import * as React from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Link, useParams } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { toast } from "sonner";

import { atualizarPrompt, listarPrompts } from "@/lib/api";
import { formatarDataHora } from "@/lib/format";
import { Cabecalho } from "@/components/layout/cabecalho";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { Carregando, ErroEstado } from "@/components/ui/estados";

/** Guarda o rascunho do prompt no navegador para não perder a edição se o backend
 *  estiver reiniciando (rebuild), o save falhar ou a página for recarregada. */
const chaveRascunho = (chave: string) => `politicando:prompt-draft:${chave}`;

export default function PromptDetalhePage() {
  const { chave = "" } = useParams();
  const qc = useQueryClient();
  const { data, isLoading, isError } = useQuery({ queryKey: ["prompts"], queryFn: listarPrompts });
  const prompt = data?.find((p) => p.chave === chave);

  // `null` = acompanha o conteúdo do servidor; string = edição local (rascunho).
  const [texto, setTexto] = React.useState<string | null>(null);

  // Ao trocar de prompt, recarrega o rascunho salvo localmente (se houver).
  React.useEffect(() => {
    const salvo = localStorage.getItem(chaveRascunho(chave));
    setTexto(salvo);
  }, [chave]);

  const valor = texto ?? prompt?.conteudo ?? "";

  const editar = (novo: string) => {
    setTexto(novo);
    // Se a edição volta a igualar o servidor, não deixa rascunho órfão guardado.
    if (prompt && novo.trim() === prompt.conteudo.trim()) {
      localStorage.removeItem(chaveRascunho(chave));
    } else {
      localStorage.setItem(chaveRascunho(chave), novo);
    }
  };

  const descartarRascunho = () => {
    localStorage.removeItem(chaveRascunho(chave));
    setTexto(null);
  };

  const salvar = useMutation({
    mutationFn: () => atualizarPrompt(chave, valor),
    onSuccess: () => {
      toast.success("Prompt salvo.");
      localStorage.removeItem(chaveRascunho(chave)); // persistiu no banco — descarta o rascunho local
      setTexto(null); // volta a acompanhar o servidor
      qc.invalidateQueries({ queryKey: ["prompts"] });
    },
    // Em erro NÃO limpa o rascunho: a edição fica preservada para nova tentativa.
    onError: (e) => toast.error(e instanceof Error ? e.message : "Falha ao salvar o prompt."),
  });

  if (isLoading) return <Carregando />;
  if (isError || !prompt) return <ErroEstado mensagem="Prompt não encontrado." />;

  const alterado = valor.trim() !== prompt.conteudo.trim();
  const temRascunho = texto !== null && alterado;

  return (
    <>
      <div className="mb-4 flex items-center justify-between gap-3">
        <Link to="/prompts">
          <Button variant="ghost" size="sm">
            <ArrowLeft /> Voltar
          </Button>
        </Link>
        <div className="flex items-center gap-2">
          {temRascunho && (
            <Button variant="ghost" size="sm" onClick={descartarRascunho} disabled={salvar.isPending}>
              Descartar rascunho
            </Button>
          )}
          <Button size="sm" disabled={!alterado || salvar.isPending} onClick={() => salvar.mutate()}>
            {salvar.isPending ? "Salvando…" : "Salvar"}
          </Button>
        </div>
      </div>

      <Cabecalho titulo={prompt.nome} descricao={prompt.descricao ?? undefined} />

      <Card className="mt-4">
        <CardContent className="space-y-2 p-5">
          <Textarea
            value={valor}
            onChange={(e) => editar(e.target.value)}
            rows={24}
            aria-label={`Conteúdo do prompt ${prompt.nome}`}
            className="font-mono text-xs leading-relaxed"
          />
          <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
            {temRascunho && (
              <Badge variant="warning">Rascunho não salvo (guardado neste navegador)</Badge>
            )}
            <span>
              {prompt.atualizadoEm
                ? `Atualizado em ${formatarDataHora(prompt.atualizadoEm)}.`
                : "Conteúdo padrão do sistema."}{" "}
              Markdown é suportado — o modelo lê a estrutura (títulos, listas) como organização.
            </span>
          </div>
        </CardContent>
      </Card>
    </>
  );
}
