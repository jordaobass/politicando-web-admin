import { useEffect, useRef, useState, type ReactNode } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Link, useParams } from "react-router-dom";
import { ArrowLeft, ExternalLink, Loader2, Sparkles, Trash2 } from "lucide-react";
import { toast } from "sonner";

import {
  analisarCandidatura,
  criarFonte,
  definirNumeroUrna,
  listarFontes,
  obterAtividade,
  obterCandidatura,
  removerFonte,
} from "@/lib/api";
import { CARGOS, ORIGENS, type AtividadeLegislativa, type CandidaturaDetalhe } from "@/lib/types";
import { formatarData, formatarDataHora, formatarMoeda, formatarNumero } from "@/lib/format";
import { Cabecalho } from "@/components/layout/cabecalho";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select } from "@/components/ui/select";
import { Tabs, type Aba } from "@/components/ui/tabs";
import { Carregando, ErroEstado, Vazio } from "@/components/ui/estados";

const erroToast = (e: unknown) => toast.error(e instanceof Error ? e.message : "Falha na operação.");

function rotulo(lista: readonly { valor: string; rotulo: string }[], valor: string) {
  return lista.find((x) => x.valor === valor)?.rotulo ?? valor;
}

/** "57ª legislatura · 2023–2027" (57ª começou em 2023; blocos de 4 anos). */
function rotuloLeg(n: number) {
  const inicio = 2023 + (n - 57) * 4;
  return `${n}ª legislatura · ${inicio}–${inicio + 4}`;
}

/** Filtro de mandato: vira <select> quando há mais de uma legislatura; senão só rótulo. */
function SeletorLeg({ valor, opcoes, onChange }: { valor: number; opcoes: number[]; onChange: (n: number) => void }) {
  if (opcoes.length <= 1) {
    return <span className="text-sm text-muted-foreground">{rotuloLeg(valor)}</span>;
  }
  return (
    <Select value={String(valor)} onChange={(e) => onChange(Number(e.target.value))} className="w-60">
      {opcoes.map((n) => (
        <option key={n} value={n}>
          {rotuloLeg(n)}
        </option>
      ))}
    </Select>
  );
}

/** Card simples usado como painel de cada aba. */
function Painel({ children }: { children: ReactNode }) {
  return (
    <Card>
      <CardContent className="space-y-4 p-5">{children}</CardContent>
    </Card>
  );
}

/** Linha rótulo→valor; oculta quando o valor está vazio. */
function Info({ rotulo: r, valor }: { rotulo: string; valor: ReactNode }) {
  if (valor === null || valor === undefined || valor === "" || valor === "—") return null;
  return (
    <div className="flex flex-col gap-0.5">
      <dt className="text-xs uppercase tracking-wide text-muted-foreground">{r}</dt>
      <dd className="text-sm">{valor}</dd>
    </div>
  );
}

/** Número de urna editável (curadoria do admin): input + salvar, dentro do grid do perfil. */
function NumeroUrnaEditavel({ c }: { c: CandidaturaDetalhe }) {
  const qc = useQueryClient();
  const [texto, setTexto] = useState<string | null>(null);
  const valor = texto ?? (c.numeroUrna != null ? String(c.numeroUrna) : "");
  const salvar = useMutation({
    mutationFn: () => definirNumeroUrna(c.id, valor.trim() === "" ? null : Number(valor)),
    onSuccess: () => {
      toast.success("Número de urna salvo.");
      setTexto(null);
      qc.invalidateQueries({ queryKey: ["admin-candidatura", c.id] });
    },
    onError: erroToast,
  });
  const original = c.numeroUrna != null ? String(c.numeroUrna) : "";
  const alterado = valor.trim() !== original;
  const invalido = valor.trim() !== "" && !/^\d+$/.test(valor.trim());
  return (
    <div className="flex flex-col gap-0.5">
      <dt className="text-xs uppercase tracking-wide text-muted-foreground">Número de urna</dt>
      <dd className="flex items-center gap-2">
        <Input
          inputMode="numeric"
          value={valor}
          onChange={(e) => setTexto(e.target.value)}
          placeholder="ex: 1300"
          className="h-8 w-28"
          aria-label="Número de urna"
        />
        <Button
          size="sm"
          variant="outline"
          disabled={!alterado || invalido || salvar.isPending}
          onClick={() => salvar.mutate()}
        >
          {salvar.isPending ? "…" : "Salvar"}
        </Button>
      </dd>
      {invalido && <span className="text-xs text-destructive">Apenas dígitos.</span>}
    </div>
  );
}

function ConteudoPerfil({ c }: { c: CandidaturaDetalhe }) {
  const p = c.politico;
  const redes = [
    p.instagram && { href: p.instagram, label: "Instagram" },
    p.twitter && { href: p.twitter, label: "Twitter/X" },
    p.siteOficial && { href: p.siteOficial, label: "Site oficial" },
  ].filter(Boolean) as { href: string; label: string }[];

  return (
    <Painel>
      <dl className="grid grid-cols-2 gap-4 sm:grid-cols-3">
        <Info rotulo="Nome civil" valor={p.nomeCivil} />
        <Info rotulo="Nome de urna" valor={p.nomeUrna} />
        <Info rotulo="Partido" valor={c.partidoNome ? `${c.partidoNome} (${c.partidoSigla})` : c.partidoSigla} />
        <Info rotulo="Cargo" valor={rotulo(CARGOS, c.cargo)} />
        <Info rotulo="UF" valor={c.uf} />
        <NumeroUrnaEditavel c={c} />
        <Info rotulo="Situação" valor={c.situacao} />
        <Info rotulo="Origem" valor={rotulo(ORIGENS, c.origem)} />
        <Info rotulo="Nascimento" valor={formatarData(p.dataNascimento)} />
        <Info rotulo="Sexo" valor={p.sexo} />
        <Info rotulo="Naturalidade" valor={p.ufNaturalidade} />
        <Info rotulo="Escolaridade" valor={p.escolaridade} />
        <Info rotulo="Ocupação" valor={p.ocupacao} />
        <Info rotulo="Eleito" valor={c.eleito ? "Sim" : "Não"} />
        <Info rotulo="Votos recebidos" valor={formatarNumero(c.votosRecebidos)} />
        <Info rotulo="Financiamento" valor={formatarMoeda(c.financiamentoTotal)} />
      </dl>

      {redes.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {redes.map((r) => (
            <a key={r.label} href={r.href} target="_blank" rel="noreferrer">
              <Badge variant="neutral" className="gap-1">
                {r.label} <ExternalLink className="size-3" />
              </Badge>
            </a>
          ))}
        </div>
      )}

      {p.biografia && (
        <div className="space-y-1">
          <h3 className="text-xs uppercase tracking-wide text-muted-foreground">Biografia</h3>
          <p className="whitespace-pre-line text-sm leading-relaxed">{p.biografia}</p>
        </div>
      )}
    </Painel>
  );
}

const MAX_FONTE = 1000;

function ConteudoFontes({ candidaturaId }: { candidaturaId: string }) {
  const qc = useQueryClient();
  const [conteudo, setConteudo] = useState("");
  const [rotulo, setRotulo] = useState("");
  const fontes = useQuery({
    queryKey: ["admin-fontes", candidaturaId],
    queryFn: () => listarFontes(candidaturaId),
  });
  const inval = () => qc.invalidateQueries({ queryKey: ["admin-fontes", candidaturaId] });

  const criar = useMutation({
    mutationFn: () => criarFonte(candidaturaId, conteudo.trim(), rotulo || undefined),
    onSuccess: () => { setConteudo(""); setRotulo(""); inval(); },
    onError: erroToast,
  });
  const remover = useMutation({
    mutationFn: (id: string) => removerFonte(id),
    onSuccess: inval,
    onError: erroToast,
  });

  return (
    <Painel>
      <p className="text-sm text-muted-foreground">
        Trechos de programa, propostas ou manifesto do candidato (texto livre, até {MAX_FONTE} caracteres).
        Cada fonte entra direto como evidência na análise da IA.
      </p>
      <div className="space-y-2">
        <Input
          placeholder="rótulo (ex: Plano 2022)"
          value={rotulo}
          onChange={(e) => setRotulo(e.target.value)}
          className="w-full sm:w-64"
        />
        <Textarea
          placeholder="Cole aqui o texto da fonte…"
          value={conteudo}
          maxLength={MAX_FONTE}
          rows={5}
          onChange={(e) => setConteudo(e.target.value)}
        />
        <div className="flex items-center justify-between gap-2">
          <span className="text-xs text-muted-foreground">{conteudo.length}/{MAX_FONTE}</span>
          <Button size="sm" disabled={!conteudo.trim() || criar.isPending} onClick={() => criar.mutate()}>
            Adicionar fonte
          </Button>
        </div>
      </div>

      {fontes.isLoading && <Carregando />}
      {fontes.data?.length === 0 && <Vazio texto="Nenhuma fonte cadastrada." />}
      {fontes.data?.map((f) => (
        <div key={f.id} className="space-y-1 rounded-md border p-3">
          <div className="flex items-center justify-between gap-2">
            <span className="min-w-0 truncate font-medium">{f.rotulo || "Fonte de texto"}</span>
            <div className="flex shrink-0 items-center gap-2">
              <Badge variant="neutral">
                {f.status}
                {f.conteudo ? ` · ${f.conteudo.length}c` : ""}
              </Badge>
              <Button variant="ghost" size="icon" onClick={() => remover.mutate(f.id)} aria-label="Remover fonte">
                <Trash2 />
              </Button>
            </div>
          </div>
          {f.conteudo && <p className="line-clamp-3 text-xs text-muted-foreground">{f.conteudo}</p>}
        </div>
      ))}
    </Painel>
  );
}

function ConteudoScores({ c }: { c: CandidaturaDetalhe }) {
  // Ordena por engajamento (0..5) desc; trata nulos como 0.
  const scores = [...c.scores].sort((a, b) => (b.engajamento ?? 0) - (a.engajamento ?? 0));
  if (scores.length === 0) {
    return (
      <Painel>
        <Vazio texto="Sem análise ainda. Use “Analisar com IA” no topo." />
      </Painel>
    );
  }
  return (
    <Painel>
      <ul className="space-y-4">
        {scores.map((s) => {
          const eng = s.engajamento ?? 0;
          return (
            <li key={s.categoriaId} className="space-y-1">
              <div className="flex items-center justify-between gap-2 text-sm">
                <span className="font-medium">{s.categoria}</span>
                <span className="flex items-center gap-2 tabular-nums">
                  {s.posicao != null && (
                    <span className="text-muted-foreground">posição {s.posicao}/100</span>
                  )}
                  <Badge variant="neutral">eng. {eng.toFixed(1)}/5</Badge>
                </span>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-muted">
                <div
                  className="h-full rounded-full bg-primary"
                  style={{ width: `${(Math.min(5, Math.max(0, eng)) / 5) * 100}%` }}
                />
              </div>
              {s.posicaoSintese && <p className="text-sm font-medium">{s.posicaoSintese}</p>}
              {s.justificativa && <p className="text-sm text-muted-foreground">{s.justificativa}</p>}
              {s.confianca != null && (
                <p className="text-xs text-muted-foreground">
                  confiança {(s.confianca * 100).toFixed(0)}%
                </p>
              )}
            </li>
          );
        })}
      </ul>
    </Painel>
  );
}

function ListaProposicoes({ itens, vazio }: { itens: AtividadeLegislativa["projetos"]; vazio: string }) {
  if (itens.length === 0) return <Vazio texto={vazio} />;
  return (
    <ul className="divide-y">
      {itens.map((p) => (
        <li key={p.idExterno} className="py-2 text-sm">
          <a href={p.urlPortal} target="_blank" rel="noreferrer" className="font-medium hover:underline">
            {p.rotulo}
          </a>
          <span className="ml-2 text-muted-foreground">{p.status}</span>
          <p className="line-clamp-2 text-muted-foreground">{p.ementa}</p>
        </li>
      ))}
    </ul>
  );
}

interface PropsAtividadeLeg {
  a: AtividadeLegislativa;
  leg: number;
  opcoes: number[];
  onLeg: (n: number) => void;
}

function ConteudoProjetos({ a, leg, opcoes, onLeg }: PropsAtividadeLeg) {
  const projetos = a.projetos.filter((p) => p.legislatura === leg);
  const relatorias = a.relatorias.filter((p) => p.legislatura === leg);
  return (
    <Painel>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h3 className="text-sm font-medium">Projetos de autoria ({projetos.length})</h3>
        <SeletorLeg valor={leg} opcoes={opcoes} onChange={onLeg} />
      </div>
      <ListaProposicoes itens={projetos} vazio="Nenhum projeto nesta legislatura." />
      {relatorias.length > 0 && (
        <div className="space-y-2">
          <h3 className="text-sm font-medium">Relatorias ({relatorias.length})</h3>
          <ListaProposicoes itens={relatorias} vazio="Nenhuma relatoria." />
        </div>
      )}
    </Painel>
  );
}

function ConteudoVotacoes({ a, leg, opcoes, onLeg }: PropsAtividadeLeg) {
  const votacoes = a.votacoes.filter((v) => v.legislatura === leg);
  return (
    <Painel>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h3 className="text-sm font-medium">Votações ({votacoes.length})</h3>
        <SeletorLeg valor={leg} opcoes={opcoes} onChange={onLeg} />
      </div>
      {votacoes.length === 0 ? (
        <Vazio texto="Nenhuma votação nesta legislatura." />
      ) : (
        <ul className="divide-y">
          {votacoes.map((v, i) => (
            <li key={i} className="flex items-start justify-between gap-3 py-2 text-sm">
              <a href={v.urlPortal} target="_blank" rel="noreferrer" className="hover:underline">
                {v.descricao}
              </a>
              <Badge variant="neutral">{v.voto}</Badge>
            </li>
          ))}
        </ul>
      )}
    </Painel>
  );
}

function ConteudoPresencaGastos({ a }: { a: AtividadeLegislativa }) {
  const r = a.resumo;
  const cards = [
    { rotulo: "Projetos", valor: r.projetosTotal },
    { rotulo: "Aprovados", valor: r.projetosAprovados },
    { rotulo: "Em tramitação", valor: r.projetosEmTramitacao },
    { rotulo: "Votações", valor: r.votacoes },
    { rotulo: "Relatorias", valor: r.relatorias },
    { rotulo: "Presença", valor: r.presencaPercentual != null ? `${r.presencaPercentual}%` : "—" },
  ];
  return (
    <Painel>
      <div className="grid grid-cols-3 gap-3 sm:grid-cols-6">
        {cards.map((card) => (
          <div key={card.rotulo} className="rounded-md border p-3 text-center">
            <div className="text-lg font-semibold tabular-nums">{card.valor}</div>
            <div className="text-xs text-muted-foreground">{card.rotulo}</div>
          </div>
        ))}
      </div>

      {a.presenca && (
        <p className="text-sm">
          <span className="font-medium">Presença {a.presenca.ano}:</span> {a.presenca.percentual}% (
          {a.presenca.sessoesPresente}/{a.presenca.sessoesTotais} sessões)
        </p>
      )}

      {a.gabinete ? (
        <div className="space-y-2">
          <p className="text-sm">
            <span className="font-medium">Cota parlamentar {a.gabinete.ano}:</span>{" "}
            {formatarMoeda(a.gabinete.total)}
          </p>
          {a.gabinete.porTipo.length > 0 && (
            <ul className="divide-y text-sm">
              {a.gabinete.porTipo.map((t) => (
                <li key={t.tipo} className="flex justify-between py-1.5">
                  <span className="text-muted-foreground">{t.tipo}</span>
                  <span className="tabular-nums">{formatarMoeda(t.total)}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      ) : (
        <Vazio texto="Sem dados de cota parlamentar." />
      )}
    </Painel>
  );
}

export default function CandidaturaDetalhePage() {
  const { id = "" } = useParams();
  const qc = useQueryClient();
  const [legSel, setLegSel] = useState<number | null>(null);
  const [analisando, setAnalisando] = useState(false);
  const analisadoEmRef = useRef<string | null>(null);
  const pollsRef = useRef(0);

  const detalhe = useQuery({
    queryKey: ["admin-candidatura", id],
    queryFn: () => obterCandidatura(id),
    enabled: !!id,
    refetchInterval: analisando ? 4000 : false, // polling enquanto a IA roda em background
  });

  const atividade = useQuery({
    queryKey: ["admin-candidatura-atividade", id],
    queryFn: () => obterAtividade(id),
    enabled: !!id,
  });

  // Dispara a análise (202) e ativa o polling; a conclusão é tratada no efeito abaixo.
  const analisar = useMutation({
    mutationFn: () => analisarCandidatura(id),
    onMutate: () => {
      analisadoEmRef.current = detalhe.data?.analisadoEm ?? null;
      pollsRef.current = 0;
      setAnalisando(true);
    },
    onError: (e) => {
      setAnalisando(false);
      toast.error(e instanceof Error ? e.message : "Falha ao iniciar a análise.");
    },
  });

  // Detecta a conclusão da análise em background: analisadoEm muda no detalhe.
  useEffect(() => {
    if (!analisando) return;
    const atual = detalhe.data?.analisadoEm ?? null;
    if (atual && atual !== analisadoEmRef.current) {
      setAnalisando(false);
      const r = detalhe.data;
      toast.success(
        `Análise concluída · ${((r?.analiseDuracaoMs ?? 0) / 1000).toFixed(1)}s · ${r?.analiseTokens ?? 0} tokens`,
      );
      return;
    }
    pollsRef.current += 1;
    if (pollsRef.current > 75) {
      setAnalisando(false);
      toast.error("A análise está demorando mais que o esperado. Atualize a página em instantes.");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [detalhe.dataUpdatedAt]);

  if (detalhe.isLoading) return <Carregando />;
  if (detalhe.isError || !detalhe.data) return <ErroEstado mensagem="Falha ao carregar o candidato." />;

  const c = detalhe.data;
  const a = atividade.data;
  const legislaturas = a
    ? [...new Set([...a.projetos, ...a.relatorias, ...a.votacoes].map((x) => x.legislatura))]
        .filter((n) => n > 0)
        .sort((x, y) => y - x)
    : [];
  const leg = legSel ?? legislaturas[0] ?? 57;
  const nProj = a ? a.projetos.filter((p) => p.legislatura === leg).length : undefined;
  const nVot = a ? a.votacoes.filter((v) => v.legislatura === leg).length : undefined;

  const cont = (n?: number) => (n === undefined ? "" : ` (${n})`);
  const painelAtividade = (render: (a: AtividadeLegislativa) => ReactNode): ReactNode =>
    atividade.isLoading ? <Carregando /> : a ? render(a) : <Painel><Vazio texto="Sem atividade legislativa." /></Painel>;
  const onLeg = (n: number) => setLegSel(n);

  const abas: Aba[] = [
    { id: "perfil", label: "Perfil", conteudo: <ConteudoPerfil c={c} /> },
    { id: "fontes", label: "Fontes IA", conteudo: <ConteudoFontes candidaturaId={c.id} /> },
    { id: "analise", label: `Análise${cont(c.scores.length)}`, conteudo: <ConteudoScores c={c} /> },
    { id: "projetos", label: `Projetos${cont(nProj)}`, conteudo: painelAtividade((a) => <ConteudoProjetos a={a} leg={leg} opcoes={legislaturas} onLeg={onLeg} />) },
    { id: "votacoes", label: `Votações${cont(nVot)}`, conteudo: painelAtividade((a) => <ConteudoVotacoes a={a} leg={leg} opcoes={legislaturas} onLeg={onLeg} />) },
    { id: "presenca", label: "Presença & Gastos", conteudo: painelAtividade((a) => <ConteudoPresencaGastos a={a} />) },
  ];

  return (
    <>
      {analisando && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
          <div className="flex flex-col items-center gap-3 rounded-lg border bg-card p-8 text-center shadow-lg">
            <Loader2 className="size-8 animate-spin text-primary" />
            <p className="text-sm font-medium">Analisando com IA…</p>
            <p className="text-xs text-muted-foreground">
              Roda em segundo plano e pode levar alguns minutos. Pode aguardar nesta tela.
            </p>
          </div>
        </div>
      )}

      <div className="mb-4 flex items-center justify-between gap-3">
        <Link to="/candidaturas">
          <Button variant="ghost" size="sm">
            <ArrowLeft /> Voltar
          </Button>
        </Link>
        <Button onClick={() => analisar.mutate()} disabled={analisando}>
          <Sparkles />
          {analisando ? "Analisando…" : "Analisar com IA"}
        </Button>
      </div>

      <div className="mb-4 flex items-center gap-4">
        {c.politico.fotoUrl ? (
          <img src={c.politico.fotoUrl} alt="" className="size-16 rounded-full object-cover" />
        ) : (
          <div className="size-16 rounded-full bg-muted" />
        )}
        <div>
          <Cabecalho titulo={c.politico.nomeUrna} descricao={`${rotulo(CARGOS, c.cargo)} · ${c.uf}`} />
          <div className="mt-1 flex flex-wrap items-center gap-2">
            {c.analisadoEm ? (
              <Badge variant="neutral">Análise IA: {formatarDataHora(c.analisadoEm)}</Badge>
            ) : (
              <Badge variant="neutral">Sem análise da IA ainda</Badge>
            )}
            {c.analiseTokens != null && (
              <span className="text-xs text-muted-foreground">
                {c.analiseTokens} tokens · {((c.analiseDuracaoMs ?? 0) / 1000).toFixed(1)}s
              </span>
            )}
          </div>
        </div>
      </div>

      {c.observacaoIa && (
        <Card className="mb-4">
          <CardContent className="space-y-1 p-5">
            <h2 className="text-sm font-semibold">Observação geral (IA)</h2>
            <p className="text-sm leading-relaxed text-muted-foreground">{c.observacaoIa}</p>
          </CardContent>
        </Card>
      )}

      <Tabs abas={abas} />
    </>
  );
}
