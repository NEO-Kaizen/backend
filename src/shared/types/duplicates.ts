/** Faixa de confiança do Alerta de duplicidade (issue #209). */
export type DuplicateConfidence = "high" | "medium" | "none";

/** Estado da linha em `request_public_projections`. */
export type PublicationStatus = "published" | "suppressed";

/** Motivo determinístico de supressão de uma projeção pública. */
export type SuppressionReason =
  | "inactive_status"
  | "terminal_status"
  | "restricted_request"
  | "restricted_status"
  | "ineligible_category"
  | "ineligible_status";

/**
 * Item público do Alerta de duplicidade — allowlist exata de seis chaves.
 * Nunca inclui Protocolo, score, total, contagem, Notas internas, Triagem,
 * Prioridade, Responsável, Anexos ou PII.
 */
export interface DuplicateAlertItem {
  publicId: string;
  title: string;
  summary: string;
  category: string;
  status: string;
  period: string;
}

/** Resposta de `POST /requests/duplicates/check`. */
export interface DuplicateCheckResponse {
  confidence: DuplicateConfidence;
  items: DuplicateAlertItem[];
}

/** Documento curado que alimenta o índice de similaridade. */
export interface SimilarityDocument {
  publicId: string;
  title: string;
  summary: string;
  category: string;
  status: string;
  period: string;
}

/** Resultado de busca: documento público + similaridade bruta do motor. */
export interface SimilarityHit extends SimilarityDocument {
  score: number;
}
