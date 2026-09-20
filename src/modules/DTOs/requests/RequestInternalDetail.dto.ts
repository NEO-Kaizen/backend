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
  RequesterBlock,
  YesNoDetail,
} from "../../../shared/types/requests.ts";

// Re-export para quem consome este arquivo como "contrato interno".
export type { ComplementaryBlock, DemandBlock, OperationalBlock, RequesterBlock, YesNoDetail };

export interface Assignee {
  id: string | null; // details_professional.user_id do responsável (id de users,
  // serializado como string — comparação com MeResponseDTO.id p/ permissão de
  // edição do mapeamento, contrato-mapeamento.md §9; issue #86)
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

export interface CorrectionAlert {
  count: number;
  message: string;
}

export interface InternalAttachment {
  fileName: string;
  mimeType: string;
  sizeBytes: number;
  downloadUrl: string | null;
  canDownload: boolean;
}

export interface RequestInternalDetailDTO {
  protocol: string;
  status: string;
  priority: string | null;
  prioritization: Prioritization;
  assignee: Assignee | null;
  correctionAlert: CorrectionAlert | null;

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
