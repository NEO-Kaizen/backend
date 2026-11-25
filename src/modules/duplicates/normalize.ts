/**
 * Normalização PT-BR para a busca lexical do Alerta de duplicidade.
 *
 * Adaptada do protótipo RF16 em
 * `/Prototipos/rf16-similarity-lab/src/engines/normalize.js`: MiniSearch não
 * traz stemming nem stopwords de português, então esta camada aplica sem
 * acentos, minúsculas, stopwords, plural leve e um mapa conservador de
 * sinônimos. A origem é o experimento lexical que fundamentou o ADR 0004.
 */
const STOPWORDS = new Set(
  `
  a o as os um uma uns umas de do da dos das em no na nos nas por para pra pro com sem sob sobre entre e ou
  mas que se como quando onde qual quais quem cujo cuja cujos cujas ao aos à às pelo pela pelos pelas num numa
  dum duma dum dum nesta neste nestas nestes nessa nesse nessas nesses naquele naquela naqueles naquelas
  isto isso aquilo aqui ali lá então assim porém contudo entretanto portanto porque pois embora caso durante
  após antes até desde contra já ainda também muito pouco bastante todo toda todos todas cada outro outra
  mesmo mesma próprios próprias seu sua seus suas meu minha nossos nossas este esta estes estas esse essa esses
  essas aquele aquela aqueles aquelas eu tu você vocês nós eles elas lhe lhes me te vos é são era eram foi foram
  ser sendo sido estar estando estado está estão estava estavam ter tem têm tinha tinham tido há havia haver
  queria queremos quero preciso precisa precisamos precisaria gostaria gostaríamos desejo deseja desejava
  hoje atualmente agora recentemente basicamente realmente simplesmente ainda
  fazer faz feito fazendo conseguir consegue conseguimos poderia pode podem poder
  dessa desse destes destas daquela daquele daquilo nesta nisto nisso
  `
    .trim()
    .split(/\s+/),
);

/**
 * Grupos de sinônimos conservadores. O primeiro termo é o canônico; os demais
 * passam a indexar e a buscar também pelo canônico.
 */
const SYNONYM_GROUPS = [
  ["painel", "dashboard", "dash"],
  ["indicador", "kpi", "metrica"],
  ["nota", "nf", "nfe"],
  ["planilha", "excel", "spreadsheet"],
  ["colaborador", "funcionario", "empregado"],
  ["chamado", "ticket", "protocolo"],
  ["estoque", "inventario"],
  ["automacao", "rpa", "robo", "robot"],
  ["contrato", "contratacao", "contratual"],
  ["pagamento", "pagar", "pagto"],
  ["recebimento", "receber", "recebiveis"],
  ["fornecedor", "parceiro", "supplier"],
  ["cliente", "consumidor", "customer"],
  ["prazo", "sla", "deadline"],
  ["treinamento", "capacitacao", "curso"],
  ["integracao", "interface", "conector"],
  ["otimizacao", "tuning", "performance"],
  ["cadastro", "registro", "cadastrar"],
  ["fatura", "faturamento"],
  ["relatorio", "report"],
  ["reembolso", "ressarcimento"],
  ["aprovacao", "aprovar", "autorizacao", "autorizar"],
  ["absenteismo", "falta", "ausencia"],
  ["turnover", "desligamento", "rotatividade"],
  ["frota", "veiculo", "carro"],
  ["documento", "documentacao", "doc"],
  ["procedimento", "pop"],
  ["reserva", "agendamento", "agendar"],
  ["viagem", "deslocamento"],
  ["manutencao", "preventiva"],
];

export function normalizeText(text: string): string {
  return text
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}

export function tokenizePt(text: string): string[] {
  return normalizeText(text)
    .split(/[^a-z0-9]+/)
    .filter((term) => term.length > 1);
}

export function stemPt(term: string): string {
  if (term.length < 5) return term;
  if (term.endsWith("coes")) return `${term.slice(0, -4)}cao`;
  if (term.endsWith("ores")) return term.slice(0, -2);
  if (term.endsWith("oes")) return `${term.slice(0, -3)}ao`;
  if (term.endsWith("zes")) return `${term.slice(0, -3)}z`;
  if (term.endsWith("eis")) return `${term.slice(0, -3)}el`;
  if (term.endsWith("ns")) return `${term.slice(0, -2)}m`;
  if (term.endsWith("ss")) return term;
  if (term.endsWith("s")) return term.slice(0, -1);
  return term;
}

const SYNONYM_MAP = new Map<string, string>();
for (const group of SYNONYM_GROUPS) {
  const canonical = stemPt(group[0] as string);
  for (const variant of group) {
    const key = stemPt(variant);
    if (key !== canonical) SYNONYM_MAP.set(key, canonical);
  }
}

export function processTerm(term: string): string | string[] | null {
  const normalized = normalizeText(term);
  if (!normalized || STOPWORDS.has(normalized)) return null;

  const stemmed = stemPt(normalized);
  const canonical = SYNONYM_MAP.get(stemmed);
  if (canonical && canonical !== stemmed) return [stemmed, canonical];
  return stemmed;
}
