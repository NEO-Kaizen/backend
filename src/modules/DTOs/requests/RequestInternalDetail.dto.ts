// DTO de GET /requests/:protocol/internal — contrato fechado com o frontend
// em docs/requests-internal-query-contract.md (tela `/(admin)/fila/[protocolo]`).
// Difere explicitamente do DTO público (GET /requests/:protocol, issue #34):
// nunca retorna dados internos de triagem além de `internalObservations`.

// Tipos do cadastro (blocos) e YesNoDetail vêm do domínio
// (src/shared/types/requests.ts) — fonte única, evitando drift de contrato.
import type {
  ComplementaryBlock,
  DemandBlock,
  OperationalBlock,
  RequestPriority,
  RequesterBlock,
  YesNoDetail,
} from "../../../shared/types/requests.ts";
import type {
  CorrectionAlert,
  InternalAttachment,
  PendingSummary,
  UnreadState,
} from "../../../shared/types/pendingItems.ts";

// Re-export para quem consome este arquivo como "contrato interno".
export type { ComplementaryBlock, DemandBlock, OperationalBlock, RequesterBlock, YesNoDetail };
export type { CorrectionAlert, InternalAttachment, PendingSummary, UnreadState };

export interface Assignee {
  /** `details_professional.user_id` serializado, ou `null` quando ausente. */
  id: string | null;
  name: string;
  email: string | null;
}

export interface Prioritization {
  score: number | null; // 10–50 (RN-007/RN-008, issue #51); null até ser avaliado
  maxScore: 50; // escala normalizada fixa — fonte: prioritization_evaluations
  label: string | null; // classificação RN-008 (ex.: "Alta"); null sem avaliação
}

export interface Meeting {
  scheduledFor: string;
  link: string | null;
}

export interface RequestInternalDetailDTO {
  protocol: string;
  status: string; // nome configurável — contrato define string
  priority: RequestPriority | null; // domínio fechado (REQUEST_PRIORITIES)
  prioritization: Prioritization;
  assignee: Assignee | null;
  mappingAssignee?: Assignee | null;
  correctionAlert: CorrectionAlert | null;
  pendingSummary: PendingSummary;
  unread: UnreadState;

  requester: RequesterBlock;
  demand: DemandBlock;
  operational: OperationalBlock;
  complementary?: ComplementaryBlock;
  schedulePreferences: string[] | null;
  mappingDate: string | null;
  meeting: Meeting | null;

  attachments: InternalAttachment[];
  openedAt: string; // ISO datetime UTC
  lastUpdate: string; // ISO datetime UTC
  internalObservations: string | null;
}
