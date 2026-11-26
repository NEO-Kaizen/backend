import type { SimilarityDocument, SimilarityHit } from "../../shared/types/duplicates.ts";

/**
 * Fronteira do motor de busca do Alerta de duplicidade (ADR 0004).
 *
 * O índice é derivado de `request_public_projections` e reconstruível; trocar
 * o MiniSearch por Meilisearch não muda o contrato HTTP.
 */
export const DUPLICATE_SEARCH_LIMIT = 20;

export interface SimilarityIndex {
  search(query: string, limit: number): SimilarityHit[];
  upsert(document: SimilarityDocument): void;
  remove(publicId: string): void;
  rebuild(documents: readonly SimilarityDocument[]): void;
}
