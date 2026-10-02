/**
 * Tradução dos códigos que a borda entrega (ISO 3166) para nome legível.
 *
 * A Vercel/Cloudflare manda país como "BR" e UF como "MG" — códigos, não nomes. No painel
 * isso vira "Minas Gerais", porque quem lê o dashboard raciocina em estado, não em sigla.
 * Código desconhecido continua aparecendo como veio: melhor a sigla crua do que esconder
 * acesso de um lugar que ainda não mapeamos.
 */

const UFS_BRASIL: Record<string, string> = {
  AC: "Acre",
  AL: "Alagoas",
  AP: "Amapá",
  AM: "Amazonas",
  BA: "Bahia",
  CE: "Ceará",
  DF: "Distrito Federal",
  ES: "Espírito Santo",
  GO: "Goiás",
  MA: "Maranhão",
  MT: "Mato Grosso",
  MS: "Mato Grosso do Sul",
  MG: "Minas Gerais",
  PA: "Pará",
  PB: "Paraíba",
  PR: "Paraná",
  PE: "Pernambuco",
  PI: "Piauí",
  RJ: "Rio de Janeiro",
  RN: "Rio Grande do Norte",
  RS: "Rio Grande do Sul",
  RO: "Rondônia",
  RR: "Roraima",
  SC: "Santa Catarina",
  SP: "São Paulo",
  SE: "Sergipe",
  TO: "Tocantins",
};

const PAISES: Record<string, string> = {
  BR: "Brasil",
  AR: "Argentina",
  AT: "Áustria",
  AU: "Austrália",
  BE: "Bélgica",
  CA: "Canadá",
  CH: "Suíça",
  CL: "Chile",
  CN: "China",
  CO: "Colômbia",
  DE: "Alemanha",
  ES: "Espanha",
  FI: "Finlândia",
  FR: "França",
  GB: "Reino Unido",
  IE: "Irlanda",
  IN: "Índia",
  IT: "Itália",
  JP: "Japão",
  MX: "México",
  NL: "Países Baixos",
  NO: "Noruega",
  PE: "Peru",
  PL: "Polônia",
  PT: "Portugal",
  PY: "Paraguai",
  RU: "Rússia",
  SE: "Suécia",
  SG: "Singapura",
  US: "Estados Unidos",
  UY: "Uruguai",
  ZA: "África do Sul",
};

/** "??" é o que o backend grava quando a borda não informou — não é país nenhum. */
const DESCONHECIDO = "??";

export function nomeDoPais(codigo: string): string {
  if (codigo === DESCONHECIDO) return "não informado";
  return PAISES[codigo.toUpperCase()] ?? codigo;
}

/** Nome do estado/província. Só o Brasil tem tabela própria; o resto mostra o código. */
export function nomeDaRegiao(pais: string, codigo: string): string {
  if (codigo === DESCONHECIDO) return "não informado";
  if (pais.toUpperCase() === "BR") return UFS_BRASIL[codigo.toUpperCase()] ?? codigo;
  return codigo;
}

export function nomeDaCidade(codigo: string): string {
  return codigo === DESCONHECIDO ? "não informada" : codigo;
}
