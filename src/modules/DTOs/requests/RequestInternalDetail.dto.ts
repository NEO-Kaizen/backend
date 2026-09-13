// DTO de GET /requests/:protocol/internal — contrato fechado com o frontend
// em docs/requests-internal-query-contract.md (tela `/(admin)/fila/[protocolo]`).
// Difere explicitamente do DTO público (GET /requests/:protocol, issue #34):
// nunca retorna dados internos de triagem além de `internalObservations`.

// Resposta "Sim/Não (+ detalhamento)": false = "Não"; string = "Sim" + detalhe.
export type YesNoDetail = false | string;

export interface RequesterBlock {
  fullName: string;
  corporateEmail: string;
  area: string;
  department?: string;
  manager: string;
  additionalContact?: string;
}

export interface DemandBlock {
  title: string;
  requestType: string;
  category: string;
  processName: string;
  description: string;
  problem: string;
  expectedResult: string;
  justification: string;
}

export interface OperationalBlock {
  processDescription: string;
  processSteps: string;
  systemsUsed: string;
  executionFrequency: string;
  volumetry: string;
  peopleInvolved: number;
  averageExecutionTime: string;
  monthlyEffortHours: number;
  hasManualControls: YesNoDetail;
  mainRisks: string;
  clientImpact: string;
  operationalImpact: string;
  desiredDeadline: string; // ISO "yyyy-mm-dd"
  perceivedCriticality: string;
}

export interface ComplementaryBlock {
  hasProcessDocumentation?: YesNoDetail;
  hasSimilarSolution?: YesNoDetail;
  dependsOnOtherAreas?: YesNoDetail;
  handlesRestrictedInfo?: YesNoDetail;
  additionalNotes?: string;
}

export interface Assignee {
  name: string;
  email: string | null;
}

export interface Prioritization {
  score: number | null;
  maxScore: 25;
  label: string | null;
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
