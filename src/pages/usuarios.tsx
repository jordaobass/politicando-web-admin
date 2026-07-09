import * as React from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ChevronLeft, ChevronRight, UserPlus, ShieldCheck, KeyRound, Copy, Trash2 } from "lucide-react";
import { toast } from "sonner";

import {
  listarUsuarios,
  listarCatalogoPermissoes,
  permissoesDoUsuario,
  definirPermissoes,
  alterarPapel,
  revogarAdmin,
  listarConvites,
  criarConvite,
  revogarConvite,
} from "@/lib/api";
import type { PermissaoCatalogo, UsuarioAdmin } from "@/lib/types";
import { formatarDataHora, formatarNumero } from "@/lib/format";
import { useDebounce } from "@/hooks/use-debounce";
import { useAuth } from "@/lib/auth";
import { Cabecalho } from "@/components/layout/cabecalho";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Select } from "@/components/ui/select";
import { Modal } from "@/components/ui/modal";
import { Switch } from "@/components/ui/switch";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Carregando, ErroEstado, Vazio } from "@/components/ui/estados";

const TAMANHO = 20;
const PAPEIS: { valor: string; rotulo: string; super?: boolean }[] = [
  { valor: "Usuario", rotulo: "Usuário comum" },
  { valor: "Admin", rotulo: "Admin" },
  { valor: "SuperAdmin", rotulo: "Super admin", super: true },
];

export default function UsuariosPage() {
  const { usuario, temPermissao } = useAuth();
  const ehSuper = usuario?.papel === "SuperAdmin";
  const qc = useQueryClient();
  const [busca, setBusca] = React.useState("");
  const [pagina, setPagina] = React.useState(1);
  const [convidando, setConvidando] = React.useState(false);
  const [permsDe, setPermsDe] = React.useState<UsuarioAdmin | null>(null);
  const q = useDebounce(busca);

  React.useEffect(() => setPagina(1), [q]);

  const { data, isLoading, isError } = useQuery({
    queryKey: ["usuarios", q, pagina],
    queryFn: () => listarUsuarios({ q, pagina, tamanho: TAMANHO }),
    retry: false,
  });
  const { data: convites } = useQuery({ queryKey: ["convites"], queryFn: listarConvites, retry: false });

  const invalidar = () => {
    qc.invalidateQueries({ queryKey: ["usuarios"] });
    qc.invalidateQueries({ queryKey: ["convites"] });
  };

  const papelMut = useMutation({
    mutationFn: ({ id, papel }: { id: string; papel: string }) => alterarPapel(id, papel),
    onSuccess: () => { toast.success("Papel atualizado."); invalidar(); },
    onError: (e: Error) => toast.error(e.message),
  });
  const revogarMut = useMutation({
    mutationFn: (id: string) => revogarAdmin(id),
    onSuccess: () => { toast.success("Acesso de admin revogado."); invalidar(); },
    onError: (e: Error) => toast.error(e.message),
  });
  const revogarConviteMut = useMutation({
    mutationFn: (id: string) => revogarConvite(id),
    onSuccess: () => { toast.success("Convite revogado."); invalidar(); },
    onError: (e: Error) => toast.error(e.message),
  });

  const total = data?.total ?? 0;
  const totalPaginas = Math.max(1, Math.ceil(total / TAMANHO));

  return (
    <>
      <Cabecalho
        titulo="Usuários e admins"
        descricao="Papéis, permissões e convites do painel."
        acao={
          <Button onClick={() => setConvidando(true)}>
            <UserPlus /> Convidar admin
          </Button>
        }
      />

      {convites && convites.length > 0 && (
        <Card className="mb-4">
          <CardContent className="p-4">
            <p className="mb-2 text-sm font-medium">Convites pendentes</p>
            <ul className="space-y-2">
              {convites.map((c) => (
                <li key={c.id} className="flex items-center justify-between text-sm">
                  <span>
                    <span className="font-medium">{c.nome}</span>{" "}
                    <span className="text-muted-foreground">({c.email})</span> ·{" "}
                    <Badge variant="neutral">{c.papel}</Badge> · expira {formatarDataHora(c.expiraEm)}
                  </span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => revogarConviteMut.mutate(c.id)}
                  >
                    <Trash2 /> Revogar
                  </Button>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

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
          {isError && <ErroEstado mensagem="Não foi possível carregar os usuários." />}
          {data && data.itens.length === 0 && <Vazio texto="Nenhum usuário encontrado." />}

          {data && data.itens.length > 0 && (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome</TableHead>
                  <TableHead>E-mail</TableHead>
                  <TableHead>Papel</TableHead>
                  <TableHead className="text-center">Quizzes</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.itens.map((u) => {
                  const ehEu = u.id === usuario?.id;
                  const staff = u.papel === "Admin" || u.papel === "SuperAdmin";
                  return (
                    <TableRow key={u.id}>
                      <TableCell className="font-medium">{u.nome}</TableCell>
                      <TableCell className="text-muted-foreground">{u.email}</TableCell>
                      <TableCell>
                        <Select
                          value={u.papel}
                          disabled={ehEu || papelMut.isPending}
                          onChange={(e) => papelMut.mutate({ id: u.id, papel: e.target.value })}
                          className="h-8 w-36"
                        >
                          {PAPEIS.filter((p) => ehSuper || !p.super).map((p) => (
                            <option key={p.valor} value={p.valor}>{p.rotulo}</option>
                          ))}
                        </Select>
                      </TableCell>
                      <TableCell className="text-center tabular-nums">
                        {formatarNumero(u.quizzes ?? 0)}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                          {u.papel === "Admin" && (
                            <Button variant="ghost" size="sm" onClick={() => setPermsDe(u)}>
                              <KeyRound /> Permissões
                            </Button>
                          )}
                          {u.papel === "SuperAdmin" && (
                            <span className="inline-flex items-center gap-1 px-2 text-xs text-muted-foreground">
                              <ShieldCheck className="size-3.5" /> acesso total
                            </span>
                          )}
                          {staff && !ehEu && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => revogarMut.mutate(u.id)}
                            >
                              <Trash2 /> Remover
                            </Button>
                          )}
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

      {data && total > 0 && (
        <div className="mt-4 flex items-center justify-between text-sm text-muted-foreground">
          <span>{total} usuário(s) · página {pagina} de {totalPaginas}</span>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" disabled={pagina <= 1} onClick={() => setPagina((p) => p - 1)}>
              <ChevronLeft /> Anterior
            </Button>
            <Button variant="outline" size="sm" disabled={pagina >= totalPaginas} onClick={() => setPagina((p) => p + 1)}>
              Próxima <ChevronRight />
            </Button>
          </div>
        </div>
      )}

      {convidando && (
        <ModalConvidar ehSuper={ehSuper} onFechar={() => setConvidando(false)} onOk={invalidar} />
      )}
      {permsDe && (
        <ModalPermissoes usuario={permsDe} onFechar={() => setPermsDe(null)} habilitado={temPermissao("usuarios.gerir")} />
      )}
    </>
  );
}

/** Modal de convite: gera o link copiável (sem SMTP). */
function ModalConvidar({ ehSuper, onFechar, onOk }: { ehSuper: boolean; onFechar: () => void; onOk: () => void }) {
  const [nome, setNome] = React.useState("");
  const [email, setEmail] = React.useState("");
  const [papel, setPapel] = React.useState("Admin");
  const [link, setLink] = React.useState<string | null>(null);

  const mut = useMutation({
    mutationFn: () => criarConvite({ nome, email, papel }),
    onSuccess: (c) => {
      setLink(`${window.location.origin}/definir-senha?token=${encodeURIComponent(c.token)}`);
      onOk();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  async function copiar() {
    if (!link) return;
    await navigator.clipboard.writeText(link);
    toast.success("Link copiado.");
  }

  return (
    <Modal aberto onFechar={onFechar} titulo="Convidar admin" descricao="Gera um link para o convidado definir a senha.">
      {link ? (
        <div className="space-y-3">
          <p className="text-sm text-muted-foreground">
            Envie este link ao convidado (válido por 7 dias). Ele abre e define a própria senha.
          </p>
          <div className="flex gap-2">
            <Input readOnly value={link} onFocus={(e) => e.currentTarget.select()} />
            <Button onClick={copiar}><Copy /> Copiar</Button>
          </div>
          <div className="flex justify-end">
            <Button variant="outline" onClick={onFechar}>Fechar</Button>
          </div>
        </div>
      ) : (
        <form
          className="space-y-4"
          onSubmit={(e) => { e.preventDefault(); mut.mutate(); }}
        >
          <div className="space-y-1.5">
            <Label htmlFor="c-nome">Nome</Label>
            <Input id="c-nome" value={nome} onChange={(e) => setNome(e.target.value)} required />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="c-email">E-mail</Label>
            <Input id="c-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="c-papel">Papel</Label>
            <Select id="c-papel" value={papel} onChange={(e) => setPapel(e.target.value)}>
              <option value="Admin">Admin</option>
              {ehSuper && <option value="SuperAdmin">Super admin</option>}
            </Select>
          </div>
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={onFechar}>Cancelar</Button>
            <Button type="submit" disabled={mut.isPending}>Gerar link</Button>
          </div>
        </form>
      )}
    </Modal>
  );
}

/** Modal da matriz de permissões de um admin (agrupada). */
function ModalPermissoes({
  usuario,
  onFechar,
  habilitado,
}: {
  usuario: UsuarioAdmin;
  onFechar: () => void;
  habilitado: boolean;
}) {
  const qc = useQueryClient();
  const { data: catalogo } = useQuery({ queryKey: ["perm-catalogo"], queryFn: listarCatalogoPermissoes, retry: false });
  const { data: atuais } = useQuery({
    queryKey: ["perm-usuario", usuario.id],
    queryFn: () => permissoesDoUsuario(usuario.id),
    retry: false,
  });
  const [sel, setSel] = React.useState<Set<string> | null>(null);

  React.useEffect(() => {
    if (atuais) setSel(new Set(atuais));
  }, [atuais]);

  const mut = useMutation({
    mutationFn: () => definirPermissoes(usuario.id, Array.from(sel ?? [])),
    onSuccess: () => {
      toast.success("Permissões salvas.");
      qc.invalidateQueries({ queryKey: ["perm-usuario", usuario.id] });
      onFechar();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const grupos = agruparPorGrupo(catalogo ?? []);

  function alternar(chave: string) {
    setSel((atual) => {
      const proximo = new Set(atual);
      if (proximo.has(chave)) proximo.delete(chave);
      else proximo.add(chave);
      return proximo;
    });
  }

  return (
    <Modal aberto onFechar={onFechar} titulo={`Permissões — ${usuario.nome}`} descricao="O que este admin pode gerir.">
      {!catalogo || sel === null ? (
        <Carregando />
      ) : (
        <div className="space-y-4">
          {grupos.map(([grupo, itens]) => (
            <div key={grupo} className="space-y-2">
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{grupo}</p>
              {itens.map((p) => (
                <label key={p.chave} className="flex items-center justify-between gap-3 text-sm">
                  <span>{p.nome}</span>
                  <Switch
                    checked={sel.has(p.chave)}
                    disabled={!habilitado}
                    onCheckedChange={() => alternar(p.chave)}
                  />
                </label>
              ))}
            </div>
          ))}
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={onFechar}>Cancelar</Button>
            <Button onClick={() => mut.mutate()} disabled={mut.isPending || !habilitado}>Salvar</Button>
          </div>
        </div>
      )}
    </Modal>
  );
}

function agruparPorGrupo(itens: PermissaoCatalogo[]): [string, PermissaoCatalogo[]][] {
  const mapa = new Map<string, PermissaoCatalogo[]>();
  for (const p of itens) {
    const lista = mapa.get(p.grupo) ?? [];
    lista.push(p);
    mapa.set(p.grupo, lista);
  }
  return Array.from(mapa.entries());
}
