import type {
  DuplicateAlertItem,
  DuplicateCheckResponse,
  DuplicateConfidence,
  SimilarityHit,
} from "../../shared/types/duplicates.ts";
import type { DemandBlock } from "../../shared/types/requests.ts";
import { classifyDuplicateConfidence } from "./confidence.ts";
import { isDuplicateDetectionEnabled } from "./duplicates.repository.ts";
import { searchDuplicateIndex } from "./indexLifecycle.ts";
import { buildDuplicateQuery } from "./query.ts";
import { DUPLICATE_SEARCH_LIMIT } from "./similarityIndex.ts";

/**
 * Serviço do Alerta de duplicidade (issue #209).
 *
 * A busca lê somente a flag e o índice derivado da projeção pública. A
 * degradação para `200 { confidence: "none", items: [] }` é responsabilidade
 * da borda (controller), que também loga a causa uma única vez; nenhum texto
 * da consulta é logado.
 */
const HIGH_CONFIDENCE_ITEM_LIMIT = 3;
const MEDIUM_CONFIDENCE_ITEM_LIMIT = 5;

export const EMPTY_DUPLICATE_CHECK_RESPONSE: DuplicateCheckResponse = {
  confidence: "none",
  items: [],
};

/** Construtor explícito por audiência: exatamente as seis chaves públicas. */
function toAlertItem(hit: SimilarityHit): DuplicateAlertItem {
  return {
    publicId: hit.publicId,
    title: hit.title,
    summary: hit.summary,
    category: hit.category,
    status: hit.status,
    period: hit.period,
  };
}

function itemLimit(confidence: DuplicateConfidence): number {
  if (confidence === "high") return HIGH_CONFIDENCE_ITEM_LIMIT;
  if (confidence === "medium") return MEDIUM_CONFIDENCE_ITEM_LIMIT;
  return 0;
}

export async function checkDuplicates(demand: DemandBlock): Promise<DuplicateCheckResponse> {
  if (!(await isDuplicateDetectionEnabled())) {
    return EMPTY_DUPLICATE_CHECK_RESPONSE;
  }

  const query = buildDuplicateQuery(demand);

  if (!query) {
    return EMPTY_DUPLICATE_CHECK_RESPONSE;
  }

  const hits = searchDuplicateIndex(query, DUPLICATE_SEARCH_LIMIT);

  if (hits.length === 0) {
    return EMPTY_DUPLICATE_CHECK_RESPONSE;
  }

  const confidence = classifyDuplicateConfidence(hits.map((hit) => hit.score));

  if (confidence === "none") {
    return EMPTY_DUPLICATE_CHECK_RESPONSE;
  }

  return {
    confidence,
    items: hits.slice(0, itemLimit(confidence)).map(toAlertItem),
  };
}
