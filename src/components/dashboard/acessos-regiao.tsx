import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { ChevronRight, Globe, MapPin } from "lucide-react";

import { buscarRegioes } from "@/lib/api";
import { formatarNumero } from "@/lib/format";
import { nomeDaCidade, nomeDaRegiao, nomeDoPais } from "@/lib/geo";
import type { RegiaoAcesso } from "@/lib/types";
import { Card, CardContent } from "@/components/ui/card";
import { Select } from "@/components/ui/select";
import { Carregando, ErroEstado, Vazio } from "@/components/ui/estados";

const PERIODOS = [
  { valor: 7, rotulo: "Últimos 7 dias" },
  { valor: 30, rotulo: "Últimos 30 dias" },
  { valor: 90, rotulo: "Últimos 90 dias" },
];

/** O backend grava "??" quando a borda não informou aquele nível. */
const DESCONHECIDO = "??";

/** `null` = nível ainda não escolhido: abre no país de onde vem a maior parte do público. */
type Nivel = { pais?: string; regiao?: string };

/** Soma os acessos de um conjunto de linhas por uma chave (país, UF ou cidade). */
function agrupar(linhas: RegiaoAcesso[], chave: (l: RegiaoAcesso) => string) {
  const mapa = new Map<string, number>();
  for (const l of linhas) mapa.set(chave(l), (mapa.get(chave(l)) ?? 0) + l.acessos);
  return [...mapa.entries()]
    .map(([nome, acessos]) => ({ nome, acessos }))
    .sort((a, b) => b.acessos - a.acessos);
}

/**
 * De onde vem a audiência.
 *
 * A localização é resolvida pela borda (Vercel/Cloudflare) e gravada AGREGADA por dia e
 * região: o IP não é lido nem armazenado em momento algum. Por isso aqui se vê "quantos
 * acessos vieram de São Paulo", e nunca "quem acessou o quê, de onde" — que seria registro de
 * convicção política ligado a pessoa.
 */
export function AcessosRegiao() {
  const [dias, setDias] = useState(30);
  const [nivel, setNivel] = useState<Nivel | null>(null);

  const { data, isLoading, isError } = useQuery({
    queryKey: ["regioes", dias],
    queryFn: () => buscarRegioes(dias),
  });

  // Quase todo acesso é do Brasil: abrir na lista de países obrigaria um clique para
  // chegar ao que interessa (o estado). Enquanto o nível não é escolhido à mão, o card
  // já entra no país dominante; a trilha "Países" continua disponível para subir.
  const paisDominante = useMemo(
    () => agrupar(data?.regioes ?? [], (l) => l.pais)[0]?.nome,
    [data],
  );

  const atual: Nivel = nivel ?? (paisDominante ? { pais: paisDominante } : {});

  const linhas = useMemo(() => {
    const todas = data?.regioes ?? [];
    if (!atual.pais) return agrupar(todas, (l) => l.pais);
    if (!atual.regiao)
      return agrupar(todas.filter((l) => l.pais === atual.pais), (l) => l.regiao);
    return agrupar(
      todas.filter((l) => l.pais === atual.pais && l.regiao === atual.regiao),
      (l) => l.cidade,
    );
  }, [data, atual.pais, atual.regiao]);

  const maximo = linhas[0]?.acessos ?? 0;
  const podeDescer = !atual.pais || !atual.regiao;

  /** Nada a destrinchar: tudo que existe neste nível é "não informado". */
  const semDetalhe =
    atual.pais !== undefined && linhas.every((l) => l.nome === DESCONHECIDO) && linhas.length > 0;

  /** Rótulo da linha depende do nível em que ela está: país, estado ou cidade. */
  const rotular = (nome: string) => {
    if (!atual.pais) return nomeDoPais(nome);
    if (!atual.regiao) return nomeDaRegiao(atual.pais, nome);
    return nomeDaCidade(nome);
  };

  const descer = (nome: string) => {
    if (!atual.pais) setNivel({ pais: nome });
    else if (!atual.regiao) setNivel({ ...atual, regiao: nome });
  };

  return (
    <Card>
      <CardContent className="space-y-4 p-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h3 className="text-sm font-semibold">Origem geográfica</h3>
            {data && (
              <p className="text-xs text-muted-foreground">
                {formatarNumero(data.totalAcessos)} acessos localizados. Sem IP — só a contagem
                por região.
              </p>
            )}
          </div>
          <Select
            className="h-8 w-auto"
            value={dias}
            onChange={(e) => {
              setDias(Number(e.target.value));
              setNivel(null);
            }}
            aria-label="Período da origem geográfica"
          >
            {PERIODOS.map((p) => (
              <option key={p.valor} value={p.valor}>
                {p.rotulo}
              </option>
            ))}
          </Select>
        </div>

        {/* Trilha de navegação: mostra onde se está e permite voltar um nível. */}
        <nav className="flex flex-wrap items-center gap-1 text-xs" aria-label="Nível geográfico">
          <button
            type="button"
            onClick={() => setNivel({})}
            className={`inline-flex items-center gap-1 rounded px-1.5 py-0.5 ${atual.pais ? "text-primary hover:underline" : "font-medium"}`}
          >
            <Globe className="size-3.5" aria-hidden="true" /> Países
          </button>
          {atual.pais && (
            <>
              <ChevronRight className="size-3 text-muted-foreground" aria-hidden="true" />
              <button
                type="button"
                onClick={() => setNivel({ pais: atual.pais })}
                className={`rounded px-1.5 py-0.5 ${atual.regiao ? "text-primary hover:underline" : "font-medium"}`}
              >
                {nomeDoPais(atual.pais)}
              </button>
            </>
          )}
          {atual.regiao && atual.pais && (
            <>
              <ChevronRight className="size-3 text-muted-foreground" aria-hidden="true" />
              <span className="rounded px-1.5 py-0.5 font-medium">
                {nomeDaRegiao(atual.pais, atual.regiao)}
              </span>
            </>
          )}
        </nav>

        {isLoading && <Carregando />}
        {isError && <ErroEstado mensagem="Falha ao carregar a origem dos acessos." />}

        {data && !data.temDadoDeGeo && (
          <Vazio texto="Nenhuma localização registrada ainda — a borda informa país/UF só em produção." />
        )}

        {data && data.temDadoDeGeo && linhas.length > 0 && (
          <>
            <ul className="space-y-2">
              {linhas.slice(0, 12).map((l) => (
                <li key={l.nome}>
                  <button
                    type="button"
                    onClick={() => podeDescer && descer(l.nome)}
                    disabled={!podeDescer}
                    className="group w-full rounded-md px-1 py-1 text-left transition-colors hover:bg-muted/60 disabled:cursor-default disabled:hover:bg-transparent"
                  >
                    <span className="flex items-baseline justify-between gap-3">
                      <span className="flex min-w-0 items-center gap-1.5 text-sm">
                        <MapPin className="size-3.5 shrink-0 text-muted-foreground" aria-hidden="true" />
                        <span className="truncate">{rotular(l.nome)}</span>
                      </span>
                      <span className="shrink-0 text-xs font-medium tabular-nums">
                        {formatarNumero(l.acessos)}
                      </span>
                    </span>
                    <span className="mt-1 block h-1.5 w-full overflow-hidden rounded-full bg-muted">
                      <span
                        className="block h-full rounded-full"
                        style={{
                          width: `${maximo > 0 ? (l.acessos / maximo) * 100 : 0}%`,
                          background: "var(--grafico-2)",
                        }}
                      />
                    </span>
                  </button>
                </li>
              ))}
            </ul>
            {semDetalhe ? (
              <p className="text-xs text-muted-foreground/70">
                Estes acessos foram gravados sem estado: a borda deste ambiente informou só o
                país. O detalhe aparece nos acessos novos.
              </p>
            ) : (
              podeDescer && (
                <p className="text-xs text-muted-foreground/70">
                  Clique numa linha para detalhar {atual.pais ? "as cidades" : "os estados"}.
                </p>
              )
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}
