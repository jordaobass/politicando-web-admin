import * as React from "react";
import { useQuery } from "@tanstack/react-query";
import { ChevronLeft, ChevronRight } from "lucide-react";

import { listarUsuarios } from "@/lib/api";
import { formatarDataHora, formatarNumero } from "@/lib/format";
import { useDebounce } from "@/hooks/use-debounce";
import { Cabecalho } from "@/components/layout/cabecalho";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Carregando, ErroEstado, Vazio } from "@/components/ui/estados";

const TAMANHO = 20;

export default function UsuariosPage() {
  const [busca, setBusca] = React.useState("");
  const [pagina, setPagina] = React.useState(1);
  const q = useDebounce(busca);

  React.useEffect(() => setPagina(1), [q]);

  const { data, isLoading, isError } = useQuery({
    queryKey: ["usuarios", q, pagina],
    queryFn: () => listarUsuarios({ q, pagina, tamanho: TAMANHO }),
    retry: false,
  });

  const total = data?.total ?? 0;
  const totalPaginas = Math.max(1, Math.ceil(total / TAMANHO));

  return (
    <>
      <Cabecalho titulo="Usuários" descricao="Eleitores cadastrados e atividade no quiz." />

      <Card className="mb-4">
        <CardContent className="p-4">
          <Input
            placeholder="Buscar por nome ou e-mail…"
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            className="max-w-sm"
          />
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-0">
          {isLoading && <Carregando />}
          {isError && (
            <ErroEstado mensagem="Endpoint de usuários ainda não disponível no backend (/admin/usuarios)." />
          )}
          {data && data.itens.length === 0 && <Vazio texto="Nenhum usuário encontrado." />}

          {data && data.itens.length > 0 && (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome</TableHead>
                  <TableHead>E-mail</TableHead>
                  <TableHead>Papel</TableHead>
                  <TableHead className="text-center">Quizzes</TableHead>
                  <TableHead>Cadastro</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.itens.map((u) => (
                  <TableRow key={u.id}>
                    <TableCell className="font-medium">{u.nome}</TableCell>
                    <TableCell className="text-muted-foreground">{u.email}</TableCell>
                    <TableCell>
                      <Badge variant={u.papel === "Admin" ? "default" : "neutral"}>{u.papel}</Badge>
                    </TableCell>
                    <TableCell className="text-center tabular-nums">
                      {formatarNumero(u.quizzes ?? 0)}
                    </TableCell>
                    <TableCell className="text-muted-foreground">{formatarDataHora(u.criadoEm)}</TableCell>
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
            {total} usuário(s) · página {pagina} de {totalPaginas}
          </span>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" disabled={pagina <= 1} onClick={() => setPagina((p) => p - 1)}>
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
