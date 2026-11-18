# Inventário de tipagens TypeScript

> Arquivo gerado por `npm run docs:types` a partir dos arquivos `src/**/*.ts` e do `tsconfig.json` do projeto. Não edite manualmente: rode o comando para atualizar. Não inclui dependências nem arquivos `.d.ts`.

## Resumo

- Arquivos-fonte analisados: **131**.
- Tipos nomeados: **276** — 189 interfaces, 85 aliases `type`, 2 classes e 0 enums.
- Declarações sem anotação explícita: **1583** — 1136 variáveis, 228 parâmetros e 219 retornos de funções/métodos.
- Declarações com tipo efetivo `any` detectado pelo checker: **48**; ocorrências com a palavra-chave `any` explícita no código-fonte: **0**.
- Arquivos com pelo menos uma declaração sem anotação: **98**; arquivos sem ocorrências são omitidos das seções 2 e 3.
- A verificação `npm run typecheck` passa com a configuração atual (inclui `strict` e `noImplicitReturns`).

## Como interpretar

- **Tipados:** as definições abaixo mostram os tipos nomeados (interfaces, aliases, classes e enums) como estão declarados no código. As anotações de propriedades e membros aparecem nas próprias definições.
- **Sem anotação explícita:** a declaração não traz `: Tipo` no local indicado. Isso **não** significa necessariamente falta de tipo: o compilador pode inferi-lo pelo inicializador, contexto ou assinatura. A lista inclui variáveis (inclusive destructuring, `for...of`/`for...in` e variável de `catch`), parâmetros e retornos de funções, métodos e getters.
- **`any`:** o checker determinou tipo efetivo `any` para os itens listados. Em destructuring, o item é marcado quando o padrão ou qualquer elemento tem tipo `any`. A lista deve ser revisada priorizando as fronteiras com bibliotecas e APIs sem tipo suficientemente específico.
- **Linhas:** referem-se ao estado do código no momento da geração. Como os números mudam a cada alteração em `src/`, valide com `npm run docs:types:check` (executado também por `npm run check`).

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
  entityType?: AuditEntityType;
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
  entity_type: AuditEntityType;
  entity_type_label: string;
  action_type: string; // histórico pode conter ações fora do catálogo atual
  actor: AuditActor;
  occurred_at: string;
}
```

### L24 — interface AuditHistoryDetail

```ts
export interface AuditHistoryDetail {
  audit_id: number;
  entity_type: AuditEntityType;
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
  change_origin: ChangeOrigin | null;
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

### L40 — alias TimelineItem

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

### L23 — interface PendingItem

```ts
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
```

### L40 — interface CreatePendingItemsBody

```ts
export interface CreatePendingItemsBody {
  observation?: string;
  requestAttachment?: boolean;
  items?: Array<{ fieldKey: string; comment: string }>;
}
```

### L46 — interface CreatePendingItemsResponse

```ts
export interface CreatePendingItemsResponse {
  batchId: string;
  requestAttachment: boolean;
  items: PendingItem[];
}
```

### L57 — interface ListPendingItemsResponse

```ts
export interface ListPendingItemsResponse {
  batchId: string | null;
  requestAttachment: boolean;
  items: PendingItem[];
}
```

### L63 — alias ReviewDecision

```ts
export type ReviewDecision = "validate" | "reopen";
```

### L65 — alias ReviewPendingItemDecision

```ts
export type ReviewPendingItemDecision =
  | { id: string; decision: "validate"; note?: string }
  | { id: string; decision: "reopen"; comment: string };
```

### L69 — interface ReviewPendingItemsBody

```ts
export interface ReviewPendingItemsBody {
  batchId: string;
  requestAttachment?: boolean;
  items: ReviewPendingItemDecision[];
}
```

### L75 — interface ReviewPendingItemsResponse

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

### L30 — alias PortalAssetsPatchDto

```ts
export type PortalAssetsPatchDto = PortalAssetsPatch;
```

### L33 — interface UpdateCategoriesRequest

```ts
export interface UpdateCategoriesRequest {
  categories: CategoriesSection["categories"];
}
```

### L38 — interface UpdateStatusesRequest

```ts
export interface UpdateStatusesRequest {
  statuses: StatusesSection["statuses"];
}
```

### L43 — interface UpdatePrioritizationWeightsRequest

```ts
export interface UpdatePrioritizationWeightsRequest {
  prioritizationWeights: PrioritizationWeightsSection["prioritizationWeights"];
}
```

### [src/modules/DTOs/portalConfig/PortalConfigResponse.dto.ts](../src/modules/DTOs/portalConfig/PortalConfigResponse.dto.ts)

### L2 — alias PortalConfigResponse

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

### L9 — alias MappingModality

```ts
export type MappingModality = "REMOTE" | "IN_PERSON";
```

### L16 — interface MappingParticipant

```ts
export interface MappingParticipant {
  id: string | null;
  name: string;
  email: string;
}
```

### L27 — interface MappingParticipantInput

```ts
export interface MappingParticipantInput {
  id?: string;
  name: string;
  email: string;
}
```

### L34 — interface MappingValues

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

### L44 — interface ResolvedParticipant

```ts
export interface ResolvedParticipant {
  userId: number | null;
  name: string;
  email: string;
}
```

### L59 — interface MappingAssignee

```ts
export interface MappingAssignee {
  id: string;
  userId: string;
  name: string;
  email: string;
  jobTitle: string | null;
}
```

### L71 — interface MappingResponseDTO

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

### L99 — interface MappingPayloadDTO

```ts
export interface MappingPayloadDTO {
  id?: string;
  /** UUID de `details_professional.professional_id`; validado por `mapping.schemas.ts`. */
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

### L117 — interface MappingActor

```ts
export interface MappingActor {
  id: number;
  email: string;
  role: Role;
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

### L4 — alias DashboardSituation

```ts
export type DashboardSituation = "open" | "closed" | "overdue" | "unassigned";
```

### L11 — alias DashboardPriorityFilter

```ts
export type DashboardPriorityFilter = number | "unassigned";
```

### L17 — interface DashboardQuery

```ts
export interface DashboardQuery {
  from?: string;
  to?: string;
  situation?: DashboardSituation;
  statusId?: number;
  categoryId?: number;
  priorityId?: DashboardPriorityFilter;
}
```

### L26 — interface DashboardSummary

```ts
export interface DashboardSummary {
  total: number;
  open: number;
  closed: number;
  overdue: number;
  unassigned: number;
}
```

### L34 — interface DashboardStatusMetric

```ts
export interface DashboardStatusMetric {
  id: number;
  name: string;
  count: number;
  tone: StatusTone;
  /**
   * Nome legado de `statuses.is_terminal` (ver `dashboard-metrics-contract.md`).
   * O Motor de Status v4 expõe o mesmo conceito como `isTerminal` em
   * `PortalStatus`; mantido por compatibilidade do contrato do dashboard.
   */
  closesRequest: boolean;
}
```

### L47 — interface DashboardPriorityMetric

```ts
export interface DashboardPriorityMetric {
  id: number | null;
  label: RequestPriority | "Não priorizada";
  count: number;
}
```

### L53 — interface DashboardFilterOptions

```ts
export interface DashboardFilterOptions {
  statuses: Array<{ id: number; name: string }>;
  categories: Array<{ id: number; name: string }>;
  priorities: Array<{ id: number; label: RequestPriority }>;
}
```

### L59 — interface DashboardCategoryMetric

```ts
export interface DashboardCategoryMetric {
  id: number;
  name: string;
  count: number;
}
```

### L65 — interface DashboardTrendPoint

```ts
export interface DashboardTrendPoint {
  period: string;
  count: number;
}
```

### L70 — interface DashboardResponse

```ts
export interface DashboardResponse {
  filters: {
    from: string | null;
    to: string | null;
    situation: DashboardSituation | null;
    statusId: number | null;
    categoryId: number | null;
    priorityId: DashboardPriorityFilter | null;
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

### L27 — interface Assignee

```ts
export interface Assignee {
  /** `details_professional.user_id` serializado, ou `null` quando ausente. */
  id: string | null;
  name: string;
  email: string | null;
}
```

### L34 — interface Prioritization

```ts
export interface Prioritization {
  score: number | null; // 10–50 (RN-007/RN-008, issue #51); null até ser avaliado
  maxScore: 50; // escala normalizada fixa — fonte: prioritization_evaluations
  label: string | null; // classificação RN-008 (ex.: "Alta"); null sem avaliação
}
```

### L40 — interface Meeting

```ts
export interface Meeting {
  scheduledFor: string;
  link: string | null;
}
```

### L45 — interface RequestInternalDetailDTO

```ts
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

### L49 — alias ListRequestsInput

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

### L21 — alias TrackingMode

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

### L77 — alias TrackingDetailsResponse

```ts
export type TrackingDetailsResponse =
  | { mode: "public"; details: PublicRequestDetails }
  | { mode: "authenticated"; details: RequesterRequestDetails };
```

### [src/modules/DTOs/users/UpdateProfileRequest.dto.ts](../src/modules/DTOs/users/UpdateProfileRequest.dto.ts)

### L36 — alias UpdateRequesterBlock

```ts
export type UpdateRequesterBlock = z.infer<typeof updateRequesterSchema>;
```

### L55 — alias UpdateProfilePayload

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

### L3 — interface CreateProfessionalInput

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

### L13 — interface RequesterInput

```ts
export interface RequesterInput {
  area: string;
  department?: string;
  manager: string;
  additionalContact?: string | null;
}
```

### L20 — interface CreateUserRequest

```ts
export interface CreateUserRequest {
  fullName: string;
  email: string;
  /** Nome do perfil no banco (`profiles.name`), ex.: "analista". */
  role: ProfileName;
  /** Obrigatório quando `role = "analista"`; proibido para os demais perfis. */
  professional?: CreateProfessionalInput;
  requester: RequesterInput;
}
```

### L30 — interface UpdateUserRequest

```ts
export interface UpdateUserRequest {
  fullName?: string;
  email?: string;
  role?: ProfileName;
  professional?: CreateProfessionalInput;
  requester?: {
    area?: string;
    department?: string | null;
    manager?: string;
    additionalContact?: string | null;
  };
}
```

### L43 — interface ListUsersQuery

```ts
export interface ListUsersQuery {
  profile?: ProfileName;
  search?: string;
  page: number;
  pageSize: number;
}
```

### L50 — interface ChangeUserStatusRequest

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
  categories: RequestCategoryName[];
  notes: string | null;
  requestLoad: number | null;
}
```

### L26 — alias Analyst

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

### L156 — alias MappingHistoryBaseRow

```ts
type MappingHistoryBaseRow = Omit<MappingHistoryRow, "participants" | "mappingAssignee">;
```

### [src/modules/internalNotes/internalNotes.schema.ts](../src/modules/internalNotes/internalNotes.schema.ts)

### L35 — alias TimelineCursorPayload

```ts
export type TimelineCursorPayload = z.infer<typeof cursorPayloadSchema>;
```

### L70 — alias ListTimelineQuery

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

### L239 — alias PendingItemInsert

```ts
export type PendingItemInsert = {
  request_id: string;
  batch_id: string;
  type: "field_edit" | "observation";
  field_key: string | null;
  field_label: string | null;
  current_value: string | number | boolean | null;
  comment: string;
  description: string;
  request_attachment: boolean;
  created_by: string;
};
```

### L252 — alias RespondFacts

```ts
export type RespondFacts = {
  requestedRemaining: number;
  attachmentSatisfied: boolean;
  currentStatusName: string;
};
```

### L258 — alias ReviewDecisionInput

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

### L268 — alias ReviewFacts

```ts
export type ReviewFacts = { hasReopen: boolean };
```

### L270 — alias SavedPendingAttachment

```ts
export type SavedPendingAttachment = {
  fileName: string;
  mimeType: string;
  sizeBytes: number;
  storageKey: string;
};
```

### [src/modules/pendingItems/pendingItems.schema.ts](../src/modules/pendingItems/pendingItems.schema.ts)

### L61 — alias CreatePendingItemsInput

```ts
export type CreatePendingItemsInput = z.infer<typeof createPendingItemsSchema>;
```

### L62 — alias VerifyInput

```ts
export type VerifyInput = z.infer<typeof verifySchema>;
```

### L63 — alias ReviewInput

```ts
export type ReviewInput = z.infer<typeof reviewSchema>;
```

### [src/modules/pendingItems/pendingItems.service.ts](../src/modules/pendingItems/pendingItems.service.ts)

### L188 — alias PendingCaller

```ts
export type PendingCaller = {
  user?: AuthenticatedUser;
  requesterIdentity?: { name: string; email: string } | null;
};
```

### [src/modules/portalConfig/portalConfig.mappers.ts](../src/modules/portalConfig/portalConfig.mappers.ts)

### L29 — alias Palette

```ts
type Palette = "light" | "dark";
```

### [src/modules/portalConfig/portalConfig.repository.ts](../src/modules/portalConfig/portalConfig.repository.ts)

### L67 — interface CriteriaRow

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

### L121 — alias MappingPayload

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

### L40 — interface YesNoDetailColumns

```ts
interface YesNoDetailColumns {
  flag: boolean | null;
  detail: string | null;
}
```

### L155 — interface RequestInsertReturning

```ts
interface RequestInsertReturning {
  request_id: string;
  protocol: string;
  created_at: Date;
}
```

### L345 — interface RequestSummaryRow

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

### L425 — interface RequestWithOwner

```ts
export interface RequestWithOwner {
  detail: RequestDetail;
  requesterEmail: string;
}
```

### L497 — interface RequestAttachmentRow

```ts
export interface RequestAttachmentRow {
  attachment_id: string;
  file_name: string;
  content_type: string;
  size_bytes: string; // bigint do pg
}
```

### L505 — interface SchedulePreferenceRow

```ts
export interface SchedulePreferenceRow {
  scheduled_for: Date | string;
}
```

### L817 — interface RequestStatusContext

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

### L831 — interface RequestStatusTarget

```ts
export interface RequestStatusTarget {
  status_id: number;
  name: string;
  is_active: boolean;
  is_restricted: boolean;
  /** Alias camelCase mantido para os guards do serviço (projeção `is_public`). */
  isPublic: boolean;
  triage_mode: StatusMode;
  mapping_mode: StatusMode;
}
```

### [src/modules/requests/requests.schema.ts](../src/modules/requests/requests.schema.ts)

### L150 — alias UpdateRequestPayload

```ts
export type UpdateRequestPayload = z.infer<typeof updateRequestPayloadSchema>;
```

### L181 — alias AssignRequestPayload

```ts
export type AssignRequestPayload = z.infer<typeof assignRequestSchema>;
```

### L204 — alias AssignAnalystPayload

```ts
export type AssignAnalystPayload = z.infer<typeof assignAnalystSchema>;
```

### L223 — alias UpdateStatusPayload

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

### L417 — interface TrackingCaller

```ts
export interface TrackingCaller {
  user?: AuthenticatedUser;
  requesterIdentity?: { name: string; email: string } | null;
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

### L26 — alias CreateTriagePayload

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

### L60 — alias AuditEntityType

```ts
export type AuditEntityType = keyof typeof auditCatalog;
```

### L63 — alias AuditEntityName

```ts
export type AuditEntityName = AuditEntityType;
```

### L81 — alias ChangeOrigin

```ts
export type ChangeOrigin = (typeof CHANGE_ORIGINS)[number];
```

### L88 — alias AuditActionOf

```ts
export type AuditActionOf<E extends AuditEntityName> = (typeof auditCatalog)[E]["actions"][number];
```

### L91 — alias ComposedAuditAction

```ts
export type ComposedAuditAction<E extends AuditEntityName> = `${E}.${AuditActionOf<E>}`;
```

### [src/shared/audit/auditLogger.ts](../src/shared/audit/auditLogger.ts)

### L12 — interface AuditEntryBase

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
  /** Origem da alteração — restrita aos valores gravados pelo sistema. */
  changeOrigin?: ChangeOrigin | null;
}
```

### L33 — alias AuditEntry

```ts
export type AuditEntry<
  E extends AuditEntityName = AuditEntityName,
  A extends ComposedAuditAction<E> = ComposedAuditAction<E>,
> = AuditEntryBase & { entityType: E; actionType: A };
```

### [src/shared/catalog/fieldCatalog.ts](../src/shared/catalog/fieldCatalog.ts)

### L42 — alias FieldKey

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

### L1 — alias RateLimitOptions

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

### [src/shared/types/ids.ts](../src/shared/types/ids.ts)

### L8 — alias Uuid

```ts
export type Uuid = `${string}-${string}-${string}-${string}-${string}`;
```

### [src/shared/types/internalNotes.ts](../src/shared/types/internalNotes.ts)

### L4 — alias InternalRole

```ts
export type InternalRole = Exclude<Role, "Solicitante">;
```

### L6 — interface InternalNoteRow

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

### L16 — interface InternalNoteReadStateRow

```ts
export interface InternalNoteReadStateRow {
  request_id: string;
  user_id: number;
  last_read_note_id: string;
  read_at: Date;
}
```

### L23 — alias TimelineEventAction

```ts
export type TimelineEventAction =
  | "request.assign"
  | "request.reassign"
  | "request.unassign"
  | "request.status_change"
  | "mapping.assign";
```

### L37 — alias AuditTimelineAction

```ts
export type AuditTimelineAction = TimelineEventAction | "request.override_status_admin";
```

### L43 — alias TimelineChangeOrigin

```ts
export type TimelineChangeOrigin = Extract<ChangeOrigin, "admin" | "system" | "internal"> | null;
```

### L45 — interface TimelineCursor

```ts
export interface TimelineCursor {
  t: Date;
  type: "note" | "event";
  id: string;
}
```

### L51 — interface TimelineEventRow

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

### L68 — interface TriageHistoryRow

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

### L89 — interface MappingHistoryParticipant

```ts
export interface MappingHistoryParticipant {
  userId: number | null;
  name: string;
  email: string;
}
```

### L96 — interface MappingHistoryAssignee

```ts
export interface MappingHistoryAssignee {
  id: string;
  userId: number;
  name: string;
  email: string;
  jobTitle: string | null;
}
```

### L105 — interface MappingHistoryRow

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

### [src/shared/types/pendingItems.ts](../src/shared/types/pendingItems.ts)

### L8 — alias PendencyStatus

```ts
export type PendencyStatus = "requested" | "responded" | "validated";
```

### L10 — alias PendingItemType

```ts
export type PendingItemType = "field_edit" | "observation";
```

### L12 — alias PendingFieldValue

```ts
export type PendingFieldValue = string | number | boolean | null;
```

### L14 — interface PendingFieldRef

```ts
export interface PendingFieldRef {
  fieldKey: string;
  /** Rótulo do catálogo (`fieldCatalog`) — ex.: "Nome completo". */
  fieldLabel: string;
  currentValue: PendingFieldValue;
}
```

### L21 — interface InternalAttachment

```ts
export interface InternalAttachment {
  fileName: string;
  mimeType: string;
  sizeBytes: number;
  /** `null` quando o download não é disponibilizado ao chamador. */
  downloadUrl: string | null;
  canDownload: boolean;
}
```

### L30 — interface UnreadState

```ts
export interface UnreadState {
  count: number;
  hasUnread: boolean;
  lastUnreadAt: string | null;
}
```

### L36 — interface CorrectionAlert

```ts
export interface CorrectionAlert {
  count: number;
  batchId: string;
}
```

### L41 — interface PendingSummary

```ts
export interface PendingSummary {
  total: number;
  requested: number;
  responded: number;
  validated: number;
}
```

### [src/shared/types/portalConfig.ts](../src/shared/types/portalConfig.ts)

### L14 — alias SolicitationMode

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

### L44 — alias AssetKey

```ts
export type AssetKey = (typeof ASSET_KEYS)[number];
```

### L48 — alias PortalAssetsPatch

```ts
export type PortalAssetsPatch = Partial<Record<AssetKey, string>> & {
  logoUsePrimaryColor?: boolean;
};
```

### L73 — alias ThemeTokenKey

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

### L121 — alias StatusMode

```ts
export type StatusMode = "none" | "free" | "conclusion_only";
```

### L138 — interface PortalStatus

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

### L165 — alias PrioritizationCriterion

```ts
export type PrioritizationCriterion = (typeof PRIORITIZATION_CRITERIA)[number];
```

### L170 — alias PrioritizationWeights

```ts
export type PrioritizationWeights = Record<PrioritizationCriterion, number>;
```

### L173 — interface PortalConfig

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

### L184 — alias AccessSection

```ts
export type AccessSection = Pick<PortalConfig, "solicitationMode">;
```

### L185 — alias IdentitySection

```ts
export type IdentitySection = Pick<PortalConfig, "platformName" | "protocolMask">;
```

### L186 — alias ThemeSection

```ts
export type ThemeSection = Pick<PortalConfig, "theme">;
```

### L187 — alias AssetsSection

```ts
export type AssetsSection = Pick<PortalConfig, "assets">;
```

### L188 — alias CategoriesSection

```ts
export type CategoriesSection = Pick<PortalConfig, "categories">;
```

### L189 — alias StatusesSection

```ts
export type StatusesSection = Pick<PortalConfig, "statuses">;
```

### L190 — alias PrioritizationWeightsSection

```ts
export type PrioritizationWeightsSection = Pick<PortalConfig, "prioritizationWeights">;
```

### L193 — interface CategoryRow

```ts
export interface CategoryRow {
  category_id: number;
  name: string;
  description: string | null;
  status: "active" | "inactive";
  display_order: number | null;
}
```

### L202 — interface StatusRow

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

### L17 — alias Classification

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

### L21 — alias QueuePriorityFilter

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

### L30 — alias SeedRequestStatus

```ts
export type SeedRequestStatus = (typeof REQUEST_STATUSES)[number];
```

### L33 — alias RequestStatus

```ts
export type RequestStatus = string;
```

### L38 — alias RequestPriority

```ts
export type RequestPriority = (typeof REQUEST_PRIORITIES)[number];
```

### L64 — alias TriageResult

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

### L73 — alias OperationalImpact

```ts
export type OperationalImpact = "Baixo" | "Médio" | "Alto" | "Crítico";
```

### L75 — alias YesNoDetail

```ts
export type YesNoDetail = false | string;
```

### L91 — alias BaseRequestCategory

```ts
export type BaseRequestCategory = (typeof BASE_REQUEST_CATEGORIES)[number];
```

### L94 — alias RequestCategoryName

```ts
export type RequestCategoryName = string;
```

### L97 — alias RequestCategory

```ts
export type RequestCategory = RequestCategoryName;
```

### L99 — interface AttachmentMetadata

```ts
export interface AttachmentMetadata {
  fileName: string; // nome original do arquivo — máx. 255
  mimeType: string; // PDF, DOCX, XLSX, PNG ou JPG
  sizeBytes: number; // máximo 10 * 1024 * 1024 (10MB)
}
```

### L105 — interface RequesterBlock

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

### L116 — interface DemandBlock

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

### L129 — interface OperationalBlock

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

### L147 — interface ComplementaryBlock

```ts
export interface ComplementaryBlock {
  hasProcessDocumentation?: YesNoDetail; // existência de documentação do processo (+ links)
  hasSimilarSolution?: YesNoDetail; // existência de solução semelhante
  dependsOnOtherAreas?: YesNoDetail; // dependência de outras áreas (+ quais)
  handlesRestrictedInfo?: YesNoDetail; // tratamento de informações restritas (LGPD/sigilo)
  additionalNotes?: string; // observações adicionais, máx. 2.000
}
```

### L155 — alias SchedulePreferences

```ts
export type SchedulePreferences = string[];
```

### L157 — interface RequesterTable

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

### L169 — interface AssignmentContextRow

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

### L182 — interface AssignmentCandidateRow

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

### L203 — interface InternalRequestRow

```ts
export interface InternalRequestRow {
  // requests
  request_id: string; // bigint serializado pelo pg
  requester_id: string; // uuid
  professional_id: string | null;
  requester_user_id: number | null;
  protocol: string;
  title: string;
  request_type: string;
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
  estimated_monthly_effort: string | number; // decimal do pg chega como string
  has_manual_controls: boolean;
  manual_controls_detail: string | null;
  main_risks: string;
  client_impact: string;
  operational_impact: OperationalImpact; // enum nativo operational_impact_level
  desired_deadline: string | Date; // coluna date
  perceived_criticality: RequestPriority; // enum nativo request_priority
  has_process_documentation: boolean | null;
  process_documentation_detail: string | null;
  has_similar_solution: boolean | null;
  similar_solution_detail: string | null;
  depends_on_other_areas: boolean | null;
  other_areas_detail: string | null;
  handles_restricted_info: boolean | null;
  restricted_info_detail: string | null;
  additional_notes: string | null;
  internal_notes: string | null;
  meeting_scheduled_for: Date | string | null;
  meeting_link: string | null;
  last_technical_message: string | null;
  last_external_update_at: Date | string | null;
  created_at: Date | string;
  updated_at: Date | string;

  // joins e aliases
  category: string | null;
  category_name?: string | null; // opcional: não é selecionado pela query
  status: string;
  public_status: string;
  priority: string | null;
  assignee_user_id: number | null;
  professional_name: string | null;
  professional_email: string | null;
  requester_name: string;
  requester_email: string;
  requester_area: string | null;
  requester_department: string | null;
  requester_manager: string | null;
  requester_additional_contact: string | null;
  mapping_professional_id: string | null;
  mapping_user_id: number | null;
  mapping_name: string | null;
  mapping_email: string | null;
}
```

### [src/shared/types/role.ts](../src/shared/types/role.ts)

### L3 — alias Role

```ts
export type Role = (typeof ROLES)[number];
```

### L12 — alias ProfileName

```ts
export type ProfileName = string;
```

### [src/shared/types/status.ts](../src/shared/types/status.ts)

### L29 — alias StatusId

```ts
export type StatusId = (typeof STATUS_IDS)[keyof typeof STATUS_IDS];
```

### L42 — alias CoreStatusId

```ts
export type CoreStatusId = (typeof CORE_STATUS_IDS)[number];
```

### [src/shared/types/systemSettings.ts](../src/shared/types/systemSettings.ts)

### L2 — alias PortalSolicitationMode

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

### L3 — alias StatusTone

```ts
export type StatusTone = (typeof STATUS_TONES)[number];
```

### L21 — alias ThemeTokenKey

```ts
export type ThemeTokenKey = (typeof THEME_TOKEN_KEYS)[number];
```

### L24 — alias ThemePalette

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

### L11 — alias AuthenticatedUser

```ts
export type AuthenticatedUser = Omit<User, "password">;
```

### L14 — interface UserRow

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

### L29 — interface AuthUserRow

```ts
export interface AuthUserRow extends UserRow {
  profile_name: string;
  profile_is_active: boolean;
}
```

### L35 — interface UserMetricsResponse

```ts
export interface UserMetricsResponse {
  total: number;
  active: number;
  pending: number;
  admins: number;
}
```

### [src/shared/utils/jwtUtil.ts](../src/shared/utils/jwtUtil.ts)

### L9 — alias TokenScope

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

- L9 — variable: `app`

### [src/configs.ts](../src/configs.ts)

- L1 — variable: `NODE_ENV`
- L4 — variable: `key`
- L14 — variable: `Config`
- L19 — parameter: `s`
- L19 — retorno da função: `<anônima>()`
- L29 — variable: `num`
- L30 — variable: `unit`

### [src/database/conection.ts](../src/database/conection.ts)

- L5 — variable: `db`

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

- L15 — parameter: `[key, val]`
- L15 — retorno da função: `<anônima>()`
- L21 — variable: `{ items, total }`
- L23 — parameter: `row`
- L23 — retorno da função: `<anônima>()`
- L49 — variable: `occurredAt`
- L51 — variable: `userId`
- L73 — variable: `row`
- L89 — variable: `normalized`
- L90 — variable: `isManagerLike`
- L92 — variable: `request`
- L106 — variable: `isAssignee`
- L108 — variable: `isMappingAssignee`
- L120 — variable: `rows`
- L121 — parameter: `row`
- L121 — retorno da função: `<anônima>()`

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

- L7 — variable: `createPendingItemsSchema`
- L21 — parameter: `ctx`
- L21 — parameter: `data`
- L21 — retorno da função: `<anônima>()`
- L22 — variable: `hasObservation`
- L24 — variable: `hasItems`
- L34 — variable: `verifySchema`
- L40 — variable: `reviewSchema`

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
- L63 — variable: `corrected`
- L86 — variable: `request`
- L95 — variable: `observation`
- L96 — variable: `items`
- L97 — variable: `hasObservation`
- L98 — variable: `hasItems`
- L108 — variable: `raw`
- L112 — variable: `item`
- L113 — variable: `fieldKey`
- L137 — variable: `batchId`
- L138 — variable: `requestAttachment`
- L155 — variable: `item`
- L156 — variable: `fieldKey`
- L157 — variable: `snapshot`
- L175 — variable: `createdRows`
- L184 — variable: `mapped`
- L202 — variable: `professionalId`
- L203 — variable: `requestProfessionalId`
- L210 — variable: `request`
- L214 — variable: `nameOk`
- L215 — variable: `emailOk`
- L225 — variable: `identity`
- L227 — variable: `nameOk`
- L228 — variable: `emailOk`
- L239 — variable: `request`
- L241 — variable: `rows`
- L242 — variable: `items`
- L251 — variable: `openRow`
- L252 — parameter: `row`
- L252 — retorno da função: `<anônima>()`
- L254 — variable: `targetRow`
- L255 — variable: `batchId`
- L256 — variable: `requestAttachment`
- L258 — parameter: `row`
- L258 — retorno da função: `<anônima>()`
- L273 — variable: `request`
- L275 — variable: `row`
- L283 — variable: `type`
- L301 — variable: `response`
- L314 — variable: `updated`
- L323 — parameter: `facts`
- L323 — retorno da função: `<anônima>()`
- L331 — variable: `list`
- L349 — variable: `request`
- L351 — variable: `row`
- L367 — variable: `[saved]`
- L377 — variable: `err`
- L417 — variable: `date`
- L439 — variable: `nullableComplement`
- L469 — variable: `request`
- L474 — variable: `batchId`
- L475 — variable: `batchRows`
- L478 — parameter: `row`
- L478 — retorno da função: `<anônima>()`
- L478 — variable: `byId`
- L480 — variable: `decision`
- L481 — variable: `row`
- L483 — variable: `status`
- L495 — parameter: `decision`
- L495 — retorno da função: `<anônima>()`
- L499 — variable: `row`
- L500 — variable: `fieldKey`
- L509 — variable: `decidedRows`
- L518 — parameter: `facts`
- L518 — retorno da função: `<anônima>()`
- L521 — variable: `mapped`
- L531 — variable: `mode`
- L536 — variable: `found`
- L538 — variable: `nameOk`
- L539 — variable: `emailOk`

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
- L46 — variable: `source`
- L54 — variable: `source`
- L60 — variable: `source`
- L73 — variable: `source`
- L129 — variable: `now`
- L147 — variable: `now`
- L175 — variable: `category`
- L193 — parameter: `c`
- L193 — retorno da função: `<anônima>()`
- L193 — variable: `keepIds`
- L215 — parameter: `index`
- L215 — parameter: `status`
- L215 — retorno da função: `<anônima>()`
- L215 — variable: `orderById`
- L217 — variable: `status`
- L218 — variable: `orderNumber`
- L219 — variable: `triageMode`
- L220 — variable: `mappingMode`
- L221 — variable: `isTerminal`
- L222 — variable: `row`
- L243 — parameter: `status`
- L243 — retorno da função: `<anônima>()`
- L243 — variable: `keepIds`
- L245 — variable: `omitted`
- L250 — variable: `nextOrder`
- L251 — variable: `row`
- L275 — variable: `[contractKey, weight]`
- L276 — variable: `criterionId`

### [src/modules/portalConfig/portalConfig.router.ts](../src/modules/portalConfig/portalConfig.router.ts)

- L16 — variable: `portalConfigRoutes`

### [src/modules/portalConfig/portalConfig.schema.ts](../src/modules/portalConfig/portalConfig.schema.ts)

- L23 — variable: `hexColorSchema`
- L27 — variable: `ThemeGradientSchema`
- L40 — variable: `StatusToneSchema`
- L48 — variable: `statusTonesShape`
- L49 — parameter: `tone`
- L49 — retorno da função: `<anônima>()`
- L52 — variable: `tokenShape`
- L53 — parameter: `key`
- L53 — retorno da função: `<anônima>()`
- L56 — variable: `ThemePaletteSchema`
- L64 — variable: `updateThemeSchema`
- L75 — variable: `updateAccessSchema`
- L83 — variable: `updateIdentitySchema`
- L100 — parameter: `identity`
- L100 — retorno da função: `<anônima>()`
- L107 — variable: `portalCategorySchema`
- L116 — variable: `updateCategoriesSchema`
- L122 — parameter: `categories`
- L122 — parameter: `ctx`
- L122 — retorno da função: `<anônima>()`
- L123 — variable: `seen`
- L124 — parameter: `category`
- L124 — parameter: `index`
- L124 — retorno da função: `<anônima>()`
- L125 — variable: `key`
- L135 — parameter: `category`
- L135 — retorno da função: `<anônima>()`
- L146 — variable: `StatusModeSchema`
- L150 — variable: `portalStatusSchema`
- L170 — parameter: `ctx`
- L170 — parameter: `status`
- L170 — retorno da função: `<anônima>()`
- L180 — variable: `updateStatusesSchema`
- L186 — parameter: `ctx`
- L186 — parameter: `statuses`
- L186 — retorno da função: `<anônima>()`
- L187 — variable: `seenNames`
- L188 — parameter: `index`
- L188 — parameter: `status`
- L188 — retorno da função: `<anônima>()`
- L189 — variable: `nameKey`
- L217 — parameter: `status`
- L217 — retorno da função: `<anônima>()`
- L233 — variable: `prioritizationWeightSchema`
- L239 — variable: `updatePrioritizationWeightsSchema`
- L247 — parameter: `ctx`
- L247 — parameter: `{ prioritizationWeights }`
- L247 — retorno da função: `<anônima>()`
- L248 — variable: `missing`
- L249 — parameter: `criterion`
- L249 — retorno da função: `<anônima>()`
- L266 — variable: `assetUrlSchema`
- L272 — parameter: `url`
- L272 — retorno da função: `<anônima>()`
- L276 — variable: `portalAssetsPatchSchema`
- L290 — parameter: `assets`
- L290 — retorno da função: `<anônima>()`

### [src/modules/portalConfig/portalConfig.service.ts](../src/modules/portalConfig/portalConfig.service.ts)

- L32 — retorno da função: `assetsFromRow()`
- L67 — variable: `[settings, themeRow, categories, statuses, criteria]`
- L75 — variable: `theme`
- L83 — parameter: `cat`
- L83 — retorno da função: `<anônima>()`
- L91 — parameter: `c`
- L91 — retorno da função: `<anônima>()`
- L92 — variable: `key`
- L107 — parameter: `trx`
- L107 — retorno da função: `<anônima>()`
- L110 — variable: `settings`
- L111 — variable: `previous`
- L136 — parameter: `trx`
- L136 — retorno da função: `<anônima>()`
- L139 — variable: `settings`
- L140 — variable: `previous`
- L147 — variable: `updated`
- L148 — variable: `newValue`
- L174 — parameter: `trx`
- L174 — retorno da função: `<anônima>()`
- L178 — variable: `themeRow`
- L179 — variable: `previousTheme`
- L180 — variable: `columns`
- L205 — parameter: `trx`
- L205 — retorno da função: `<anônima>()`
- L208 — variable: `settings`
- L209 — variable: `previous`
- L213 — variable: `updated`
- L214 — variable: `newValue`
- L237 — parameter: `trx`
- L237 — retorno da função: `<anônima>()`
- L240 — variable: `prevRows`
- L241 — parameter: `cat`
- L241 — retorno da função: `<anônima>()`
- L241 — variable: `previous`
- L271 — parameter: `trx`
- L271 — retorno da função: `<anônima>()`
- L274 — variable: `prevRows`
- L275 — variable: `previous`
- L276 — parameter: `st`
- L276 — retorno da função: `<anônima>()`
- L276 — variable: `prevById`
- L277 — parameter: `s`
- L277 — retorno da função: `<anônima>()`
- L277 — variable: `incomingById`
- L279 — variable: `coreId`
- L280 — variable: `existing`
- L289 — variable: `incoming`
- L358 — parameter: `trx`
- L358 — retorno da função: `<anônima>()`
- L361 — variable: `prevRows`
- L362 — variable: `previous`
- L363 — parameter: `c`
- L363 — retorno da função: `<anônima>()`
- L364 — variable: `key`

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

- L38 — variable: `INITIAL_STATUS`
- L78 — variable: `email`
- L125 — variable: `row`
- L139 — variable: `requesterId`
- L162 — variable: `result`
- L166 — variable: `row`
- L183 — variable: `email`
- L184 — variable: `requestId`
- L186 — variable: `manualControls`
- L187 — variable: `processDocumentation`
- L188 — variable: `similarSolution`
- L189 — variable: `otherAreas`
- L190 — variable: `restrictedInfo`
- L192 — variable: `insertedRows`
- L251 — variable: `row`
- L270 — parameter: `scheduledFor`
- L270 — retorno da função: `<anônima>()`
- L289 — parameter: `attachment`
- L289 — retorno da função: `<anônima>()`
- L307 — parameter: `trx`
- L307 — retorno da função: `<anônima>()`
- L308 — variable: `categoryId`
- L314 — variable: `statusId`
- L315 — variable: `requesterId`
- L316 — variable: `saved`
- L325 — variable: `email`
- L340 — variable: `row`
- L355 — variable: `PUBLIC_STATUS_SUMMARY_SQL`
- L358 — retorno da função: `baseSummaryQuery()`
- L375 — parameter: `builder`
- L375 — retorno da função: `<anônima>()`
- L385 — variable: `countRows`
- L391 — variable: `total`
- L393 — variable: `rows`
- L408 — parameter: `row`
- L408 — retorno da função: `<anônima>()`
- L433 — variable: `response`
- L465 — variable: `meetingScheduledFor`
- L467 — variable: `meeting`
- L471 — variable: `openedAt`
- L512 — variable: `hasMapping`
- L514 — variable: `query`
- L542 — variable: `baseSelect`
- L609 — variable: `mappingSelect`
- L653 — variable: `row`
- L666 — variable: `ASSIGNABLE_PROFILES`
- L689 — variable: `numericId`
- L734 — variable: `hasMapping`
- L750 — variable: `query`
- L761 — variable: `row`
- L805 — variable: `statusId`
- L845 — variable: `hasMappingColumn`
- L860 — variable: `query`
- L871 — variable: `row`
- L896 — retorno da função: `<anônima>()`
- L955 — variable: `manualControls`
- L956 — variable: `processDocumentation`
- L957 — variable: `similarSolution`
- L958 — variable: `otherAreas`
- L959 — variable: `restrictedInfo`

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
- L208 — variable: `assigneeUserId`
- L209 — variable: `mappingUserId`
- L210 — variable: `isAssignee`
- L216 — variable: `requestId`
- L217 — variable: `[attachments, schedulePreferences, evaluation]`
- L226 — variable: `meeting`
- L234 — retorno da função: `<anônima>()`
- L234 — variable: `pendingSummary`
- L236 — variable: `summary`
- L237 — variable: `correctionAlert`
- L238 — variable: `unreadRaw`
- L274 — variable: `openedAt`
- L275 — variable: `lastUpdate`
- L277 — variable: `assigneeUserId`
- L278 — variable: `mappingUserId`
- L280 — variable: `assignee`
- L289 — variable: `mappingAssignee`
- L356 — parameter: `row`
- L356 — retorno da função: `<anônima>()`
- L360 — parameter: `attachment`
- L360 — retorno da função: `<anônima>()`
- L386 — variable: `trimmed`
- L393 — variable: `record`
- L397 — variable: `{ __triage: _triage, observations: _obs, ...rest }`
- L422 — variable: `TRACKING_INVALID_IDENTITY`
- L425 — variable: `scheduledFor`
- L482 — variable: `openedAt`
- L501 — variable: `requestId`
- L502 — variable: `[attachments, schedulePreferences]`
- L507 — variable: `meeting`
- L508 — variable: `complementary`
- L511 — variable: `{ impacts, ...base }`
- L530 — parameter: `preference`
- L530 — retorno da função: `<anônima>()`
- L535 — parameter: `attachment`
- L535 — retorno da função: `<anônima>()`
- L554 — variable: `requesterUserId`
- L578 — variable: `row`
- L593 — variable: `mode`
- L604 — variable: `row`
- L606 — variable: `nameOk`
- L608 — variable: `emailOk`
- L629 — variable: `normalizedProtocol`
- L713 — variable: `request`
- L724 — variable: `professional`
- L725 — variable: `canEdit`
- L732 — parameter: `trx`
- L732 — retorno da função: `<anônima>()`
- L761 — variable: `RN010_ELIGIBLE_SCREENING`
- L769 — variable: `candidate`
- L791 — variable: `candidate`
- L812 — variable: `request`
- L827 — variable: `assignee`
- L832 — variable: `previousId`
- L833 — variable: `nextId`
- L836 — parameter: `c`
- L836 — retorno da função: `<anônima>()`
- L839 — variable: `auditNext`
- L840 — variable: `auditPrev`
- L843 — variable: `action`
- L845 — variable: `shouldAdvanceStatus`
- L850 — parameter: `trx`
- L850 — retorno da função: `<anônima>()`
- L893 — variable: `request`
- L908 — variable: `hasAssignee`
- L909 — variable: `hasMapping`
- L912 — variable: `raw`
- L914 — variable: `previous`
- L915 — variable: `auditPrev`
- L918 — parameter: `trx`
- L918 — retorno da função: `<anônima>()`
- L935 — variable: `resolved`
- L936 — variable: `previous`
- L937 — variable: `auditPrev`
- L940 — variable: `previousMapping`
- L941 — variable: `auditPrevMapping`
- L944 — variable: `action`
- L945 — variable: `shouldAdvance`
- L948 — parameter: `trx`
- L948 — retorno da função: `<anônima>()`
- L997 — variable: `raw`
- L999 — variable: `previous`
- L1000 — variable: `auditPrev`
- L1003 — parameter: `trx`
- L1003 — retorno da função: `<anônima>()`
- L1020 — variable: `resolved`
- L1021 — variable: `previous`
- L1022 — variable: `auditPrev`
- L1025 — variable: `previousAssignee`
- L1026 — variable: `auditPrevAssignee`
- L1029 — variable: `action`
- L1030 — parameter: `trx`
- L1030 — retorno da função: `<anônima>()`
- L1079 — variable: `isTriageAssignee`
- L1081 — variable: `isMappingAssignee`
- L1106 — parameter: `trx`
- L1106 — retorno da função: `<anônima>()`
- L1127 — variable: `request`
- L1132 — variable: `target`
- L1137 — variable: `isAdmin`
- L1151 — variable: `isAssignee`
- L1153 — variable: `isMappingAssignee`
- L1156 — variable: `isAnalystAssignee`
- L1222 — variable: `changeOrigin`
- L1224 — parameter: `trx`
- L1224 — retorno da função: `<anônima>()`
- L1224 — variable: `lastUpdate`
- L1225 — variable: `persistedAt`

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
- L616 — variable: `next`
- L634 — variable: `anon`

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
- L362 — variable: `changesAdministrativeFields`
- L397 — variable: `url`
- L400 — variable: `url`
- L428 — variable: `saved`
- L429 — variable: `attachment`
- L437 — variable: `key`
- L438 — variable: `storagePath`
- L439 — retorno da função: `<anônima>()`
- L456 — variable: `id`
- L462 — variable: `target`
- L467 — variable: `isTargetAdmin`
- L468 — variable: `hasNonRequesterPatch`
- L481 — variable: `pid`
- L485 — variable: `role`
- L490 — variable: `finalRoleName`
- L491 — variable: `isFinalAnalyst`
- L492 — variable: `wasAnalyst`
- L510 — variable: `before`
- L513 — parameter: `trx`
- L513 — retorno da função: `<anônima>()`
- L523 — variable: `fullName`
- L524 — variable: `corporateEmail`
- L537 — variable: `fullName`
- L538 — variable: `corporateEmail`
- L558 — variable: `error`
- L565 — variable: `updated`
- L576 — retorno da função: `<anônima>()`

### [src/router.ts](../src/router.ts)

- L16 — variable: `router`

### [src/server.ts](../src/server.ts)

- L5 — variable: `PORT`
- L8 — parameter: `e`
- L8 — retorno da função: `<anônima>()`
- L10 — retorno da função: `<anônima>()`

### [src/shared/audit/auditCatalog.ts](../src/shared/audit/auditCatalog.ts)

- L13 — variable: `auditCatalog`
- L71 — variable: `CHANGE_ORIGINS`
- L104 — parameter: `action`
- L104 — retorno da função: `<anônima>()`

### [src/shared/catalog/fieldCatalog.ts](../src/shared/catalog/fieldCatalog.ts)

- L6 — variable: `FIELD_KEYS`
- L162 — variable: `value`
- L164 — variable: `date`

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

### [src/shared/types/ids.ts](../src/shared/types/ids.ts)

- L10 — variable: `UUID_PATTERN`

### [src/shared/types/portalConfig.ts](../src/shared/types/portalConfig.ts)

- L33 — variable: `ASSET_KEYS`
- L55 — variable: `THEME_TOKEN_KEYS`
- L152 — variable: `PRIORITIZATION_CRITERIA`

### [src/shared/types/requests.ts](../src/shared/types/requests.ts)

- L9 — variable: `REQUEST_STATUSES`
- L36 — variable: `REQUEST_PRIORITIES`
- L47 — variable: `IN_PROGRESS_STATUSES`
- L62 — variable: `TERMINAL_STATUSES`
- L78 — variable: `BASE_REQUEST_CATEGORIES`

### [src/shared/types/role.ts](../src/shared/types/role.ts)

- L1 — variable: `ROLES`

### [src/shared/types/status.ts](../src/shared/types/status.ts)

- L9 — variable: `STATUS_IDS`
- L32 — variable: `CORE_STATUS_IDS`
- L52 — variable: `IN_PROGRESS_STATUS_IDS`

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

- L7 — variable: `salt`
- L9 — variable: `hashedPassword`
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

### [src/modules/auth/auth.repository.ts](../src/modules/auth/auth.repository.ts)

- L87 — variable: `passwordChangedAt`

### [src/modules/pendingItems/pendingItems.repository.ts](../src/modules/pendingItems/pendingItems.repository.ts)

- L23 — variable: `row`
- L44 — variable: `row`
- L62 — variable: `row`
- L85 — variable: `row`
- L231 — variable: `row`
- L281 — variable: `row`
- L303 — variable: `row`
- L308 — variable: `row`
- L439 — variable: `requiresAttachment`
- L624 — variable: `requesterRow`
- L649 — variable: `category`

### [src/modules/pendingItems/pendingItems.router.ts](../src/modules/pendingItems/pendingItems.router.ts)

- L54 — parameter: `err`

### [src/modules/portalConfig/portalConfig.controller.ts](../src/modules/portalConfig/portalConfig.controller.ts)

- L106 — variable: `rawAssets`

### [src/modules/portalConfig/portalConfig.repository.ts](../src/modules/portalConfig/portalConfig.repository.ts)

- L251 — variable: `row`

### [src/modules/prioritization/prioritization.repository.ts](../src/modules/prioritization/prioritization.repository.ts)

- L17 — variable: `row`
- L24 — variable: `row`
- L57 — variable: `row`

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

### [src/modules/queue/queue.repository.ts](../src/modules/queue/queue.repository.ts)

- L33 — variable: `result`

### [src/modules/requests/requests.repository.ts](../src/modules/requests/requests.repository.ts)

- L125 — variable: `row`
- L340 — variable: `row`
- L433 — variable: `response`
- L653 — variable: `row`
- L761 — variable: `row`
- L871 — variable: `row`

### [src/modules/requests/requests.service.ts](../src/modules/requests/requests.service.ts)

- L191 — parameter: `value`

### [src/modules/requests/triage/triage.repository.ts](../src/modules/requests/triage/triage.repository.ts)

- L122 — variable: `row`

### [src/modules/users/users.repository.ts](../src/modules/users/users.repository.ts)

- L27 — variable: `row`
- L201 — variable: `user`
- L208 — variable: `[requester, professional]`
- L575 — variable: `result`
- L634 — variable: `anon`

### [src/server.ts](../src/server.ts)

- L8 — parameter: `e`

### [src/shared/middleware/auth.ts](../src/shared/middleware/auth.ts)

- L25 — variable: `token`

### [src/shared/middleware/upload.ts](../src/shared/middleware/upload.ts)

- L49 — parameter: `err`

### [src/shared/middleware/uploadAssets.ts](../src/shared/middleware/uploadAssets.ts)

- L124 — parameter: `err`

### [src/shared/middleware/uploadAvatar.ts](../src/shared/middleware/uploadAvatar.ts)

- L70 — parameter: `err`

### [src/shared/utils/json.ts](../src/shared/utils/json.ts)

- L8 — parameter: `v`
- L8 — retorno da função: `<anônima>()`
