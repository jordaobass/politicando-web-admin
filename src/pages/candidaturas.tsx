import * as React from "react";
import { Link } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Eye, EyeOff, ChevronLeft, ChevronRight } from "lucide-react";
import { toast } from "sonner";

import {
  listarCandidaturasAdmin,
  definirPublicacao,
  definirPublicacaoEmMassa,
} from "@/lib/api";
import { CARGOS, ORIGENS, UFS, type CandidaturaAdmin } from "@/lib/types";
import { useDebounce } from "@/hooks/use-debounce";
import { Cabecalho } from "@/components/layout/cabecalho";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Carregando, ErroEstado, Vazio } from "@/components/ui/estados";

const TAMANHO = 20;

function rotuloOrigem(origem: string) {
  return ORIGENS.find((o) => o.valor === origem)?.rotulo ?? origem;
}

export default function CandidaturasPage() {
  const qc = useQueryClient();
  const [cargo, setCargo] = React.useState("");
  const [uf, setUf] = React.useState("");
  const [busca, setBusca] = React.useState("");
  const [pagina, setPagina] = React.useState(1);
  const q = useDebounce(busca);

  React.useEffect(() => setPagina(1), [cargo, uf, q]);

  const filtros = { cargo, uf, q, pagina, tamanho: TAMANHO };
  const { data, isLoading, isError } = useQuery({
    queryKey: ["admin-candidaturas", filtros],
    queryFn: () => listarCandidaturasAdmin(filtros),
  });

  const togglePublicacao = useMutation({
    mutationFn: (c: CandidaturaAdmin) => definirPublicacao(c.id, !(c.publicado ?? true)),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin-candidaturas"] }),
    onError: (e) => toast.error(e instanceof Error ? e.message : "Falha ao alterar publicação."),
  });

  const massa = useMutation({
    mutationFn: (publicado: boolean) =>
      definirPublicacaoEmMassa({ publicado, cargo: cargo || undefined, uf: uf || undefined }),
    onSuccess: (r) => {
      toast.success(`${r.afetados} candidatura(s) atualizadas.`);
      qc.invalidateQueries({ queryKey: ["admin-candidaturas"] });
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Falha na ação em massa."),
  });

  const total = data?.total ?? 0;
  const totalPaginas = Math.max(1, Math.ceil(total / TAMANHO));

  // Ação em massa mexe no que é público — confirma com escopo e volume antes de aplicar.
  function confirmarMassa(publicado: boolean) {
    const escopo =
      [cargo && CARGOS.find((c) => c.valor === cargo)?.rotulo, uf].filter(Boolean).join(" · ") ||
      "todos os cargos e UFs";
    const acao = publicado ? "Publicar" : "Ocultar";
    if (confirm(`${acao} ${total} candidatura(s) do filtro atual (${escopo})?`)) {
      massa.mutate(publicado);
    }
  }

  return (
    <>
      <Cabecalho
        titulo="Candidaturas"
        descricao="Curadoria: controle o que aparece no site e entra no ranking do quiz."
      />

      <Card className="mb-4">
        <CardContent className="flex flex-wrap items-end gap-3 p-4">
          <div className="min-w-48 flex-1">
            <Input
              placeholder="Buscar por nome…"
              aria-label="Buscar candidatura por nome"
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
            />
          </div>
          <Select
            value={cargo}
            onChange={(e) => setCargo(e.target.value)}
            className="w-44"
            aria-label="Filtrar por cargo"
          >
            <option value="">Todos os cargos</option>
            {CARGOS.map((c) => (
              <option key={c.valor} value={c.valor}>
                {c.rotulo}
              </option>
            ))}
          </Select>
          <Select
            value={uf}
            onChange={(e) => setUf(e.target.value)}
            className="w-28"
            aria-label="Filtrar por UF"
          >
            <option value="">UF</option>
            {UFS.map((u) => (
              <option key={u} value={u}>
                {u}
              </option>
            ))}
          </Select>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => confirmarMassa(true)} disabled={massa.isPending}>
              <Eye /> Publicar grupo
            </Button>
            <Button variant="outline" size="sm" onClick={() => confirmarMassa(false)} disabled={massa.isPending}>
              <EyeOff /> Ocultar grupo
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-0">
          {isLoading && <Carregando />}
          {isError && <ErroEstado mensagem="Falha ao carregar candidaturas." />}
          {data && data.itens.length === 0 && <Vazio texto="Nenhuma candidatura encontrada." />}

          {data && data.itens.length > 0 && (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Candidato</TableHead>
                  <TableHead>Partido</TableHead>
                  <TableHead>Cargo / UF</TableHead>
                  <TableHead>Origem</TableHead>
                  <TableHead className="text-center">Scores</TableHead>
                  <TableHead className="text-right">Publicado</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.itens.map((c) => (
                  <TableRow key={c.id}>
                    <TableCell>
                      <Link
                        to={`/candidaturas/${c.id}`}
                        className="flex items-center gap-3 text-left hover:underline"
                      >
                        {c.fotoUrl ? (
                          <img
                            src={c.fotoUrl}
                            alt=""
                            className="size-8 rounded-full object-cover"
                          />
                        ) : (
                          <div className="size-8 rounded-full bg-muted" />
                        )}
                        <span className="font-medium">{c.nomeUrna}</span>
                      </Link>
                    </TableCell>
                    <TableCell>{c.partidoSigla ?? "—"}</TableCell>
                    <TableCell className="whitespace-nowrap text-muted-foreground">
                      {CARGOS.find((x) => x.valor === c.cargo)?.rotulo ?? c.cargo} · {c.uf}
                    </TableCell>
                    <TableCell>
                      <Badge variant="neutral">{rotuloOrigem(c.origem)}</Badge>
                    </TableCell>
                    <TableCell className="text-center tabular-nums">{c.scores.length}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end">
                        <Switch
                          checked={c.publicado ?? true}
                          disabled={togglePublicacao.isPending}
                          onCheckedChange={() => togglePublicacao.mutate(c)}
                          aria-label={`Publicar ${c.nomeUrna}`}
                        />
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {data && total > 0 && (
        <div className="mt-4 flex items-center justify-between text-sm text-muted-foreground">
          <span>
            {total} candidatura(s) · página {pagina} de {totalPaginas}
          </span>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={pagina <= 1}
              onClick={() => setPagina((p) => p - 1)}
            >
              <ChevronLeft /> Anterior
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={pagina >= totalPaginas}
              onClick={() => setPagina((p) => p + 1)}
            >
              Próxima <ChevronRight />
            </Button>
          </div>
        </div>
      )}
    </>
  );
}
