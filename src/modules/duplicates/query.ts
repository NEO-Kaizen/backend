import type { DemandBlock } from "../../shared/types/requests.ts";
import { normalizeText, processTerm } from "./normalize.ts";

/**
 * Consulta lexical do Alerta de duplicidade (issue #209).
 *
 * Monta a consulta a partir dos campos da aba de Demanda, na ordem de
 * prioridade título → categoria → processo → descrição → problema → resultado
 * esperado → justificativa. Stopwords saem, plurais são reduzidos pelo mesmo
 * stemmer do índice, sinônimos são canonicalizados e os termos são
 * deduplicados por stem, limitados a 12.
 */
export const DUPLICATE_QUERY_TERM_LIMIT = 12;

const DEMAND_FIELDS: readonly (keyof DemandBlock)[] = [
  "title",
  "category",
  "processName",
  "description",
  "problem",
  "expectedResult",
  "justification",
];

function pushTerms(value: string, terms: string[], seen: Set<string>): void {
  for (const rawTerm of normalizeText(value).split(/[^a-z0-9]+/)) {
    if (rawTerm.length <= 1) continue;

    const processed = processTerm(rawTerm);
    if (processed === null) continue;

    const candidates = Array.isArray(processed) ? processed : [processed];
    for (const candidate of candidates) {
      if (!candidate || seen.has(candidate)) continue;
      seen.add(candidate);
      terms.push(candidate);
      if (terms.length >= DUPLICATE_QUERY_TERM_LIMIT) return;
    }
  }
}

/**
 * Extrai termos normalizados e deduplicados, preservando a ordem de prioridade
 * dos campos da Demanda.
 */
export function buildDuplicateQueryTerms(demand: DemandBlock): string[] {
  const terms: string[] = [];
  const seen = new Set<string>();

  for (const field of DEMAND_FIELDS) {
    pushTerms(demand[field], terms, seen);
    if (terms.length >= DUPLICATE_QUERY_TERM_LIMIT) break;
  }

  return terms;
}

/** Texto enviado ao motor de busca; vazio quando não há termo útil. */
export function buildDuplicateQuery(demand: DemandBlock): string {
  return buildDuplicateQueryTerms(demand).join(" ");
}
