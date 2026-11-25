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

/**
 * Serviço do Alerta de duplicidade (issue #209).
 *
 * A busca lê somente a flag e o índice derivado da projeção pública. Qualquer
 * falha de flag/índice/busca degrada para `200 { confidence: "none", items: [] }`;
 * nenhum texto da consulta é logado.
 */
const SEARCH_LIMIT = 20;
const HIGH_CONFIDENCE_ITEM_LIMIT = 3;
const MEDIUM_CONFIDENCE_ITEM_LIMIT = 5;

const EMPTY_RESPONSE: DuplicateCheckResponse = { confidence: "none", items: [] };

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
  try {
    if (!(await isDuplicateDetectionEnabled())) {
      return EMPTY_RESPONSE;
    }

    const query = buildDuplicateQuery(demand);

    if (!query) {
      return EMPTY_RESPONSE;
    }

    const hits = searchDuplicateIndex(query, SEARCH_LIMIT);

    if (hits.length === 0) {
      return EMPTY_RESPONSE;
    }

    const confidence = classifyDuplicateConfidence(hits.map((hit) => hit.score));

    if (confidence === "none") {
      return EMPTY_RESPONSE;
    }

    return {
      confidence,
      items: hits.slice(0, itemLimit(confidence)).map(toAlertItem),
    };
  } catch {
    return EMPTY_RESPONSE;
  }
}
