# Inventário de tipagens TypeScript

> Levantamento automático do código em `src/**/*.ts`, baseado no TypeScript configurado no projeto. Não inclui dependências nem arquivos de declaração de terceiros.

## Resumo

- Arquivos-fonte analisados: **152**.
- Tipos nomeados: **269** — 192 interfaces, 75 aliases `type`, 2 classes e 0 enums.
- Declarações sem anotação explícita: **1622** — 1166 variáveis, 230 parâmetros e 226 retornos de funções/métodos.
- Declarações com tipo efetivo `any` detectado pelo checker: **97**; ocorrências com palavra-chave `any` explícita no código-fonte: **0**.
- A verificação `npm run typecheck` passa com a configuração atual (inclui `strict` e `noImplicitReturns`).

## Como interpretar

- **Tipados:** as definições abaixo mostram os tipos nomeados (interfaces, aliases, classes e enums) como estão declarados no código. As anotações de propriedades e membros aparecem nas próprias definições.
- **Sem anotação explícita:** a declaração não traz `: Tipo` no local indicado. Isso **não** significa necessariamente falta de tipo: o compilador pode inferi-lo pelo inicializador, contexto ou assinatura. A lista inclui variáveis, parâmetros e retornos sem anotação.
- **`any`:** o checker determinou tipo efetivo `any` para os itens listados. Não foi encontrada a palavra-chave `any` explícita no código-fonte. As ocorrências são inferidas/contextuais, frequentemente nas fronteiras com bibliotecas ou APIs sem tipo suficientemente específico; a lista deve ser revisada priorizando os pontos de entrada dessas fronteiras.
- As linhas indicadas referem-se ao estado do código no momento do levantamento.

## 1. Tipos nomeados e suas definições

### [src/modules/auditHistory/auditHistory.repository.ts](../src/modules/auditHistory/auditHistory.repository.ts)

### L4 — interface AuditSummaryRow

```ts
interface AuditSummaryRow {
  audit_id: number;
  entity_type: string;
  action_type: string;
  user_id: number | null;
  actor_name: string | null;
  occurred_at: Date;
}
```

### L13 — interface AuditCountRow

```ts
interface AuditCountRow {
  total: number | string;
}
```

### L17 — interface AuditHistoryDetailRow

```ts
interface AuditHistoryDetailRow {
  audit_id: number | string;
  entity_type: string;
  entity_id: string;
  action_type: string;
  user_id: number | string | null;
  actor_name: string | null;
  previous_value: string | null;
  new_value: string | null;
  note: string | null;
  last_technical_message: string | null;
  ip_address: string | null;
  change_origin: string | null;
  occurred_at: Date | string;
}
```

### [src/modules/auth/auth.repository.ts](../src/modules/auth/auth.repository.ts)

### L50 — interface AuthState

```ts
export interface AuthState {
  is_active: boolean;
  profile_is_active: boolean;
  profile_name: string;
  must_change_password: boolean;
  password_changed_at: Date;
}
```

### [src/modules/auth/auth.service.ts](../src/modules/auth/auth.service.ts)

### L11 — interface SessionUserResult

```ts
export interface SessionUserResult {
  id: string;
  name: string;
  email: string;
  avatarUrl: string | null;
  role: Role;
  mustChangePassword: boolean;
  /** Época (ms) de `users.password_changed_at` — vai no payload do JWT. */
  passwordChangedAt: number;
}
```

### [src/modules/DTOs/auditHistory/AuditHistory.dto.ts](../src/modules/DTOs/auditHistory/AuditHistory.dto.ts)

### L3 — interface AuditHistoryQuery

```ts
export interface AuditHistoryQuery {
  page?: number;
  limit?: number;
  entityType?: AuditEntityName;
}
```

### L9 — interface AuditActor

```ts
export interface AuditActor {
  kind: "system" | "user";
  userId: number | null;
  displayName: string | null;
}
```

### L15 — interface AuditHistorySummary

```ts
export interface AuditHistorySummary {
  audit_id: number;
  entity_type: string;
  entity_type_label: string;
  action_type: string;
  actor: AuditActor;
  occurred_at: string;
}
```

### L24 — interface AuditHistoryDetail

```ts
export interface AuditHistoryDetail {
  audit_id: number;
  entity_type: string;
  entity_id: string;
  action_type: string;
  actor: AuditActor;
  previous_value: string | null;
  new_value: string | null;
  /** Justificativa interna da transição. */
  note: string | null;
  /** Snapshot do retorno público da transição (nunca concatenado em `note`). */
  last_technical_message: string | null;
  ip_address: string | null;
  change_origin: string | null;
  occurred_at: string;
}
```

### L41 — interface AuditHistoryListResponse

```ts
export interface AuditHistoryListResponse {
  items: AuditHistorySummary[];
  total: number;
  page: number;
  limit: number;
}
```

### [src/modules/DTOs/auth/ChangePasswordRequest.dto.ts](../src/modules/DTOs/auth/ChangePasswordRequest.dto.ts)

### L1 — interface ChangePasswordRequest

```ts
export interface ChangePasswordRequest {
  currentPassword: string;
  newPassword: string;
  confirmNewPassword: string;
}
```

### [src/modules/DTOs/auth/ChangePasswordResponse.dto.ts](../src/modules/DTOs/auth/ChangePasswordResponse.dto.ts)

### L3 — interface ChangePasswordResponseDTO

```ts
export interface ChangePasswordResponseDTO {
  id: string;
  name: string;
  email: string;
  avatarUrl: string | null;
  role: Role;
  mustChangePassword: boolean;
}
```

### [src/modules/DTOs/auth/LoginRequest.dto.ts](../src/modules/DTOs/auth/LoginRequest.dto.ts)

### L1 — interface LoginRequestDTO

```ts
export interface LoginRequestDTO {
  email: string;
  password: string;
}
```

### [src/modules/DTOs/auth/LoginResponse.dto.ts](../src/modules/DTOs/auth/LoginResponse.dto.ts)

### L3 — interface LoginResponseDTO

```ts
export interface LoginResponseDTO {
  id: string;
  name: string;
  email: string;
  avatarUrl: string | null;
  role: Role;
  mustChangePassword: boolean;
}
```

### [src/modules/DTOs/auth/MeResponse.dto.ts](../src/modules/DTOs/auth/MeResponse.dto.ts)

### L3 — interface MeResponseDTO

```ts
export interface MeResponseDTO {
  id: string;
  name: string;
  email: string;
  avatarUrl: string | null;
  role: Role;
  mustChangePassword: boolean;
}
```

### [src/modules/DTOs/internalNotes/InternalNotes.dto.ts](../src/modules/DTOs/internalNotes/InternalNotes.dto.ts)

### L9 — interface TimelineActorDTO

```ts
export interface TimelineActorDTO {
  id: string;
  name: string;
  role: InternalRole;
}
```

### L15 — interface TimelineNote

```ts
export interface TimelineNote {
  type: "note";
  id: string;
  content: string;
  createdAt: string;
  author: TimelineActorDTO;
}
```

### L23 — interface TimelineEvent

```ts
export interface TimelineEvent {
  type: "event";
  id: string;
  action: TimelineEventAction;
  text: string;
  occurredAt: string;
  actor: TimelineActorDTO | null;
  changeOrigin: TimelineChangeOrigin;
  /** Justificativa interna da transição (nunca o retorno público). */
  justification?: string | null;
  /**
   * Snapshot do retorno público da própria transição — populado **somente**
   * em `request.status_change` de destino público; `null`/ausente nos demais.
   */
  lastTechnicalMessage?: string | null;
}
```

### L40 — type TimelineItem

```ts
export type TimelineItem = TimelineNote | TimelineEvent;
```

### L42 — interface TriageHistoryEntry

```ts
export interface TriageHistoryEntry {
  triage: TriageAssessment;
  occurredAt: string;
}
```

### L47 — interface MappingHistoryEntry

```ts
export interface MappingHistoryEntry {
  mapping: MappingResponseDTO;
  occurredAt: string;
}
```

### L52 — interface InternalNotesResponse

```ts
export interface InternalNotesResponse {
  items: TimelineItem[];
  nextCursor: string | null;
  unseenCount: number;
  triages: TriageHistoryEntry[];
  mappings: MappingHistoryEntry[];
}
```

### L60 — interface CreateInternalNoteRequest

```ts
export interface CreateInternalNoteRequest {
  content: string;
}
```

### L64 — interface MarkInternalNotesReadRequest

```ts
export interface MarkInternalNotesReadRequest {
  lastReadNoteId: string;
}
```

### [src/modules/DTOs/pendingItems/PendingItems.dto.ts](../src/modules/DTOs/pendingItems/PendingItems.dto.ts)

### L1 — type PendencyStatus

```ts
export type PendencyStatus = "requested" | "responded" | "validated";
```

### L2 — type PendingItemType

```ts
export type PendingItemType = "field_edit" | "observation";
```

### L4 — interface PendingFieldRef

```ts
export interface PendingFieldRef {
  fieldKey: string;
  fieldLabel: string;
  currentValue: string | number | boolean | null;
}
```

### L10 — interface InternalAttachment

```ts
export interface InternalAttachment {
  fileName: string;
  mimeType: string;
  sizeBytes: number;
  downloadUrl: string | null;
  canDownload: boolean;
}
```

### L18 — interface PendingItem

```ts
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
```

### L35 — interface UnreadState

```ts
export interface UnreadState {
  count: number;
  hasUnread: boolean;
  lastUnreadAt: string | null;
}
```

### L41 — interface CorrectionAlert

```ts
export interface CorrectionAlert {
  count: number;
  batchId: string;
}
```

### L46 — interface PendingSummary

```ts
export interface PendingSummary {
  total: number;
  requested: number;
  responded: number;
  validated: number;
}
```

### L53 — interface CreatePendingItemsBody

```ts
export interface CreatePendingItemsBody {
  observation?: string;
  requestAttachment?: boolean;
  items?: Array<{ fieldKey: string; comment: string }>;
}
```

### L59 — interface CreatePendingItemsResponse

```ts
export interface CreatePendingItemsResponse {
  batchId: string;
  requestAttachment: boolean;
  items: PendingItem[];
}
```

### L70 — interface ListPendingItemsResponse

```ts
export interface ListPendingItemsResponse {
  batchId: string | null;
  requestAttachment: boolean;
  items: PendingItem[];
}
```

### L76 — type ReviewDecision

```ts
export type ReviewDecision = "validate" | "reopen";
```

### L78 — type ReviewPendingItemDecision

```ts
export type ReviewPendingItemDecision =
  | { id: string; decision: "validate"; note?: string }
  | { id: string; decision: "reopen"; comment: string };
```

### L82 — interface ReviewPendingItemsBody

```ts
export interface ReviewPendingItemsBody {
  batchId: string;
  requestAttachment?: boolean;
  items: ReviewPendingItemDecision[];
}
```

### L88 — interface ReviewPendingItemsResponse

```ts
export interface ReviewPendingItemsResponse {
  batchId: string;
  items: PendingItem[];
}
```

### [src/modules/DTOs/portalConfig/PortalConfigRequests.dto.ts](../src/modules/DTOs/portalConfig/PortalConfigRequests.dto.ts)

### L10 — interface UpdateAccessRequest

```ts
export interface UpdateAccessRequest {
  solicitationMode: "PUBLIC" | "AUTHENTICATED";
}
```

### L15 — interface UpdateIdentityRequest

```ts
export interface UpdateIdentityRequest {
  platformName?: string;
  protocolMask?: string;
}
```

### L21 — interface UpdateThemeRequest

```ts
export interface UpdateThemeRequest {
  theme: ThemeSection["theme"];
}
```

### L30 — type PortalAssetsPatchDto

```ts
export type PortalAssetsPatchDto = Partial<Record<AssetKey, string>> & {
  logoUsePrimaryColor?: boolean;
};
```

### L35 — interface UpdateCategoriesRequest

```ts
export interface UpdateCategoriesRequest {
  categories: CategoriesSection["categories"];
}
```

### L40 — interface UpdateStatusesRequest

```ts
export interface UpdateStatusesRequest {
  statuses: StatusesSection["statuses"];
}
```

### L45 — interface UpdatePrioritizationWeightsRequest

```ts
export interface UpdatePrioritizationWeightsRequest {
  prioritizationWeights: PrioritizationWeightsSection["prioritizationWeights"];
}
```

### [src/modules/DTOs/portalConfig/PortalConfigResponse.dto.ts](../src/modules/DTOs/portalConfig/PortalConfigResponse.dto.ts)

### L2 — type PortalConfigResponse

```ts
export type PortalConfigResponse = import("../../../shared/types/portalConfig.ts").PortalConfig;
```

### [src/modules/DTOs/prioritization/PrioritizationRequests.dto.ts](../src/modules/DTOs/prioritization/PrioritizationRequests.dto.ts)

### L4 — interface EvaluatePrioritizationRequest

```ts
export interface EvaluatePrioritizationRequest {
  notes: Record<string, number>;
  justification?: string;
}
```

### L10 — interface EvaluationSnapshot

```ts
export interface EvaluationSnapshot {
  notes: Record<string, number>;
  score: number;
  classification: Classification;
}
```

### [src/modules/DTOs/prioritization/PrioritizationResponse.dto.ts](../src/modules/DTOs/prioritization/PrioritizationResponse.dto.ts)

### L4 — interface CriterionResponse

```ts
export interface CriterionResponse {
  id: string;
  name: string;
  weight: number;
}
```

### L11 — interface ListCriteriaResponse

```ts
export interface ListCriteriaResponse {
  criteria: CriterionResponse[];
}
```

### L16 — interface EvaluatePrioritizationResponse

```ts
export interface EvaluatePrioritizationResponse {
  protocol: string;
  score: number;
  classification: Classification;
  calculatedAt: string;
  calculatedBy: number;
}
```

### [src/modules/DTOs/queue/mapping.dto.ts](../src/modules/DTOs/queue/mapping.dto.ts)

### L8 — type MappingModality

```ts
export type MappingModality = "REMOTE" | "IN_PERSON";
```

### L15 — interface MappingParticipant

```ts
export interface MappingParticipant {
  id: string | null;
  name: string;
  email: string;
}
```

### L26 — interface MappingParticipantInput

```ts
export interface MappingParticipantInput {
  id?: string;
  name: string;
  email: string;
}
```

### L33 — interface MappingValues

```ts
export interface MappingValues {
  scheduledFor: string | null;
  durationMinutes: number | null;
  modality: MappingModality | null;
  meetingLink: string | null;
  location: string | null;
  notes: string | null;
}
```

### L43 — interface ResolvedParticipant

```ts
export interface ResolvedParticipant {
  userId: number | null;
  name: string;
  email: string;
}
```

### L58 — interface MappingAssignee

```ts
export interface MappingAssignee {
  id: string;
  userId: string;
  name: string;
  email: string;
  jobTitle: string | null;
}
```

### L70 — interface MappingResponseDTO

```ts
export interface MappingResponseDTO {
  protocol: string;
  id: string | null;
  targetStatus: number | null;
  scheduledFor: string | null;
  durationMinutes: number | null;
  modality: MappingModality | null;
  meetingLink: string | null;
  location: string | null;
  participants: MappingParticipant[];
  notes: string | null;
  justification?: string | null;
  lastTechnicalMessage?: string | null;
  mappingAssignee: MappingAssignee | null;
}
```

### L98 — interface MappingPayloadDTO

```ts
export interface MappingPayloadDTO {
  id?: string;
  mappingAssigneeId?: string | null;
  scheduledFor?: string | null;
  durationMinutes?: number | null;
  modality?: MappingModality | null;
  meetingLink?: string | null;
  location?: string | null;
  participants?: MappingParticipantInput[];
  notes?: string | null;
  completeMapping: boolean;
  targetStatus?: number;
  justification?: string;
  lastTechnicalMessage?: string | null;
}
```

### L115 — interface MappingActor

```ts
export interface MappingActor {
  id: number;
  email: string;
  role: "Solicitante" | "Analista" | "Gestor" | "Administrador";
}
```

### [src/modules/DTOs/queue/queue.dto.ts](../src/modules/DTOs/queue/queue.dto.ts)

### L7 — interface FindQueueParams

```ts
export interface FindQueueParams extends QueueFilterQuery {
  /**
   * Escopo de visibilidade por usuário (issue #102). Quando definido, restringe
   * o resultado às solicitações em que o usuário é responsável — de triagem ou
   * de mapeamento. `undefined` = sem restrição (perfis Gestor/Administrador).
   */
  scopedUserId?: number;
  limit: number;
  offset: number;
}
```

### [src/modules/DTOs/reports/Dashboard.dto.ts](../src/modules/DTOs/reports/Dashboard.dto.ts)

### L4 — type DashboardSituation

```ts
export type DashboardSituation = "open" | "closed" | "overdue" | "unassigned";
```

### L6 — interface DashboardQuery

```ts
export interface DashboardQuery {
  from?: string;
  to?: string;
  situation?: DashboardSituation;
  statusId?: number;
  categoryId?: number;
  priorityId?: number | "unassigned";
}
```

### L15 — interface DashboardSummary

```ts
export interface DashboardSummary {
  total: number;
  open: number;
  closed: number;
  overdue: number;
  unassigned: number;
}
```

### L23 — interface DashboardStatusMetric

```ts
export interface DashboardStatusMetric {
  id: number;
  name: string;
  count: number;
  tone: StatusTone;
  closesRequest: boolean;
}
```

### L31 — interface DashboardPriorityMetric

```ts
export interface DashboardPriorityMetric {
  id: number | null;
  label: RequestPriority | "Não priorizada";
  count: number;
}
```

### L37 — interface DashboardFilterOptions

```ts
export interface DashboardFilterOptions {
  statuses: Array<{ id: number; name: string }>;
  categories: Array<{ id: number; name: string }>;
  priorities: Array<{ id: number; label: RequestPriority }>;
}
```

### L43 — interface DashboardCategoryMetric

```ts
export interface DashboardCategoryMetric {
  id: number;
  name: string;
  count: number;
}
```

### L49 — interface DashboardTrendPoint

```ts
export interface DashboardTrendPoint {
  period: string;
  count: number;
}
```

### L54 — interface DashboardResponse

```ts
export interface DashboardResponse {
  filters: {
    from: string | null;
    to: string | null;
    situation: DashboardSituation | null;
    statusId: number | null;
    categoryId: number | null;
    priorityId: number | "unassigned" | null;
  };
  filterOptions: DashboardFilterOptions;
  summary: DashboardSummary;
  byStatus: DashboardStatusMetric[];
  byPriority: DashboardPriorityMetric[];
  byCategory: DashboardCategoryMetric[];
  openedOverTime: DashboardTrendPoint[];
}
```

### [src/modules/DTOs/reports/QueueExport.dto.ts](../src/modules/DTOs/reports/QueueExport.dto.ts)

### L1 — interface QueueExportRow

```ts
export interface QueueExportRow {
  protocol: string;
  createdAt: string | Date;
  area: string | null;
  processName: string;
  category: string;
  status: string;
  priority: string | null;
  assignee: string | null;
  mappingScheduledFor: string | Date | null;
  updatedAt: string | Date;
  internalNotes: string | null;
  completedAt: string | Date | null;
}
```

### L16 — interface QueueCsvExport

```ts
export interface QueueCsvExport {
  content: string;
  filename: string;
}
```

### [src/modules/DTOs/requests/RequestInternalDetail.dto.ts](../src/modules/DTOs/requests/RequestInternalDetail.dto.ts)

### L19 — interface Assignee

```ts
export interface Assignee {
  id: string | null;
  name: string | null;
  email?: string | null;
}
```

### L25 — interface Prioritization

```ts
export interface Prioritization {
  score: number | null; // 10–50 (RN-007/RN-008, issue #51); null até ser avaliado
  maxScore: 50; // escala normalizada fixa — fonte: prioritization_evaluations
  label: string | null; // classificação RN-008 (ex.: "Alta"); null sem avaliação
}
```

### L31 — interface Meeting

```ts
export interface Meeting {
  scheduledFor: string;
  link: string | null;
}
```

### L36 — interface CorrectionAlert

```ts
export interface CorrectionAlert {
  count: number;
  batchId: string;
}
```

### L41 — interface UnreadState

```ts
export interface UnreadState {
  count: number;
  hasUnread: boolean;
  lastUnreadAt: string | null;
}
```

### L47 — interface PendingSummary

```ts
export interface PendingSummary {
  total: number;
  requested: number;
  responded: number;
  validated: number;
}
```

### L54 — interface InternalAttachment

```ts
export interface InternalAttachment {
  fileName: string;
  mimeType: string;
  sizeBytes: number;
  downloadUrl: string | null;
  canDownload: boolean;
}
```

### L62 — interface RequestInternalDetailDTO

```ts
export interface RequestInternalDetailDTO {
  protocol: string;
  status: string;
  priority: string | null;
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
```

### [src/modules/DTOs/requests/RequestRequests.dto.ts](../src/modules/DTOs/requests/RequestRequests.dto.ts)

### L9 — interface CreateRequestPayload

```ts
export interface CreateRequestPayload {
  requester: RequesterBlock;
  demand: DemandBlock;
  operational: OperationalBlock;
  complementary?: ComplementaryBlock;
  schedulePreferences?: SchedulePreferences; // até 3 horários
}
```

### L20 — interface UpdateRequesterBlock

```ts
export interface UpdateRequesterBlock {
  area: string;
  department?: string;
  manager: string;
  additionalContact?: string;
}
```

### L30 — interface UpdateInternalRequestPayload

```ts
export interface UpdateInternalRequestPayload {
  requester: UpdateRequesterBlock;
  demand: DemandBlock;
  operational: OperationalBlock;
  complementary?: ComplementaryBlock;
}
```

### L37 — interface ListRequestsQuery

```ts
export interface ListRequestsQuery {
  email: string;
  status?: string;
  page: number;
  pageSize: number;
}
```

### L49 — type ListRequestsInput

```ts
export type ListRequestsInput = Omit<ListRequestsQuery, "email"> & { email?: string };
```

### L55 — interface UpdateStatusResponse

```ts
export interface UpdateStatusResponse {
  protocol: string;
  status: string;
  previous: string;
  next: string;
  lastUpdate: string;
}
```

### [src/modules/DTOs/requests/RequestResponse.dto.ts](../src/modules/DTOs/requests/RequestResponse.dto.ts)

### L3 — interface RequestDetail

```ts
export interface RequestDetail {
  protocol: string;
  demandTitle: string;
  processName: string;
  status: RequestStatus;
  assigneeName: string | null;
  openedAt: string;
  estimatedCompletion: string | null;
  mappingDate: string | null;
  meeting: {
    scheduledFor: string;
    link: string | null;
  } | null;
  pendingIssues: string[];
  nextStep: string;
  lastTechnicalMessage: string | null;
  lastUpdate: string;
  conclusion: {
    result: TriageResult;
    justification: string;
  } | null;
}
```

### L26 — interface CreateRequestResponse

```ts
export interface CreateRequestResponse {
  protocol: string; // "MAAT-8K3P-9X2M" — protocolo único de rastreio,
  // não enumerável (FPE/Feistel sobre o ID interno —
  // Especificação 3.0 §5.2)
  status: RequestStatus; // "Solicitação enviada"
  createdAt: string; // ISO datetime
}
```

### L36 — interface AssigneeSummary

```ts
export interface AssigneeSummary {
  id: string; // professional_id
  name: string; // users.full_name
  email: string; // users.email
  jobTitle: string | null;
  capacity: number;
}
```

### L44 — interface AssignRequestResponse

```ts
export interface AssignRequestResponse {
  protocol: string;
  assignee: { id: string; name: string; email: string } | null;
  /** Status após a operação — muda para "Aguardando mapeamento" quando a RN-010 dispara. */
  status: RequestStatus;
}
```

### [src/modules/DTOs/requests/RequestTracking.dto.ts](../src/modules/DTOs/requests/RequestTracking.dto.ts)

### L21 — type TrackingMode

```ts
export type TrackingMode = "public" | "authenticated";
```

### L23 — interface Meeting

```ts
export interface Meeting {
  scheduledFor: string;
  link: string | null;
}
```

### L28 — interface PublicOperationalImpacts

```ts
export interface PublicOperationalImpacts {
  mainRisks: string;
  clientImpact: string;
  operationalImpact: OperationalImpact;
  perceivedCriticality: RequestPriority;
  desiredDeadline: string;
}
```

### L36 — interface RequesterOperational

```ts
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
```

### L48 — interface RequesterAttachment

```ts
export interface RequesterAttachment {
  id: string;
  fileName: string;
  mimeType: string;
  sizeBytes: number;
  downloadUrl: string;
  canDownload: boolean;
}
```

### L57 — interface PublicRequestDetails

```ts
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
```

### L69 — interface RequesterRequestDetails

```ts
export interface RequesterRequestDetails extends Omit<PublicRequestDetails, "impacts"> {
  operational: RequesterOperational;
  complementary?: ComplementaryBlock;
  schedulePreferences: string[] | null;
  mappingDate: string | null;
  attachments: RequesterAttachment[];
}
```

### L77 — type TrackingDetailsResponse

```ts
export type TrackingDetailsResponse =
  | { mode: "public"; details: PublicRequestDetails }
  | { mode: "authenticated"; details: RequesterRequestDetails };
```

### [src/modules/DTOs/users/UpdateProfileRequest.dto.ts](../src/modules/DTOs/users/UpdateProfileRequest.dto.ts)

### L36 — type UpdateRequesterBlock

```ts
export type UpdateRequesterBlock = z.infer<typeof updateRequesterSchema>;
```

### L55 — type UpdateProfilePayload

```ts
export type UpdateProfilePayload = z.infer<typeof updateProfileSchema>;
```

### [src/modules/DTOs/users/UserProfileResponse.dto.ts](../src/modules/DTOs/users/UserProfileResponse.dto.ts)

### L4 — interface UserProfileResponseDTO

```ts
export interface UserProfileResponseDTO {
  id: string;
  fullName: string;
  email: string;
  role: Role;
  avatarUrl: string | null;
  requester: RequesterProfileBlock | null;
  professional: ProfessionalProfileBlock | null;
}
```

### L15 — interface RequesterProfileBlock

```ts
export interface RequesterProfileBlock {
  area: string | null;
  department: string | null;
  manager: string | null;
  additionalContact: string | null;
}
```

### L23 — interface ProfessionalProfileBlock

```ts
export interface ProfessionalProfileBlock {
  jobTitle: string | null;
  specialties: string[];
  attendedCategoryIds: number[];
  notes: string | null;
}
```

### [src/modules/DTOs/users/UserRequests.dto.ts](../src/modules/DTOs/users/UserRequests.dto.ts)

### L1 — interface CreateProfessionalInput

```ts
export interface CreateProfessionalInput {
  /** Cargo do analista (vira `job_title` → `specialty` no card). */
  jobTitle: string;
  /** Especialidades (vira `specialties`, texto separado por vírgula). */
  specialties: string[];
  /** Ids das categorias atendidas (vira `attended_category_ids`). */
  attendedCategoryIds: number[];
  notes?: string;
}
```

### L11 — interface RequesterInput

```ts
export interface RequesterInput {
  area: string;
  department?: string;
  manager: string;
  additionalContact?: string | null;
}
```

### L18 — interface CreateUserRequest

```ts
export interface CreateUserRequest {
  fullName: string;
  email: string;
  role: string;
  /** Obrigatório quando `role = "analista"`; proibido para os demais perfis. */
  professional?: CreateProfessionalInput;
  requester: RequesterInput;
}
```

### L27 — interface UpdateUserRequest

```ts
export interface UpdateUserRequest {
  fullName?: string;
  email?: string;
  role?: string;
  professional?: CreateProfessionalInput;
  requester?: {
    area?: string;
    department?: string | null;
    manager?: string;
    additionalContact?: string | null;
  };
}
```

### L40 — interface ListUsersQuery

```ts
export interface ListUsersQuery {
  profile?: string;
  search?: string;
  page: number;
  pageSize: number;
}
```

### L47 — interface ChangeUserStatusRequest

```ts
export interface ChangeUserStatusRequest {
  isActive: boolean;
}
```

### [src/modules/DTOs/users/UserResponse.dto.ts](../src/modules/DTOs/users/UserResponse.dto.ts)

### L4 — interface UserSummary

```ts
export interface UserSummary {
  id: string;
  fullName: string;
  email: string;
  avatarUrl: string | null;
  profile: Role;
  isActive: boolean;
  mustChangePassword: boolean;
  createdAt: string;
}
```

### L15 — interface AssignAnalyst

```ts
export interface AssignAnalyst {
  id: string;
  fullName: string;
  email: string;
  specialty: string;
  categories: RequestCategory[];
  notes: string | null;
  requestLoad: number | null;
}
```

### L26 — type Analyst

```ts
export type Analyst = AssignAnalyst;
```

### L28 — interface CreateUserResponse

```ts
export interface CreateUserResponse extends Omit<UserSummary, "profile" | "avatarUrl"> {
  /** Vocabulário de exibição — capitalizado (ex.: "Analista"). */
  role: Role;
  /** Exibida uma única vez — não recuperável depois. */
  temporaryPassword: string;
}
```

### L35 — interface ResetPasswordResponse

```ts
export interface ResetPasswordResponse {
  id: string;
  temporaryPassword: string;
}
```

### L40 — interface ChangeUserStatusResponse

```ts
export interface ChangeUserStatusResponse {
  id: string;
  isActive: boolean;
}
```

### [src/modules/internalNotes/internalNotes.repository.ts](../src/modules/internalNotes/internalNotes.repository.ts)

### L15 — interface RequestIdentityRow

```ts
interface RequestIdentityRow {
  request_id: string;
}
```

### L156 — type MappingHistoryBaseRow

```ts
type MappingHistoryBaseRow = Omit<MappingHistoryRow, "participants" | "mappingAssignee">;
```

### [src/modules/internalNotes/internalNotes.schema.ts](../src/modules/internalNotes/internalNotes.schema.ts)

### L35 — type TimelineCursorPayload

```ts
export type TimelineCursorPayload = z.infer<typeof cursorPayloadSchema>;
```

### L70 — type ListTimelineQuery

```ts
export type ListTimelineQuery = z.infer<typeof listTimelineQuerySchema>;
```

### [src/modules/internalNotes/internalNotes.service.ts](../src/modules/internalNotes/internalNotes.service.ts)

### L68 — interface TimelineEntry

```ts
interface TimelineEntry {
  item: TimelineItem;
  timeMs: number;
  rank: number;
  id: bigint;
}
```

### L166 — interface ActorSource

```ts
interface ActorSource {
  actor_user_id: number | null;
  actor_name: string | null;
  actor_profile_name: string | null;
}
```

### [src/modules/pendingItems/pendingItems.repository.ts](../src/modules/pendingItems/pendingItems.repository.ts)

### L8 — interface RequestRef

```ts
export interface RequestRef {
  request_id: string;
  protocol: string;
  status: string;
  status_id: number;
  requester_user_id: number | null;
  requester_name: string;
  requester_email: string;
}
```

### L239 — type PendingItemInsert

```ts
export type PendingItemInsert = {
  request_id: string;
  batch_id: string;
  type: "field_edit" | "observation";
  field_key: string | null;
  field_label: string | null;
  current_value: string | null;
  comment: string;
  description: string;
  request_attachment: boolean;
  created_by: string;
};
```

### L252 — type RespondFacts

```ts
export type RespondFacts = {
  requestedRemaining: number;
  attachmentSatisfied: boolean;
  currentStatusName: string;
};
```

### L258 — type ReviewDecisionInput

```ts
export type ReviewDecisionInput =
  | {
      id: string;
      decision: "validate";
      note: string | null;
      fieldKey: string | null;
      value: unknown;
    }
  | { id: string; decision: "reopen"; comment: string };
```

### L268 — type ReviewFacts

```ts
export type ReviewFacts = { hasReopen: boolean };
```

### L270 — type SavedPendingAttachment

```ts
export type SavedPendingAttachment = {
  fileName: string;
  mimeType: string;
  sizeBytes: number;
  storageKey: string;
};
```

### [src/modules/pendingItems/pendingItems.schema.ts](../src/modules/pendingItems/pendingItems.schema.ts)

### L57 — type CreatePendingItemsInput

```ts
export type CreatePendingItemsInput = z.infer<typeof createPendingItemsSchema>;
```

### L58 — type VerifyInput

```ts
export type VerifyInput = z.infer<typeof verifySchema>;
```

### L59 — type ReviewInput

```ts
export type ReviewInput = z.infer<typeof reviewSchema>;
```

### [src/modules/pendingItems/pendingItems.service.ts](../src/modules/pendingItems/pendingItems.service.ts)

### L189 — type PendingCaller

```ts
export type PendingCaller = {
  user?: AuthenticatedUser;
  requesterIdentity?: { name: string; email: string } | null;
};
```

### [src/modules/portalConfig/portalConfig.mappers.ts](../src/modules/portalConfig/portalConfig.mappers.ts)

### L29 — type Palette

```ts
type Palette = "light" | "dark";
```

### [src/modules/portalConfig/portalConfig.repository.ts](../src/modules/portalConfig/portalConfig.repository.ts)

### L63 — interface CriteriaRow

```ts
interface CriteriaRow {
  criterion_id: string;
  weight: number;
}
```

### [src/modules/prioritization/prioritization.service.ts](../src/modules/prioritization/prioritization.service.ts)

### L33 — interface Actor

```ts
interface Actor {
  id: number;
  role: string;
}
```

### [src/modules/queue/mapping.repository.ts](../src/modules/queue/mapping.repository.ts)

### L17 — interface MappingRow

```ts
export interface MappingRow {
  mapping_id: string;
  request_id: string;
  professional_id: string | null;
  target_status_id: number | null;
  justification: string | null;
  last_technical_message: string | null;
  scheduled_for: Date | string | null;
  duration_minutes: number | null;
  modality: "REMOTE" | "IN_PERSON" | null;
  meeting_link: string | null;
  location: string | null;
  notes: string | null;
  is_concluded: boolean;
  concluded_at: Date | string | null;
  created_at: Date | string;
  updated_at: Date | string | null;
}
```

### L41 — interface MappingParticipantRow

```ts
export interface MappingParticipantRow {
  userId: number | null;
  name: string;
  email: string;
}
```

### L48 — interface MappingRequestContext

```ts
export interface MappingRequestContext {
  request_id: string;
  protocol: string;
  professional_id: string | null;
  mapping_professional_id: string | null;
  status: RequestStatus;
  /** `details_professional.user_id` do responsável (id de `users`, não UUID). */
  assignee_user_id: number | null;
  mapping_assignee_user_id: number | null;
  /** Motor de Status v4 (issue #124): flags do status vigente. */
  status_id: number | null;
  is_terminal: boolean;
  is_restricted: boolean;
}
```

### L64 — interface MappingAssigneeCandidate

```ts
export interface MappingAssigneeCandidate {
  id: string;
  userId: number;
  name: string;
  email: string;
  jobTitle: string | null;
  professional_status: "active" | "inactive";
  user_is_active: boolean;
  profile_name: string;
}
```

### L118 — interface MappingTargetRow

```ts
export interface MappingTargetRow {
  status_id: number;
  name: string;
  isPublic: boolean;
}
```

### [src/modules/queue/mapping.schemas.ts](../src/modules/queue/mapping.schemas.ts)

### L121 — type MappingPayload

```ts
export type MappingPayload = z.infer<typeof mappingPayloadSchema>;
```

### [src/modules/queue/queue.filters.ts](../src/modules/queue/queue.filters.ts)

### L4 — interface QueueRepositoryFilters

```ts
export interface QueueRepositoryFilters extends QueueFilterQuery {
  scopedUserId?: number;
}
```

### [src/modules/reports/reports.repository.ts](../src/modules/reports/reports.repository.ts)

### L14 — interface DashboardSummaryRow

```ts
interface DashboardSummaryRow {
  total: number | string;
  open: number | string;
  closed: number | string;
  overdue: number | string;
  unassigned: number | string;
}
```

### L22 — interface DashboardStatusRow

```ts
interface DashboardStatusRow {
  id: number | string;
  name: string;
  count: number | string;
  tone: string;
  closesRequest: boolean;
}
```

### L30 — interface DashboardPriorityRow

```ts
interface DashboardPriorityRow {
  id: number | string | null;
  label: string;
  count: number | string;
}
```

### L36 — interface DashboardCategoryRow

```ts
interface DashboardCategoryRow {
  id: number | string;
  name: string;
  count: number | string;
}
```

### L42 — interface DashboardTrendRow

```ts
interface DashboardTrendRow {
  period: string;
  count: number | string;
}
```

### L47 — interface DashboardStatusOptionRow

```ts
interface DashboardStatusOptionRow {
  id: number | string;
  name: string;
}
```

### L52 — interface DashboardCategoryOptionRow

```ts
interface DashboardCategoryOptionRow {
  id: number | string;
  name: string;
}
```

### L57 — interface DashboardPriorityOptionRow

```ts
interface DashboardPriorityOptionRow {
  id: number | string;
  label: string;
}
```

### L62 — interface DashboardFilterOptionRows

```ts
export interface DashboardFilterOptionRows {
  statuses: DashboardStatusOptionRow[];
  categories: DashboardCategoryOptionRow[];
  priorities: DashboardPriorityOptionRow[];
}
```

### [src/modules/requests/requests.repository.ts](../src/modules/requests/requests.repository.ts)

### L38 — interface YesNoDetailColumns

```ts
interface YesNoDetailColumns {
  flag: boolean | null;
  detail: string | null;
}
```

### L153 — interface RequestInsertReturning

```ts
interface RequestInsertReturning {
  request_id: string;
  protocol: string;
  created_at: Date;
}
```

### L343 — interface RequestSummaryRow

```ts
interface RequestSummaryRow {
  protocol: string;
  process_name: string;
  priority: RequestPriority | null;
  status: RequestStatus;
  assignee: string | null;
  requester_name: string;
  created_at: Date;
}
```

### L423 — interface RequestWithOwner

```ts
export interface RequestWithOwner {
  detail: RequestDetail;
  requesterEmail: string;
}
```

### L792 — interface RequestStatusContext

```ts
export interface RequestStatusContext {
  request_id: string;
  protocol: string;
  current_status_id: number | null;
  current_status_name: string | null;
  current_is_terminal: boolean;
  current_is_restricted: boolean;
  /** `details_professional.user_id` do responsável pela triagem. */
  assignee_user_id: number | null;
  /** `details_professional.user_id` do designado do mapeamento. */
  mapping_assignee_user_id: number | null;
}
```

### L806 — interface RequestStatusTarget

```ts
export interface RequestStatusTarget {
  status_id: number;
  name: string;
  is_active: boolean;
  is_restricted: boolean;
  isPublic: boolean;
  triage_mode: "none" | "free" | "conclusion_only";
  mapping_mode: "none" | "free" | "conclusion_only";
}
```

### [src/modules/requests/requests.schema.ts](../src/modules/requests/requests.schema.ts)

### L150 — type UpdateRequestPayload

```ts
export type UpdateRequestPayload = z.infer<typeof updateRequestPayloadSchema>;
```

### L181 — type AssignRequestPayload

```ts
export type AssignRequestPayload = z.infer<typeof assignRequestSchema>;
```

### L204 — type AssignAnalystPayload

```ts
export type AssignAnalystPayload = z.infer<typeof assignAnalystSchema>;
```

### L223 — type UpdateStatusPayload

```ts
export type UpdateStatusPayload = z.infer<typeof updateStatusSchema>;
```

### [src/modules/requests/requests.service.ts](../src/modules/requests/requests.service.ts)

### L61 — interface AuthenticatedIdentity

```ts
interface AuthenticatedIdentity {
  fullName: string;
  email: string;
}
```

### L420 — interface TrackingCaller

```ts
export interface TrackingCaller {
  user?: AuthenticatedUser;
  requesterIdentity?: { name: string; email: string } | null;
}
```

### L674 — interface InternalRequestRow

```ts
interface InternalRequestRow {
  request_id: string;
  requester_id: string;
  professional_id: string | null;
  title: string;
  request_type: string;
  category: string;
  process_name: string;
  need_description: string;
  problem_opportunity: string;
  expected_result: string;
  justification: string;
  process_description: string;
  process_steps: string;
  systems_used: string;
  execution_frequency: string;
  approximate_volume: string;
  people_involved: number;
  average_duration: string;
  estimated_monthly_effort: string | number;
  has_manual_controls: boolean;
  manual_controls_detail: string | null;
  main_risks: string;
  client_impact: string;
  operational_impact: OperationalImpact;
  desired_deadline: Date | string;
  perceived_criticality: RequestPriority;
  has_process_documentation: boolean | null;
  process_documentation_detail: string | null;
  has_similar_solution: boolean | null;
  similar_solution_detail: string | null;
  depends_on_other_areas: boolean | null;
  other_areas_detail: string | null;
  handles_restricted_info: boolean | null;
  restricted_info_detail: string | null;
  additional_notes: string | null;
  requester_area: string | null;
  requester_department: string | null;
  requester_manager: string | null;
  requester_additional_contact: string | null;
}
```

### [src/modules/requests/statusTransition.ts](../src/modules/requests/statusTransition.ts)

### L4 — interface StatusTransitionTarget

```ts
export interface StatusTransitionTarget {
  status_id: number;
  name: string;
  isPublic: boolean;
}
```

### L10 — interface StatusTransitionInput

```ts
export interface StatusTransitionInput {
  requestId: string;
  target: StatusTransitionTarget;
  updatedBy: string;
  lastTechnicalMessage?: string | null;
  expectedStatusId?: number | null;
}
```

### [src/modules/requests/triage/triage.repository.ts](../src/modules/requests/triage/triage.repository.ts)

### L7 — interface StatusRow

```ts
interface StatusRow {
  status_id: number;
  name: string;
  isPublic: boolean;
}
```

### L13 — interface CategoryRow

```ts
interface CategoryRow {
  category_id: number;
  name: string;
}
```

### L18 — interface RequestContextRow

```ts
interface RequestContextRow {
  request_id: string;
  protocol: string;
  professional_id: string | null;
  assignee_user_id: number | null;
  status_id: number;
  status_name: string | null;
  status_is_restricted: boolean;
  status_is_terminal: boolean;
  category_name: string | null;
}
```

### L50 — interface TriageRow

```ts
interface TriageRow {
  triage_id: string;
  adherent_to_scope: "Sim" | "Não" | "";
  adherent_justification: string;
  change_category: "Sim" | "Não" | "";
  new_category: string;
  preliminary_complexity: string;
  perceived_risks: string;
  suggested_responsible: string;
  suggested_responsible_justification: string;
  exit_status: number;
  result: string;
  conclusion_justification: string;
  assignee_user_id: number | null;
  assignee_name: string | null;
  assignee_email: string | null;
  last_technical_message: string | null;
}
```

### L220 — interface TriageAuditContext

```ts
export interface TriageAuditContext {
  actorId: number;
  previousStatus: string | null;
  previousCategory: string | null;
  nextStatus: string;
  justification: string;
  ipAddress?: string;
  changeOrigin: "admin" | "internal";
}
```

### [src/modules/requests/triage/triage.schema.ts](../src/modules/requests/triage/triage.schema.ts)

### L3 — interface TriageAssignee

```ts
export interface TriageAssignee {
  id: string | null;
  name: string | null;
  email: string | null;
}
```

### L9 — interface TriageAssessment

```ts
export interface TriageAssessment {
  id: string;
  adherentToScope: "Sim" | "Não" | "";
  adherentJustification: string;
  changeCategory: "Sim" | "Não" | "";
  newCategory: string;
  preliminaryComplexity: string;
  perceivedRisks: string;
  suggestedResponsible: string;
  suggestedResponsibleJustification: string;
  exitStatus: number;
  result: string;
  conclusionJustification: string;
  assignee: TriageAssignee | null;
  lastTechnicalMessage: string | null;
}
```

### L26 — type CreateTriagePayload

```ts
export type CreateTriagePayload = Omit<
  TriageAssessment,
  "id" | "assignee" | "lastTechnicalMessage"
> & {
  lastTechnicalMessage?: string | null;
};
```

### [src/modules/requests/triage/triage.service.ts](../src/modules/requests/triage/triage.service.ts)

### L9 — interface Actor

```ts
interface Actor {
  id: number;
  email: string;
  name: string;
  role: string;
}
```

### [src/modules/users/users.repository.ts](../src/modules/users/users.repository.ts)

### L15 — interface UserSummaryRow

```ts
interface UserSummaryRow {
  user_id: number;
  full_name: string;
  email: string;
  avatar_url: string | null;
  profile_name: string;
  is_active: boolean;
  must_change_password: boolean;
  created_at: Date;
}
```

### L180 — interface UserProfileRow

```ts
export interface UserProfileRow {
  user_id: number;
  full_name: string;
  email: string;
  avatar_url: string | null;
  profile_name: string;
  requester: {
    area: string | null;
    department: string | null;
    manager_name: string | null;
    additional_contact: string | null;
  } | null;
  professional: {
    job_title: string | null;
    specialties: string[];
    attended_category_ids: number[];
    notes: string | null;
  } | null;
}
```

### L485 — interface AnalystRow

```ts
interface AnalystRow {
  user_id: number;
  full_name: string;
  email: string;
  job_title: string | null;
  attended_category_ids: string | null;
  notes: string | null;
  professional_id: string | null;
}
```

### [src/shared/audit/auditCatalog.ts](../src/shared/audit/auditCatalog.ts)

### L60 — type AuditEntityName

```ts
export type AuditEntityName = keyof typeof auditCatalog;
```

### L63 — type AuditActionOf

```ts
export type AuditActionOf<E extends AuditEntityName> = (typeof auditCatalog)[E]["actions"][number];
```

### L66 — type ComposedAuditAction

```ts
export type ComposedAuditAction<E extends AuditEntityName> = `${E}.${AuditActionOf<E>}`;
```

### [src/shared/audit/auditLogger.ts](../src/shared/audit/auditLogger.ts)

### L11 — interface AuditEntryBase

```ts
export interface AuditEntryBase {
  /** Identificador da entidade afetada. */
  entityId: string;
  /** Ator (quem executou). Nulo para ações de sistema. */
  userId: number | null;
  /** Valor anterior (texto livre), ex.: is_active antes. */
  previousValue?: string | null;
  newValue?: string | null;
  /** Justificativa interna da transição (nunca o retorno público). */
  note?: string | null;
  /** Snapshot do retorno público submetido na transição (só status público). */
  lastTechnicalMessage?: string | null;
  ipAddress?: string | null;
  changeOrigin?: string | null;
}
```

### L31 — type AuditEntry

```ts
export type AuditEntry<
  E extends AuditEntityName = AuditEntityName,
  A extends ComposedAuditAction<E> = ComposedAuditAction<E>,
> = AuditEntryBase & { entityType: E; actionType: A };
```

### [src/shared/catalog/fieldCatalog.ts](../src/shared/catalog/fieldCatalog.ts)

### L42 — type FieldKey

```ts
export type FieldKey = (typeof FIELD_KEYS)[number];
```

### [src/shared/errors/AppError.ts](../src/shared/errors/AppError.ts)

### L1 — class AppError

```ts
export class AppError extends Error {
  public readonly statusCode: number;
  public readonly code?: string;

  constructor(message: string, statusCode = 400, code?: string) {
    super(message);
    this.name = "AppError";
    this.statusCode = statusCode;
    this.code = code;
  }
}
```

### [src/shared/errors/ValidationError.ts](../src/shared/errors/ValidationError.ts)

### L10 — class ValidationError

```ts
export class ValidationError extends AppError {
  public readonly fields: Record<string, string>;

  constructor(fields: Record<string, string>, message: string, code?: string) {
    super(message, 422, code);
    this.name = "ValidationError";
    this.fields = fields;
  }
}
```

### [src/shared/middleware/rateLimit.ts](../src/shared/middleware/rateLimit.ts)

### L1 — type RateLimitOptions

```ts
type RateLimitOptions = {
  windowMs: number;
  limit: number;
  keyGenerator?: (key: string) => string;
};
```

### [src/shared/storage/fileStorage.ts](../src/shared/storage/fileStorage.ts)

### L6 — interface SavedAttachment

```ts
export interface SavedAttachment {
  fileName: string; // nome original do arquivo
  mimeType: string; // MIME detectado no upload
  sizeBytes: number; // tamanho em bytes
  storageKey: string; // chave relativa persistida no banco (basename)
  storagePath: string; // caminho absoluto em disco — uso interno, nunca exposto na API
}
```

### [src/shared/types/internalNotes.ts](../src/shared/types/internalNotes.ts)

### L3 — type InternalRole

```ts
export type InternalRole = Exclude<Role, "Solicitante">;
```

### L5 — interface InternalNoteRow

```ts
export interface InternalNoteRow {
  internal_note_id: string;
  request_id: string;
  author_user_id: number;
  author_role_at_creation: InternalRole;
  content: string;
  created_at: Date;
  author_name: string;
}
```

### L15 — interface InternalNoteReadStateRow

```ts
export interface InternalNoteReadStateRow {
  request_id: string;
  user_id: number;
  last_read_note_id: string;
  read_at: Date;
}
```

### L22 — type TimelineEventAction

```ts
export type TimelineEventAction =
  | "request.assign"
  | "request.reassign"
  | "request.unassign"
  | "request.status_change"
  | "mapping.assign";
```

### L36 — type AuditTimelineAction

```ts
export type AuditTimelineAction = TimelineEventAction | "request.override_status_admin";
```

### L38 — type TimelineChangeOrigin

```ts
export type TimelineChangeOrigin = "admin" | "system" | "internal" | null;
```

### L40 — interface TimelineCursor

```ts
export interface TimelineCursor {
  t: Date;
  type: "note" | "event";
  id: string;
}
```

### L46 — interface TimelineEventRow

```ts
export interface TimelineEventRow {
  audit_id: string;
  action_type: AuditTimelineAction;
  previous_value: string | null;
  new_value: string | null;
  /** Justificativa interna da transição (`audit_history.note`). */
  note: string | null;
  /** Snapshot do retorno público da transição (`audit_history.last_technical_message`). */
  last_technical_message: string | null;
  change_origin: TimelineChangeOrigin;
  occurred_at: Date;
  actor_user_id: number | null;
  actor_name: string | null;
  actor_profile_name: string | null;
}
```

### L63 — interface TriageHistoryRow

```ts
export interface TriageHistoryRow {
  triage_id: string;
  adherent_to_scope: "Sim" | "Não" | "";
  adherent_justification: string;
  change_category: "Sim" | "Não" | "";
  new_category: string;
  preliminary_complexity: string;
  perceived_risks: string;
  suggested_responsible: string;
  suggested_responsible_justification: string;
  exit_status: number;
  result: string;
  conclusion_justification: string;
  assignee_user_id: number | null;
  assignee_name: string | null;
  assignee_email: string | null;
  last_technical_message: string | null;
  occurred_at: Date;
}
```

### L84 — interface MappingHistoryParticipant

```ts
export interface MappingHistoryParticipant {
  userId: number | null;
  name: string;
  email: string;
}
```

### L91 — interface MappingHistoryAssignee

```ts
export interface MappingHistoryAssignee {
  id: string;
  userId: number;
  name: string;
  email: string;
  jobTitle: string | null;
}
```

### L100 — interface MappingHistoryRow

```ts
export interface MappingHistoryRow {
  protocol: string;
  mapping_id: string;
  professional_id: string | null;
  scheduled_for: Date | string | null;
  duration_minutes: number | null;
  modality: "REMOTE" | "IN_PERSON" | null;
  meeting_link: string | null;
  location: string | null;
  notes: string | null;
  target_status_id: number | null;
  justification: string | null;
  last_technical_message: string | null;
  occurred_at: Date;
  participants: MappingHistoryParticipant[];
  mappingAssignee: MappingHistoryAssignee | null;
}
```

### [src/shared/types/pagination.ts](../src/shared/types/pagination.ts)

### L1 — interface PaginatedResponse

```ts
export interface PaginatedResponse<T> {
  data: T[];
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
}
```

### [src/shared/types/portalConfig.ts](../src/shared/types/portalConfig.ts)

### L14 — type SolicitationMode

```ts
export type SolicitationMode = "PUBLIC" | "AUTHENTICATED";
```

### L19 — interface PortalAssets

```ts
export interface PortalAssets {
  logoLightUrl: string;
  logoDarkUrl: string;
  // Quando true, o logo (SVG) é renderizado monocromático na cor primária.
  logoUsePrimaryColor: boolean;
  avatarLightUrl: string;
  avatarDarkUrl: string;
  loginImageLightUrl: string;
  loginImageDarkUrl: string;
  faviconLightUrl: string;
  faviconDarkUrl: string;
}
```

### L44 — type AssetKey

```ts
export type AssetKey = (typeof ASSET_KEYS)[number];
```

### L48 — type PortalAssetsPatch

```ts
export type PortalAssetsPatch = Partial<Record<AssetKey, string>> & {
  logoUsePrimaryColor?: boolean;
};
```

### L73 — type ThemeTokenKey

```ts
export type ThemeTokenKey = (typeof THEME_TOKEN_KEYS)[number];
```

### L77 — interface StatusToneTokens

```ts
export interface StatusToneTokens {
  color: string;
  background: string;
  backgroundLocked: boolean;
}
```

### L84 — interface ThemeGradient

```ts
export interface ThemeGradient {
  from: string; // hex #RRGGBB / #RRGGBBAA
  to: string; // hex #RRGGBB / #RRGGBBAA
  angle?: number; // graus 0..360 (default 143 quando ausente)
}
```

### L93 — interface ThemeTokens

```ts
export interface ThemeTokens extends Record<ThemeTokenKey, string> {
  gradient: ThemeGradient;
  statuses: Record<StatusTone, StatusToneTokens>;
}
```

### L99 — interface PortalTheme

```ts
export interface PortalTheme {
  light: ThemeTokens;
  dark: ThemeTokens;
}
```

### L107 — interface PortalCategory

```ts
export interface PortalCategory {
  id: number;
  name: string;
  description: string;
  isActive: boolean;
}
```

### L121 — type StatusMode

```ts
export type StatusMode = "none" | "free" | "conclusion_only";
```

### L133 — interface PortalStatus

```ts
export interface PortalStatus {
  id: number;
  name: string;
  isCore: boolean;
  isPublic: boolean;
  isTerminal: boolean;
  triageMode: StatusMode;
  mappingMode: StatusMode;
  isRestricted: boolean;
  tone: StatusTone;
  isActive: boolean;
}
```

### L160 — type PrioritizationCriterion

```ts
export type PrioritizationCriterion = (typeof PRIORITIZATION_CRITERIA)[number];
```

### L165 — type PrioritizationWeights

```ts
export type PrioritizationWeights = Record<PrioritizationCriterion, number>;
```

### L168 — interface PortalConfig

```ts
export interface PortalConfig {
  platformName: string;
  solicitationMode: SolicitationMode;
  protocolMask: string;
  theme: PortalTheme;
  assets: PortalAssets;
  categories: PortalCategory[];
  statuses: PortalStatus[];
  prioritizationWeights: PrioritizationWeights;
}
```

### L179 — type AccessSection

```ts
export type AccessSection = Pick<PortalConfig, "solicitationMode">;
```

### L180 — type IdentitySection

```ts
export type IdentitySection = Pick<PortalConfig, "platformName" | "protocolMask">;
```

### L181 — type ThemeSection

```ts
export type ThemeSection = Pick<PortalConfig, "theme">;
```

### L182 — type AssetsSection

```ts
export type AssetsSection = Pick<PortalConfig, "assets">;
```

### L183 — type CategoriesSection

```ts
export type CategoriesSection = Pick<PortalConfig, "categories">;
```

### L184 — type StatusesSection

```ts
export type StatusesSection = Pick<PortalConfig, "statuses">;
```

### L185 — type PrioritizationWeightsSection

```ts
export type PrioritizationWeightsSection = Pick<PortalConfig, "prioritizationWeights">;
```

### L188 — interface CategoryRow

```ts
export interface CategoryRow {
  category_id: number;
  name: string;
  description: string | null;
  status: "active" | "inactive";
  display_order: number | null;
}
```

### L197 — interface StatusRow

```ts
export interface StatusRow {
  status_id: number;
  name: string;
  is_public: boolean;
  is_core: boolean;
  is_restricted: boolean;
  is_terminal: boolean;
  triage_mode: StatusMode;
  mapping_mode: StatusMode;
  tone: StatusTone;
  order_number: number;
  is_active: boolean;
}
```

### [src/shared/types/prioritization.ts](../src/shared/types/prioritization.ts)

### L2 — interface CriterionRow

```ts
export interface CriterionRow {
  criterion_id: string;
  name: string;
  weight: number;
  active: boolean;
  display_order: number;
}
```

### L17 — type Classification

```ts
export type Classification = RequestPriority;
```

### L20 — interface PriorityRangeRow

```ts
export interface PriorityRangeRow {
  priority_id: number;
  level: Classification;
  min_score: number;
  max_score: number;
}
```

### L28 — interface EvaluationRow

```ts
export interface EvaluationRow {
  protocol: string;
  notes: Record<string, number>;
  score: number;
  classification: Classification;
  calculated_by: number;
  calculated_at: Date;
}
```

### [src/shared/types/queue.types.ts](../src/shared/types/queue.types.ts)

### L4 — interface RequestSummary

```ts
export interface RequestSummary {
  protocol: string;
  createdAt: string;
  processName: string;
  priority: RequestPriority | null;
  status: RequestStatus;
  assignee: string | null;
  requesterName: string;
}
```

### L14 — interface QueueMetricsResponse

```ts
export interface QueueMetricsResponse {
  totalRequests: number;
  unassignedRequests: number;
  inProgressRequests: number;
  overdueRequests: number;
}
```

### L21 — type QueuePriorityFilter

```ts
export type QueuePriorityFilter = RequestPriority | "nenhum";
```

### L24 — interface QueueFilterQuery

```ts
export interface QueueFilterQuery {
  search?: string;
  status?: RequestStatus;
  priority?: QueuePriorityFilter;
  assigneeId?: string | "unassigned";
  unassigned?: boolean;
}
```

### L33 — interface QueueQuery

```ts
export interface QueueQuery extends QueueFilterQuery {
  page: number;
  pageSize: number;
}
```

### L38 — interface QueueAssignee

```ts
export interface QueueAssignee {
  id: string;
  name: string;
}
```

### L43 — interface QueueItem

```ts
export interface QueueItem extends RequestSummary {
  requesterEmail: string;
  assigneeId: string | null;
}
```

### L48 — interface QueueResponse

```ts
export interface QueueResponse extends PaginatedResponse<QueueItem> {
  assignees: QueueAssignee[];
}
```

### [src/shared/types/requests.ts](../src/shared/types/requests.ts)

### L26 — type RequestStatus

```ts
export type RequestStatus = string;
```

### L31 — type RequestPriority

```ts
export type RequestPriority = (typeof REQUEST_PRIORITIES)[number];
```

### L45 — type TriageResult

```ts
export type TriageResult =
  | "Elegível para avaliação"
  | "Pendente de informações"
  | "Fora do escopo"
  | "Direcionada para outra área"
  | "Duplicada"
  | "Cancelada"
  | "Backlog";
```

### L54 — type OperationalImpact

```ts
export type OperationalImpact = "Baixo" | "Médio" | "Alto" | "Crítico";
```

### L56 — type YesNoDetail

```ts
export type YesNoDetail = false | string;
```

### L58 — type RequestCategory

```ts
export type RequestCategory =
  | "Automação"
  | "Melhoria de processo"
  | "Indicador"
  | "Dashboard ou relatório"
  | "Análise de dados"
  | "Padronização"
  | "Revisão de processo"
  | "Apoio técnico"
  | "Estudo de viabilidade"
  | "Outros";
```

### L70 — interface AttachmentMetadata

```ts
export interface AttachmentMetadata {
  fileName: string; // nome original do arquivo — máx. 255
  mimeType: string; // PDF, DOCX, XLSX, PNG ou JPG
  sizeBytes: number; // máximo 10 * 1024 * 1024 (10MB)
}
```

### L76 — interface RequesterBlock

```ts
export interface RequesterBlock {
  fullName: string; // obrigatório — máx. 150
  corporateEmail: string; // obrigatório — e-mail corporativo, máx. 254 (RFC 5321)
  area: string; // obrigatório — máx. 100
  department?: string; // opcional (padrão; Admin pode tornar obrigatório) — máx. 100
  // renderização híbrida: <Select> se houver departamentos
  // cadastrados; texto livre caso contrário (§1.1)
  manager: string; // obrigatório — gestor responsável, máx. 150
  additionalContact?: string; // opcional — telefone, ramal ou e-mail secundário, máx. 100
}
```

### L87 — interface DemandBlock

```ts
export interface DemandBlock {
  title: string; // obrigatório — título resumido, máx. 150
  requestType: string; // obrigatório — Tipo de Solicitação (modalidade macro,
  // ex.: Automação, Manutenção, Nova Demanda), máx. 80
  category: string; // obrigatório — Categoria da Demanda (validada contra o
  // cadastro ativo; nomes em RequestCategory são a referência base), máx. 80
  processName: string; // obrigatório — nome formal do processo atual, máx. 150
  description: string; // obrigatório — Descrição da Necessidade, máx. 4.000
  problem: string; // obrigatório — Problema ou Oportunidade Identificada, máx. 4.000
  expectedResult: string; // obrigatório — Resultado Esperado, máx. 4.000
  justification: string; // obrigatório — Justificativa da Solicitação, máx. 4.000
}
```

### L100 — interface OperationalBlock

```ts
export interface OperationalBlock {
  processDescription: string; // 1 — descrição resumida do processo atual, máx. 4.000
  processSteps: string; // 2 — principais etapas em tópicos/passo a passo, máx. 4.000
  systemsUsed: string; // 3 — softwares, ERPs, planilhas envolvidos, máx. 255
  executionFrequency: string; // 4 — Diária, Semanal, Mensal, Por Demanda etc., máx. 50
  volumetry: string; // 5 — ex.: "500 transações/mês", máx. 100
  peopleInvolved: number; // 6 — headcount alocado (INTEGER > 0)
  averageExecutionTime: string; // 7 — tempo médio por ciclo, ex.: "15 minutos", máx. 60
  monthlyEffortHours: number; // 8 — esforço mensal estimado em horas (DECIMAL(10,2))
  hasManualControls: YesNoDetail; // 9 — controles manuais: false ou texto do
  //      detalhamento (obrigatório junto do "Sim")
  mainRisks: string; // 10 — riscos de erro/compliance/operacionais, máx. 2.000
  clientImpact: string; // 11 — reflexo no cliente interno/externo, máx. 2.000
  operationalImpact: OperationalImpact; // 12 — Baixo/Médio/Alto/Crítico
  desiredDeadline: string; // 13 — prazo desejado, data ISO "yyyy-mm-dd"
  perceivedCriticality: RequestPriority; // 14 — criticidade percebida pelo solicitante
}
```

### L118 — interface ComplementaryBlock

```ts
export interface ComplementaryBlock {
  hasProcessDocumentation?: YesNoDetail; // existência de documentação do processo (+ links)
  hasSimilarSolution?: YesNoDetail; // existência de solução semelhante
  dependsOnOtherAreas?: YesNoDetail; // dependência de outras áreas (+ quais)
  handlesRestrictedInfo?: YesNoDetail; // tratamento de informações restritas (LGPD/sigilo)
  additionalNotes?: string; // observações adicionais, máx. 2.000
}
```

### L126 — type SchedulePreferences

```ts
export type SchedulePreferences = string[];
```

### L128 — interface RequesterTable

```ts
export interface RequesterTable {
  requester_id: string;
  user_id: number | null;
  full_name: string;
  corporate_email: string;
  area: string | null;
  department: string | null;
  manager_name: string | null;
  additional_contact: string | null;
  created_at: Date;
}
```

### L140 — interface AssignmentContextRow

```ts
export interface AssignmentContextRow {
  request_id: string;
  protocol: string;
  professional_id: string | null;
  mapping_professional_id: string | null;
  status: RequestStatus;
  screening_result: string | null;
  /** `details_professional.user_id` do responsável da triagem (issue #124). */
  assignee_user_id: number | null;
  /** `details_professional.user_id` do designado do mapeamento (issue #124). */
  mapping_assignee_user_id: number | null;
}
```

### L153 — interface AssignmentCandidateRow

```ts
export interface AssignmentCandidateRow {
  id: string;
  professional_id: string;
  user_id: number;
  name: string;
  email: string;
  professional_status: "active" | "inactive";
  user_is_active: boolean;
  profile_name: string;
}
```

### L164 — interface InternalRequestRow

```ts
export interface InternalRequestRow {
  request_id: string;
  protocol: string;
  status: string;
  requester_user_id?: number | null;
  requester_name: string;
  requester_email: string;
  requester_area: string | null;
  requester_department: string | null;
  requester_manager: string | null;
  requester_additional_contact: string | null;
  title: string;
  request_type: string;
  category?: string | null;
  category_name?: string | null;
  process_name: string;
  need_description: string;
  problem_opportunity: string;
  expected_result: string;
  justification: string;
  process_description: string;
  process_steps: string;
  systems_used: string;
  execution_frequency: string;
  approximate_volume: string;
  people_involved: number;
  average_duration: string;
  estimated_monthly_effort: string | number;
  has_manual_controls: boolean;
  manual_controls_detail: string | null;
  main_risks: string;
  client_impact: string;
  operational_impact: string;
  desired_deadline: string | Date;
  perceived_criticality: string;
  has_process_documentation: boolean | null;
  process_documentation_detail: string | null;
  has_similar_solution: boolean | null;
  similar_solution_detail: string | null;
  depends_on_other_areas: boolean | null;
  other_areas_detail: string | null;
  handles_restricted_info: boolean | null;
  restricted_info_detail: string | null;
  additional_notes: string | null;
  [key: string]: unknown;
}
```

### [src/shared/types/role.ts](../src/shared/types/role.ts)

### L3 — type Role

```ts
export type Role = (typeof ROLES)[number];
```

### [src/shared/types/systemSettings.ts](../src/shared/types/systemSettings.ts)

### L2 — type PortalSolicitationMode

```ts
export type PortalSolicitationMode = "PUBLIC" | "AUTHENTICATED";
```

### L18 — interface SystemSettingsRow

```ts
export interface SystemSettingsRow {
  settings_id: number;
  platform_name: string;
  solicitation_mode: PortalSolicitationMode;
  protocol_mask: string;
  theme_id: number | null;
  logo_light_url: string | null;
  logo_dark_url: string | null;
  logo_use_primary_color: boolean;
  avatar_light_url: string | null;
  avatar_dark_url: string | null;
  login_image_light_url: string | null;
  login_image_dark_url: string | null;
  favicon_light_url: string | null;
  favicon_dark_url: string | null;
  updated_by: number | null;
  created_at: Date;
  updated_at: Date | null;
}
```

### [src/shared/types/systemTheme.ts](../src/shared/types/systemTheme.ts)

### L3 — type StatusTone

```ts
export type StatusTone = (typeof STATUS_TONES)[number];
```

### L21 — type ThemeTokenKey

```ts
export type ThemeTokenKey = (typeof THEME_TOKEN_KEYS)[number];
```

### L24 — type ThemePalette

```ts
export type ThemePalette = "light" | "dark";
```

### L36 — interface SystemThemeRow

```ts
export interface SystemThemeRow {
  theme_id: number;
  // light palette
  light_background: string | null;
  light_surface: string | null;
  light_border: string | null;
  light_text_primary: string | null;
  light_text_secondary: string | null;
  light_heading: string | null;
  light_rich_black: string | null;
  light_primary: string | null;
  light_secondary: string | null;
  light_tint: string | null;
  light_on_primary: string | null;
  light_on_dark: string | null;
  light_on_gradient: string | null;
  light_gradient_from: string | null;
  light_gradient_to: string | null;
  light_gradient_angle: number | null;
  light_status_error_color: string | null;
  light_status_error_background: string | null;
  light_status_error_background_locked: boolean | null;
  light_status_success_color: string | null;
  light_status_success_background: string | null;
  light_status_success_background_locked: boolean | null;
  light_status_info_color: string | null;
  light_status_info_background: string | null;
  light_status_info_background_locked: boolean | null;
  light_status_warning_color: string | null;
  light_status_warning_background: string | null;
  light_status_warning_background_locked: boolean | null;
  light_status_neutral_color: string | null;
  light_status_neutral_background: string | null;
  light_status_neutral_background_locked: boolean | null;
  // dark palette
  dark_background: string | null;
  dark_surface: string | null;
  dark_border: string | null;
  dark_text_primary: string | null;
  dark_text_secondary: string | null;
  dark_heading: string | null;
  dark_rich_black: string | null;
  dark_primary: string | null;
  dark_secondary: string | null;
  dark_tint: string | null;
  dark_on_primary: string | null;
  dark_on_dark: string | null;
  dark_on_gradient: string | null;
  dark_gradient_from: string | null;
  dark_gradient_to: string | null;
  dark_gradient_angle: number | null;
  dark_status_error_color: string | null;
  dark_status_error_background: string | null;
  dark_status_error_background_locked: boolean | null;
  dark_status_success_color: string | null;
  dark_status_success_background: string | null;
  dark_status_success_background_locked: boolean | null;
  dark_status_info_color: string | null;
  dark_status_info_background: string | null;
  dark_status_info_background_locked: boolean | null;
  dark_status_warning_color: string | null;
  dark_status_warning_background: string | null;
  dark_status_warning_background_locked: boolean | null;
  dark_status_neutral_color: string | null;
  dark_status_neutral_background: string | null;
  dark_status_neutral_background_locked: boolean | null;
  // auditoria
  updated_at: Date | null;
}
```

### [src/shared/types/user.ts](../src/shared/types/user.ts)

### L3 — interface User

```ts
export interface User {
  id: string;
  email: string;
  name: string;
  password: string;
  role: Role;
}
```

### L11 — type AuthenticatedUser

```ts
export type AuthenticatedUser = Omit<User, "password">;
```

### L12 — type UserRequestDTO

```ts
export type UserRequestDTO = Omit<User, "id">;
```

### L15 — interface UserRow

```ts
export interface UserRow {
  user_id: number;
  full_name: string;
  email: string;
  avatar_url: string | null;
  password_hash: string;
  profile_id: number;
  is_active: boolean;
  must_change_password: boolean;
  password_changed_at: Date;
  created_at: Date;
  updated_at: Date;
}
```

### L30 — interface AuthUserRow

```ts
export interface AuthUserRow extends UserRow {
  profile_name: string;
  profile_is_active: boolean;
}
```

### L36 — interface UserMetricsResponse

```ts
export interface UserMetricsResponse {
  total: number;
  active: number;
  pending: number;
  admins: number;
}
```

### [src/shared/utils/jwtUtil.ts](../src/shared/utils/jwtUtil.ts)

### L9 — type TokenScope

```ts
export type TokenScope = "session" | "change_password";
```

### L11 — interface TokenPayload

```ts
export interface TokenPayload {
  id: string;
  name: string;
  email: string;
  role: Role;
  /** Época (ms) de `users.password_changed_at` no momento da emissão — usado
   *  para revogar tokens emitidos antes de uma troca/redefinição de senha. */
  password_changed_at: number;
  scope?: TokenScope;
}
```

### [src/shared/validation/zodErrors.ts](../src/shared/validation/zodErrors.ts)

### L23 — interface GroupedIssues

```ts
interface GroupedIssues {
  missing: ZodError["issues"][number][];
  invalid: ZodError["issues"][number][];
}
```

## 2. Declarações sem anotação explícita

### [src/app.ts](../src/app.ts)

- L10 — variable: `app`

### [src/configs.ts](../src/configs.ts)

- L1 — variable: `NODE_ENV`
- L4 — variable: `key`
- L14 — variable: `Config`
- L19 — parameter: `s`
- L19 — retorno da função: `<anônima>()`
- L30 — variable: `num`
- L31 — variable: `unit`

### [src/database/conection.ts](../src/database/conection.ts)

- L5 — variable: `db`

### [src/docs/components/security.ts](../src/docs/components/security.ts)

- L1 — variable: `securitySchemes`

### [src/docs/openapi.ts](../src/docs/openapi.ts)

- L1 — variable: `openapiBase`

### [src/docs/paths/index.ts](../src/docs/paths/index.ts)

- L12 — variable: `paths`

### [src/docs/schemas/auth.ts](../src/docs/schemas/auth.ts)

- L1 — variable: `AuthenticatedUser`
- L18 — variable: `LoginRequest`
- L27 — variable: `LoginResponse`
- L40 — variable: `LogoutResponse`
- L48 — variable: `ChangePasswordRequest`
- L58 — variable: `ChangePasswordResponse`

### [src/docs/schemas/common.ts](../src/docs/schemas/common.ts)

- L1 — variable: `ErrorResponse`
- L11 — variable: `ValidationErrorResponse`

### [src/docs/schemas/index.ts](../src/docs/schemas/index.ts)

- L48 — variable: `schemas`

### [src/docs/schemas/mapping.ts](../src/docs/schemas/mapping.ts)

- L1 — variable: `MappingResponse`

### [src/docs/schemas/portal.ts](../src/docs/schemas/portal.ts)

- L1 — variable: `PortalConfig`

### [src/docs/schemas/prioritization.ts](../src/docs/schemas/prioritization.ts)

- L1 — variable: `PrioritizationCriteria`

### [src/docs/schemas/queue.ts](../src/docs/schemas/queue.ts)

- L1 — variable: `QueueMetrics`
- L12 — variable: `QueueItem`
- L37 — variable: `QueueResponse`

### [src/docs/schemas/request.ts](../src/docs/schemas/request.ts)

- L1 — variable: `RequestSummary`
- L13 — variable: `RequestDetail`

### [src/docs/schemas/triage.ts](../src/docs/schemas/triage.ts)

- L1 — variable: `TriagemResponse`

### [src/docs/schemas/user.ts](../src/docs/schemas/user.ts)

- L1 — variable: `UserMetrics`
- L12 — variable: `UserListItem`

### [src/docs/swagger.ts](../src/docs/swagger.ts)

- L19 — variable: `openapiSpec`
- L28 — variable: `swaggerOptions`
- L41 — parameter: `_req`
- L41 — parameter: `res`
- L41 — retorno da função: `<anônima>()`

### [src/modules/auditHistory/auditHistory.controller.ts](../src/modules/auditHistory/auditHistory.controller.ts)

- L12 — variable: `parsed`
- L25 — variable: `id`
- L31 — variable: `detail`
- L43 — variable: `protocol`
- L48 — variable: `logs`

### [src/modules/auditHistory/auditHistory.repository.ts](../src/modules/auditHistory/auditHistory.repository.ts)

- L36 — variable: `query`
- L52 — variable: `totalRow`
- L53 — parameter: `builder`
- L53 — retorno da função: `<anônima>()`
- L60 — variable: `total`
- L62 — variable: `page`
- L63 — variable: `limit`
- L64 — variable: `offset`
- L65 — variable: `items`
- L123 — parameter: `rows`
- L123 — retorno da função: `<anônima>()`

### [src/modules/auditHistory/auditHistory.router.ts](../src/modules/auditHistory/auditHistory.router.ts)

- L10 — variable: `auditHistoryRoutes`
- L14 — parameter: `_req`
- L14 — parameter: `next`
- L14 — parameter: `res`
- L14 — retorno da função: `<anônima>()`
- L38 — variable: `auditLogsRouter`

### [src/modules/auditHistory/auditHistory.schema.ts](../src/modules/auditHistory/auditHistory.schema.ts)

- L5 — variable: `optionalPositiveInt`
- L9 — variable: `auditEntityNames`
- L11 — variable: `auditHistoryQuerySchema`
- L18 — parameter: `query`
- L18 — retorno da função: `<anônima>()`
- L22 — parameter: `query`
- L22 — retorno da função: `<anônima>()`
- L26 — parameter: `query`
- L26 — retorno da função: `<anônima>()`
- L30 — parameter: `query`
- L30 — retorno da função: `<anônima>()`

### [src/modules/auditHistory/auditHistory.service.ts](../src/modules/auditHistory/auditHistory.service.ts)

- L14 — parameter: `[key, val]`
- L14 — retorno da função: `<anônima>()`
- L20 — variable: `{ items, total }`
- L22 — parameter: `row`
- L22 — retorno da função: `<anônima>()`
- L46 — variable: `occurredAt`
- L48 — variable: `userId`
- L70 — variable: `row`
- L86 — variable: `normalized`
- L87 — variable: `isManagerLike`
- L89 — variable: `request`
- L103 — variable: `isAssignee`
- L105 — variable: `isMappingAssignee`
- L117 — variable: `rows`
- L118 — parameter: `row`
- L118 — retorno da função: `<anônima>()`

### [src/modules/auth/auth.controller.ts](../src/modules/auth/auth.controller.ts)

- L12 — variable: `COOKIE_OPTIONS`
- L26 — retorno da função: `<anônima>()`
- L26 — variable: `logout`
- L31 — retorno da função: `<anônima>()`
- L31 — variable: `authenticate`
- L32 — variable: `parsed`
- L38 — variable: `foundUser`
- L41 — variable: `changeToken`
- L64 — variable: `sessionToken`
- L87 — retorno da função: `<anônima>()`
- L87 — variable: `me`
- L88 — variable: `userId`
- L89 — variable: `sessionUser`
- L103 — retorno da função: `<anônima>()`
- L103 — variable: `changePassword`
- L104 — variable: `parsed`
- L110 — variable: `userId`
- L111 — variable: `updated`
- L113 — variable: `sessionToken`

### [src/modules/auth/auth.repository.ts](../src/modules/auth/auth.repository.ts)

- L6 — retorno da função: `authUserQuery()`
- L77 — variable: `updated`
- L87 — variable: `passwordChangedAt`

### [src/modules/auth/auth.router.ts](../src/modules/auth/auth.router.ts)

- L2 — variable: `authRoutes`

### [src/modules/auth/auth.schema.ts](../src/modules/auth/auth.schema.ts)

- L4 — variable: `maxPasswordBytes`
- L7 — parameter: `value`
- L7 — retorno da função: `<anônima>()`
- L9 — variable: `loginSchema`
- L14 — variable: `changePasswordSchema`
- L20 — parameter: `data`
- L20 — retorno da função: `<anônima>()`
- L24 — parameter: `data`
- L24 — retorno da função: `<anônima>()`

### [src/modules/auth/auth.service.ts](../src/modules/auth/auth.service.ts)

- L24 — variable: `DUMMY_PASSWORD_HASH`
- L27 — variable: `email`
- L29 — variable: `user`
- L45 — variable: `isPasswordValid`
- L64 — variable: `user`
- L86 — variable: `user`
- L96 — variable: `isCurrentPasswordValid`
- L102 — variable: `isSamePassword`
- L108 — variable: `newPasswordHash`
- L112 — parameter: `trx`
- L112 — retorno da função: `<anônima>()`
- L112 — variable: `{ password_changed_at }`
- L113 — variable: `result`

### [src/modules/DTOs/users/UpdateProfileRequest.dto.ts](../src/modules/DTOs/users/UpdateProfileRequest.dto.ts)

- L15 — variable: `updateRequesterSelfSchema`
- L29 — variable: `updateRequesterSchema`
- L47 — variable: `updateProfileSchema`

### [src/modules/internalNotes/internalNotes.controller.ts](../src/modules/internalNotes/internalNotes.controller.ts)

- L14 — variable: `parsed`
- L26 — variable: `userId`
- L38 — variable: `listInternalNotes`
- L39 — variable: `parsed`
- L44 — variable: `actor`
- L45 — variable: `response`
- L53 — variable: `createInternalNote`
- L54 — variable: `parsed`
- L59 — variable: `response`
- L67 — variable: `markInternalNotesRead`
- L68 — variable: `parsed`
- L73 — variable: `actor`

### [src/modules/internalNotes/internalNotes.repository.ts](../src/modules/internalNotes/internalNotes.repository.ts)

- L30 — variable: `MAPPING_RECORD_ACTIONS`
- L32 — variable: `NOTE_COLUMNS`
- L53 — variable: `query`
- L59 — parameter: `builder`
- L59 — retorno da função: `<anônima>()`
- L60 — parameter: `nested`
- L60 — retorno da função: `<anônima>()`
- L84 — variable: `query`
- L87 — parameter: `scope`
- L87 — retorno da função: `<anônima>()`
- L89 — parameter: `requestScope`
- L89 — retorno da função: `<anônima>()`
- L95 — parameter: `mappingScope`
- L95 — retorno da função: `<anônima>()`
- L108 — variable: `auditId`
- L109 — parameter: `builder`
- L109 — retorno da função: `<anônima>()`
- L110 — parameter: `nested`
- L110 — retorno da função: `<anônima>()`
- L143 — variable: `query`
- L151 — variable: `row`
- L158 — variable: `TRIAGE_HISTORY_COLUMNS`
- L205 — variable: `latestAudit`
- L214 — variable: `rows`
- L216 — retorno da função: `<anônima>()`
- L242 — parameter: `row`
- L242 — retorno da função: `<anônima>()`
- L242 — variable: `mappingIds`
- L243 — variable: `professionalIds`
- L244 — parameter: `id`
- L244 — parameter: `row`
- L244 — retorno da função: `<anônima>()`
- L247 — variable: `[participantRows, assigneeRows]`
- L274 — variable: `participantsByMapping`
- L275 — variable: `participant`
- L276 — variable: `list`
- L285 — parameter: `assignee`
- L285 — retorno da função: `<anônima>()`
- L285 — variable: `assigneeById`
- L287 — parameter: `row`
- L287 — retorno da função: `<anônima>()`
- L304 — parameter: `row`
- L304 — retorno da função: `<anônima>()`
- L312 — variable: `rows`
- L316 — parameter: `row`
- L316 — retorno da função: `<anônima>()`
- L333 — parameter: `row`
- L333 — retorno da função: `<anônima>()`
- L350 — variable: `rows`
- L359 — variable: `row`

### [src/modules/internalNotes/internalNotes.router.ts](../src/modules/internalNotes/internalNotes.router.ts)

- L10 — variable: `internalNotesRoutes`

### [src/modules/internalNotes/internalNotes.schema.ts](../src/modules/internalNotes/internalNotes.schema.ts)

- L3 — variable: `protocolParamsSchema`
- L7 — variable: `createInternalNoteSchema`
- L15 — variable: `markInternalNotesReadSchema`
- L22 — variable: `cursorPayloadSchema`
- L28 — parameter: `ctx`
- L28 — parameter: `cursor`
- L28 — retorno da função: `<anônima>()`
- L29 — variable: `pattern`
- L37 — variable: `listTimelineQuerySchema`
- L48 — parameter: `ctx`
- L48 — parameter: `raw`
- L61 — variable: `payload`

### [src/modules/internalNotes/internalNotes.service.ts](../src/modules/internalNotes/internalNotes.service.ts)

- L27 — variable: `EVENT_ID_PREFIX`
- L28 — variable: `NOTE_RANK`
- L29 — variable: `EVENT_RANK`
- L46 — variable: `request`
- L61 — variable: `payload`
- L99 — variable: `entries`
- L100 — variable: `page`
- L101 — variable: `oldest`
- L102 — variable: `nextCursor`
- L104 — parameter: `entry`
- L104 — retorno da função: `<anônima>()`
- L109 — variable: `parsed`
- L139 — variable: `numericId`
- L140 — variable: `statusName`
- L144 — variable: `userId`
- L145 — variable: `name`
- L149 — variable: `userId`
- L150 — variable: `name`
- L157 — variable: `name`
- L177 — variable: `role`
- L188 — variable: `date`
- L232 — parameter: `participant`
- L232 — retorno da função: `<anônima>()`
- L256 — variable: `userIds`
- L257 — variable: `professionalIds`
- L258 — variable: `statusIds`
- L260 — variable: `row`
- L262 — variable: `userId`
- L267 — variable: `statusId`
- L276 — variable: `[userNames, professionalNames, statusNames]`
- L282 — parameter: `row`
- L282 — retorno da função: `<anônima>()`
- L304 — variable: `requestId`
- L305 — variable: `cursor`
- L306 — variable: `pageLimit`
- L308 — variable: `readState`
- L310 — variable: `[noteRows, eventRows, unseenCount, triageRows, mappingRows]`
- L318 — variable: `events`
- L319 — variable: `notes`
- L320 — variable: `{ items, nextCursor }`
- L336 — variable: `requestId`
- L337 — variable: `internalNoteId`
- L338 — variable: `note`
- L351 — variable: `requestId`
- L352 — variable: `note`

### [src/modules/pendingItems/pendingItems.controller.ts](../src/modules/pendingItems/pendingItems.controller.ts)

- L8 — variable: `{ checkRateLimit }`
- L22 — variable: `p`
- L30 — variable: `id`
- L36 — variable: `protocol`
- L37 — variable: `parsed`
- L39 — variable: `result`
- L49 — variable: `protocol`
- L50 — variable: `result`
- L55 — variable: `protocol`
- L56 — variable: `pendingItemId`
- L59 — variable: `isInternal`
- L60 — variable: `actorEmail`
- L61 — variable: `item`
- L74 — variable: `protocol`
- L75 — variable: `pendingItemId`
- L78 — variable: `file`
- L80 — variable: `result`
- L91 — variable: `protocol`
- L92 — variable: `parsed`
- L94 — variable: `result`
- L104 — variable: `protocol`
- L105 — variable: `body`
- L110 — variable: `key`
- L114 — variable: `parsed`

### [src/modules/pendingItems/pendingItems.repository.ts](../src/modules/pendingItems/pendingItems.repository.ts)

- L22 — variable: `conn`
- L23 — variable: `row`
- L43 — variable: `conn`
- L44 — variable: `row`
- L61 — variable: `conn`
- L62 — variable: `row`
- L73 — variable: `conn`
- L84 — variable: `conn`
- L85 — variable: `row`
- L94 — variable: `grouped`
- L97 — variable: `conn`
- L98 — variable: `rows`
- L103 — variable: `row`
- L104 — variable: `key`
- L105 — variable: `list`
- L117 — variable: `conn`
- L118 — variable: `row`
- L131 — variable: `conn`
- L132 — variable: `rows`
- L138 — parameter: `r`
- L138 — retorno da função: `<anônima>()`
- L138 — variable: `map`
- L139 — variable: `requested`
- L140 — variable: `responded`
- L141 — variable: `validated`
- L154 — variable: `conn`
- L156 — variable: `rows`
- L166 — variable: `byBatch`
- L167 — variable: `row`
- L168 — variable: `entry`
- L169 — variable: `count`
- L176 — variable: `candidates`
- L177 — parameter: `[, s]`
- L177 — retorno da função: `<anônima>()`
- L181 — variable: `requiresAttachment`
- L185 — parameter: `[batchId]`
- L185 — retorno da função: `<anônima>()`
- L189 — parameter: `r`
- L189 — retorno da função: `<anônima>()`
- L189 — variable: `requiresSet`
- L191 — variable: `attachmentCounts`
- L193 — variable: `counts`
- L203 — variable: `c`
- L206 — variable: `[batchId, summary]`
- L217 — variable: `conn`
- L218 — variable: `row`
- L224 — variable: `count`
- L226 — variable: `lastUnreadAt`
- L231 — variable: `row`
- L281 — variable: `row`
- L303 — variable: `row`
- L308 — variable: `row`
- L317 — variable: `conn`
- L332 — parameter: `trx`
- L332 — retorno da função: `<anônima>()`
- L333 — parameter: `row`
- L333 — retorno da função: `<anônima>()`
- L333 — variable: `toInsert`
- L349 — variable: `current`
- L350 — variable: `pendingStatusId`
- L405 — parameter: `trx`
- L405 — retorno da função: `<anônima>()`
- L406 — variable: `row`
- L433 — variable: `requestedCount`
- L437 — variable: `requestedRemaining`
- L439 — variable: `requiresAttachment`
- L442 — variable: `attachmentSatisfied`
- L446 — variable: `current`
- L447 — variable: `nextStatusName`
- L454 — variable: `statusId`
- L480 — parameter: `trx`
- L480 — retorno da função: `<anônima>()`
- L517 — parameter: `trx`
- L517 — retorno da função: `<anônima>()`
- L524 — variable: `hasReopen`
- L526 — variable: `dec`
- L527 — variable: `row`
- L531 — variable: `currentStatus`
- L577 — variable: `nextStatusName`
- L579 — variable: `statusId`
- L596 — parameter: `d`
- L596 — retorno da função: `<anônima>()`
- L618 — variable: `col`
- L620 — variable: `v`
- L624 — variable: `requesterRow`
- L646 — variable: `col`
- L649 — variable: `category`
- L692 — variable: `col`
- L719 — variable: `entry`

### [src/modules/pendingItems/pendingItems.router.ts](../src/modules/pendingItems/pendingItems.router.ts)

- L17 — variable: `router`
- L19 — variable: `upload`
- L22 — parameter: `_req`
- L22 — parameter: `cb`
- L22 — parameter: `file`
- L22 — retorno da função: `<anônima>()`
- L33 — variable: `uploadSingle`
- L53 — parameter: `next`
- L53 — parameter: `req`
- L53 — parameter: `res`
- L53 — retorno da função: `<anônima>()`
- L54 — parameter: `err`
- L54 — retorno da função: `<anônima>()`
- L69 — variable: `publicVerifyRouter`

### [src/modules/pendingItems/pendingItems.schema.ts](../src/modules/pendingItems/pendingItems.schema.ts)

- L3 — variable: `createPendingItemsSchema`
- L17 — parameter: `ctx`
- L17 — parameter: `data`
- L17 — retorno da função: `<anônima>()`
- L18 — variable: `hasObservation`
- L20 — variable: `hasItems`
- L30 — variable: `verifySchema`
- L36 — variable: `reviewSchema`

### [src/modules/pendingItems/pendingItems.service.ts](../src/modules/pendingItems/pendingItems.service.ts)

- L21 — variable: `TERMINAL_STATUSES`
- L33 — parameter: `row`
- L33 — retorno da função: `<anônima>()`
- L33 — variable: `bases`
- L34 — variable: `base`
- L38 — parameter: `b`
- L38 — retorno da função: `<anônima>()`
- L38 — variable: `attachmentsByItem`
- L41 — variable: `base`
- L42 — variable: `atts`
- L43 — parameter: `a`
- L43 — retorno da função: `<anônima>()`
- L43 — variable: `attachments`
- L51 — variable: `currentValue`
- L54 — variable: `parsed`
- L63 — variable: `corrected`
- L66 — variable: `parsed`
- L86 — variable: `request`
- L95 — variable: `observation`
- L96 — variable: `items`
- L97 — variable: `hasObservation`
- L98 — variable: `hasItems`
- L108 — variable: `raw`
- L114 — variable: `item`
- L115 — variable: `fieldKey`
- L139 — variable: `batchId`
- L140 — variable: `requestAttachment`
- L157 — variable: `item`
- L158 — variable: `fieldKey`
- L159 — variable: `snapshot`
- L176 — variable: `createdRows`
- L185 — variable: `mapped`
- L203 — variable: `professionalId`
- L204 — variable: `requestProfessionalId`
- L211 — variable: `request`
- L215 — variable: `nameOk`
- L216 — variable: `emailOk`
- L226 — variable: `identity`
- L228 — variable: `nameOk`
- L229 — variable: `emailOk`
- L240 — variable: `request`
- L242 — variable: `rows`
- L243 — variable: `items`
- L252 — variable: `openRow`
- L253 — parameter: `row`
- L253 — retorno da função: `<anônima>()`
- L255 — variable: `targetRow`
- L256 — variable: `batchId`
- L257 — variable: `requestAttachment`
- L259 — parameter: `row`
- L259 — retorno da função: `<anônima>()`
- L274 — variable: `request`
- L276 — variable: `row`
- L284 — variable: `type`
- L302 — variable: `response`
- L315 — variable: `updated`
- L324 — parameter: `facts`
- L324 — retorno da função: `<anônima>()`
- L332 — variable: `list`
- L350 — variable: `request`
- L352 — variable: `row`
- L368 — variable: `[saved]`
- L378 — variable: `err`
- L418 — variable: `date`
- L440 — variable: `nullableComplement`
- L470 — variable: `request`
- L475 — variable: `batchId`
- L476 — variable: `batchRows`
- L479 — parameter: `row`
- L479 — retorno da função: `<anônima>()`
- L479 — variable: `byId`
- L481 — variable: `decision`
- L482 — variable: `row`
- L484 — variable: `status`
- L496 — parameter: `decision`
- L496 — retorno da função: `<anônima>()`
- L500 — variable: `row`
- L501 — variable: `fieldKey`
- L510 — variable: `decidedRows`
- L519 — parameter: `facts`
- L519 — retorno da função: `<anônima>()`
- L522 — variable: `mapped`
- L532 — variable: `mode`
- L537 — variable: `found`
- L539 — variable: `nameOk`
- L540 — variable: `emailOk`

### [src/modules/portalConfig/portalConfig.controller.ts](../src/modules/portalConfig/portalConfig.controller.ts)

- L27 — variable: `id`
- L50 — variable: `getConfig`
- L51 — variable: `response`
- L59 — variable: `updateAccess`
- L60 — variable: `parsed`
- L65 — variable: `response`
- L73 — variable: `updateIdentity`
- L74 — variable: `parsed`
- L79 — variable: `response`
- L87 — variable: `updateTheme`
- L88 — variable: `parsed`
- L93 — variable: `response`
- L101 — variable: `updateAssets`
- L106 — variable: `rawAssets`
- L107 — variable: `filesMap`
- L108 — parameter: `list`
- L108 — retorno da função: `<anônima>()`
- L108 — variable: `hasBinary`
- L121 — variable: `validated`
- L129 — variable: `files`
- L137 — variable: `[fieldName, fileArray]`
- L139 — variable: `file`
- L145 — variable: `targetDir`
- L147 — variable: `saved`
- L148 — parameter: `[, file]`
- L148 — retorno da função: `<anônima>()`
- L150 — parameter: `[fieldName]`
- L150 — retorno da função: `<anônima>()`
- L154 — parameter: `attachment`
- L154 — parameter: `index`
- L154 — retorno da função: `<anônima>()`
- L155 — variable: `fieldName`
- L165 — variable: `response`
- L167 — variable: `err`
- L180 — variable: `updateCategories`
- L181 — variable: `parsed`
- L186 — variable: `response`
- L194 — variable: `updateStatuses`
- L195 — variable: `parsed`
- L200 — variable: `response`
- L208 — variable: `updatePrioritizationWeights`
- L212 — variable: `parsed`
- L217 — variable: `response`

### [src/modules/portalConfig/portalConfig.mappers.ts](../src/modules/portalConfig/portalConfig.mappers.ts)

- L27 — variable: `TONES`
- L121 — variable: `palette`
- L122 — variable: `tokens`
- L123 — variable: `token`
- L130 — variable: `tone`
- L131 — variable: `{ color, background, backgroundLocked }`
- L151 — variable: `read`
- L155 — variable: `readGradient`
- L159 — variable: `readAngle`
- L163 — variable: `readStatus`
- L167 — variable: `{ color, background, backgroundLocked }`
- L181 — variable: `buildPalette`
- L182 — parameter: `token`
- L182 — retorno da função: `<anônima>()`
- L182 — variable: `tokenEntries`

### [src/modules/portalConfig/portalConfig.repository.ts](../src/modules/portalConfig/portalConfig.repository.ts)

- L22 — variable: `source`
- L23 — variable: `row`
- L38 — variable: `row`
- L45 — variable: `source`
- L52 — variable: `source`
- L57 — variable: `source`
- L69 — variable: `source`
- L124 — variable: `now`
- L142 — variable: `now`
- L170 — variable: `category`
- L188 — parameter: `c`
- L188 — retorno da função: `<anônima>()`
- L188 — variable: `keepIds`
- L210 — parameter: `index`
- L210 — parameter: `status`
- L210 — retorno da função: `<anônima>()`
- L210 — variable: `orderById`
- L212 — variable: `status`
- L213 — variable: `orderNumber`
- L214 — variable: `triageMode`
- L215 — variable: `mappingMode`
- L216 — variable: `isTerminal`
- L217 — variable: `row`
- L238 — parameter: `status`
- L238 — retorno da função: `<anônima>()`
- L238 — variable: `keepIds`
- L240 — variable: `omitted`
- L245 — variable: `nextOrder`
- L246 — variable: `row`
- L270 — variable: `[contractKey, weight]`
- L271 — variable: `criterionId`

### [src/modules/portalConfig/portalConfig.router.ts](../src/modules/portalConfig/portalConfig.router.ts)

- L16 — variable: `portalConfigRoutes`

### [src/modules/portalConfig/portalConfig.schema.ts](../src/modules/portalConfig/portalConfig.schema.ts)

- L18 — variable: `hexColorSchema`
- L22 — variable: `ThemeGradientSchema`
- L35 — variable: `StatusToneSchema`
- L43 — variable: `statusTonesShape`
- L44 — parameter: `tone`
- L44 — retorno da função: `<anônima>()`
- L47 — variable: `tokenShape`
- L48 — parameter: `key`
- L48 — retorno da função: `<anônima>()`
- L51 — variable: `ThemePaletteSchema`
- L59 — variable: `updateThemeSchema`
- L70 — variable: `updateAccessSchema`
- L78 — variable: `updateIdentitySchema`
- L95 — parameter: `identity`
- L95 — retorno da função: `<anônima>()`
- L102 — variable: `portalCategorySchema`
- L111 — variable: `updateCategoriesSchema`
- L117 — parameter: `categories`
- L117 — parameter: `ctx`
- L117 — retorno da função: `<anônima>()`
- L118 — variable: `seen`
- L119 — parameter: `category`
- L119 — parameter: `index`
- L119 — retorno da função: `<anônima>()`
- L120 — variable: `key`
- L130 — parameter: `category`
- L130 — retorno da função: `<anônima>()`
- L141 — variable: `StatusModeSchema`
- L145 — variable: `portalStatusSchema`
- L165 — parameter: `ctx`
- L165 — parameter: `status`
- L165 — retorno da função: `<anônima>()`
- L175 — variable: `updateStatusesSchema`
- L181 — parameter: `ctx`
- L181 — parameter: `statuses`
- L181 — retorno da função: `<anônima>()`
- L182 — variable: `seenNames`
- L183 — parameter: `index`
- L183 — parameter: `status`
- L183 — retorno da função: `<anônima>()`
- L184 — variable: `nameKey`
- L212 — parameter: `status`
- L212 — retorno da função: `<anônima>()`
- L228 — variable: `prioritizationWeightSchema`
- L234 — variable: `updatePrioritizationWeightsSchema`
- L242 — parameter: `{ prioritizationWeights }`
- L242 — parameter: `ctx`
- L242 — retorno da função: `<anônima>()`
- L243 — variable: `missing`
- L244 — parameter: `criterion`
- L244 — retorno da função: `<anônima>()`
- L261 — variable: `assetUrlSchema`
- L267 — parameter: `url`
- L267 — retorno da função: `<anônima>()`
- L271 — variable: `portalAssetsPatchSchema`
- L285 — parameter: `assets`
- L285 — retorno da função: `<anônima>()`

### [src/modules/portalConfig/portalConfig.service.ts](../src/modules/portalConfig/portalConfig.service.ts)

- L31 — retorno da função: `assetsFromRow()`
- L66 — variable: `[settings, themeRow, categories, statuses, criteria]`
- L74 — variable: `theme`
- L82 — parameter: `cat`
- L82 — retorno da função: `<anônima>()`
- L90 — parameter: `c`
- L90 — retorno da função: `<anônima>()`
- L91 — variable: `key`
- L106 — parameter: `trx`
- L106 — retorno da função: `<anônima>()`
- L109 — variable: `settings`
- L110 — variable: `previous`
- L135 — parameter: `trx`
- L135 — retorno da função: `<anônima>()`
- L138 — variable: `settings`
- L139 — variable: `previous`
- L146 — variable: `updated`
- L147 — variable: `newValue`
- L173 — parameter: `trx`
- L173 — retorno da função: `<anônima>()`
- L177 — variable: `themeRow`
- L178 — variable: `previousTheme`
- L179 — variable: `columns`
- L204 — parameter: `trx`
- L204 — retorno da função: `<anônima>()`
- L207 — variable: `settings`
- L208 — variable: `previous`
- L212 — variable: `updated`
- L213 — variable: `newValue`
- L236 — parameter: `trx`
- L236 — retorno da função: `<anônima>()`
- L239 — variable: `prevRows`
- L240 — parameter: `cat`
- L240 — retorno da função: `<anônima>()`
- L240 — variable: `previous`
- L270 — parameter: `trx`
- L270 — retorno da função: `<anônima>()`
- L273 — variable: `prevRows`
- L274 — variable: `previous`
- L275 — parameter: `st`
- L275 — retorno da função: `<anônima>()`
- L275 — variable: `prevById`
- L276 — parameter: `s`
- L276 — retorno da função: `<anônima>()`
- L276 — variable: `incomingById`
- L278 — variable: `coreId`
- L279 — variable: `existing`
- L288 — variable: `incoming`
- L357 — parameter: `trx`
- L357 — retorno da função: `<anônima>()`
- L360 — variable: `prevRows`
- L361 — variable: `previous`
- L362 — parameter: `c`
- L362 — retorno da função: `<anônima>()`
- L363 — variable: `key`

### [src/modules/prioritization/prioritization.controller.ts](../src/modules/prioritization/prioritization.controller.ts)

- L12 — variable: `id`
- L20 — variable: `protocolParamsSchema`
- L24 — variable: `listCriteria`
- L25 — variable: `response`
- L30 — variable: `evaluateScore`
- L31 — variable: `parsedParams`
- L36 — variable: `parsed`
- L42 — variable: `response`

### [src/modules/prioritization/prioritization.repository.ts](../src/modules/prioritization/prioritization.repository.ts)

- L17 — variable: `row`
- L24 — variable: `row`
- L38 — variable: `scoreRounded`
- L57 — variable: `row`
- L72 — variable: `data`
- L82 — variable: `rows`
- L88 — variable: `row`

### [src/modules/prioritization/prioritization.router.ts](../src/modules/prioritization/prioritization.router.ts)

- L6 — variable: `prioritizationRoutes`

### [src/modules/prioritization/prioritization.schema.ts](../src/modules/prioritization/prioritization.schema.ts)

- L5 — variable: `noteSchema`
- L12 — variable: `criterionKeySchema`
- L24 — variable: `evaluateScoreSchema`
- L25 — parameter: `notes`
- L25 — retorno da função: `<anônima>()`

### [src/modules/prioritization/prioritization.service.ts](../src/modules/prioritization/prioritization.service.ts)

- L18 — variable: `rows`
- L19 — parameter: `row`
- L19 — retorno da função: `<anônima>()`
- L49 — variable: `exists`
- L54 — variable: `assigneeUserId`
- L62 — variable: `criteria`
- L66 — variable: `score`
- L67 — variable: `classification`
- L75 — parameter: `trx`
- L75 — retorno da função: `<anônima>()`
- L75 — variable: `evaluation`
- L76 — variable: `previous`
- L85 — variable: `row`
- L132 — parameter: `row`
- L132 — retorno da função: `<anônima>()`
- L132 — variable: `validIds`
- L134 — parameter: `row`
- L134 — retorno da função: `<anônima>()`
- L134 — variable: `missing`
- L136 — parameter: `row`
- L136 — retorno da função: `<anônima>()`
- L136 — variable: `list`
- L140 — parameter: `key`
- L140 — retorno da função: `<anônima>()`
- L140 — variable: `unknown`
- L148 — variable: `shown`
- L154 — variable: `somaPonderada`
- L155 — parameter: `acc`
- L155 — parameter: `row`
- L155 — retorno da função: `<anônima>()`
- L158 — parameter: `acc`
- L158 — parameter: `row`
- L158 — retorno da função: `<anônima>()`
- L158 — variable: `somaPesos`
- L169 — variable: `range`

### [src/modules/queue/mapping.controller.ts](../src/modules/queue/mapping.controller.ts)

- L13 — variable: `protocol`
- L28 — variable: `id`
- L36 — variable: `getMappingController`
- L37 — variable: `protocol`
- L42 — variable: `putMappingController`
- L43 — variable: `protocol`
- L47 — variable: `actor`
- L54 — variable: `parsed`
- L56 — variable: `{ message, fields }`
- L60 — variable: `response`

### [src/modules/queue/mapping.repository.ts](../src/modules/queue/mapping.repository.ts)

- L82 — variable: `findMappingRequestContext`
- L86 — variable: `row`
- L124 — variable: `resolveMappingTarget`
- L134 — retorno da função: `<anônima>()`
- L146 — variable: `findMappingAssigneeCandidate`
- L154 — variable: `row`
- L173 — variable: `findCurrentMapping`
- L177 — variable: `row`
- L187 — variable: `findLatestOpenMapping`
- L191 — variable: `row`
- L201 — variable: `findMappingById`
- L206 — variable: `row`
- L220 — variable: `findMappingParticipants`
- L242 — variable: `resolveParticipantUsers`
- L250 — variable: `rows`
- L261 — parameter: `id`
- L261 — retorno da função: `<anônima>()`
- L261 — variable: `invalid`
- L262 — parameter: `r`
- L262 — retorno da função: `<anônima>()`
- L262 — variable: `row`
- L271 — parameter: `row`
- L271 — retorno da função: `<anônima>()`
- L278 — variable: `insertMapping`
- L290 — variable: `[row]`
- L311 — variable: `updateMapping`
- L349 — variable: `clearRequestMappingAssignee`
- L362 — variable: `replaceMappingParticipants`
- L374 — parameter: `participant`
- L374 — retorno da função: `<anônima>()`

### [src/modules/queue/mapping.schemas.ts](../src/modules/queue/mapping.schemas.ts)

- L20 — variable: `participantIdSchema`
- L30 — parameter: `value`
- L30 — retorno da função: `<anônima>()`
- L33 — parameter: `value`
- L33 — retorno da função: `<anônima>()`
- L35 — variable: `mappingParticipantSchema`
- L41 — variable: `noDuplicateParticipants`
- L42 — variable: `seen`
- L44 — variable: `participant`
- L48 — variable: `key`
- L62 — variable: `mappingPayloadSchema`

### [src/modules/queue/mapping.service.ts](../src/modules/queue/mapping.service.ts)

- L42 — parameter: `trx`
- L42 — retorno da função: `<anônima>()`
- L61 — variable: `date`
- L124 — parameter: `participant`
- L124 — retorno da função: `<anônima>()`
- L156 — parameter: `participant`
- L156 — retorno da função: `<anônima>()`
- L187 — variable: `textField`
- L188 — variable: `next`
- L189 — variable: `normalized`
- L236 — parameter: `participant`
- L236 — retorno da função: `<anônima>()`
- L236 — variable: `userIds`
- L240 — variable: `usersById`
- L242 — parameter: `participant`
- L242 — variable: `resolved`
- L247 — variable: `user`
- L254 — variable: `seenEmails`
- L255 — variable: `seenUserIds`
- L256 — variable: `participant`
- L257 — variable: `emailKey`
- L284 — variable: `getMappingService`
- L285 — variable: `context`
- L290 — variable: `mapping`
- L295 — variable: `[participants, assigneeCandidate]`
- L308 — variable: `upsertMappingService`
- L314 — parameter: `trx`
- L314 — retorno da função: `<anônima>()`
- L317 — variable: `context`
- L355 — variable: `isAdmin`
- L356 — variable: `isRequestAssignee`
- L358 — variable: `isRequestMappingAssignee`
- L362 — variable: `mapping`
- L373 — variable: `previousProfessionalId`
- L383 — variable: `explicitDesignation`
- L384 — variable: `isNullOnCreate`
- L385 — variable: `designationAction`
- L387 — variable: `priorDesigneeUserId`
- L392 — variable: `isPriorMappingAssignee`
- L396 — variable: `canCreateByInheritance`
- L400 — variable: `isCurrentMappingAssignee`
- L404 — variable: `canDesignate`
- L405 — variable: `canEditContent`
- L410 — variable: `contentAction`
- L458 — variable: `candidate`
- L478 — variable: `currentValues`
- L479 — variable: `values`
- L481 — variable: `concluding`
- L491 — variable: `target`
- L522 — variable: `missing`
- L532 — variable: `resolvedParticipants`
- L539 — variable: `designationChanged`
- L574 — variable: `changeOrigin`
- L578 — variable: `previousAuditValues`
- L585 — variable: `nextAuditValues`
- L678 — parameter: `participant`
- L678 — retorno da função: `<anônima>()`
- L685 — variable: `assigneeCandidate`

### [src/modules/queue/queue.controller.ts](../src/modules/queue/queue.controller.ts)

- L7 — variable: `getMetricsController`
- L8 — variable: `metrics`
- L13 — variable: `centralizedQueue`
- L14 — variable: `parsed`
- L20 — variable: `result`

### [src/modules/queue/queue.filters.ts](../src/modules/queue/queue.filters.ts)

- L14 — variable: `{ search, status, priority, assigneeId, unassigned, scopedUserId }`
- L17 — parameter: `builder`
- L17 — retorno da função: `<anônima>()`
- L45 — parameter: `builder`
- L45 — retorno da função: `<anônima>()`

### [src/modules/queue/queue.repository.ts](../src/modules/queue/queue.repository.ts)

- L7 — variable: `fetchQueueMetrics`
- L8 — variable: `query`
- L26 — parameter: `builder`
- L26 — retorno da função: `<anônima>()`
- L33 — variable: `result`
- L40 — retorno da função: `<anônima>()`
- L46 — retorno da função: `<anônima>()`
- L60 — variable: `findQueueRequests`
- L63 — variable: `{ limit, offset }`
- L65 — variable: `baseQuery`
- L84 — variable: `countQuery`
- L86 — variable: `itemsQuery`
- L103 — variable: `[countResult, items]`
- L104 — variable: `total`
- L109 — variable: `fetchAllAssignees`
- L110 — variable: `rows`

### [src/modules/queue/queue.router.ts](../src/modules/queue/queue.router.ts)

- L7 — variable: `queueRoutes`

### [src/modules/queue/queue.schemas.ts](../src/modules/queue/queue.schemas.ts)

- L5 — variable: `queueFilterShape`
- L25 — parameter: `value`
- L25 — retorno da função: `<anônima>()`
- L38 — variable: `queueFilterQuerySchema`
- L50 — variable: `queueQuerySchema`

### [src/modules/queue/queue.service.ts](../src/modules/queue/queue.service.ts)

- L17 — variable: `resolveQueueScope`
- L20 — variable: `userId`
- L24 — variable: `getQueueMetricsService`
- L35 — variable: `listQueueService`
- L39 — variable: `{ page, pageSize, search, status, priority, assigneeId, unassigned }`
- L40 — variable: `offset`
- L42 — variable: `repoUnassigned`
- L43 — variable: `repoAssigneeId`
- L46 — variable: `[{ items, total }, assignees]`
- L60 — variable: `totalPages`
- L63 — variable: `effectivePage`
- L65 — parameter: `item`
- L65 — retorno da função: `<anônima>()`
- L65 — variable: `formattedData`

### [src/modules/reports/reports.controller.ts](../src/modules/reports/reports.controller.ts)

- L9 — variable: `parsed`
- L19 — variable: `parsed`
- L25 — variable: `file`

### [src/modules/reports/reports.repository.ts](../src/modules/reports/reports.repository.ts)

- L8 — variable: `BUSINESS_TIME_ZONE`
- L9 — variable: `OPENED_MONTH_SQL`
- L112 — variable: `query`
- L140 — variable: `query`
- L159 — variable: `query`
- L174 — variable: `query`
- L188 — variable: `query`
- L202 — variable: `[statuses, categories, priorities]`
- L221 — variable: `query`

### [src/modules/reports/reports.router.ts](../src/modules/reports/reports.router.ts)

- L6 — variable: `reportsRoutes`

### [src/modules/reports/reports.schema.ts](../src/modules/reports/reports.schema.ts)

- L4 — variable: `optionalDate`
- L5 — variable: `optionalId`
- L7 — variable: `dashboardQuerySchema`
- L17 — parameter: `query`
- L17 — retorno da função: `<anônima>()`

### [src/modules/reports/reports.service.ts](../src/modules/reports/reports.service.ts)

- L12 — variable: `BUSINESS_TIME_ZONE`
- L13 — variable: `CSV_HEADERS`
- L28 — variable: `dateTimeFormatter`
- L38 — variable: `filenameDateFormatter`
- L46 — variable: `[summary, byStatus, byPriority, byCategory, openedOverTime, filterOptions]`
- L66 — parameter: `item`
- L66 — retorno da função: `<anônima>()`
- L70 — parameter: `item`
- L70 — retorno da função: `<anônima>()`
- L74 — parameter: `item`
- L74 — retorno da função: `<anônima>()`
- L86 — parameter: `item`
- L86 — retorno da função: `<anônima>()`
- L93 — parameter: `item`
- L98 — parameter: `item`
- L98 — retorno da função: `<anônima>()`
- L103 — parameter: `item`
- L103 — retorno da função: `<anônima>()`
- L113 — variable: `date`
- L124 — variable: `record`
- L125 — variable: `assessment`
- L138 — variable: `raw`
- L139 — variable: `protectedValue`
- L163 — variable: `rows`
- L164 — variable: `lines`

### [src/modules/requests/requests.controller.ts](../src/modules/requests/requests.controller.ts)

- L27 — variable: `userId`
- L36 — variable: `getRequestsByProtocol`
- L37 — variable: `protocol`
- L39 — variable: `foundRequest`
- L47 — variable: `getTracking`
- L48 — variable: `protocol`
- L50 — variable: `response`
- L61 — variable: `getInternalRequestByProtocol`
- L65 — variable: `protocol`
- L67 — variable: `request`
- L74 — variable: `protocol`
- L88 — variable: `id`
- L98 — variable: `patchInternalRequestByProtocol`
- L102 — variable: `protocol`
- L104 — variable: `parsed`
- L106 — variable: `{ message, fields }`
- L110 — variable: `updated`
- L120 — variable: `postRequest`
- L134 — variable: `parsed`
- L138 — variable: `multerFiles`
- L139 — variable: `attachments`
- L141 — variable: `savedAttachments`
- L143 — variable: `response`
- L152 — variable: `getRequestsByEmail`
- L159 — variable: `parsed`
- L165 — variable: `requests`
- L177 — variable: `parsed`
- L183 — variable: `requests`
- L188 — variable: `getAssignees`
- L192 — variable: `patchAssignee`
- L193 — variable: `protocol`
- L195 — variable: `parsed`
- L200 — variable: `response`
- L210 — variable: `patchInternalAssignee`
- L211 — variable: `protocol`
- L213 — variable: `parsed`
- L218 — variable: `response`
- L228 — variable: `patchRequestStatus`
- L229 — variable: `protocol`
- L231 — variable: `parsed`
- L236 — variable: `response`

### [src/modules/requests/requests.repository.ts](../src/modules/requests/requests.repository.ts)

- L36 — variable: `INITIAL_STATUS`
- L76 — variable: `email`
- L123 — variable: `row`
- L137 — variable: `requesterId`
- L160 — variable: `result`
- L164 — variable: `row`
- L181 — variable: `email`
- L182 — variable: `requestId`
- L184 — variable: `manualControls`
- L185 — variable: `processDocumentation`
- L186 — variable: `similarSolution`
- L187 — variable: `otherAreas`
- L188 — variable: `restrictedInfo`
- L190 — variable: `insertedRows`
- L249 — variable: `row`
- L268 — parameter: `scheduledFor`
- L268 — retorno da função: `<anônima>()`
- L287 — parameter: `attachment`
- L287 — retorno da função: `<anônima>()`
- L305 — parameter: `trx`
- L305 — retorno da função: `<anônima>()`
- L306 — variable: `categoryId`
- L312 — variable: `statusId`
- L313 — variable: `requesterId`
- L314 — variable: `saved`
- L323 — variable: `email`
- L338 — variable: `row`
- L353 — variable: `PUBLIC_STATUS_SUMMARY_SQL`
- L356 — retorno da função: `baseSummaryQuery()`
- L373 — parameter: `builder`
- L373 — retorno da função: `<anônima>()`
- L383 — variable: `countRows`
- L389 — variable: `total`
- L391 — variable: `rows`
- L406 — parameter: `row`
- L406 — retorno da função: `<anônima>()`
- L431 — variable: `response`
- L463 — variable: `meetingScheduledFor`
- L465 — variable: `meeting`
- L469 — variable: `openedAt`
- L494 — retorno da função: `findInternalRequestByProtocol()`
- L495 — variable: `hasMapping`
- L497 — variable: `query`
- L525 — variable: `baseSelect`
- L592 — variable: `mappingSelect`
- L606 — variable: `request`
- L611 — retorno da função: `findAttachmentsByRequestId()`
- L618 — retorno da função: `findSchedulePreferencesByRequestId()`
- L628 — variable: `row`
- L641 — variable: `ASSIGNABLE_PROFILES`
- L664 — variable: `numericId`
- L709 — variable: `hasMapping`
- L725 — variable: `query`
- L736 — variable: `row`
- L780 — variable: `statusId`
- L819 — variable: `hasMappingColumn`
- L834 — variable: `query`
- L845 — variable: `row`
- L870 — retorno da função: `<anônima>()`
- L929 — variable: `manualControls`
- L930 — variable: `processDocumentation`
- L931 — variable: `similarSolution`
- L932 — variable: `otherAreas`
- L933 — variable: `restrictedInfo`

### [src/modules/requests/requests.router.ts](../src/modules/requests/requests.router.ts)

- L20 — variable: `requestsRoutes`

### [src/modules/requests/requests.schema.ts](../src/modules/requests/requests.schema.ts)

- L15 — variable: `yesNoDetailSchema`
- L25 — variable: `requesterSchema`
- L34 — variable: `demandSchema`
- L45 — variable: `operationalSchema`
- L72 — variable: `complementarySchema`
- L80 — variable: `isRealCalendarDateTime`
- L81 — variable: `[datePart, timePart]`
- L82 — variable: `[year, month, day]`
- L83 — variable: `[hour = 0, minute = 0]`
- L86 — variable: `lastDay`
- L90 — variable: `createRequestPayloadSchema`
- L109 — parameter: `preferences`
- L109 — retorno da função: `<anônima>()`
- L126 — variable: `todaySaoPauloYmd`
- L128 — variable: `desiredDeadlineUpdateSchema`
- L131 — parameter: `value`
- L131 — retorno da função: `<anônima>()`
- L135 — variable: `operationalUpdateSchema`
- L141 — variable: `updateRequesterSchema`
- L143 — variable: `updateRequestPayloadSchema`
- L152 — variable: `listRequestsQuerySchema`
- L173 — variable: `listAuthenticatedRequestsQuerySchema`
- L175 — variable: `assignRequestSchema`
- L185 — variable: `analystIdSchema`
- L187 — variable: `assignAnalystSchema`
- L192 — parameter: `ctx`
- L192 — parameter: `data`
- L192 — retorno da função: `<anônima>()`
- L193 — variable: `hasAssignee`
- L194 — variable: `hasMapping`
- L212 — variable: `updateStatusSchema`

### [src/modules/requests/requests.service.ts](../src/modules/requests/requests.service.ts)

- L72 — variable: `user`
- L85 — variable: `normalizedProtocol`
- L87 — variable: `found`
- L96 — variable: `identity`
- L105 — retorno da função: `registerRequest()`
- L113 — variable: `payload`
- L119 — variable: `err`
- L129 — variable: `identity`
- L146 — variable: `email`
- L155 — variable: `normalizedEmail`
- L191 — parameter: `value`
- L191 — retorno da função: `<anônima>()`
- L198 — variable: `request`
- L211 — variable: `assigneeUserId`
- L212 — variable: `mappingUserId`
- L213 — variable: `isAssignee`
- L219 — variable: `requestId`
- L220 — variable: `[attachments, schedulePreferences, evaluation]`
- L229 — variable: `meeting`
- L237 — retorno da função: `<anônima>()`
- L237 — variable: `pendingSummary`
- L239 — variable: `summary`
- L240 — variable: `correctionAlert`
- L241 — variable: `unreadRaw`
- L280 — variable: `openedAt`
- L281 — variable: `lastUpdate`
- L283 — variable: `assigneeUserId`
- L284 — variable: `mappingUserId`
- L286 — variable: `assignee`
- L295 — variable: `mappingAssignee`
- L359 — parameter: `row`
- L359 — retorno da função: `<anônima>()`
- L363 — parameter: `attachment`
- L363 — retorno da função: `<anônima>()`
- L389 — variable: `trimmed`
- L396 — variable: `record`
- L400 — variable: `{ __triage: _triage, observations: _obs, ...rest }`
- L425 — variable: `TRACKING_INVALID_IDENTITY`
- L428 — variable: `scheduledFor`
- L494 — variable: `openedAt`
- L515 — variable: `requestId`
- L516 — variable: `[attachments, schedulePreferences]`
- L521 — variable: `meeting`
- L522 — variable: `complementary`
- L525 — variable: `{ impacts, ...base }`
- L547 — parameter: `preference`
- L547 — retorno da função: `<anônima>()`
- L552 — parameter: `attachment`
- L552 — retorno da função: `<anônima>()`
- L571 — variable: `requesterUserId`
- L595 — variable: `row`
- L613 — variable: `mode`
- L624 — variable: `row`
- L629 — variable: `nameOk`
- L632 — variable: `emailOk`
- L654 — variable: `normalizedProtocol`
- L781 — variable: `request`
- L792 — variable: `professional`
- L793 — variable: `canEdit`
- L800 — parameter: `trx`
- L800 — retorno da função: `<anônima>()`
- L829 — variable: `RN010_ELIGIBLE_SCREENING`
- L837 — variable: `candidate`
- L859 — variable: `candidate`
- L880 — variable: `request`
- L895 — variable: `assignee`
- L900 — variable: `previousId`
- L901 — variable: `nextId`
- L904 — parameter: `c`
- L904 — retorno da função: `<anônima>()`
- L907 — variable: `auditNext`
- L908 — variable: `auditPrev`
- L911 — variable: `action`
- L913 — variable: `shouldAdvanceStatus`
- L918 — parameter: `trx`
- L918 — retorno da função: `<anônima>()`
- L961 — variable: `request`
- L976 — variable: `hasAssignee`
- L977 — variable: `hasMapping`
- L980 — variable: `raw`
- L982 — variable: `previous`
- L983 — variable: `auditPrev`
- L986 — parameter: `trx`
- L986 — retorno da função: `<anônima>()`
- L1003 — variable: `resolved`
- L1004 — variable: `previous`
- L1005 — variable: `auditPrev`
- L1008 — variable: `previousMapping`
- L1009 — variable: `auditPrevMapping`
- L1012 — variable: `action`
- L1013 — variable: `shouldAdvance`
- L1016 — parameter: `trx`
- L1016 — retorno da função: `<anônima>()`
- L1065 — variable: `raw`
- L1067 — variable: `previous`
- L1068 — variable: `auditPrev`
- L1071 — parameter: `trx`
- L1071 — retorno da função: `<anônima>()`
- L1088 — variable: `resolved`
- L1089 — variable: `previous`
- L1090 — variable: `auditPrev`
- L1093 — variable: `previousAssignee`
- L1094 — variable: `auditPrevAssignee`
- L1097 — variable: `action`
- L1098 — parameter: `trx`
- L1098 — retorno da função: `<anônima>()`
- L1147 — variable: `isTriageAssignee`
- L1149 — variable: `isMappingAssignee`
- L1174 — parameter: `trx`
- L1174 — retorno da função: `<anônima>()`
- L1195 — variable: `request`
- L1200 — variable: `target`
- L1205 — variable: `isAdmin`
- L1219 — variable: `isAssignee`
- L1221 — variable: `isMappingAssignee`
- L1224 — variable: `isAnalystAssignee`
- L1290 — variable: `changeOrigin`
- L1292 — parameter: `trx`
- L1292 — retorno da função: `<anônima>()`
- L1292 — variable: `lastUpdate`
- L1293 — variable: `persistedAt`

### [src/modules/requests/statusTransition.ts](../src/modules/requests/statusTransition.ts)

- L29 — variable: `lastTechnicalMessage`
- L38 — variable: `query`
- L42 — variable: `rows`
- L43 — variable: `row`

### [src/modules/requests/triage/triage.controller.ts](../src/modules/requests/triage/triage.controller.ts)

- L9 — variable: `protocolParamsSchema`
- L18 — variable: `id`
- L32 — variable: `parsed`
- L40 — variable: `getTriage`
- L41 — variable: `protocol`
- L42 — variable: `actor`
- L44 — variable: `triage`
- L49 — variable: `saveTriage`
- L50 — variable: `protocol`
- L51 — variable: `actor`
- L53 — variable: `parsed`
- L55 — variable: `{ message, fields }`
- L59 — variable: `triage`

### [src/modules/requests/triage/triage.repository.ts](../src/modules/requests/triage/triage.repository.ts)

- L69 — variable: `TRIAGE_COLUMNS`
- L122 — variable: `row`
- L151 — retorno da função: `<anônima>()`
- L162 — variable: `raw`
- L181 — variable: `source`
- L210 — variable: `updatedRows`
- L278 — parameter: `trx`
- L278 — retorno da função: `<anônima>()`

### [src/modules/requests/triage/triage.router.ts](../src/modules/requests/triage/triage.router.ts)

- L6 — variable: `triageRoutes`

### [src/modules/requests/triage/triage.schema.ts](../src/modules/requests/triage/triage.schema.ts)

- L33 — variable: `triageChoice`
- L35 — retorno da função: `<anônima>()`
- L35 — variable: `textField`
- L42 — variable: `createTriagePayloadSchema`
- L80 — parameter: `ctx`
- L80 — parameter: `value`
- L80 — retorno da função: `<anônima>()`

### [src/modules/requests/triage/triage.service.ts](../src/modules/requests/triage/triage.service.ts)

- L28 — parameter: `trx`
- L28 — retorno da função: `<anônima>()`
- L44 — variable: `request`
- L51 — variable: `canAccess`
- L66 — variable: `request`
- L87 — variable: `canAccess`
- L102 — variable: `exitStatus`
- L123 — variable: `categoryName`
- L125 — variable: `newCategory`

### [src/modules/users/users.controller.ts](../src/modules/users/users.controller.ts)

- L18 — variable: `id`
- L25 — variable: `getUserMetrics`
- L26 — variable: `metrics`
- L31 — variable: `listAnalysts`
- L32 — variable: `analysts`
- L36 — variable: `listUsers`
- L37 — variable: `parsed`
- L43 — variable: `users`
- L48 — variable: `createUser`
- L49 — variable: `parsed`
- L52 — variable: `{ message, fields }`
- L56 — variable: `created`
- L61 — variable: `updateUser`
- L62 — variable: `parsed`
- L65 — variable: `{ message, fields }`
- L69 — variable: `updated`
- L79 — variable: `getUser`
- L80 — variable: `user`
- L85 — variable: `changeUserStatus`
- L86 — variable: `parsed`
- L92 — variable: `updated`
- L102 — variable: `resetUserPassword`
- L103 — variable: `reset`
- L112 — variable: `getMyProfile`
- L113 — variable: `profile`
- L124 — variable: `updateMyProfile`
- L145 — variable: `rawReq`
- L162 — variable: `parsed`
- L167 — variable: `updated`

### [src/modules/users/users.repository.ts](../src/modules/users/users.repository.ts)

- L27 — variable: `row`
- L57 — variable: `PROFESSIONAL_PROFILES`
- L92 — variable: `inserted`
- L102 — variable: `row`
- L136 — variable: `corporateEmail`
- L140 — variable: `hasRequester`
- L201 — variable: `user`
- L208 — variable: `[requester, professional]`
- L236 — retorno da função: `<anônima>()`
- L269 — variable: `updated`
- L280 — variable: `adopted`
- L317 — variable: `specialties`
- L318 — variable: `attendedCategoryIds`
- L321 — variable: `updated`
- L359 — retorno da função: `baseQuery()`
- L362 — parameter: `builder`
- L362 — retorno da função: `<anônima>()`
- L367 — variable: `escapedSearch`
- L368 — parameter: `inner`
- L368 — retorno da função: `<anônima>()`
- L378 — variable: `countRows`
- L381 — variable: `total`
- L383 — variable: `rows`
- L400 — parameter: `row`
- L400 — retorno da função: `<anônima>()`
- L423 — variable: `updated`
- L444 — variable: `updated`
- L473 — variable: `updated`
- L496 — variable: `rows`
- L506 — parameter: `builder`
- L506 — retorno da função: `<anônima>()`
- L522 — variable: `categoryMap`
- L523 — variable: `categories`
- L526 — variable: `cat`
- L534 — variable: `professionalIds`
- L535 — parameter: `r`
- L535 — retorno da função: `<anônima>()`
- L536 — parameter: `id`
- L537 — variable: `counts`
- L542 — variable: `countByProfessional`
- L543 — variable: `c`
- L547 — parameter: `row`
- L547 — retorno da função: `<anônima>()`
- L550 — variable: `part`
- L551 — variable: `id`
- L553 — variable: `name`
- L574 — variable: `fetchUserMetrics`
- L575 — variable: `result`
- L609 — variable: `existing`
- L614 — variable: `next`
- L632 — variable: `anon`
- L666 — retorno da função: `findRequesterByUserId()`

### [src/modules/users/users.router.ts](../src/modules/users/users.router.ts)

- L18 — variable: `usersRoutes`

### [src/modules/users/users.schema.ts](../src/modules/users/users.schema.ts)

- L14 — variable: `professionalSchema`
- L24 — variable: `PROFESSIONAL_ROLE`
- L26 — variable: `requesterSchema`
- L33 — variable: `createUserSchema`
- L41 — parameter: `ctx`
- L41 — parameter: `value`
- L41 — retorno da função: `<anônima>()`
- L42 — variable: `isAnalyst`
- L59 — variable: `listUsersQuerySchema`
- L81 — variable: `requesterPatchSchema`
- L88 — variable: `changeUserStatusSchema`
- L92 — variable: `updateUserSchema`
- L105 — parameter: `ctx`
- L105 — parameter: `value`
- L105 — retorno da função: `<anônima>()`
- L107 — variable: `isAnalyst`

### [src/modules/users/users.service.ts](../src/modules/users/users.service.ts)

- L35 — variable: `AVATAR_DIR`
- L36 — variable: `ROLE_ANALYST`
- L38 — variable: `CHANGE_ORIGIN_ADMIN`
- L47 — variable: `id`
- L70 — variable: `profileId`
- L83 — variable: `getUserMetrics`
- L95 — variable: `profileId`
- L103 — variable: `temporaryPassword`
- L104 — variable: `passwordHash`
- L111 — parameter: `trx`
- L111 — retorno da função: `<anônima>()`
- L112 — variable: `created`
- L125 — variable: `professional`
- L148 — variable: `error`
- L177 — variable: `id`
- L183 — variable: `user`
- L192 — parameter: `trx`
- L192 — retorno da função: `<anônima>()`
- L215 — variable: `id`
- L221 — variable: `user`
- L228 — variable: `temporaryPassword`
- L229 — variable: `passwordHash`
- L233 — parameter: `trx`
- L233 — retorno da função: `<anônima>()`
- L282 — variable: `row`
- L336 — variable: `user`
- L342 — variable: `snapshot`
- L343 — variable: `previousValue`
- L350 — parameter: `trx`
- L350 — retorno da função: `<anônima>()`
- L362 — variable: `rawRequester`
- L363 — variable: `changesAdministrativeFields`
- L396 — variable: `url`
- L399 — variable: `url`
- L427 — variable: `saved`
- L428 — variable: `attachment`
- L436 — variable: `key`
- L437 — variable: `storagePath`
- L438 — retorno da função: `<anônima>()`
- L455 — variable: `id`
- L461 — variable: `target`
- L466 — variable: `isTargetAdmin`
- L467 — variable: `hasNonRequesterPatch`
- L480 — variable: `pid`
- L484 — variable: `role`
- L489 — variable: `finalRoleName`
- L490 — variable: `isFinalAnalyst`
- L491 — variable: `wasAnalyst`
- L509 — variable: `before`
- L512 — parameter: `trx`
- L512 — retorno da função: `<anônima>()`
- L522 — variable: `fullName`
- L523 — variable: `corporateEmail`
- L536 — variable: `fullName`
- L537 — variable: `corporateEmail`
- L557 — variable: `error`
- L564 — variable: `updated`
- L575 — retorno da função: `<anônima>()`

### [src/router.ts](../src/router.ts)

- L16 — variable: `router`

### [src/server.ts](../src/server.ts)

- L5 — variable: `PORT`
- L8 — parameter: `e`
- L8 — retorno da função: `<anônima>()`
- L10 — retorno da função: `<anônima>()`

### [src/shared/audit/auditCatalog.ts](../src/shared/audit/auditCatalog.ts)

- L13 — variable: `auditCatalog`
- L79 — parameter: `action`
- L79 — retorno da função: `<anônima>()`

### [src/shared/catalog/fieldCatalog.ts](../src/shared/catalog/fieldCatalog.ts)

- L6 — variable: `FIELD_KEYS`
- L44 — variable: `FIELD_KEY_SET`
- L145 — variable: `flag`
- L146 — variable: `detail`
- L156 — variable: `v`
- L158 — variable: `d`
- L194 — variable: `normalized`

### [src/shared/errors/AppError.ts](../src/shared/errors/AppError.ts)

- L5 — parameter: `statusCode`

### [src/shared/middleware/accessMode.ts](../src/shared/middleware/accessMode.ts)

- L19 — retorno da função: `requireAccessMode()`
- L27 — variable: `error`

### [src/shared/middleware/auth.ts](../src/shared/middleware/auth.ts)

- L9 — variable: `{ JsonWebTokenError, NotBeforeError, TokenExpiredError }`
- L10 — variable: `COOKIE_NAME`
- L25 — variable: `token`
- L35 — variable: `userState`
- L47 — variable: `scope`
- L54 — variable: `isPendingChangeAllowedRoute`
- L66 — variable: `tokenPasswordChangedAt`
- L67 — variable: `currentPasswordChangedAt`
- L87 — variable: `error`

### [src/shared/middleware/dualAuth.ts](../src/shared/middleware/dualAuth.ts)

- L20 — variable: `hasCookie`
- L27 — variable: `identity`

### [src/shared/middleware/errorHandler.ts](../src/shared/middleware/errorHandler.ts)

- L25 — variable: `fields`
- L34 — variable: `maybeHttp`
- L35 — variable: `statusCode`

### [src/shared/middleware/rateLimit.ts](../src/shared/middleware/rateLimit.ts)

- L7 — retorno da função: `createRateLimiter()`
- L8 — variable: `{ windowMs, limit, keyGenerator }`
- L9 — variable: `buckets`
- L12 — variable: `normalized`
- L13 — variable: `now`
- L14 — variable: `arr`
- L15 — parameter: `t`
- L15 — retorno da função: `<anônima>()`
- L15 — variable: `recent`

### [src/shared/middleware/requireRole.ts](../src/shared/middleware/requireRole.ts)

- L9 — retorno da função: `requireRole()`
- L21 — variable: `expected`

### [src/shared/middleware/upload.ts](../src/shared/middleware/upload.ts)

- L5 — variable: `ALLOWED_MIMES`
- L13 — variable: `MAX_FILE_SIZE_BYTES`
- L14 — variable: `MAX_ATTACHMENT_COUNT`
- L15 — variable: `MAX_FIELD_SIZE_BYTES`
- L17 — variable: `upload`
- L24 — parameter: `_req`
- L24 — parameter: `cb`
- L24 — parameter: `file`
- L24 — retorno da função: `<anônima>()`
- L35 — variable: `multerFields`
- L49 — parameter: `err`
- L49 — retorno da função: `<anônima>()`

### [src/shared/middleware/uploadAssets.ts](../src/shared/middleware/uploadAssets.ts)

- L57 — parameter: `r`
- L57 — retorno da função: `<anônima>()`
- L57 — variable: `MAX_FILE_SIZE`
- L58 — variable: `MAX_FIELD_SIZE`
- L60 — variable: `upload`
- L68 — parameter: `_req`
- L68 — parameter: `cb`
- L68 — parameter: `file`
- L68 — retorno da função: `<anônima>()`
- L69 — variable: `rules`
- L75 — variable: `ext`
- L100 — variable: `multerFields`
- L124 — parameter: `err`
- L124 — retorno da função: `<anônima>()`
- L131 — variable: `message`
- L132 — variable: `statusCode`
- L147 — variable: `files`
- L153 — variable: `[fieldName, fileArray]`
- L154 — variable: `rules`
- L157 — variable: `file`
- L159 — variable: `maxMb`

### [src/shared/middleware/uploadAvatar.ts](../src/shared/middleware/uploadAvatar.ts)

- L14 — variable: `avatarRules`
- L20 — variable: `MAX_FIELD_SIZE`
- L22 — variable: `upload`
- L30 — parameter: `_req`
- L30 — parameter: `cb`
- L30 — parameter: `file`
- L30 — retorno da função: `<anônima>()`
- L36 — variable: `ext`
- L61 — variable: `single`
- L70 — parameter: `err`
- L70 — retorno da função: `<anônima>()`
- L77 — variable: `message`
- L78 — variable: `statusCode`

### [src/shared/protocol/generateProtocol.ts](../src/shared/protocol/generateProtocol.ts)

- L4 — variable: `ALPHABET`
- L5 — variable: `CODE_LENGTH`
- L6 — variable: `CODE_BITS`
- L7 — variable: `HALF_BITS`
- L8 — variable: `HALF_MASK`
- L9 — variable: `DOMAIN`
- L10 — variable: `ROUNDS`
- L15 — variable: `digest`
- L18 — variable: `chunk`
- L23 — variable: `left`
- L24 — variable: `right`
- L26 — variable: `round`
- L27 — variable: `nextLeft`
- L28 — variable: `nextRight`
- L37 — variable: `code`
- L38 — variable: `index`
- L39 — variable: `shift`
- L40 — variable: `charIndex`
- L50 — variable: `value`
- L56 — variable: `code`

### [src/shared/storage/fileStorage.ts](../src/shared/storage/fileStorage.ts)

- L22 — variable: `dir`
- L27 — variable: `i`
- L28 — variable: `file`
- L30 — variable: `prefix`
- L31 — variable: `filename`
- L32 — variable: `storagePath`
- L42 — variable: `err`
- L52 — parameter: `attachment`
- L52 — retorno da função: `<anônima>()`

### [src/shared/types/criteria.ts](../src/shared/types/criteria.ts)

- L22 — parameter: `[key, id]`
- L22 — retorno da função: `<anônima>()`

### [src/shared/types/portalConfig.ts](../src/shared/types/portalConfig.ts)

- L33 — variable: `ASSET_KEYS`
- L55 — variable: `THEME_TOKEN_KEYS`
- L123 — variable: `CORE_STATUS_IDS`
- L147 — variable: `PRIORITIZATION_CRITERIA`

### [src/shared/types/requests.ts](../src/shared/types/requests.ts)

- L6 — variable: `REQUEST_STATUSES`
- L29 — variable: `REQUEST_PRIORITIES`
- L34 — variable: `IN_PROGRESS_STATUSES`
- L43 — variable: `TERMINAL_STATUSES`

### [src/shared/types/role.ts](../src/shared/types/role.ts)

- L1 — variable: `ROLES`

### [src/shared/types/systemTheme.ts](../src/shared/types/systemTheme.ts)

- L2 — variable: `STATUS_TONES`
- L6 — variable: `THEME_TOKEN_KEYS`

### [src/shared/utils/date.ts](../src/shared/utils/date.ts)

- L13 — variable: `date`
- L32 — variable: `date`
- L38 — retorno da função: `<anônima>()`
- L38 — variable: `pad`
- L49 — variable: `date`
- L69 — variable: `year`
- L70 — variable: `month`
- L71 — variable: `day`
- L81 — variable: `year`
- L82 — variable: `month`
- L83 — variable: `day`
- L84 — variable: `hours`
- L85 — variable: `minutes`

### [src/shared/utils/ensureDefaultAssets.ts](../src/shared/utils/ensureDefaultAssets.ts)

- L19 — variable: `uploadRoot`
- L20 — variable: `assetsRootCandidates`
- L30 — variable: `p`
- L46 — variable: `[srcName, destRel]`
- L47 — variable: `src`
- L48 — variable: `dest`
- L58 — variable: `e`
- L66 — variable: `destToColumn`
- L76 — variable: `[, destRel]`
- L77 — variable: `column`
- L79 — variable: `url`
- L81 — variable: `hasCol`
- L85 — parameter: `qb`
- L85 — retorno da função: `<anônima>()`
- L89 — variable: `e`

### [src/shared/utils/json.ts](../src/shared/utils/json.ts)

- L8 — parameter: `_`
- L8 — parameter: `v`
- L8 — retorno da função: `<anônima>()`
- L11 — parameter: `[a]`
- L11 — parameter: `[b]`
- L11 — retorno da função: `<anônima>()`

### [src/shared/utils/jwtUtil.ts](../src/shared/utils/jwtUtil.ts)

- L7 — variable: `{ sign, verify }`
- L23 — variable: `secret`
- L24 — variable: `expiresIn`
- L34 — variable: `secret`
- L40 — variable: `decoded`
- L54 — variable: `scope`

### [src/shared/utils/passwordHandler.ts](../src/shared/utils/passwordHandler.ts)

- L5 — retorno da função: `hashPassword()`
- L7 — variable: `salt`
- L9 — variable: `hashedPassword`
- L17 — retorno da função: `comparePassword()`
- L19 — variable: `match`
- L31 — parameter: `length`

### [src/shared/utils/requesterIdentity.ts](../src/shared/utils/requesterIdentity.ts)

- L7 — variable: `obj`

### [src/shared/utils/roleUtils.ts](../src/shared/utils/roleUtils.ts)

- L15 — variable: `role`

### [src/shared/validation/fieldSchemas.ts](../src/shared/validation/fieldSchemas.ts)

- L3 — retorno da função: `<anônima>()`
- L3 — variable: `ptNumber`
- L5 — retorno da função: `<anônima>()`
- L5 — variable: `requiredString`
- L12 — retorno da função: `<anônima>()`
- L12 — variable: `optionalString`
- L17 — parameter: `value`
- L17 — retorno da função: `<anônima>()`
- L20 — variable: `emailSchema`
- L27 — variable: `passwordSchema`
- L30 — parameter: `value`
- L30 — retorno da função: `<anônima>()`
- L32 — variable: `TEXT_PATTERN`
- L38 — variable: `PROFILE_AREA_MAX_LENGTH`
- L39 — variable: `PROFILE_DEPARTMENT_MAX_LENGTH`
- L40 — variable: `PROFILE_MANAGER_MAX_LENGTH`
- L41 — variable: `PROFILE_ADDITIONAL_CONTACT_MAX_LENGTH`
- L43 — retorno da função: `<anônima>()`
- L43 — variable: `requiredText`
- L44 — parameter: `value`
- L44 — retorno da função: `<anônima>()`
- L48 — retorno da função: `<anônima>()`
- L48 — variable: `optionalText`
- L53 — parameter: `value`
- L53 — retorno da função: `<anônima>()`
- L56 — parameter: `value`
- L56 — retorno da função: `<anônima>()`
- L59 — retorno da função: `<anônima>()`
- L59 — variable: `nullableOptionalString`
- L66 — parameter: `value`
- L66 — retorno da função: `<anônima>()`

### [src/shared/validation/zodErrors.ts](../src/shared/validation/zodErrors.ts)

- L11 — variable: `MAX_PATH_LENGTH`
- L28 — variable: `isMissing`
- L34 — variable: `match`
- L35 — variable: `translated`
- L41 — variable: `raw`
- L46 — variable: `key`
- L53 — parameter: `issue`
- L53 — retorno da função: `<anônima>()`
- L62 — variable: `seen`
- L66 — variable: `missingFields`
- L67 — parameter: `issue`
- L67 — retorno da função: `<anônima>()`
- L72 — variable: `details`
- L73 — parameter: `issue`
- L73 — retorno da função: `<anônima>()`
- L77 — parameter: `detail`
- L77 — retorno da função: `<anônima>()`
- L82 — parameter: `detail`
- L82 — retorno da função: `<anônima>()`
- L89 — parameter: `rootLabel`
- L102 — parameter: `rootLabel`
- L104 — variable: `grouped`
- L107 — variable: `issue`
- L110 — variable: `issue`
- L111 — variable: `key`

## 3. Declarações com tipo efetivo `any`

### [src/modules/auditHistory/auditHistory.service.ts](../src/modules/auditHistory/auditHistory.service.ts)

- L20 — variable: `{ items, total }`

### [src/modules/auth/auth.repository.ts](../src/modules/auth/auth.repository.ts)

- L87 — variable: `passwordChangedAt`

### [src/modules/auth/auth.service.ts](../src/modules/auth/auth.service.ts)

- L112 — variable: `{ password_changed_at }`

### [src/modules/internalNotes/internalNotes.repository.ts](../src/modules/internalNotes/internalNotes.repository.ts)

- L247 — variable: `[participantRows, assigneeRows]`

### [src/modules/internalNotes/internalNotes.service.ts](../src/modules/internalNotes/internalNotes.service.ts)

- L276 — variable: `[userNames, professionalNames, statusNames]`
- L310 — variable: `[noteRows, eventRows, unseenCount, triageRows, mappingRows]`
- L320 — variable: `{ items, nextCursor }`

### [src/modules/pendingItems/pendingItems.controller.ts](../src/modules/pendingItems/pendingItems.controller.ts)

- L8 — variable: `{ checkRateLimit }`

### [src/modules/pendingItems/pendingItems.repository.ts](../src/modules/pendingItems/pendingItems.repository.ts)

- L23 — variable: `row`
- L44 — variable: `row`
- L62 — variable: `row`
- L85 — variable: `row`
- L206 — variable: `[batchId, summary]`
- L231 — variable: `row`
- L281 — variable: `row`
- L303 — variable: `row`
- L308 — variable: `row`
- L439 — variable: `requiresAttachment`
- L624 — variable: `requesterRow`
- L649 — variable: `category`

### [src/modules/pendingItems/pendingItems.router.ts](../src/modules/pendingItems/pendingItems.router.ts)

- L54 — parameter: `err`

### [src/modules/pendingItems/pendingItems.service.ts](../src/modules/pendingItems/pendingItems.service.ts)

- L54 — variable: `parsed`
- L66 — variable: `parsed`
- L368 — variable: `[saved]`

### [src/modules/portalConfig/portalConfig.controller.ts](../src/modules/portalConfig/portalConfig.controller.ts)

- L106 — variable: `rawAssets`
- L137 — variable: `[fieldName, fileArray]`

### [src/modules/portalConfig/portalConfig.mappers.ts](../src/modules/portalConfig/portalConfig.mappers.ts)

- L131 — variable: `{ color, background, backgroundLocked }`
- L167 — variable: `{ color, background, backgroundLocked }`

### [src/modules/portalConfig/portalConfig.repository.ts](../src/modules/portalConfig/portalConfig.repository.ts)

- L246 — variable: `row`
- L270 — variable: `[contractKey, weight]`

### [src/modules/portalConfig/portalConfig.service.ts](../src/modules/portalConfig/portalConfig.service.ts)

- L66 — variable: `[settings, themeRow, categories, statuses, criteria]`

### [src/modules/prioritization/prioritization.repository.ts](../src/modules/prioritization/prioritization.repository.ts)

- L17 — variable: `row`
- L24 — variable: `row`
- L57 — variable: `row`

### [src/modules/queue/mapping.controller.ts](../src/modules/queue/mapping.controller.ts)

- L56 — variable: `{ message, fields }`

### [src/modules/queue/mapping.repository.ts](../src/modules/queue/mapping.repository.ts)

- L86 — variable: `row`
- L154 — variable: `row`
- L177 — variable: `row`
- L191 — variable: `row`
- L206 — variable: `row`
- L262 — parameter: `r`
- L262 — variable: `row`
- L271 — parameter: `row`
- L290 — variable: `[row]`

### [src/modules/queue/mapping.service.ts](../src/modules/queue/mapping.service.ts)

- L295 — variable: `[participants, assigneeCandidate]`

### [src/modules/queue/queue.filters.ts](../src/modules/queue/queue.filters.ts)

- L14 — variable: `{ search, status, priority, assigneeId, unassigned, scopedUserId }`

### [src/modules/queue/queue.repository.ts](../src/modules/queue/queue.repository.ts)

- L33 — variable: `result`
- L63 — variable: `{ limit, offset }`
- L103 — variable: `[countResult, items]`

### [src/modules/queue/queue.service.ts](../src/modules/queue/queue.service.ts)

- L39 — variable: `{ page, pageSize, search, status, priority, assigneeId, unassigned }`
- L46 — variable: `[{ items, total }, assignees]`

### [src/modules/reports/reports.repository.ts](../src/modules/reports/reports.repository.ts)

- L202 — variable: `[statuses, categories, priorities]`

### [src/modules/reports/reports.service.ts](../src/modules/reports/reports.service.ts)

- L46 — variable: `[summary, byStatus, byPriority, byCategory, openedOverTime, filterOptions]`

### [src/modules/requests/requests.controller.ts](../src/modules/requests/requests.controller.ts)

- L106 — variable: `{ message, fields }`

### [src/modules/requests/requests.repository.ts](../src/modules/requests/requests.repository.ts)

- L123 — variable: `row`
- L338 — variable: `row`
- L431 — variable: `response`
- L606 — variable: `request`
- L628 — variable: `row`
- L736 — variable: `row`
- L845 — variable: `row`

### [src/modules/requests/requests.schema.ts](../src/modules/requests/requests.schema.ts)

- L81 — variable: `[datePart, timePart]`
- L82 — variable: `[year, month, day]`
- L83 — variable: `[hour = 0, minute = 0]`

### [src/modules/requests/requests.service.ts](../src/modules/requests/requests.service.ts)

- L191 — parameter: `value`
- L220 — variable: `[attachments, schedulePreferences, evaluation]`
- L359 — parameter: `row`
- L363 — parameter: `attachment`
- L400 — variable: `{ __triage: _triage, observations: _obs, ...rest }`
- L516 — variable: `[attachments, schedulePreferences]`
- L525 — variable: `{ impacts, ...base }`
- L547 — parameter: `preference`
- L552 — parameter: `attachment`
- L781 — variable: `request`

### [src/modules/requests/triage/triage.controller.ts](../src/modules/requests/triage/triage.controller.ts)

- L55 — variable: `{ message, fields }`

### [src/modules/requests/triage/triage.repository.ts](../src/modules/requests/triage/triage.repository.ts)

- L122 — variable: `row`

### [src/modules/users/users.controller.ts](../src/modules/users/users.controller.ts)

- L52 — variable: `{ message, fields }`
- L65 — variable: `{ message, fields }`

### [src/modules/users/users.repository.ts](../src/modules/users/users.repository.ts)

- L27 — variable: `row`
- L201 — variable: `user`
- L208 — variable: `[requester, professional]`
- L575 — variable: `result`
- L609 — variable: `existing`
- L632 — variable: `anon`

### [src/server.ts](../src/server.ts)

- L8 — parameter: `e`

### [src/shared/middleware/auth.ts](../src/shared/middleware/auth.ts)

- L9 — variable: `{ JsonWebTokenError, NotBeforeError, TokenExpiredError }`
- L25 — variable: `token`

### [src/shared/middleware/rateLimit.ts](../src/shared/middleware/rateLimit.ts)

- L8 — variable: `{ windowMs, limit, keyGenerator }`

### [src/shared/middleware/upload.ts](../src/shared/middleware/upload.ts)

- L49 — parameter: `err`

### [src/shared/middleware/uploadAssets.ts](../src/shared/middleware/uploadAssets.ts)

- L124 — parameter: `err`
- L153 — variable: `[fieldName, fileArray]`

### [src/shared/middleware/uploadAvatar.ts](../src/shared/middleware/uploadAvatar.ts)

- L70 — parameter: `err`

### [src/shared/utils/ensureDefaultAssets.ts](../src/shared/utils/ensureDefaultAssets.ts)

- L46 — variable: `[srcName, destRel]`
- L76 — variable: `[, destRel]`

### [src/shared/utils/json.ts](../src/shared/utils/json.ts)

- L8 — parameter: `v`
- L8 — retorno de `<anônima>()`

### [src/shared/utils/jwtUtil.ts](../src/shared/utils/jwtUtil.ts)

- L7 — variable: `{ sign, verify }`
