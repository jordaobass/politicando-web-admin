import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { toast } from "sonner";

import { listarPartidos, removerPartido } from "@/lib/api";
import { Cabecalho } from "@/components/layout/cabecalho";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Carregando, ErroEstado, Vazio } from "@/components/ui/estados";

export default function PartidosPage() {
  const qc = useQueryClient();
  const navigate = useNavigate();

  const { data, isLoading, isError } = useQuery({ queryKey: ["partidos"], queryFn: listarPartidos });

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
          <Button onClick={() => navigate("/partidos/novo")}>
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
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => navigate(`/partidos/${p.id}`)}
                          aria-label="Editar"
                        >
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
    </>
  );
}
