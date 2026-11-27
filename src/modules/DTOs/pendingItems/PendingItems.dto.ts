import type {
  CorrectionAlert,
  InternalAttachment,
  PendencyStatus,
  PendingFieldRef,
  PendingFieldValue,
  PendingItemType,
  PendingSummary,
  UnreadState,
} from "../../../shared/types/pendingItems.ts";

export type {
  CorrectionAlert,
  InternalAttachment,
  PendencyStatus,
  PendingFieldRef,
  PendingFieldValue,
  PendingItemType,
  PendingSummary,
  UnreadState,
};

export interface PendingItem {
  id: string;
  protocol: string;
  batchId: string;
  type: PendingItemType;
  field: PendingFieldRef | null;
  comment: string;
  status: PendencyStatus;
  correctedValue: PendingFieldValue;
  responseText: string | null;
  responseAttachments: InternalAttachment[];
  deadline?: string | null;
  createdAt: string;
  respondedAt: string | null;
  validatedAt: string | null;
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
