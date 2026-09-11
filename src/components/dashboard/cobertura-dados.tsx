import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { ChevronLeft, ChevronRight, ExternalLink } from "lucide-react";

import { buscarCobertura, buscarFaltantes } from "@/lib/api";
import { formatarNumero } from "@/lib/format";
import { CARGOS, type CoberturaItem } from "@/lib/types";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";
import { Carregando, ErroEstado, Vazio } from "@/components/ui/estados";

const TAMANHO = 15;

const rotuloCargo = (cargo: string) => CARGOS.find((c) => c.valor === cargo)?.rotulo ?? cargo;

/** Abaixo disso a barra fica em alerta: é buraco de conteúdo que o eleitor encontra. */
const LIMIAR_ALERTA = 0.5;

/**
 * O candidato que o eleitor abre tem conteúdo, ou é página vazia?
 *
 * Mede só os PUBLICADOS — buraco em candidatura oculta não chega a ninguém. Clicar numa
 * dimensão abre a lista de quem está faltando, que é o que transforma a métrica em trabalho.
 */
export function CoberturaDados() {
  const [aberta, setAberta] = useState<CoberturaItem | null>(null);

  const { data, isLoading, isError } = useQuery({
    queryKey: ["cobertura"],
    queryFn: buscarCobertura,
  });

  return (
    <Card>
      <CardContent className="space-y-4 p-5">
        <div>
          <h3 className="text-sm font-semibold">Cobertura de conteúdo</h3>
          {data && (
            <p className="text-xs text-muted-foreground">
              Entre os {formatarNumero(data.publicados)} candidatos publicados.
            </p>
          )}
        </div>

        {isLoading && <Carregando />}
        {isError && <ErroEstado mensagem="Falha ao carregar a cobertura de dados." />}

        {data && (
          <>
            <ul className="space-y-3">
              {data.itens.map((item) => {
                const fracao = item.total > 0 ? item.comDado / item.total : 0;
                const faltam = item.total - item.comDado;
                return (
                  <li key={item.chave}>
                    <button
                      type="button"
                      onClick={() => setAberta(item)}
                      disabled={faltam === 0}
                      className="group w-full rounded-md px-1 py-1 text-left transition-colors hover:bg-muted/60 disabled:cursor-default disabled:hover:bg-transparent"
                    >
                      <span className="flex items-baseline justify-between gap-3">
                        <span className="text-sm">{item.rotulo}</span>
                        <span className="shrink-0 text-xs tabular-nums text-muted-foreground">
                          {formatarNumero(item.comDado)}/{formatarNumero(item.total)} ·{" "}
                          {Math.round(fracao * 100)}%
                        </span>
                      </span>
                      <span className="mt-1.5 block h-2 w-full overflow-hidden rounded-full bg-muted">
                        <span
                          className="block h-full rounded-full transition-all"
                          style={{
                            width: `${fracao * 100}%`,
                            background:
                              fracao < LIMIAR_ALERTA ? "var(--grafico-5)" : "var(--grafico-4)",
                          }}
                        />
                      </span>
                      {faltam > 0 && (
                        <span className="mt-1 block text-xs text-muted-foreground/70 group-hover:text-primary">
                          faltam {formatarNumero(faltam)} — clique para ver quem
                        </span>
                      )}
                    </button>
                  </li>
                );
              })}
            </ul>
          </>
        )}

        <ModalFaltantes item={aberta} onFechar={() => setAberta(null)} />
      </CardContent>
    </Card>
  );
}

/** Lista paginada de quem está sem o dado, com link direto para a candidatura. */
function ModalFaltantes({
  item,
  onFechar,
}: {
  item: CoberturaItem | null;
  onFechar: () => void;
}) {
  const [pagina, setPagina] = useState(1);
  const { data, isLoading, isError } = useQuery({
    queryKey: ["faltantes", item?.chave, pagina],
    queryFn: () => buscarFaltantes(item!.chave, pagina, TAMANHO),
    enabled: Boolean(item),
  });

  // O tipo compartilhado de paginação não declara totalPaginas; calcular aqui evita
  // depender de um campo que o contrato não promete.
  const totalPaginas = data ? Math.max(1, Math.ceil(data.total / TAMANHO)) : 1;

  const fechar = () => {
    setPagina(1);
    onFechar();
  };

  return (
    <Modal
      aberto={Boolean(item)}
      onFechar={fechar}
      titulo={item ? `Sem ${item.rotulo.toLowerCase()}` : ""}
      descricao="Candidatos publicados que não têm este dado."
      className="max-w-2xl"
    >
      {isLoading && <Carregando />}
      {isError && <ErroEstado mensagem="Falha ao carregar a lista." />}
      {data && data.itens.length === 0 && <Vazio texto="Nenhuma pendência aqui." />}

      {data && data.itens.length > 0 && (
        <div className="space-y-3">
          <p className="text-xs text-muted-foreground">
            {formatarNumero(data.total)} candidatura(s) nesta situação.
          </p>
          <ul className="divide-y rounded-md border">
            {data.itens.map((f) => (
              <li key={f.candidaturaId}>
                <Link
                  to={`/candidaturas/${f.candidaturaId}`}
                  onClick={fechar}
                  className="flex items-center justify-between gap-3 px-3 py-2 transition-colors hover:bg-muted/60"
                >
                  <span className="min-w-0">
                    <span className="block truncate text-sm font-medium">{f.nomeUrna}</span>
                    <span className="block truncate text-xs text-muted-foreground">
                      {[f.partidoSigla, rotuloCargo(f.cargo), f.uf].filter(Boolean).join(" · ")}
                    </span>
                  </span>
                  <ExternalLink className="size-3.5 shrink-0 text-muted-foreground" aria-hidden="true" />
                </Link>
              </li>
            ))}
          </ul>

          {totalPaginas > 1 && (
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground">
                Página {data.pagina} de {totalPaginas}
              </span>
              <span className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPagina((p) => Math.max(1, p - 1))}
                  disabled={pagina <= 1}
                >
                  <ChevronLeft className="size-4" /> Anterior
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPagina((p) => p + 1)}
                  disabled={pagina >= totalPaginas}
                >
                  Próxima <ChevronRight className="size-4" />
                </Button>
              </span>
            </div>
          )}
        </div>
      )}
    </Modal>
  );
}
