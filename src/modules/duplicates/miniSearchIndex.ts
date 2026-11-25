import MiniSearch, { type SearchResult } from "minisearch";
import type { SimilarityDocument, SimilarityHit } from "../../shared/types/duplicates.ts";
import { processTerm, tokenizePt } from "./normalize.ts";
import type { SimilarityIndex } from "./similarityIndex.ts";

/**
 * Adaptador MiniSearch do `SimilarityIndex` (ADR 0004).
 *
 * - campos indexados: título (boost 3), resumo (1,2), categoria (0,15) e
 *   período (0,15); `status` fica apenas armazenado para o DTO;
 * - fuzzy e prefix desligados na v1; `combineWith: "OR"`;
 * - upsert via `replace` e remoção via `discard`;
 * - busca limitada ao top 20.
 */
export const MINI_SEARCH_MAX_RESULTS = 20;

const INDEXED_FIELDS = ["title", "summary", "category", "period"] as const;
const STORED_FIELDS = ["title", "summary", "category", "status", "period"] as const;

const SEARCH_OPTIONS = {
  boost: { title: 3, summary: 1.2, category: 0.15, period: 0.15 },
  combineWith: "OR",
  fuzzy: false,
  prefix: false,
} as const;

interface IndexedDocument extends SimilarityDocument {
  id: string;
}

function toIndexedDocument(document: SimilarityDocument): IndexedDocument {
  return {
    id: document.publicId,
    publicId: document.publicId,
    title: document.title,
    summary: document.summary,
    category: document.category,
    status: document.status,
    period: document.period,
  };
}

function storedString(result: SearchResult, field: string): string {
  const value: unknown = result[field];
  return typeof value === "string" ? value : "";
}

export class MiniSearchIndex implements SimilarityIndex {
  private readonly engine: MiniSearch<IndexedDocument>;

  constructor() {
    this.engine = new MiniSearch<IndexedDocument>({
      idField: "id",
      fields: [...INDEXED_FIELDS],
      storeFields: [...STORED_FIELDS],
      tokenize: tokenizePt,
      processTerm,
      searchOptions: SEARCH_OPTIONS,
    });
  }

  search(query: string, limit: number): SimilarityHit[] {
    if (!query.trim()) return [];

    const cappedLimit = Math.max(0, Math.min(limit, MINI_SEARCH_MAX_RESULTS));
    if (cappedLimit === 0) return [];

    return this.engine
      .search(query, SEARCH_OPTIONS)
      .slice(0, cappedLimit)
      .flatMap((result) => {
        const publicId = typeof result.id === "string" ? result.id : "";
        if (!publicId) return [];

        return [
          {
            publicId,
            title: storedString(result, "title"),
            summary: storedString(result, "summary"),
            category: storedString(result, "category"),
            status: storedString(result, "status"),
            period: storedString(result, "period"),
            score: result.score,
          },
        ];
      });
  }

  upsert(document: SimilarityDocument): void {
    this.engine.replace(toIndexedDocument(document));
  }

  remove(publicId: string): void {
    this.engine.discard(publicId);
  }

  rebuild(documents: readonly SimilarityDocument[]): void {
    this.engine.removeAll();
    this.engine.addAll(documents.map(toIndexedDocument));
  }
}
