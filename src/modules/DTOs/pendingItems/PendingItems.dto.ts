export type PendencyStatus = "requested" | "responded" | "validated";
export type PendingItemType = "field_edit" | "observation";

export interface PendingFieldRef {
  fieldKey: string;
  fieldLabel: string;
  currentValue: string | number | boolean | null;
}

export interface InternalAttachment {
  fileName: string;
  mimeType: string;
  sizeBytes: number;
  downloadUrl: string | null;
  canDownload: boolean;
}

export interface PendingItem {
  id: string;
  protocol: string;
  batchId: string;
  type: PendingItemType;
  field: PendingFieldRef | null;
  comment: string;
  status: PendencyStatus;
  correctedValue: string | number | boolean | null;
  responseText: string | null;
  responseAttachments: InternalAttachment[];
  deadline?: string | null;
  createdAt: string;
  respondedAt: string | null;
  validatedAt: string | null;
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

export interface CreatePendingItemsBody {
  observation?: string;
  requestAttachment?: boolean;
  items?: Array<{ fieldKey: string; comment: string }>;
}

export interface CreatePendingItemsResponse {
  batchId: string;
  requestAttachment: boolean;
  items: PendingItem[];
}

/**
 * Resposta de `GET /requests/:protocol/pending-items` (D-P8/D-P15).
 * `requestAttachment` é flag do LOTE (nunca por campo) — o envelope expõe o
 * lote vigente para o solicitante saber se deve enviar anexo.
 */
export interface ListPendingItemsResponse {
  batchId: string | null;
  requestAttachment: boolean;
  items: PendingItem[];
}

export type ReviewDecision = "validate" | "reopen";

export type ReviewPendingItemDecision =
  | { id: string; decision: "validate"; note?: string }
  | { id: string; decision: "reopen"; comment: string };

export interface ReviewPendingItemsBody {
  batchId: string;
  requestAttachment?: boolean;
  items: ReviewPendingItemDecision[];
}

export interface ReviewPendingItemsResponse {
  batchId: string;
  items: PendingItem[];
}

// Re-export de shared para manter imports `from DTOs/pendingItems` funcionando
// (fonte canônica agora em shared/types/requests.ts).
export type { InternalRequestRow } from "../../../shared/types/requests.ts";
