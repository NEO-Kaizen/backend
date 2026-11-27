// DTO de GET /requests/:protocol/tracking — contrato do acompanhamento do
// solicitante (`/acompanhar/[protocolo]`), espelho fiel de
// `frontend/src/lib/types/requester-tracking.ts`. O backend decide o `mode`
// pela credencial: `public` (header `X-Requester-Identity`) ou `authenticated`
// (cookie de sessão do dono). Difere do DTO interno
// (`RequestInternalDetailDTO`): nunca expõe triagem, priorização ou anotações
// internas — apenas o recorte público (ou o recorte do solicitante dono).
//
// Tipos do domínio vêm da fonte única (`src/shared/types/requests.ts`) para
// evitar drift de contrato.

import type {
  ComplementaryBlock,
  DemandBlock,
  OperationalImpact,
  RequesterBlock,
  RequestPriority,
  RequestStatus,
} from "../../../shared/types/requests.ts";

export type TrackingMode = "public" | "authenticated";

export interface Meeting {
  scheduledFor: string;
  link: string | null;
}

export interface PublicOperationalImpacts {
  mainRisks: string;
  clientImpact: string;
  operationalImpact: OperationalImpact;
  perceivedCriticality: RequestPriority;
  desiredDeadline: string;
}

export interface RequesterOperational extends PublicOperationalImpacts {
  processDescription: string;
  processSteps: string;
  systemsUsed: string;
  executionFrequency: string;
  volumetry: string;
  peopleInvolved: number;
  averageExecutionTime: string;
  monthlyEffortHours: number;
  hasManualControls: false | string;
}

export interface RequesterAttachment {
  id: string;
  fileName: string;
  mimeType: string;
  sizeBytes: number;
  downloadUrl: string;
  canDownload: boolean;
}

export interface PublicRequestDetails {
  protocol: string;
  status: RequestStatus;
  openedAt: string;
  lastUpdate: string;
  lastTechnicalMessage: string | null;
  meeting: Meeting | null;
  requester: RequesterBlock;
  demand: DemandBlock;
  impacts: PublicOperationalImpacts;
}

export interface RequesterRequestDetails extends Omit<PublicRequestDetails, "impacts"> {
  operational: RequesterOperational;
  complementary?: ComplementaryBlock;
  schedulePreferences: string[] | null;
  mappingDate: string | null;
  attachments: RequesterAttachment[];
}

export type TrackingDetailsResponse =
  | { mode: "public"; details: PublicRequestDetails }
  | { mode: "authenticated"; details: RequesterRequestDetails };
