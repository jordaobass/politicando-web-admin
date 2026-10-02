import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { ChevronRight, Globe, MapPin } from "lucide-react";

import { buscarRegioes } from "@/lib/api";
import { formatarNumero } from "@/lib/format";
import type { RegiaoAcesso } from "@/lib/types";
import { Card, CardContent } from "@/components/ui/card";
import { Select } from "@/components/ui/select";
import { Carregando, ErroEstado, Vazio } from "@/components/ui/estados";

const PERIODOS = [
  { valor: 7, rotulo: "Últimos 7 dias" },
  { valor: 30, rotulo: "Últimos 30 dias" },
  { valor: 90, rotulo: "Últimos 90 dias" },
];

const DESCONHECIDO = "??";
const exibir = (valor: string) => (valor === DESCONHECIDO ? "não informado" : valor);

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
  const [nivel, setNivel] = useState<Nivel>({});

  const { data, isLoading, isError } = useQuery({
    queryKey: ["regioes", dias],
    queryFn: () => buscarRegioes(dias),
  });

  const linhas = useMemo(() => {
    const todas = data?.regioes ?? [];
    if (!nivel.pais) return agrupar(todas, (l) => l.pais);
    if (!nivel.regiao)
      return agrupar(todas.filter((l) => l.pais === nivel.pais), (l) => l.regiao);
    return agrupar(
      todas.filter((l) => l.pais === nivel.pais && l.regiao === nivel.regiao),
      (l) => l.cidade,
    );
  }, [data, nivel]);

  const maximo = linhas[0]?.acessos ?? 0;
  const podeDescer = !nivel.pais || !nivel.regiao;

  const descer = (nome: string) => {
    if (!nivel.pais) setNivel({ pais: nome });
    else if (!nivel.regiao) setNivel({ ...nivel, regiao: nome });
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
              setNivel({});
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
            className={`inline-flex items-center gap-1 rounded px-1.5 py-0.5 ${nivel.pais ? "text-primary hover:underline" : "font-medium"}`}
          >
            <Globe className="size-3.5" aria-hidden="true" /> Países
          </button>
          {nivel.pais && (
            <>
              <ChevronRight className="size-3 text-muted-foreground" aria-hidden="true" />
              <button
                type="button"
                onClick={() => setNivel({ pais: nivel.pais })}
                className={`rounded px-1.5 py-0.5 ${nivel.regiao ? "text-primary hover:underline" : "font-medium"}`}
              >
                {exibir(nivel.pais)}
              </button>
            </>
          )}
          {nivel.regiao && (
            <>
              <ChevronRight className="size-3 text-muted-foreground" aria-hidden="true" />
              <span className="rounded px-1.5 py-0.5 font-medium">{exibir(nivel.regiao)}</span>
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
                        <span className="truncate">{exibir(l.nome)}</span>
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
            {podeDescer && (
              <p className="text-xs text-muted-foreground/70">
                Clique numa linha para detalhar {nivel.pais ? "as cidades" : "os estados"}.
              </p>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}
