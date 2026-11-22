/**
 * Tipos compartilhados de pendências (`pending_items`).
 *
 * Fonte única para os DTOs de resposta e para os mapeadores de persistência.
 * `PendingFieldValue` reflete o contrato de `jsonb`: escalares JSON, sem
 * objetos/arrays.
 */
export type PendencyStatus = "requested" | "responded" | "validated";

export type PendingItemType = "field_edit" | "observation";

export type PendingFieldValue = string | number | boolean | null;

export interface PendingFieldRef {
  fieldKey: string;
  /** Rótulo do catálogo (`fieldCatalog`) — ex.: "Nome completo". */
  fieldLabel: string;
  currentValue: PendingFieldValue;
}

export interface InternalAttachment {
  fileName: string;
  mimeType: string;
  sizeBytes: number;
  /** `null` quando o download não é disponibilizado ao chamador. */
  downloadUrl: string | null;
  canDownload: boolean;
}

export interface UnreadState {
  count: number;
  hasUnread: boolean;
  lastUnreadAt: string | null;
}

export interface CorrectionAlert {
  count: number;
  batchId: string;
}

export interface PendingSummary {
  total: number;
  requested: number;
  responded: number;
  validated: number;
}
