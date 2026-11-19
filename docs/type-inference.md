# Inventário de tipagens TypeScript

> Arquivo gerado por `npm run docs:types` a partir dos arquivos `src/**/*.ts` e do `tsconfig.json` do projeto. Não edite manualmente: rode o comando para atualizar. Não inclui dependências nem arquivos `.d.ts`.

## Resumo

- Arquivos-fonte analisados: **155**.
- Tipos nomeados: **272** — 190 interfaces, 80 aliases `type`, 2 classes e 0 enums.
- Declarações sem anotação explícita: **1624** — 1175 variáveis, 229 parâmetros e 220 retornos de funções/métodos.
- Declarações com tipo efetivo `any` detectado pelo checker: **48**; ocorrências com a palavra-chave `any` explícita no código-fonte: **0**.
- Arquivos com pelo menos uma declaração sem anotação: **112**; arquivos sem ocorrências são omitidos das seções 2 e 3.
- Erros de typecheck no momento da geração: **0** (mesmo `tsconfig.json`; 0 significa que `npm run typecheck` passa).

## Como interpretar

- **Tipados:** as definições abaixo mostram os tipos nomeados (interfaces, aliases, classes e enums) como estão declarados no código. As anotações de propriedades e membros aparecem nas próprias definições.
- **Sem anotação explícita:** a declaração não traz `: Tipo` no local indicado. Isso **não** significa necessariamente falta de tipo: o compilador pode inferi-lo pelo inicializador, contexto ou assinatura. A lista inclui variáveis (inclusive destructuring, `for...of`/`for...in` e variável de `catch`), parâmetros e retornos de funções, métodos e getters.
- **`any`:** o checker determinou tipo efetivo `any` para os itens listados. Em destructuring, o item é marcado quando o padrão ou qualquer elemento tem tipo `any`. A lista deve ser revisada priorizando as fronteiras com bibliotecas e APIs sem tipo suficientemente específico.
- **Linhas:** referem-se ao estado do código no momento da geração. Como os números mudam a cada alteração em `src/`, valide com `npm run docs:types:check` antes de publicar mudanças de tipagem.

## 1. Tipos nomeados e suas definições

### [src/docs/swagger.ts](../src/docs/swagger.ts)

#### L24 — interface SwaggerInterceptorRequest

```ts
interface SwaggerInterceptorRequest {
  withCredentials: boolean;
  headers: Record<string, string>;
  [key: string]: unknown;
}
```

### [src/modules/auditHistory/auditHistory.repository.ts](../src/modules/auditHistory/auditHistory.repository.ts)

#### L4 — interface AuditSummaryRow

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

#### L13 — interface AuditCountRow

```ts
interface AuditCountRow {
  total: number | string;
}
```

#### L17 — interface AuditHistoryDetailRow

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

#### L50 — interface AuthState

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

#### L11 — interface SessionUserResult

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

#### L3 — interface AuditHistoryQuery

```ts
export interface AuditHistoryQuery {
  page?: number;
  limit?: number;
  entityType?: AuditEntityType;
}
```

#### L9 — interface AuditActor

```ts
export interface AuditActor {
  kind: "system" | "user";
  userId: number | null;
  displayName: string | null;
}
```

#### L15 — interface AuditHistorySummary

```ts
export interface AuditHistorySummary {
  audit_id: number;
  /** Valor persistido em `audit_history.entity_type`; histórico pode estar fora do catálogo. */
  entity_type: string;
  entity_type_label: string;
  action_type: string; // histórico pode conter ações fora do catálogo atual
  actor: AuditActor;
  occurred_at: string;
}
```

#### L25 — interface AuditHistoryDetail

```ts
export interface AuditHistoryDetail {
  audit_id: number;
  /** Valor persistido em `audit_history.entity_type`; histórico pode estar fora do catálogo. */
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
  /** Valor persistido em `audit_history.change_origin`; histórico pode estar fora de `ChangeOrigin`. */
  change_origin: string | null;
  occurred_at: string;
}
```

#### L44 — interface AuditHistoryListResponse

```ts
export interface AuditHistoryListResponse {
  items: AuditHistorySummary[];
  total: number;
  page: number;
  limit: number;
}
```

### [src/modules/DTOs/auth/ChangePasswordRequest.dto.ts](../src/modules/DTOs/auth/ChangePasswordRequest.dto.ts)

#### L1 — interface ChangePasswordRequest

```ts
export interface ChangePasswordRequest {
  currentPassword: string;
  newPassword: string;
  confirmNewPassword: string;
}
```

### [src/modules/DTOs/auth/ChangePasswordResponse.dto.ts](../src/modules/DTOs/auth/ChangePasswordResponse.dto.ts)

#### L3 — interface ChangePasswordResponseDTO

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

#### L1 — interface LoginRequestDTO

```ts
export interface LoginRequestDTO {
  email: string;
  password: string;
}
```

### [src/modules/DTOs/auth/LoginResponse.dto.ts](../src/modules/DTOs/auth/LoginResponse.dto.ts)

#### L3 — interface LoginResponseDTO

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

#### L3 — interface MeResponseDTO

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

#### L9 — interface TimelineActorDTO

```ts
export interface TimelineActorDTO {
  id: string;
  name: string;
  role: InternalRole;
}
```

#### L15 — interface TimelineNote

```ts
export interface TimelineNote {
  type: "note";
  id: string;
  content: string;
  createdAt: string;
  author: TimelineActorDTO;
}
```

#### L23 — interface TimelineEvent

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

#### L40 — alias TimelineItem

```ts
export type TimelineItem = TimelineNote | TimelineEvent;
```

#### L42 — interface TriageHistoryEntry

```ts
export interface TriageHistoryEntry {
  triage: TriageAssessment;
  occurredAt: string;
}
```

#### L47 — interface MappingHistoryEntry

```ts
export interface MappingHistoryEntry {
  mapping: MappingResponseDTO;
  occurredAt: string;
}
```

#### L52 — interface InternalNotesResponse

```ts
export interface InternalNotesResponse {
  items: TimelineItem[];
  nextCursor: string | null;
  unseenCount: number;
  triages: TriageHistoryEntry[];
  mappings: MappingHistoryEntry[];
}
```

#### L60 — interface CreateInternalNoteRequest

```ts
export interface CreateInternalNoteRequest {
  content: string;
}
```

#### L64 — interface MarkInternalNotesReadRequest

```ts
export interface MarkInternalNotesReadRequest {
  lastReadNoteId: string;
}
```

### [src/modules/DTOs/pendingItems/PendingItems.dto.ts](../src/modules/DTOs/pendingItems/PendingItems.dto.ts)

#### L23 — interface PendingItem

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

#### L40 — interface CreatePendingItemsBody

```ts
export interface CreatePendingItemsBody {
  observation?: string;
  requestAttachment?: boolean;
  items?: Array<{ fieldKey: string; comment: string }>;
}
```

#### L46 — interface CreatePendingItemsResponse

```ts
export interface CreatePendingItemsResponse {
  batchId: string;
  requestAttachment: boolean;
  items: PendingItem[];
}
```

#### L57 — interface ListPendingItemsResponse

```ts
export interface ListPendingItemsResponse {
  batchId: string | null;
  requestAttachment: boolean;
  items: PendingItem[];
}
```

#### L63 — alias ReviewDecision

```ts
export type ReviewDecision = "validate" | "reopen";
```

#### L65 — alias ReviewPendingItemDecision

```ts
export type ReviewPendingItemDecision =
  | { id: string; decision: "validate"; note?: string }
  | { id: string; decision: "reopen"; comment: string };
```

#### L69 — interface ReviewPendingItemsBody

```ts
export interface ReviewPendingItemsBody {
  batchId: string;
  requestAttachment?: boolean;
  items: ReviewPendingItemDecision[];
}
```

#### L75 — interface ReviewPendingItemsResponse

```ts
export interface ReviewPendingItemsResponse {
  batchId: string;
  items: PendingItem[];
}
```

### [src/modules/DTOs/portalConfig/PortalConfigRequests.dto.ts](../src/modules/DTOs/portalConfig/PortalConfigRequests.dto.ts)

#### L10 — interface UpdateAccessRequest

```ts
export interface UpdateAccessRequest {
  solicitationMode: "PUBLIC" | "AUTHENTICATED";
}
```

#### L15 — interface UpdateIdentityRequest

```ts
export interface UpdateIdentityRequest {
  platformName?: string;
  protocolMask?: string;
}
```

#### L21 — interface UpdateThemeRequest

```ts
export interface UpdateThemeRequest {
  theme: ThemeSection["theme"];
}
```

#### L30 — alias PortalAssetsPatchDto

```ts
export type PortalAssetsPatchDto = PortalAssetsPatch;
```

#### L33 — interface UpdateCategoriesRequest

```ts
export interface UpdateCategoriesRequest {
  categories: CategoriesSection["categories"];
}
```

#### L38 — interface UpdateStatusesRequest

```ts
export interface UpdateStatusesRequest {
  statuses: StatusesSection["statuses"];
}
```

#### L43 — interface UpdatePrioritizationWeightsRequest

```ts
export interface UpdatePrioritizationWeightsRequest {
  prioritizationWeights: PrioritizationWeightsSection["prioritizationWeights"];
}
```

### [src/modules/DTOs/portalConfig/PortalConfigResponse.dto.ts](../src/modules/DTOs/portalConfig/PortalConfigResponse.dto.ts)

#### L2 — alias PortalConfigResponse

```ts
export type PortalConfigResponse = import("../../../shared/types/portalConfig.ts").PortalConfig;
```

### [src/modules/DTOs/prioritization/PrioritizationRequests.dto.ts](../src/modules/DTOs/prioritization/PrioritizationRequests.dto.ts)

#### L4 — interface EvaluatePrioritizationRequest

```ts
export interface EvaluatePrioritizationRequest {
  notes: Record<string, number>;
  justification?: string;
}
```

#### L10 — interface EvaluationSnapshot

```ts
export interface EvaluationSnapshot {
  notes: Record<string, number>;
  score: number;
  classification: Classification;
}
```

### [src/modules/DTOs/prioritization/PrioritizationResponse.dto.ts](../src/modules/DTOs/prioritization/PrioritizationResponse.dto.ts)

#### L4 — interface CriterionResponse

```ts
export interface CriterionResponse {
  id: string;
  name: string;
  weight: number;
}
```

#### L11 — interface ListCriteriaResponse

```ts
export interface ListCriteriaResponse {
  criteria: CriterionResponse[];
}
```

#### L16 — interface EvaluatePrioritizationResponse

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

#### L9 — alias MappingModality

```ts
export type MappingModality = "REMOTE" | "IN_PERSON";
```

#### L16 — interface MappingParticipant

```ts
export interface MappingParticipant {
  id: string | null;
  name: string;
  email: string;
}
```

#### L27 — interface MappingParticipantInput

```ts
export interface MappingParticipantInput {
  id?: string;
  name: string;
  email: string;
}
```

#### L34 — interface MappingValues

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

#### L44 — interface ResolvedParticipant

```ts
export interface ResolvedParticipant {
  userId: number | null;
  name: string;
  email: string;
}
```

#### L59 — interface MappingAssignee

```ts
export interface MappingAssignee {
  id: string;
  userId: string;
  name: string;
  email: string;
  jobTitle: string | null;
}
```

#### L71 — interface MappingResponseDTO

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

#### L99 — interface MappingPayloadDTO

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

#### L117 — interface MappingActor

```ts
export interface MappingActor {
  id: number;
  email: string;
  role: Role;
}
```

### [src/modules/DTOs/queue/queue.dto.ts](../src/modules/DTOs/queue/queue.dto.ts)

#### L7 — interface FindQueueParams

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

#### L4 — alias DashboardSituation

```ts
export type DashboardSituation = "open" | "closed" | "overdue" | "unassigned";
```

#### L11 — alias DashboardPriorityFilter

```ts
export type DashboardPriorityFilter = number | "unassigned";
```

#### L13 — interface DashboardQuery

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

#### L22 — interface DashboardSummary

```ts
export interface DashboardSummary {
  total: number;
  open: number;
  closed: number;
  overdue: number;
  unassigned: number;
}
```

#### L30 — interface DashboardStatusMetric

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

#### L43 — interface DashboardPriorityMetric

```ts
export interface DashboardPriorityMetric {
  id: number | null;
  label: RequestPriority | "Não priorizada";
  count: number;
}
```

#### L49 — interface DashboardFilterOptions

```ts
export interface DashboardFilterOptions {
  statuses: Array<{ id: number; name: string }>;
  categories: Array<{ id: number; name: string }>;
  priorities: Array<{ id: number; label: RequestPriority }>;
}
```

#### L55 — interface DashboardCategoryMetric

```ts
export interface DashboardCategoryMetric {
  id: number;
  name: string;
  count: number;
}
```

#### L61 — interface DashboardTrendPoint

```ts
export interface DashboardTrendPoint {
  period: string;
  count: number;
}
```

#### L66 — interface DashboardResponse

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

#### L1 — interface QueueExportRow

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

#### L16 — interface QueueCsvExport

```ts
export interface QueueCsvExport {
  content: string;
  filename: string;
}
```

### [src/modules/DTOs/requests/RequestInternalDetail.dto.ts](../src/modules/DTOs/requests/RequestInternalDetail.dto.ts)

#### L27 — interface Assignee

```ts
export interface Assignee {
  /** `details_professional.user_id` serializado, ou `null` quando ausente. */
  id: string | null;
  name: string;
  email: string | null;
}
```

#### L34 — interface Prioritization

```ts
export interface Prioritization {
  score: number | null; // 10–50 (RN-007/RN-008, issue #51); null até ser avaliado
  maxScore: 50; // escala normalizada fixa — fonte: prioritization_evaluations
  label: string | null; // classificação RN-008 (ex.: "Alta"); null sem avaliação
}
```

#### L40 — interface Meeting

```ts
export interface Meeting {
  scheduledFor: string;
  link: string | null;
}
```

#### L45 — interface RequestInternalDetailDTO

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

#### L9 — interface CreateRequestPayload

```ts
export interface CreateRequestPayload {
  requester: RequesterBlock;
  demand: DemandBlock;
  operational: OperationalBlock;
  complementary?: ComplementaryBlock;
  schedulePreferences?: SchedulePreferences; // até 3 horários
}
```

#### L20 — interface UpdateRequesterBlock

```ts
export interface UpdateRequesterBlock {
  area: string;
  department?: string;
  manager: string;
  additionalContact?: string;
}
```

#### L30 — interface UpdateInternalRequestPayload

```ts
export interface UpdateInternalRequestPayload {
  requester: UpdateRequesterBlock;
  demand: DemandBlock;
  operational: OperationalBlock;
  complementary?: ComplementaryBlock;
}
```

#### L37 — interface ListRequestsQuery

```ts
export interface ListRequestsQuery {
  email: string;
  status?: string;
  page: number;
  pageSize: number;
}
```

#### L49 — alias ListRequestsInput

```ts
export type ListRequestsInput = Omit<ListRequestsQuery, "email"> & { email?: string };
```

#### L55 — interface UpdateStatusResponse

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

#### L3 — interface RequestDetail

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

#### L26 — interface CreateRequestResponse

```ts
export interface CreateRequestResponse {
  protocol: string; // "MAAT-8K3P-9X2M" — protocolo único de rastreio,
  // não enumerável (FPE/Feistel sobre o ID interno —
  // Especificação 3.0 §5.2)
  status: RequestStatus; // "Solicitação enviada"
  createdAt: string; // ISO datetime
}
```

#### L36 — interface AssigneeSummary

```ts
export interface AssigneeSummary {
  id: string; // professional_id
  name: string; // users.full_name
  email: string; // users.email
  jobTitle: string | null;
  capacity: number;
}
```

#### L44 — interface AssignRequestResponse

```ts
export interface AssignRequestResponse {
  protocol: string;
  assignee: { id: string; name: string; email: string } | null;
  /** Status após a operação — muda para "Aguardando mapeamento" quando a RN-010 dispara. */
  status: RequestStatus;
}
```

### [src/modules/DTOs/requests/RequestTracking.dto.ts](../src/modules/DTOs/requests/RequestTracking.dto.ts)

#### L21 — alias TrackingMode

```ts
export type TrackingMode = "public" | "authenticated";
```

#### L23 — interface Meeting

```ts
export interface Meeting {
  scheduledFor: string;
  link: string | null;
}
```

#### L28 — interface PublicOperationalImpacts

```ts
export interface PublicOperationalImpacts {
  mainRisks: string;
  clientImpact: string;
  operationalImpact: OperationalImpact;
  perceivedCriticality: RequestPriority;
  desiredDeadline: string;
}
```

#### L36 — interface RequesterOperational

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

#### L48 — interface RequesterAttachment

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

#### L57 — interface PublicRequestDetails

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

#### L69 — interface RequesterRequestDetails

```ts
export interface RequesterRequestDetails extends Omit<PublicRequestDetails, "impacts"> {
  operational: RequesterOperational;
  complementary?: ComplementaryBlock;
  schedulePreferences: string[] | null;
  mappingDate: string | null;
  attachments: RequesterAttachment[];
}
```

#### L77 — alias TrackingDetailsResponse

```ts
export type TrackingDetailsResponse =
  | { mode: "public"; details: PublicRequestDetails }
  | { mode: "authenticated"; details: RequesterRequestDetails };
```

### [src/modules/DTOs/users/UpdateProfileRequest.dto.ts](../src/modules/DTOs/users/UpdateProfileRequest.dto.ts)

#### L36 — alias UpdateRequesterBlock

```ts
export type UpdateRequesterBlock = z.infer<typeof updateRequesterSchema>;
```

#### L55 — alias UpdateProfilePayload

```ts
export type UpdateProfilePayload = z.infer<typeof updateProfileSchema>;
```

### [src/modules/DTOs/users/UserProfileResponse.dto.ts](../src/modules/DTOs/users/UserProfileResponse.dto.ts)

#### L4 — interface UserProfileResponseDTO

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

#### L15 — interface RequesterProfileBlock

```ts
export interface RequesterProfileBlock {
  area: string | null;
  department: string | null;
  manager: string | null;
  additionalContact: string | null;
}
```

#### L23 — interface ProfessionalProfileBlock

```ts
export interface ProfessionalProfileBlock {
  jobTitle: string | null;
  specialties: string[];
  attendedCategoryIds: number[];
  notes: string | null;
}
```

### [src/modules/DTOs/users/UserRequests.dto.ts](../src/modules/DTOs/users/UserRequests.dto.ts)

#### L3 — interface CreateProfessionalInput

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

#### L13 — interface RequesterInput

```ts
export interface RequesterInput {
  area: string;
  department?: string;
  manager: string;
  additionalContact?: string | null;
}
```

#### L20 — interface CreateUserRequest

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

#### L30 — interface UpdateUserRequest

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

#### L43 — interface ListUsersQuery

```ts
export interface ListUsersQuery {
  profile?: ProfileName;
  search?: string;
  page: number;
  pageSize: number;
}
```

#### L50 — interface ChangeUserStatusRequest

```ts
export interface ChangeUserStatusRequest {
  isActive: boolean;
}
```

### [src/modules/DTOs/users/UserResponse.dto.ts](../src/modules/DTOs/users/UserResponse.dto.ts)

#### L4 — interface UserSummary

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

#### L15 — interface AssignAnalyst

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

#### L26 — alias Analyst

```ts
export type Analyst = AssignAnalyst;
```

#### L28 — interface CreateUserResponse

```ts
export interface CreateUserResponse extends Omit<UserSummary, "profile" | "avatarUrl"> {
  /** Vocabulário de exibição — capitalizado (ex.: "Analista"). */
  role: Role;
  /** Exibida uma única vez — não recuperável depois. */
  temporaryPassword: string;
}
```

#### L35 — interface ResetPasswordResponse

```ts
export interface ResetPasswordResponse {
  id: string;
  temporaryPassword: string;
}
```

#### L40 — interface ChangeUserStatusResponse

```ts
export interface ChangeUserStatusResponse {
  id: string;
  isActive: boolean;
}
```

### [src/modules/internalNotes/internalNotes.repository.ts](../src/modules/internalNotes/internalNotes.repository.ts)

#### L15 — interface RequestIdentityRow

```ts
interface RequestIdentityRow {
  request_id: string;
}
```

#### L156 — alias MappingHistoryBaseRow

```ts
type MappingHistoryBaseRow = Omit<MappingHistoryRow, "participants" | "mappingAssignee">;
```

### [src/modules/internalNotes/internalNotes.schema.ts](../src/modules/internalNotes/internalNotes.schema.ts)

#### L35 — alias TimelineCursorPayload

```ts
export type TimelineCursorPayload = z.infer<typeof cursorPayloadSchema>;
```

#### L70 — alias ListTimelineQuery

```ts
export type ListTimelineQuery = z.infer<typeof listTimelineQuerySchema>;
```

### [src/modules/internalNotes/internalNotes.service.ts](../src/modules/internalNotes/internalNotes.service.ts)

#### L68 — interface TimelineEntry

```ts
interface TimelineEntry {
  item: TimelineItem;
  timeMs: number;
  rank: number;
  id: bigint;
}
```

#### L166 — interface ActorSource

```ts
interface ActorSource {
  actor_user_id: number | null;
  actor_name: string | null;
  actor_profile_name: string | null;
}
```

### [src/modules/pendingItems/pendingItems.repository.ts](../src/modules/pendingItems/pendingItems.repository.ts)

#### L8 — interface RequestRef

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

#### L239 — alias PendingItemInsert

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

#### L252 — alias RespondFacts

```ts
export type RespondFacts = {
  requestedRemaining: number;
  attachmentSatisfied: boolean;
  currentStatusName: string;
};
```

#### L258 — alias ReviewDecisionInput

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

#### L268 — alias ReviewFacts

```ts
export type ReviewFacts = { hasReopen: boolean };
```

#### L270 — alias SavedPendingAttachment

```ts
export type SavedPendingAttachment = {
  fileName: string;
  mimeType: string;
  sizeBytes: number;
  storageKey: string;
};
```

### [src/modules/pendingItems/pendingItems.schema.ts](../src/modules/pendingItems/pendingItems.schema.ts)

#### L61 — alias CreatePendingItemsInput

```ts
export type CreatePendingItemsInput = z.infer<typeof createPendingItemsSchema>;
```

#### L62 — alias VerifyInput

```ts
export type VerifyInput = z.infer<typeof verifySchema>;
```

#### L63 — alias ReviewInput

```ts
export type ReviewInput = z.infer<typeof reviewSchema>;
```

### [src/modules/pendingItems/pendingItems.service.ts](../src/modules/pendingItems/pendingItems.service.ts)

#### L188 — alias PendingCaller

```ts
export type PendingCaller = {
  user?: AuthenticatedUser;
  requesterIdentity?: { name: string; email: string } | null;
};
```

### [src/modules/portalConfig/portalConfig.mappers.ts](../src/modules/portalConfig/portalConfig.mappers.ts)

#### L29 — alias Palette

```ts
type Palette = "light" | "dark";
```

### [src/modules/portalConfig/portalConfig.repository.ts](../src/modules/portalConfig/portalConfig.repository.ts)

#### L67 — interface CriteriaRow

```ts
interface CriteriaRow {
  criterion_id: string;
  weight: number;
}
```

### [src/modules/prioritization/prioritization.service.ts](../src/modules/prioritization/prioritization.service.ts)

#### L33 — interface Actor

```ts
interface Actor {
  id: number;
  role: string;
}
```

### [src/modules/queue/mapping.repository.ts](../src/modules/queue/mapping.repository.ts)

#### L17 — interface MappingRow

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

#### L41 — interface MappingParticipantRow

```ts
export interface MappingParticipantRow {
  userId: number | null;
  name: string;
  email: string;
}
```

#### L48 — interface MappingRequestContext

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

#### L64 — interface MappingAssigneeCandidate

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

#### L118 — interface MappingTargetRow

```ts
export interface MappingTargetRow {
  status_id: number;
  name: string;
  isPublic: boolean;
}
```

### [src/modules/queue/mapping.schemas.ts](../src/modules/queue/mapping.schemas.ts)

#### L121 — alias MappingPayload

```ts
export type MappingPayload = z.infer<typeof mappingPayloadSchema>;
```

### [src/modules/queue/queue.filters.ts](../src/modules/queue/queue.filters.ts)

#### L4 — interface QueueRepositoryFilters

```ts
export interface QueueRepositoryFilters extends QueueFilterQuery {
  scopedUserId?: number;
}
```

### [src/modules/reports/reports.repository.ts](../src/modules/reports/reports.repository.ts)

#### L14 — interface DashboardSummaryRow

```ts
interface DashboardSummaryRow {
  total: number | string;
  open: number | string;
  closed: number | string;
  overdue: number | string;
  unassigned: number | string;
}
```

#### L22 — interface DashboardStatusRow

```ts
interface DashboardStatusRow {
  id: number | string;
  name: string;
  count: number | string;
  tone: string;
  closesRequest: boolean;
}
```

#### L30 — interface DashboardPriorityRow

```ts
interface DashboardPriorityRow {
  id: number | string | null;
  label: string;
  count: number | string;
}
```

#### L36 — interface DashboardCategoryRow

```ts
interface DashboardCategoryRow {
  id: number | string;
  name: string;
  count: number | string;
}
```

#### L42 — interface DashboardTrendRow

```ts
interface DashboardTrendRow {
  period: string;
  count: number | string;
}
```

#### L47 — interface DashboardStatusOptionRow

```ts
interface DashboardStatusOptionRow {
  id: number | string;
  name: string;
}
```

#### L52 — interface DashboardCategoryOptionRow

```ts
interface DashboardCategoryOptionRow {
  id: number | string;
  name: string;
}
```

#### L57 — interface DashboardPriorityOptionRow

```ts
interface DashboardPriorityOptionRow {
  id: number | string;
  label: string;
}
```

#### L62 — interface DashboardFilterOptionRows

```ts
export interface DashboardFilterOptionRows {
  statuses: DashboardStatusOptionRow[];
  categories: DashboardCategoryOptionRow[];
  priorities: DashboardPriorityOptionRow[];
}
```

### [src/modules/requests/requests.repository.ts](../src/modules/requests/requests.repository.ts)

#### L40 — interface YesNoDetailColumns

```ts
interface YesNoDetailColumns {
  flag: boolean | null;
  detail: string | null;
}
```

#### L155 — interface RequestInsertReturning

```ts
interface RequestInsertReturning {
  request_id: string;
  protocol: string;
  created_at: Date;
}
```

#### L345 — interface RequestSummaryRow

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

#### L425 — interface RequestWithOwner

```ts
export interface RequestWithOwner {
  detail: RequestDetail;
  requesterEmail: string;
}
```

#### L497 — interface RequestAttachmentRow

```ts
export interface RequestAttachmentRow {
  attachment_id: string;
  file_name: string;
  content_type: string;
  size_bytes: string; // bigint do pg
}
```

#### L505 — interface SchedulePreferenceRow

```ts
export interface SchedulePreferenceRow {
  scheduled_for: Date | string;
}
```

#### L817 — interface RequestStatusContext

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

#### L831 — interface RequestStatusTarget

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

#### L150 — alias UpdateRequestPayload

```ts
export type UpdateRequestPayload = z.infer<typeof updateRequestPayloadSchema>;
```

#### L181 — alias AssignRequestPayload

```ts
export type AssignRequestPayload = z.infer<typeof assignRequestSchema>;
```

#### L204 — alias AssignAnalystPayload

```ts
export type AssignAnalystPayload = z.infer<typeof assignAnalystSchema>;
```

#### L223 — alias UpdateStatusPayload

```ts
export type UpdateStatusPayload = z.infer<typeof updateStatusSchema>;
```

### [src/modules/requests/requests.service.ts](../src/modules/requests/requests.service.ts)

#### L61 — interface AuthenticatedIdentity

```ts
interface AuthenticatedIdentity {
  fullName: string;
  email: string;
}
```

#### L417 — interface TrackingCaller

```ts
export interface TrackingCaller {
  user?: AuthenticatedUser;
  requesterIdentity?: { name: string; email: string } | null;
}
```

### [src/modules/requests/statusTransition.ts](../src/modules/requests/statusTransition.ts)

#### L4 — interface StatusTransitionTarget

```ts
export interface StatusTransitionTarget {
  status_id: number;
  name: string;
  isPublic: boolean;
}
```

#### L10 — interface StatusTransitionInput

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

#### L7 — interface StatusRow

```ts
interface StatusRow {
  status_id: number;
  name: string;
  isPublic: boolean;
}
```

#### L13 — interface CategoryRow

```ts
interface CategoryRow {
  category_id: number;
  name: string;
}
```

#### L18 — interface RequestContextRow

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

#### L50 — interface TriageRow

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

#### L220 — interface TriageAuditContext

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

#### L3 — interface TriageAssignee

```ts
export interface TriageAssignee {
  id: string | null;
  name: string | null;
  email: string | null;
}
```

#### L9 — interface TriageAssessment

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

#### L26 — alias CreateTriagePayload

```ts
export type CreateTriagePayload = Omit<
  TriageAssessment,
  "id" | "assignee" | "lastTechnicalMessage"
> & {
  lastTechnicalMessage?: string | null;
};
```

### [src/modules/requests/triage/triage.service.ts](../src/modules/requests/triage/triage.service.ts)

#### L9 — interface Actor

```ts
interface Actor {
  id: number;
  email: string;
  name: string;
  role: string;
}
```

### [src/modules/users/users.repository.ts](../src/modules/users/users.repository.ts)

#### L15 — interface UserSummaryRow

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

#### L180 — interface UserProfileRow

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

#### L485 — interface AnalystRow

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

#### L60 — alias AuditEntityType

```ts
export type AuditEntityType = keyof typeof auditCatalog;
```

#### L63 — alias AuditEntityName

```ts
export type AuditEntityName = AuditEntityType;
```

#### L81 — alias ChangeOrigin

```ts
export type ChangeOrigin = (typeof CHANGE_ORIGINS)[number];
```

#### L84 — alias AuditActionOf

```ts
export type AuditActionOf<E extends AuditEntityName> = (typeof auditCatalog)[E]["actions"][number];
```

#### L87 — alias ComposedAuditAction

```ts
export type ComposedAuditAction<E extends AuditEntityName> = `${E}.${AuditActionOf<E>}`;
```

### [src/shared/audit/auditLogger.ts](../src/shared/audit/auditLogger.ts)

#### L12 — interface AuditEntryBase

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

#### L33 — alias AuditEntry

```ts
export type AuditEntry<
  E extends AuditEntityName = AuditEntityName,
  A extends ComposedAuditAction<E> = ComposedAuditAction<E>,
> = AuditEntryBase & { entityType: E; actionType: A };
```

### [src/shared/catalog/fieldCatalog.ts](../src/shared/catalog/fieldCatalog.ts)

#### L42 — alias FieldKey

```ts
export type FieldKey = (typeof FIELD_KEYS)[number];
```

### [src/shared/errors/AppError.ts](../src/shared/errors/AppError.ts)

#### L1 — class AppError

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

#### L10 — class ValidationError

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

#### L1 — alias RateLimitOptions

```ts
type RateLimitOptions = {
  windowMs: number;
  limit: number;
  keyGenerator?: (key: string) => string;
};
```

### [src/shared/storage/fileStorage.ts](../src/shared/storage/fileStorage.ts)

#### L6 — interface SavedAttachment

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

#### L4 — alias InternalRole

```ts
export type InternalRole = Exclude<Role, "Solicitante">;
```

#### L6 — interface InternalNoteRow

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

#### L16 — interface InternalNoteReadStateRow

```ts
export interface InternalNoteReadStateRow {
  request_id: string;
  user_id: number;
  last_read_note_id: string;
  read_at: Date;
}
```

#### L23 — alias TimelineEventAction

```ts
export type TimelineEventAction =
  | "request.assign"
  | "request.reassign"
  | "request.unassign"
  | "request.status_change"
  | "mapping.assign";
```

#### L37 — alias AuditTimelineAction

```ts
export type AuditTimelineAction = TimelineEventAction | "request.override_status_admin";
```

#### L43 — alias TimelineChangeOrigin

```ts
export type TimelineChangeOrigin = Extract<ChangeOrigin, "admin" | "system" | "internal"> | null;
```

#### L45 — interface TimelineCursor

```ts
export interface TimelineCursor {
  t: Date;
  type: "note" | "event";
  id: string;
}
```

#### L51 — interface TimelineEventRow

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

#### L68 — interface TriageHistoryRow

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

#### L89 — interface MappingHistoryParticipant

```ts
export interface MappingHistoryParticipant {
  userId: number | null;
  name: string;
  email: string;
}
```

#### L96 — interface MappingHistoryAssignee

```ts
export interface MappingHistoryAssignee {
  id: string;
  userId: number;
  name: string;
  email: string;
  jobTitle: string | null;
}
```

#### L105 — interface MappingHistoryRow

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

#### L1 — interface PaginatedResponse

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

#### L8 — alias PendencyStatus

```ts
export type PendencyStatus = "requested" | "responded" | "validated";
```

#### L10 — alias PendingItemType

```ts
export type PendingItemType = "field_edit" | "observation";
```

#### L12 — alias PendingFieldValue

```ts
export type PendingFieldValue = string | number | boolean | null;
```

#### L14 — interface PendingFieldRef

```ts
export interface PendingFieldRef {
  fieldKey: string;
  /** Rótulo do catálogo (`fieldCatalog`) — ex.: "Nome completo". */
  fieldLabel: string;
  currentValue: PendingFieldValue;
}
```

#### L21 — interface InternalAttachment

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

#### L30 — interface UnreadState

```ts
export interface UnreadState {
  count: number;
  hasUnread: boolean;
  lastUnreadAt: string | null;
}
```

#### L36 — interface CorrectionAlert

```ts
export interface CorrectionAlert {
  count: number;
  batchId: string;
}
```

#### L41 — interface PendingSummary

```ts
export interface PendingSummary {
  total: number;
  requested: number;
  responded: number;
  validated: number;
}
```

### [src/shared/types/portalConfig.ts](../src/shared/types/portalConfig.ts)

#### L14 — alias SolicitationMode

```ts
export type SolicitationMode = "PUBLIC" | "AUTHENTICATED";
```

#### L19 — interface PortalAssets

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

#### L44 — alias AssetKey

```ts
export type AssetKey = (typeof ASSET_KEYS)[number];
```

#### L48 — alias PortalAssetsPatch

```ts
export type PortalAssetsPatch = Partial<Record<AssetKey, string>> & {
  logoUsePrimaryColor?: boolean;
};
```

#### L73 — alias ThemeTokenKey

```ts
export type ThemeTokenKey = (typeof THEME_TOKEN_KEYS)[number];
```

#### L77 — interface StatusToneTokens

```ts
export interface StatusToneTokens {
  color: string;
  background: string;
  backgroundLocked: boolean;
}
```

#### L84 — interface ThemeGradient

```ts
export interface ThemeGradient {
  from: string; // hex #RRGGBB / #RRGGBBAA
  to: string; // hex #RRGGBB / #RRGGBBAA
  angle?: number; // graus 0..360 (default 143 quando ausente)
}
```

#### L93 — interface ThemeTokens

```ts
export interface ThemeTokens extends Record<ThemeTokenKey, string> {
  gradient: ThemeGradient;
  statuses: Record<StatusTone, StatusToneTokens>;
}
```

#### L99 — interface PortalTheme

```ts
export interface PortalTheme {
  light: ThemeTokens;
  dark: ThemeTokens;
}
```

#### L107 — interface PortalCategory

```ts
export interface PortalCategory {
  id: number;
  name: string;
  description: string;
  isActive: boolean;
}
```

#### L121 — alias StatusMode

```ts
export type StatusMode = "none" | "free" | "conclusion_only";
```

#### L137 — interface PortalStatus

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

#### L164 — alias PrioritizationCriterion

```ts
export type PrioritizationCriterion = (typeof PRIORITIZATION_CRITERIA)[number];
```

#### L169 — alias PrioritizationWeights

```ts
export type PrioritizationWeights = Record<PrioritizationCriterion, number>;
```

#### L172 — interface PortalConfig

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

#### L183 — alias AccessSection

```ts
export type AccessSection = Pick<PortalConfig, "solicitationMode">;
```

#### L184 — alias IdentitySection

```ts
export type IdentitySection = Pick<PortalConfig, "platformName" | "protocolMask">;
```

#### L185 — alias ThemeSection

```ts
export type ThemeSection = Pick<PortalConfig, "theme">;
```

#### L186 — alias AssetsSection

```ts
export type AssetsSection = Pick<PortalConfig, "assets">;
```

#### L187 — alias CategoriesSection

```ts
export type CategoriesSection = Pick<PortalConfig, "categories">;
```

#### L188 — alias StatusesSection

```ts
export type StatusesSection = Pick<PortalConfig, "statuses">;
```

#### L189 — alias PrioritizationWeightsSection

```ts
export type PrioritizationWeightsSection = Pick<PortalConfig, "prioritizationWeights">;
```

#### L192 — interface CategoryRow

```ts
export interface CategoryRow {
  category_id: number;
  name: string;
  description: string | null;
  status: "active" | "inactive";
  display_order: number | null;
}
```

#### L201 — interface StatusRow

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

#### L2 — interface CriterionRow

```ts
export interface CriterionRow {
  criterion_id: string;
  name: string;
  weight: number;
  active: boolean;
  display_order: number;
}
```

#### L17 — alias Classification

```ts
export type Classification = RequestPriority;
```

#### L20 — interface PriorityRangeRow

```ts
export interface PriorityRangeRow {
  priority_id: number;
  level: Classification;
  min_score: number;
  max_score: number;
}
```

#### L28 — interface EvaluationRow

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

#### L4 — interface RequestSummary

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

#### L14 — interface QueueMetricsResponse

```ts
export interface QueueMetricsResponse {
  totalRequests: number;
  unassignedRequests: number;
  inProgressRequests: number;
  overdueRequests: number;
}
```

#### L21 — alias QueuePriorityFilter

```ts
export type QueuePriorityFilter = RequestPriority | "nenhum";
```

#### L24 — interface QueueFilterQuery

```ts
export interface QueueFilterQuery {
  search?: string;
  status?: RequestStatus;
  priority?: QueuePriorityFilter;
  assigneeId?: string | "unassigned";
  unassigned?: boolean;
}
```

#### L33 — interface QueueQuery

```ts
export interface QueueQuery extends QueueFilterQuery {
  page: number;
  pageSize: number;
}
```

#### L38 — interface QueueAssignee

```ts
export interface QueueAssignee {
  id: string;
  name: string;
}
```

#### L43 — interface QueueItem

```ts
export interface QueueItem extends RequestSummary {
  requesterEmail: string;
  assigneeId: string | null;
}
```

#### L48 — interface QueueResponse

```ts
export interface QueueResponse extends PaginatedResponse<QueueItem> {
  assignees: QueueAssignee[];
}
```

### [src/shared/types/requests.ts](../src/shared/types/requests.ts)

#### L7 — alias RequestStatus

```ts
export type RequestStatus = string;
```

#### L12 — alias RequestPriority

```ts
export type RequestPriority = (typeof REQUEST_PRIORITIES)[number];
```

#### L23 — alias TriageResult

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

#### L32 — alias OperationalImpact

```ts
export type OperationalImpact = "Baixo" | "Médio" | "Alto" | "Crítico";
```

#### L34 — alias YesNoDetail

```ts
export type YesNoDetail = false | string;
```

#### L44 — alias RequestCategoryName

```ts
export type RequestCategoryName = string;
```

#### L46 — interface AttachmentMetadata

```ts
export interface AttachmentMetadata {
  fileName: string; // nome original do arquivo — máx. 255
  mimeType: string; // PDF, DOCX, XLSX, PNG ou JPG
  sizeBytes: number; // máximo 10 * 1024 * 1024 (10MB)
}
```

#### L52 — interface RequesterBlock

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

#### L63 — interface DemandBlock

```ts
export interface DemandBlock {
  title: string; // obrigatório — título resumido, máx. 150
  requestType: string; // obrigatório — Tipo de Solicitação (modalidade macro,
  // ex.: Automação, Manutenção, Nova Demanda), máx. 80
  category: string; // obrigatório — Categoria da Demanda (validada contra o
  // cadastro ativo de `categories`), máx. 80
  processName: string; // obrigatório — nome formal do processo atual, máx. 150
  description: string; // obrigatório — Descrição da Necessidade, máx. 4.000
  problem: string; // obrigatório — Problema ou Oportunidade Identificada, máx. 4.000
  expectedResult: string; // obrigatório — Resultado Esperado, máx. 4.000
  justification: string; // obrigatório — Justificativa da Solicitação, máx. 4.000
}
```

#### L76 — interface OperationalBlock

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

#### L94 — interface ComplementaryBlock

```ts
export interface ComplementaryBlock {
  hasProcessDocumentation?: YesNoDetail; // existência de documentação do processo (+ links)
  hasSimilarSolution?: YesNoDetail; // existência de solução semelhante
  dependsOnOtherAreas?: YesNoDetail; // dependência de outras áreas (+ quais)
  handlesRestrictedInfo?: YesNoDetail; // tratamento de informações restritas (LGPD/sigilo)
  additionalNotes?: string; // observações adicionais, máx. 2.000
}
```

#### L102 — alias SchedulePreferences

```ts
export type SchedulePreferences = string[];
```

#### L104 — interface RequesterTable

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

#### L116 — interface AssignmentContextRow

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

#### L129 — interface AssignmentCandidateRow

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

#### L150 — interface InternalRequestRow

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

#### L3 — alias Role

```ts
export type Role = (typeof ROLES)[number];
```

#### L12 — alias ProfileName

```ts
export type ProfileName = string;
```

### [src/shared/types/status.ts](../src/shared/types/status.ts)

#### L20 — alias StatusId

```ts
export type StatusId = (typeof STATUS_IDS)[keyof typeof STATUS_IDS];
```

### [src/shared/types/systemSettings.ts](../src/shared/types/systemSettings.ts)

#### L2 — alias PortalSolicitationMode

```ts
export type PortalSolicitationMode = "PUBLIC" | "AUTHENTICATED";
```

#### L18 — interface SystemSettingsRow

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

#### L3 — alias StatusTone

```ts
export type StatusTone = (typeof STATUS_TONES)[number];
```

#### L21 — alias ThemeTokenKey

```ts
export type ThemeTokenKey = (typeof THEME_TOKEN_KEYS)[number];
```

#### L24 — alias ThemePalette

```ts
export type ThemePalette = "light" | "dark";
```

#### L36 — interface SystemThemeRow

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

#### L3 — interface User

```ts
export interface User {
  id: string;
  email: string;
  name: string;
  password: string;
  role: Role;
}
```

#### L11 — alias AuthenticatedUser

```ts
export type AuthenticatedUser = Omit<User, "password">;
```

#### L14 — interface UserRow

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

#### L29 — interface AuthUserRow

```ts
export interface AuthUserRow extends UserRow {
  profile_name: string;
  profile_is_active: boolean;
}
```

#### L35 — interface UserMetricsResponse

```ts
export interface UserMetricsResponse {
  total: number;
  active: number;
  pending: number;
  admins: number;
}
```

### [src/shared/utils/jwtUtil.ts](../src/shared/utils/jwtUtil.ts)

#### L9 — alias TokenScope

```ts
export type TokenScope = "session" | "change_password";
```

#### L11 — interface TokenPayload

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

#### L23 — interface GroupedIssues

```ts
interface GroupedIssues {
  missing: ZodError["issues"][number][];
  invalid: ZodError["issues"][number][];
}
```

## 2. Declarações sem anotação explícita

### [src/app.ts](../src/app.ts)

- L10 — variável: `app`

### [src/configs.ts](../src/configs.ts)

- L1 — variável: `NODE_ENV`
- L4 — variável: `key`
- L14 — variável: `Config`
- L19 — parâmetro: `s`
- L19 — retorno da função: `<anônima>()`
- L30 — variável: `num`
- L31 — variável: `unit`

### [src/database/conection.ts](../src/database/conection.ts)

- L5 — variável: `db`

### [src/docs/components/security.ts](../src/docs/components/security.ts)

- L1 — variável: `securitySchemes`

### [src/docs/openapi.ts](../src/docs/openapi.ts)

- L1 — variável: `openapiBase`

### [src/docs/paths/index.ts](../src/docs/paths/index.ts)

- L12 — variável: `paths`

### [src/docs/schemas/auth.ts](../src/docs/schemas/auth.ts)

- L1 — variável: `AuthenticatedUser`
- L18 — variável: `LoginRequest`
- L27 — variável: `LoginResponse`
- L40 — variável: `LogoutResponse`
- L48 — variável: `ChangePasswordRequest`
- L58 — variável: `ChangePasswordResponse`

### [src/docs/schemas/common.ts](../src/docs/schemas/common.ts)

- L1 — variável: `ErrorResponse`
- L11 — variável: `ValidationErrorResponse`

### [src/docs/schemas/index.ts](../src/docs/schemas/index.ts)

- L90 — variável: `schemas`

### [src/docs/schemas/mapping.ts](../src/docs/schemas/mapping.ts)

- L1 — variável: `MappingResponse`

### [src/docs/schemas/pendingItems.ts](../src/docs/schemas/pendingItems.ts)

- L1 — variável: `ReviewDecisionValidate`
- L11 — variável: `ReviewDecisionReopen`

### [src/docs/schemas/portal.ts](../src/docs/schemas/portal.ts)

- L5 — variável: `StatusToneTokens`
- L23 — variável: `ThemeGradient`
- L37 — variável: `ThemeTokens`
- L96 — variável: `PortalTheme`
- L109 — variável: `PortalAssets`
- L139 — variável: `PortalCategory`
- L154 — variável: `PortalStatus`
- L190 — variável: `PrioritizationWeights`
- L222 — variável: `PortalConfig`
- L256 — variável: `PortalAccessPatchBody`
- L268 — variável: `PortalIdentityPatchBody`
- L281 — variável: `PortalThemePatchBody`
- L289 — variável: `PortalCategoriesPatchBody`
- L302 — variável: `PortalStatusesPatchBody`
- L315 — variável: `PortalPrioritizationWeightsPatchBody`

### [src/docs/schemas/prioritization.ts](../src/docs/schemas/prioritization.ts)

- L1 — variável: `PrioritizationCriteria`

### [src/docs/schemas/queue.ts](../src/docs/schemas/queue.ts)

- L1 — variável: `QueueMetrics`
- L12 — variável: `QueueItem`
- L37 — variável: `QueueResponse`

### [src/docs/schemas/request.ts](../src/docs/schemas/request.ts)

- L1 — variável: `RequestSummary`
- L13 — variável: `RequestDetail`

### [src/docs/schemas/triage.ts](../src/docs/schemas/triage.ts)

- L1 — variável: `TriagemResponse`

### [src/docs/schemas/user.ts](../src/docs/schemas/user.ts)

- L1 — variável: `UserMetrics`
- L12 — variável: `UserListItem`
- L25 — variável: `RequesterProfileBlock`
- L36 — variável: `ProfessionalProfileBlock`
- L47 — variável: `UserProfileResponse`

### [src/docs/swagger.ts](../src/docs/swagger.ts)

- L30 — variável: `openapiSpec`
- L39 — variável: `swaggerOptions`
- L48 — retorno da função: `<anônima>()`
- L61 — parâmetro: `_req`
- L61 — parâmetro: `res`
- L61 — retorno da função: `<anônima>()`

### [src/modules/auditHistory/auditHistory.controller.ts](../src/modules/auditHistory/auditHistory.controller.ts)

- L12 — variável: `parsed`
- L25 — variável: `id`
- L31 — variável: `detail`
- L43 — variável: `protocol`
- L48 — variável: `logs`

### [src/modules/auditHistory/auditHistory.repository.ts](../src/modules/auditHistory/auditHistory.repository.ts)

- L36 — variável: `query`
- L52 — variável: `totalRow`
- L53 — parâmetro: `builder`
- L53 — retorno da função: `<anônima>()`
- L60 — variável: `total`
- L62 — variável: `page`
- L63 — variável: `limit`
- L64 — variável: `offset`
- L65 — variável: `items`
- L123 — parâmetro: `rows`
- L123 — retorno da função: `<anônima>()`

### [src/modules/auditHistory/auditHistory.router.ts](../src/modules/auditHistory/auditHistory.router.ts)

- L10 — variável: `auditHistoryRoutes`
- L14 — parâmetro: `_req`
- L14 — parâmetro: `next`
- L14 — parâmetro: `res`
- L14 — retorno da função: `<anônima>()`
- L38 — variável: `auditLogsRouter`

### [src/modules/auditHistory/auditHistory.schema.ts](../src/modules/auditHistory/auditHistory.schema.ts)

- L5 — variável: `optionalPositiveInt`
- L9 — variável: `auditEntityNames`
- L11 — variável: `auditHistoryQuerySchema`
- L18 — parâmetro: `query`
- L18 — retorno da função: `<anônima>()`
- L22 — parâmetro: `query`
- L22 — retorno da função: `<anônima>()`
- L26 — parâmetro: `query`
- L26 — retorno da função: `<anônima>()`
- L30 — parâmetro: `query`
- L30 — retorno da função: `<anônima>()`

### [src/modules/auditHistory/auditHistory.service.ts](../src/modules/auditHistory/auditHistory.service.ts)

- L21 — variável: `{ items, total }`
- L23 — parâmetro: `row`
- L23 — retorno da função: `<anônima>()`
- L49 — variável: `occurredAt`
- L51 — variável: `userId`
- L73 — variável: `row`
- L89 — variável: `normalized`
- L90 — variável: `isManagerLike`
- L92 — variável: `request`
- L106 — variável: `isAssignee`
- L108 — variável: `isMappingAssignee`
- L120 — variável: `rows`
- L121 — parâmetro: `row`
- L121 — retorno da função: `<anônima>()`

### [src/modules/auth/auth.controller.ts](../src/modules/auth/auth.controller.ts)

- L12 — variável: `COOKIE_OPTIONS`
- L26 — retorno da função: `<anônima>()`
- L26 — variável: `logout`
- L31 — retorno da função: `<anônima>()`
- L31 — variável: `authenticate`
- L32 — variável: `parsed`
- L38 — variável: `foundUser`
- L41 — variável: `changeToken`
- L64 — variável: `sessionToken`
- L87 — retorno da função: `<anônima>()`
- L87 — variável: `me`
- L88 — variável: `userId`
- L89 — variável: `sessionUser`
- L103 — retorno da função: `<anônima>()`
- L103 — variável: `changePassword`
- L104 — variável: `parsed`
- L110 — variável: `userId`
- L111 — variável: `updated`
- L113 — variável: `sessionToken`

### [src/modules/auth/auth.repository.ts](../src/modules/auth/auth.repository.ts)

- L6 — retorno da função: `authUserQuery()`
- L77 — variável: `updated`
- L87 — variável: `passwordChangedAt`

### [src/modules/auth/auth.router.ts](../src/modules/auth/auth.router.ts)

- L2 — variável: `authRoutes`

### [src/modules/auth/auth.schema.ts](../src/modules/auth/auth.schema.ts)

- L4 — variável: `maxPasswordBytes`
- L7 — parâmetro: `value`
- L7 — retorno da função: `<anônima>()`
- L9 — variável: `loginSchema`
- L14 — variável: `changePasswordSchema`
- L20 — parâmetro: `data`
- L20 — retorno da função: `<anônima>()`
- L24 — parâmetro: `data`
- L24 — retorno da função: `<anônima>()`

### [src/modules/auth/auth.service.ts](../src/modules/auth/auth.service.ts)

- L24 — variável: `DUMMY_PASSWORD_HASH`
- L27 — variável: `email`
- L29 — variável: `user`
- L45 — variável: `isPasswordValid`
- L64 — variável: `user`
- L86 — variável: `user`
- L96 — variável: `isCurrentPasswordValid`
- L102 — variável: `isSamePassword`
- L108 — variável: `newPasswordHash`
- L112 — parâmetro: `trx`
- L112 — retorno da função: `<anônima>()`
- L112 — variável: `{ password_changed_at }`
- L113 — variável: `result`

### [src/modules/DTOs/users/UpdateProfileRequest.dto.ts](../src/modules/DTOs/users/UpdateProfileRequest.dto.ts)

- L15 — variável: `updateRequesterSelfSchema`
- L29 — variável: `updateRequesterSchema`
- L47 — variável: `updateProfileSchema`

### [src/modules/internalNotes/internalNotes.controller.ts](../src/modules/internalNotes/internalNotes.controller.ts)

- L14 — variável: `parsed`
- L26 — variável: `userId`
- L38 — variável: `listInternalNotes`
- L39 — variável: `parsed`
- L44 — variável: `actor`
- L45 — variável: `response`
- L53 — variável: `createInternalNote`
- L54 — variável: `parsed`
- L59 — variável: `response`
- L67 — variável: `markInternalNotesRead`
- L68 — variável: `parsed`
- L73 — variável: `actor`

### [src/modules/internalNotes/internalNotes.repository.ts](../src/modules/internalNotes/internalNotes.repository.ts)

- L30 — variável: `MAPPING_RECORD_ACTIONS`
- L32 — variável: `NOTE_COLUMNS`
- L53 — variável: `query`
- L59 — parâmetro: `builder`
- L59 — retorno da função: `<anônima>()`
- L60 — parâmetro: `nested`
- L60 — retorno da função: `<anônima>()`
- L84 — variável: `query`
- L87 — parâmetro: `scope`
- L87 — retorno da função: `<anônima>()`
- L89 — parâmetro: `requestScope`
- L89 — retorno da função: `<anônima>()`
- L95 — parâmetro: `mappingScope`
- L95 — retorno da função: `<anônima>()`
- L108 — variável: `auditId`
- L109 — parâmetro: `builder`
- L109 — retorno da função: `<anônima>()`
- L110 — parâmetro: `nested`
- L110 — retorno da função: `<anônima>()`
- L143 — variável: `query`
- L151 — variável: `row`
- L158 — variável: `TRIAGE_HISTORY_COLUMNS`
- L205 — variável: `latestAudit`
- L214 — variável: `rows`
- L216 — retorno da função: `<anônima>()`
- L242 — parâmetro: `row`
- L242 — retorno da função: `<anônima>()`
- L242 — variável: `mappingIds`
- L243 — variável: `professionalIds`
- L244 — parâmetro: `id`
- L244 — parâmetro: `row`
- L244 — retorno da função: `<anônima>()`
- L247 — variável: `[participantRows, assigneeRows]`
- L274 — variável: `participantsByMapping`
- L275 — variável: `participant`
- L276 — variável: `list`
- L285 — parâmetro: `assignee`
- L285 — retorno da função: `<anônima>()`
- L285 — variável: `assigneeById`
- L287 — parâmetro: `row`
- L287 — retorno da função: `<anônima>()`
- L304 — parâmetro: `row`
- L304 — retorno da função: `<anônima>()`
- L312 — variável: `rows`
- L316 — parâmetro: `row`
- L316 — retorno da função: `<anônima>()`
- L333 — parâmetro: `row`
- L333 — retorno da função: `<anônima>()`
- L350 — variável: `rows`
- L359 — variável: `row`

### [src/modules/internalNotes/internalNotes.router.ts](../src/modules/internalNotes/internalNotes.router.ts)

- L10 — variável: `internalNotesRoutes`

### [src/modules/internalNotes/internalNotes.schema.ts](../src/modules/internalNotes/internalNotes.schema.ts)

- L3 — variável: `protocolParamsSchema`
- L7 — variável: `createInternalNoteSchema`
- L15 — variável: `markInternalNotesReadSchema`
- L22 — variável: `cursorPayloadSchema`
- L28 — parâmetro: `ctx`
- L28 — parâmetro: `cursor`
- L28 — retorno da função: `<anônima>()`
- L29 — variável: `pattern`
- L37 — variável: `listTimelineQuerySchema`
- L48 — parâmetro: `ctx`
- L48 — parâmetro: `raw`
- L61 — variável: `payload`

### [src/modules/internalNotes/internalNotes.service.ts](../src/modules/internalNotes/internalNotes.service.ts)

- L27 — variável: `EVENT_ID_PREFIX`
- L28 — variável: `NOTE_RANK`
- L29 — variável: `EVENT_RANK`
- L46 — variável: `request`
- L61 — variável: `payload`
- L99 — variável: `entries`
- L100 — variável: `page`
- L101 — variável: `oldest`
- L102 — variável: `nextCursor`
- L104 — parâmetro: `entry`
- L104 — retorno da função: `<anônima>()`
- L109 — variável: `parsed`
- L139 — variável: `numericId`
- L140 — variável: `statusName`
- L144 — variável: `userId`
- L145 — variável: `name`
- L149 — variável: `userId`
- L150 — variável: `name`
- L157 — variável: `name`
- L177 — variável: `role`
- L188 — variável: `date`
- L232 — parâmetro: `participant`
- L232 — retorno da função: `<anônima>()`
- L256 — variável: `userIds`
- L257 — variável: `professionalIds`
- L258 — variável: `statusIds`
- L260 — variável: `row`
- L262 — variável: `userId`
- L267 — variável: `statusId`
- L276 — variável: `[userNames, professionalNames, statusNames]`
- L282 — parâmetro: `row`
- L282 — retorno da função: `<anônima>()`
- L304 — variável: `requestId`
- L305 — variável: `cursor`
- L306 — variável: `pageLimit`
- L308 — variável: `readState`
- L310 — variável: `[noteRows, eventRows, unseenCount, triageRows, mappingRows]`
- L318 — variável: `events`
- L319 — variável: `notes`
- L320 — variável: `{ items, nextCursor }`
- L336 — variável: `requestId`
- L337 — variável: `internalNoteId`
- L338 — variável: `note`
- L351 — variável: `requestId`
- L352 — variável: `note`

### [src/modules/pendingItems/pendingItems.controller.ts](../src/modules/pendingItems/pendingItems.controller.ts)

- L8 — variável: `{ checkRateLimit }`
- L22 — variável: `p`
- L30 — variável: `id`
- L36 — variável: `protocol`
- L37 — variável: `parsed`
- L39 — variável: `result`
- L49 — variável: `protocol`
- L50 — variável: `result`
- L55 — variável: `protocol`
- L56 — variável: `pendingItemId`
- L59 — variável: `isInternal`
- L60 — variável: `actorEmail`
- L61 — variável: `item`
- L74 — variável: `protocol`
- L75 — variável: `pendingItemId`
- L78 — variável: `file`
- L80 — variável: `result`
- L91 — variável: `protocol`
- L92 — variável: `parsed`
- L94 — variável: `result`
- L104 — variável: `protocol`
- L105 — variável: `body`
- L110 — variável: `key`
- L114 — variável: `parsed`

### [src/modules/pendingItems/pendingItems.repository.ts](../src/modules/pendingItems/pendingItems.repository.ts)

- L22 — variável: `conn`
- L23 — variável: `row`
- L43 — variável: `conn`
- L44 — variável: `row`
- L61 — variável: `conn`
- L62 — variável: `row`
- L73 — variável: `conn`
- L84 — variável: `conn`
- L85 — variável: `row`
- L94 — variável: `grouped`
- L97 — variável: `conn`
- L98 — variável: `rows`
- L103 — variável: `row`
- L104 — variável: `key`
- L105 — variável: `list`
- L117 — variável: `conn`
- L118 — variável: `row`
- L131 — variável: `conn`
- L132 — variável: `rows`
- L138 — parâmetro: `r`
- L138 — retorno da função: `<anônima>()`
- L138 — variável: `map`
- L139 — variável: `requested`
- L140 — variável: `responded`
- L141 — variável: `validated`
- L154 — variável: `conn`
- L156 — variável: `rows`
- L166 — variável: `byBatch`
- L167 — variável: `row`
- L168 — variável: `entry`
- L169 — variável: `count`
- L176 — variável: `candidates`
- L177 — parâmetro: `[, s]`
- L177 — retorno da função: `<anônima>()`
- L181 — variável: `requiresAttachment`
- L185 — parâmetro: `[batchId]`
- L185 — retorno da função: `<anônima>()`
- L189 — parâmetro: `r`
- L189 — retorno da função: `<anônima>()`
- L189 — variável: `requiresSet`
- L191 — variável: `attachmentCounts`
- L193 — variável: `counts`
- L203 — variável: `c`
- L206 — variável: `[batchId, summary]`
- L217 — variável: `conn`
- L218 — variável: `row`
- L224 — variável: `count`
- L226 — variável: `lastUnreadAt`
- L231 — variável: `row`
- L281 — variável: `row`
- L303 — variável: `row`
- L308 — variável: `row`
- L317 — variável: `conn`
- L332 — parâmetro: `trx`
- L332 — retorno da função: `<anônima>()`
- L333 — parâmetro: `row`
- L333 — retorno da função: `<anônima>()`
- L333 — variável: `toInsert`
- L349 — variável: `current`
- L350 — variável: `pendingStatusId`
- L405 — parâmetro: `trx`
- L405 — retorno da função: `<anônima>()`
- L406 — variável: `row`
- L433 — variável: `requestedCount`
- L437 — variável: `requestedRemaining`
- L439 — variável: `requiresAttachment`
- L442 — variável: `attachmentSatisfied`
- L446 — variável: `current`
- L447 — variável: `nextStatusName`
- L454 — variável: `statusId`
- L480 — parâmetro: `trx`
- L480 — retorno da função: `<anônima>()`
- L517 — parâmetro: `trx`
- L517 — retorno da função: `<anônima>()`
- L524 — variável: `hasReopen`
- L526 — variável: `dec`
- L527 — variável: `row`
- L531 — variável: `currentStatus`
- L577 — variável: `nextStatusName`
- L579 — variável: `statusId`
- L596 — parâmetro: `d`
- L596 — retorno da função: `<anônima>()`
- L618 — variável: `col`
- L620 — variável: `v`
- L624 — variável: `requesterRow`
- L646 — variável: `col`
- L649 — variável: `category`
- L692 — variável: `col`
- L719 — variável: `entry`

### [src/modules/pendingItems/pendingItems.router.ts](../src/modules/pendingItems/pendingItems.router.ts)

- L17 — variável: `router`
- L19 — variável: `upload`
- L22 — parâmetro: `_req`
- L22 — parâmetro: `cb`
- L22 — parâmetro: `file`
- L22 — retorno da função: `<anônima>()`
- L33 — variável: `uploadSingle`
- L53 — parâmetro: `next`
- L53 — parâmetro: `req`
- L53 — parâmetro: `res`
- L53 — retorno da função: `<anônima>()`
- L54 — parâmetro: `err`
- L54 — retorno da função: `<anônima>()`
- L69 — variável: `publicVerifyRouter`

### [src/modules/pendingItems/pendingItems.schema.ts](../src/modules/pendingItems/pendingItems.schema.ts)

- L7 — variável: `createPendingItemsSchema`
- L21 — parâmetro: `ctx`
- L21 — parâmetro: `data`
- L21 — retorno da função: `<anônima>()`
- L22 — variável: `hasObservation`
- L24 — variável: `hasItems`
- L34 — variável: `verifySchema`
- L40 — variável: `reviewSchema`

### [src/modules/pendingItems/pendingItems.service.ts](../src/modules/pendingItems/pendingItems.service.ts)

- L21 — variável: `TERMINAL_STATUSES`
- L33 — parâmetro: `row`
- L33 — retorno da função: `<anônima>()`
- L33 — variável: `bases`
- L34 — variável: `base`
- L38 — parâmetro: `b`
- L38 — retorno da função: `<anônima>()`
- L38 — variável: `attachmentsByItem`
- L41 — variável: `base`
- L42 — variável: `atts`
- L43 — parâmetro: `a`
- L43 — retorno da função: `<anônima>()`
- L43 — variável: `attachments`
- L51 — variável: `currentValue`
- L63 — variável: `corrected`
- L86 — variável: `request`
- L95 — variável: `observation`
- L96 — variável: `items`
- L97 — variável: `hasObservation`
- L98 — variável: `hasItems`
- L109 — variável: `raw`
- L113 — variável: `item`
- L114 — variável: `fieldKey`
- L139 — variável: `batchId`
- L140 — variável: `requestAttachment`
- L157 — variável: `{ item, fieldKey }`
- L158 — variável: `snapshot`
- L175 — variável: `createdRows`
- L184 — variável: `mapped`
- L202 — variável: `professionalId`
- L203 — variável: `requestProfessionalId`
- L210 — variável: `request`
- L214 — variável: `nameOk`
- L215 — variável: `emailOk`
- L225 — variável: `identity`
- L227 — variável: `nameOk`
- L228 — variável: `emailOk`
- L239 — variável: `request`
- L241 — variável: `rows`
- L242 — variável: `items`
- L251 — variável: `openRow`
- L252 — parâmetro: `row`
- L252 — retorno da função: `<anônima>()`
- L254 — variável: `targetRow`
- L255 — variável: `batchId`
- L256 — variável: `requestAttachment`
- L258 — parâmetro: `row`
- L258 — retorno da função: `<anônima>()`
- L273 — variável: `request`
- L275 — variável: `row`
- L283 — variável: `type`
- L301 — variável: `response`
- L314 — variável: `updated`
- L323 — parâmetro: `facts`
- L323 — retorno da função: `<anônima>()`
- L331 — variável: `list`
- L349 — variável: `request`
- L351 — variável: `row`
- L367 — variável: `[saved]`
- L377 — variável: `err`
- L417 — variável: `date`
- L439 — variável: `nullableComplement`
- L469 — variável: `request`
- L474 — variável: `batchId`
- L475 — variável: `batchRows`
- L478 — parâmetro: `row`
- L478 — retorno da função: `<anônima>()`
- L478 — variável: `byId`
- L480 — variável: `decision`
- L481 — variável: `row`
- L483 — variável: `status`
- L495 — parâmetro: `decision`
- L495 — retorno da função: `<anônima>()`
- L499 — variável: `row`
- L500 — variável: `fieldKey`
- L509 — variável: `decidedRows`
- L518 — parâmetro: `facts`
- L518 — retorno da função: `<anônima>()`
- L521 — variável: `mapped`
- L531 — variável: `mode`
- L536 — variável: `found`
- L538 — variável: `nameOk`
- L539 — variável: `emailOk`

### [src/modules/portalConfig/portalConfig.controller.ts](../src/modules/portalConfig/portalConfig.controller.ts)

- L27 — variável: `id`
- L50 — variável: `getConfig`
- L51 — variável: `response`
- L59 — variável: `updateAccess`
- L60 — variável: `parsed`
- L65 — variável: `response`
- L73 — variável: `updateIdentity`
- L74 — variável: `parsed`
- L79 — variável: `response`
- L87 — variável: `updateTheme`
- L88 — variável: `parsed`
- L93 — variável: `response`
- L101 — variável: `updateAssets`
- L106 — variável: `rawAssets`
- L107 — variável: `filesMap`
- L108 — parâmetro: `list`
- L108 — retorno da função: `<anônima>()`
- L108 — variável: `hasBinary`
- L121 — variável: `validated`
- L129 — variável: `files`
- L137 — variável: `[fieldName, fileArray]`
- L139 — variável: `file`
- L145 — variável: `targetDir`
- L147 — variável: `saved`
- L148 — parâmetro: `[, file]`
- L148 — retorno da função: `<anônima>()`
- L150 — parâmetro: `[fieldName]`
- L150 — retorno da função: `<anônima>()`
- L154 — parâmetro: `attachment`
- L154 — parâmetro: `index`
- L154 — retorno da função: `<anônima>()`
- L155 — variável: `fieldName`
- L165 — variável: `response`
- L167 — variável: `err`
- L180 — variável: `updateCategories`
- L181 — variável: `parsed`
- L186 — variável: `response`
- L194 — variável: `updateStatuses`
- L195 — variável: `parsed`
- L200 — variável: `response`
- L208 — variável: `updatePrioritizationWeights`
- L212 — variável: `parsed`
- L217 — variável: `response`

### [src/modules/portalConfig/portalConfig.mappers.ts](../src/modules/portalConfig/portalConfig.mappers.ts)

- L27 — variável: `TONES`
- L121 — variável: `palette`
- L122 — variável: `tokens`
- L123 — variável: `token`
- L130 — variável: `tone`
- L131 — variável: `{ color, background, backgroundLocked }`
- L151 — variável: `read`
- L155 — variável: `readGradient`
- L159 — variável: `readAngle`
- L163 — variável: `readStatus`
- L167 — variável: `{ color, background, backgroundLocked }`
- L181 — variável: `buildPalette`
- L182 — parâmetro: `token`
- L182 — retorno da função: `<anônima>()`
- L182 — variável: `tokenEntries`

### [src/modules/portalConfig/portalConfig.repository.ts](../src/modules/portalConfig/portalConfig.repository.ts)

- L22 — variável: `source`
- L23 — variável: `row`
- L46 — variável: `source`
- L54 — variável: `source`
- L60 — variável: `source`
- L73 — variável: `source`
- L129 — variável: `now`
- L147 — variável: `now`
- L175 — variável: `category`
- L193 — parâmetro: `c`
- L193 — retorno da função: `<anônima>()`
- L193 — variável: `keepIds`
- L215 — parâmetro: `index`
- L215 — parâmetro: `status`
- L215 — retorno da função: `<anônima>()`
- L215 — variável: `orderById`
- L217 — variável: `status`
- L218 — variável: `orderNumber`
- L219 — variável: `triageMode`
- L220 — variável: `mappingMode`
- L221 — variável: `isTerminal`
- L222 — variável: `row`
- L243 — parâmetro: `status`
- L243 — retorno da função: `<anônima>()`
- L243 — variável: `keepIds`
- L245 — variável: `omitted`
- L250 — variável: `nextOrder`
- L251 — variável: `row`
- L275 — variável: `[contractKey, weight]`
- L276 — variável: `criterionId`

### [src/modules/portalConfig/portalConfig.router.ts](../src/modules/portalConfig/portalConfig.router.ts)

- L16 — variável: `portalConfigRoutes`

### [src/modules/portalConfig/portalConfig.schema.ts](../src/modules/portalConfig/portalConfig.schema.ts)

- L23 — variável: `hexColorSchema`
- L27 — variável: `ThemeGradientSchema`
- L40 — variável: `StatusToneSchema`
- L48 — variável: `statusTonesShape`
- L49 — parâmetro: `tone`
- L49 — retorno da função: `<anônima>()`
- L52 — variável: `tokenShape`
- L53 — parâmetro: `key`
- L53 — retorno da função: `<anônima>()`
- L56 — variável: `ThemePaletteSchema`
- L64 — variável: `updateThemeSchema`
- L75 — variável: `updateAccessSchema`
- L83 — variável: `updateIdentitySchema`
- L100 — parâmetro: `identity`
- L100 — retorno da função: `<anônima>()`
- L107 — variável: `portalCategorySchema`
- L116 — variável: `updateCategoriesSchema`
- L122 — parâmetro: `categories`
- L122 — parâmetro: `ctx`
- L122 — retorno da função: `<anônima>()`
- L123 — variável: `seen`
- L124 — parâmetro: `category`
- L124 — parâmetro: `index`
- L124 — retorno da função: `<anônima>()`
- L125 — variável: `key`
- L135 — parâmetro: `category`
- L135 — retorno da função: `<anônima>()`
- L146 — variável: `StatusModeSchema`
- L150 — variável: `portalStatusSchema`
- L170 — parâmetro: `ctx`
- L170 — parâmetro: `status`
- L170 — retorno da função: `<anônima>()`
- L180 — variável: `updateStatusesSchema`
- L186 — parâmetro: `ctx`
- L186 — parâmetro: `statuses`
- L186 — retorno da função: `<anônima>()`
- L187 — variável: `seenNames`
- L188 — parâmetro: `index`
- L188 — parâmetro: `status`
- L188 — retorno da função: `<anônima>()`
- L189 — variável: `nameKey`
- L217 — parâmetro: `status`
- L217 — retorno da função: `<anônima>()`
- L233 — variável: `prioritizationWeightSchema`
- L239 — variável: `updatePrioritizationWeightsSchema`
- L247 — parâmetro: `ctx`
- L247 — parâmetro: `{ prioritizationWeights }`
- L247 — retorno da função: `<anônima>()`
- L248 — variável: `missing`
- L249 — parâmetro: `criterion`
- L249 — retorno da função: `<anônima>()`
- L266 — variável: `assetUrlSchema`
- L272 — parâmetro: `url`
- L272 — retorno da função: `<anônima>()`
- L276 — variável: `portalAssetsPatchSchema`
- L290 — parâmetro: `assets`
- L290 — retorno da função: `<anônima>()`

### [src/modules/portalConfig/portalConfig.service.ts](../src/modules/portalConfig/portalConfig.service.ts)

- L32 — retorno da função: `assetsFromRow()`
- L67 — variável: `[settings, themeRow, categories, statuses, criteria]`
- L75 — variável: `theme`
- L83 — parâmetro: `cat`
- L83 — retorno da função: `<anônima>()`
- L91 — parâmetro: `c`
- L91 — retorno da função: `<anônima>()`
- L92 — variável: `key`
- L107 — parâmetro: `trx`
- L107 — retorno da função: `<anônima>()`
- L110 — variável: `settings`
- L111 — variável: `previous`
- L136 — parâmetro: `trx`
- L136 — retorno da função: `<anônima>()`
- L139 — variável: `settings`
- L140 — variável: `previous`
- L147 — variável: `updated`
- L148 — variável: `newValue`
- L174 — parâmetro: `trx`
- L174 — retorno da função: `<anônima>()`
- L178 — variável: `themeRow`
- L179 — variável: `previousTheme`
- L180 — variável: `columns`
- L205 — parâmetro: `trx`
- L205 — retorno da função: `<anônima>()`
- L208 — variável: `settings`
- L209 — variável: `previous`
- L213 — variável: `updated`
- L214 — variável: `newValue`
- L237 — parâmetro: `trx`
- L237 — retorno da função: `<anônima>()`
- L240 — variável: `prevRows`
- L241 — parâmetro: `cat`
- L241 — retorno da função: `<anônima>()`
- L241 — variável: `previous`
- L271 — parâmetro: `trx`
- L271 — retorno da função: `<anônima>()`
- L274 — variável: `prevRows`
- L275 — variável: `previous`
- L276 — parâmetro: `st`
- L276 — retorno da função: `<anônima>()`
- L276 — variável: `prevById`
- L277 — parâmetro: `s`
- L277 — retorno da função: `<anônima>()`
- L277 — variável: `incomingById`
- L279 — variável: `coreId`
- L280 — variável: `existing`
- L289 — variável: `incoming`
- L358 — parâmetro: `trx`
- L358 — retorno da função: `<anônima>()`
- L361 — variável: `prevRows`
- L362 — variável: `previous`
- L363 — parâmetro: `c`
- L363 — retorno da função: `<anônima>()`
- L364 — variável: `key`

### [src/modules/prioritization/prioritization.controller.ts](../src/modules/prioritization/prioritization.controller.ts)

- L12 — variável: `id`
- L20 — variável: `protocolParamsSchema`
- L24 — variável: `listCriteria`
- L25 — variável: `response`
- L30 — variável: `evaluateScore`
- L31 — variável: `parsedParams`
- L36 — variável: `parsed`
- L42 — variável: `response`

### [src/modules/prioritization/prioritization.repository.ts](../src/modules/prioritization/prioritization.repository.ts)

- L17 — variável: `row`
- L24 — variável: `row`
- L38 — variável: `scoreRounded`
- L57 — variável: `row`
- L72 — variável: `data`
- L82 — variável: `rows`
- L88 — variável: `row`

### [src/modules/prioritization/prioritization.router.ts](../src/modules/prioritization/prioritization.router.ts)

- L6 — variável: `prioritizationRoutes`

### [src/modules/prioritization/prioritization.schema.ts](../src/modules/prioritization/prioritization.schema.ts)

- L5 — variável: `noteSchema`
- L12 — variável: `criterionKeySchema`
- L24 — variável: `evaluateScoreSchema`
- L25 — parâmetro: `notes`
- L25 — retorno da função: `<anônima>()`

### [src/modules/prioritization/prioritization.service.ts](../src/modules/prioritization/prioritization.service.ts)

- L18 — variável: `rows`
- L19 — parâmetro: `row`
- L19 — retorno da função: `<anônima>()`
- L49 — variável: `exists`
- L54 — variável: `assigneeUserId`
- L62 — variável: `criteria`
- L66 — variável: `score`
- L67 — variável: `classification`
- L75 — parâmetro: `trx`
- L75 — retorno da função: `<anônima>()`
- L75 — variável: `evaluation`
- L76 — variável: `previous`
- L85 — variável: `row`
- L132 — parâmetro: `row`
- L132 — retorno da função: `<anônima>()`
- L132 — variável: `validIds`
- L134 — parâmetro: `row`
- L134 — retorno da função: `<anônima>()`
- L134 — variável: `missing`
- L136 — parâmetro: `row`
- L136 — retorno da função: `<anônima>()`
- L136 — variável: `list`
- L140 — parâmetro: `key`
- L140 — retorno da função: `<anônima>()`
- L140 — variável: `unknown`
- L148 — variável: `shown`
- L154 — variável: `somaPonderada`
- L155 — parâmetro: `acc`
- L155 — parâmetro: `row`
- L155 — retorno da função: `<anônima>()`
- L158 — parâmetro: `acc`
- L158 — parâmetro: `row`
- L158 — retorno da função: `<anônima>()`
- L158 — variável: `somaPesos`
- L169 — variável: `range`

### [src/modules/queue/mapping.controller.ts](../src/modules/queue/mapping.controller.ts)

- L13 — variável: `protocol`
- L28 — variável: `id`
- L36 — variável: `getMappingController`
- L37 — variável: `protocol`
- L42 — variável: `putMappingController`
- L43 — variável: `protocol`
- L47 — variável: `actor`
- L54 — variável: `parsed`
- L56 — variável: `{ message, fields }`
- L60 — variável: `response`

### [src/modules/queue/mapping.repository.ts](../src/modules/queue/mapping.repository.ts)

- L82 — variável: `findMappingRequestContext`
- L86 — variável: `row`
- L124 — variável: `resolveMappingTarget`
- L134 — retorno da função: `<anônima>()`
- L146 — variável: `findMappingAssigneeCandidate`
- L154 — variável: `row`
- L173 — variável: `findCurrentMapping`
- L177 — variável: `row`
- L187 — variável: `findLatestOpenMapping`
- L191 — variável: `row`
- L201 — variável: `findMappingById`
- L206 — variável: `row`
- L220 — variável: `findMappingParticipants`
- L242 — variável: `resolveParticipantUsers`
- L250 — variável: `rows`
- L261 — parâmetro: `id`
- L261 — retorno da função: `<anônima>()`
- L261 — variável: `invalid`
- L262 — parâmetro: `r`
- L262 — retorno da função: `<anônima>()`
- L262 — variável: `row`
- L271 — parâmetro: `row`
- L271 — retorno da função: `<anônima>()`
- L278 — variável: `insertMapping`
- L290 — variável: `[row]`
- L311 — variável: `updateMapping`
- L349 — variável: `clearRequestMappingAssignee`
- L362 — variável: `replaceMappingParticipants`
- L374 — parâmetro: `participant`
- L374 — retorno da função: `<anônima>()`

### [src/modules/queue/mapping.schemas.ts](../src/modules/queue/mapping.schemas.ts)

- L20 — variável: `participantIdSchema`
- L30 — parâmetro: `value`
- L30 — retorno da função: `<anônima>()`
- L33 — parâmetro: `value`
- L33 — retorno da função: `<anônima>()`
- L35 — variável: `mappingParticipantSchema`
- L41 — variável: `noDuplicateParticipants`
- L42 — variável: `seen`
- L44 — variável: `participant`
- L48 — variável: `key`
- L62 — variável: `mappingPayloadSchema`

### [src/modules/queue/mapping.service.ts](../src/modules/queue/mapping.service.ts)

- L43 — parâmetro: `trx`
- L43 — retorno da função: `<anônima>()`
- L62 — variável: `date`
- L125 — parâmetro: `participant`
- L125 — retorno da função: `<anônima>()`
- L157 — parâmetro: `participant`
- L157 — retorno da função: `<anônima>()`
- L188 — variável: `textField`
- L189 — variável: `next`
- L190 — variável: `normalized`
- L237 — parâmetro: `participant`
- L237 — retorno da função: `<anônima>()`
- L237 — variável: `userIds`
- L241 — variável: `usersById`
- L243 — parâmetro: `participant`
- L243 — variável: `resolved`
- L248 — variável: `user`
- L255 — variável: `seenEmails`
- L256 — variável: `seenUserIds`
- L257 — variável: `participant`
- L258 — variável: `emailKey`
- L285 — variável: `getMappingService`
- L286 — variável: `context`
- L291 — variável: `mapping`
- L296 — variável: `[participants, assigneeCandidate]`
- L309 — variável: `upsertMappingService`
- L315 — parâmetro: `trx`
- L315 — retorno da função: `<anônima>()`
- L318 — variável: `context`
- L356 — variável: `isAdmin`
- L357 — variável: `isRequestAssignee`
- L359 — variável: `isRequestMappingAssignee`
- L363 — variável: `mapping`
- L374 — variável: `previousProfessionalId`
- L384 — variável: `explicitDesignation`
- L385 — variável: `isNullOnCreate`
- L386 — variável: `designationAction`
- L388 — variável: `priorDesigneeUserId`
- L393 — variável: `isPriorMappingAssignee`
- L397 — variável: `canCreateByInheritance`
- L401 — variável: `isCurrentMappingAssignee`
- L405 — variável: `canDesignate`
- L406 — variável: `canEditContent`
- L411 — variável: `contentAction`
- L459 — variável: `candidate`
- L479 — variável: `currentValues`
- L480 — variável: `values`
- L482 — variável: `concluding`
- L492 — variável: `target`
- L523 — variável: `missing`
- L533 — variável: `resolvedParticipants`
- L540 — variável: `designationChanged`
- L579 — variável: `changeOrigin`
- L583 — variável: `previousAuditValues`
- L590 — variável: `nextAuditValues`
- L694 — parâmetro: `participant`
- L694 — retorno da função: `<anônima>()`
- L701 — variável: `assigneeCandidate`

### [src/modules/queue/queue.controller.ts](../src/modules/queue/queue.controller.ts)

- L7 — variável: `getMetricsController`
- L8 — variável: `metrics`
- L13 — variável: `centralizedQueue`
- L14 — variável: `parsed`
- L20 — variável: `result`

### [src/modules/queue/queue.filters.ts](../src/modules/queue/queue.filters.ts)

- L14 — variável: `{ search, status, priority, assigneeId, unassigned, scopedUserId }`
- L17 — parâmetro: `builder`
- L17 — retorno da função: `<anônima>()`
- L45 — parâmetro: `builder`
- L45 — retorno da função: `<anônima>()`

### [src/modules/queue/queue.repository.ts](../src/modules/queue/queue.repository.ts)

- L17 — variável: `IN_PROGRESS_STATUS_NAMES`
- L25 — variável: `fetchQueueMetrics`
- L26 — variável: `query`
- L44 — parâmetro: `builder`
- L44 — retorno da função: `<anônima>()`
- L51 — variável: `result`
- L58 — retorno da função: `<anônima>()`
- L64 — retorno da função: `<anônima>()`
- L78 — variável: `findQueueRequests`
- L81 — variável: `{ limit, offset }`
- L83 — variável: `baseQuery`
- L102 — variável: `countQuery`
- L104 — variável: `itemsQuery`
- L121 — variável: `[countResult, items]`
- L122 — variável: `total`
- L127 — variável: `fetchAllAssignees`
- L128 — variável: `rows`

### [src/modules/queue/queue.router.ts](../src/modules/queue/queue.router.ts)

- L7 — variável: `queueRoutes`

### [src/modules/queue/queue.schemas.ts](../src/modules/queue/queue.schemas.ts)

- L5 — variável: `queueFilterShape`
- L25 — parâmetro: `value`
- L25 — retorno da função: `<anônima>()`
- L38 — variável: `queueFilterQuerySchema`
- L50 — variável: `queueQuerySchema`

### [src/modules/queue/queue.service.ts](../src/modules/queue/queue.service.ts)

- L17 — variável: `resolveQueueScope`
- L20 — variável: `userId`
- L24 — variável: `getQueueMetricsService`
- L35 — variável: `listQueueService`
- L39 — variável: `{ page, pageSize, search, status, priority, assigneeId, unassigned }`
- L40 — variável: `offset`
- L42 — variável: `repoUnassigned`
- L43 — variável: `repoAssigneeId`
- L46 — variável: `[{ items, total }, assignees]`
- L60 — variável: `totalPages`
- L63 — variável: `effectivePage`
- L65 — parâmetro: `item`
- L65 — retorno da função: `<anônima>()`
- L65 — variável: `formattedData`

### [src/modules/reports/reports.controller.ts](../src/modules/reports/reports.controller.ts)

- L9 — variável: `parsed`
- L19 — variável: `parsed`
- L25 — variável: `file`

### [src/modules/reports/reports.repository.ts](../src/modules/reports/reports.repository.ts)

- L8 — variável: `BUSINESS_TIME_ZONE`
- L9 — variável: `OPENED_MONTH_SQL`
- L112 — variável: `query`
- L140 — variável: `query`
- L159 — variável: `query`
- L174 — variável: `query`
- L188 — variável: `query`
- L202 — variável: `[statuses, categories, priorities]`
- L221 — variável: `query`

### [src/modules/reports/reports.router.ts](../src/modules/reports/reports.router.ts)

- L6 — variável: `reportsRoutes`

### [src/modules/reports/reports.schema.ts](../src/modules/reports/reports.schema.ts)

- L4 — variável: `optionalDate`
- L5 — variável: `optionalId`
- L7 — variável: `dashboardQuerySchema`
- L17 — parâmetro: `query`
- L17 — retorno da função: `<anônima>()`

### [src/modules/reports/reports.service.ts](../src/modules/reports/reports.service.ts)

- L12 — variável: `BUSINESS_TIME_ZONE`
- L13 — variável: `CSV_HEADERS`
- L28 — variável: `dateTimeFormatter`
- L38 — variável: `filenameDateFormatter`
- L46 — variável: `[summary, byStatus, byPriority, byCategory, openedOverTime, filterOptions]`
- L66 — parâmetro: `item`
- L66 — retorno da função: `<anônima>()`
- L70 — parâmetro: `item`
- L70 — retorno da função: `<anônima>()`
- L74 — parâmetro: `item`
- L74 — retorno da função: `<anônima>()`
- L86 — parâmetro: `item`
- L86 — retorno da função: `<anônima>()`
- L93 — parâmetro: `item`
- L98 — parâmetro: `item`
- L98 — retorno da função: `<anônima>()`
- L103 — parâmetro: `item`
- L103 — retorno da função: `<anônima>()`
- L113 — variável: `date`
- L124 — variável: `record`
- L125 — variável: `assessment`
- L138 — variável: `raw`
- L139 — variável: `protectedValue`
- L163 — variável: `rows`
- L164 — variável: `lines`

### [src/modules/requests/requests.controller.ts](../src/modules/requests/requests.controller.ts)

- L27 — variável: `userId`
- L36 — variável: `getRequestsByProtocol`
- L37 — variável: `protocol`
- L39 — variável: `foundRequest`
- L47 — variável: `getTracking`
- L48 — variável: `protocol`
- L50 — variável: `response`
- L61 — variável: `getInternalRequestByProtocol`
- L65 — variável: `protocol`
- L67 — variável: `request`
- L74 — variável: `protocol`
- L88 — variável: `id`
- L98 — variável: `patchInternalRequestByProtocol`
- L102 — variável: `protocol`
- L104 — variável: `parsed`
- L106 — variável: `{ message, fields }`
- L110 — variável: `updated`
- L120 — variável: `postRequest`
- L134 — variável: `parsed`
- L138 — variável: `multerFiles`
- L139 — variável: `attachments`
- L141 — variável: `savedAttachments`
- L143 — variável: `response`
- L152 — variável: `getRequestsByEmail`
- L159 — variável: `parsed`
- L165 — variável: `requests`
- L177 — variável: `parsed`
- L183 — variável: `requests`
- L188 — variável: `getAssignees`
- L192 — variável: `patchAssignee`
- L193 — variável: `protocol`
- L195 — variável: `parsed`
- L200 — variável: `response`
- L210 — variável: `patchInternalAssignee`
- L211 — variável: `protocol`
- L213 — variável: `parsed`
- L218 — variável: `response`
- L228 — variável: `patchRequestStatus`
- L229 — variável: `protocol`
- L231 — variável: `parsed`
- L236 — variável: `response`

### [src/modules/requests/requests.repository.ts](../src/modules/requests/requests.repository.ts)

- L38 — variável: `INITIAL_STATUS`
- L78 — variável: `email`
- L125 — variável: `row`
- L139 — variável: `requesterId`
- L162 — variável: `result`
- L166 — variável: `row`
- L183 — variável: `email`
- L184 — variável: `requestId`
- L186 — variável: `manualControls`
- L187 — variável: `processDocumentation`
- L188 — variável: `similarSolution`
- L189 — variável: `otherAreas`
- L190 — variável: `restrictedInfo`
- L192 — variável: `insertedRows`
- L251 — variável: `row`
- L270 — parâmetro: `scheduledFor`
- L270 — retorno da função: `<anônima>()`
- L289 — parâmetro: `attachment`
- L289 — retorno da função: `<anônima>()`
- L307 — parâmetro: `trx`
- L307 — retorno da função: `<anônima>()`
- L308 — variável: `categoryId`
- L314 — variável: `statusId`
- L315 — variável: `requesterId`
- L316 — variável: `saved`
- L325 — variável: `email`
- L340 — variável: `row`
- L355 — variável: `PUBLIC_STATUS_SUMMARY_SQL`
- L358 — retorno da função: `baseSummaryQuery()`
- L375 — parâmetro: `builder`
- L375 — retorno da função: `<anônima>()`
- L385 — variável: `countRows`
- L391 — variável: `total`
- L393 — variável: `rows`
- L408 — parâmetro: `row`
- L408 — retorno da função: `<anônima>()`
- L433 — variável: `response`
- L465 — variável: `meetingScheduledFor`
- L467 — variável: `meeting`
- L471 — variável: `openedAt`
- L512 — variável: `hasMapping`
- L514 — variável: `query`
- L542 — variável: `baseSelect`
- L609 — variável: `mappingSelect`
- L653 — variável: `row`
- L666 — variável: `ASSIGNABLE_PROFILES`
- L689 — variável: `numericId`
- L734 — variável: `hasMapping`
- L750 — variável: `query`
- L761 — variável: `row`
- L805 — variável: `statusId`
- L845 — variável: `hasMappingColumn`
- L860 — variável: `query`
- L871 — variável: `row`
- L896 — retorno da função: `<anônima>()`
- L955 — variável: `manualControls`
- L956 — variável: `processDocumentation`
- L957 — variável: `similarSolution`
- L958 — variável: `otherAreas`
- L959 — variável: `restrictedInfo`

### [src/modules/requests/requests.router.ts](../src/modules/requests/requests.router.ts)

- L20 — variável: `requestsRoutes`

### [src/modules/requests/requests.schema.ts](../src/modules/requests/requests.schema.ts)

- L15 — variável: `yesNoDetailSchema`
- L25 — variável: `requesterSchema`
- L34 — variável: `demandSchema`
- L45 — variável: `operationalSchema`
- L72 — variável: `complementarySchema`
- L80 — variável: `isRealCalendarDateTime`
- L81 — variável: `[datePart, timePart]`
- L82 — variável: `[year, month, day]`
- L83 — variável: `[hour = 0, minute = 0]`
- L86 — variável: `lastDay`
- L90 — variável: `createRequestPayloadSchema`
- L109 — parâmetro: `preferences`
- L109 — retorno da função: `<anônima>()`
- L126 — variável: `todaySaoPauloYmd`
- L128 — variável: `desiredDeadlineUpdateSchema`
- L131 — parâmetro: `value`
- L131 — retorno da função: `<anônima>()`
- L135 — variável: `operationalUpdateSchema`
- L141 — variável: `updateRequesterSchema`
- L143 — variável: `updateRequestPayloadSchema`
- L152 — variável: `listRequestsQuerySchema`
- L173 — variável: `listAuthenticatedRequestsQuerySchema`
- L175 — variável: `assignRequestSchema`
- L185 — variável: `analystIdSchema`
- L187 — variável: `assignAnalystSchema`
- L192 — parâmetro: `ctx`
- L192 — parâmetro: `data`
- L192 — retorno da função: `<anônima>()`
- L193 — variável: `hasAssignee`
- L194 — variável: `hasMapping`
- L212 — variável: `updateStatusSchema`

### [src/modules/requests/requests.service.ts](../src/modules/requests/requests.service.ts)

- L72 — variável: `user`
- L85 — variável: `normalizedProtocol`
- L87 — variável: `found`
- L96 — variável: `identity`
- L105 — retorno da função: `registerRequest()`
- L113 — variável: `payload`
- L119 — variável: `err`
- L129 — variável: `identity`
- L146 — variável: `email`
- L155 — variável: `normalizedEmail`
- L191 — parâmetro: `value`
- L191 — retorno da função: `<anônima>()`
- L198 — variável: `request`
- L208 — variável: `assigneeUserId`
- L209 — variável: `mappingUserId`
- L210 — variável: `isAssignee`
- L216 — variável: `requestId`
- L217 — variável: `[attachments, schedulePreferences, evaluation]`
- L226 — variável: `meeting`
- L234 — retorno da função: `<anônima>()`
- L234 — variável: `pendingSummary`
- L236 — variável: `summary`
- L237 — variável: `correctionAlert`
- L238 — variável: `unreadRaw`
- L274 — variável: `openedAt`
- L275 — variável: `lastUpdate`
- L277 — variável: `assigneeUserId`
- L278 — variável: `mappingUserId`
- L280 — variável: `assignee`
- L289 — variável: `mappingAssignee`
- L356 — parâmetro: `row`
- L356 — retorno da função: `<anônima>()`
- L360 — parâmetro: `attachment`
- L360 — retorno da função: `<anônima>()`
- L386 — variável: `trimmed`
- L393 — variável: `record`
- L397 — variável: `{ __triage: _triage, observations: _obs, ...rest }`
- L422 — variável: `TRACKING_INVALID_IDENTITY`
- L425 — variável: `scheduledFor`
- L482 — variável: `openedAt`
- L501 — variável: `requestId`
- L502 — variável: `[attachments, schedulePreferences]`
- L507 — variável: `meeting`
- L508 — variável: `complementary`
- L511 — variável: `{ impacts, ...base }`
- L530 — parâmetro: `preference`
- L530 — retorno da função: `<anônima>()`
- L535 — parâmetro: `attachment`
- L535 — retorno da função: `<anônima>()`
- L554 — variável: `requesterUserId`
- L578 — variável: `row`
- L593 — variável: `mode`
- L604 — variável: `row`
- L606 — variável: `nameOk`
- L608 — variável: `emailOk`
- L629 — variável: `normalizedProtocol`
- L713 — variável: `request`
- L724 — variável: `professional`
- L725 — variável: `canEdit`
- L732 — parâmetro: `trx`
- L732 — retorno da função: `<anônima>()`
- L761 — variável: `RN010_ELIGIBLE_SCREENING`
- L769 — variável: `candidate`
- L791 — variável: `candidate`
- L812 — variável: `request`
- L827 — variável: `assignee`
- L832 — variável: `previousId`
- L833 — variável: `nextId`
- L836 — parâmetro: `c`
- L836 — retorno da função: `<anônima>()`
- L839 — variável: `auditNext`
- L840 — variável: `auditPrev`
- L843 — variável: `action`
- L845 — variável: `shouldAdvanceStatus`
- L850 — parâmetro: `trx`
- L850 — retorno da função: `<anônima>()`
- L893 — variável: `request`
- L908 — variável: `hasAssignee`
- L909 — variável: `hasMapping`
- L912 — variável: `raw`
- L914 — variável: `previous`
- L915 — variável: `auditPrev`
- L918 — parâmetro: `trx`
- L918 — retorno da função: `<anônima>()`
- L935 — variável: `resolved`
- L936 — variável: `previous`
- L937 — variável: `auditPrev`
- L940 — variável: `previousMapping`
- L941 — variável: `auditPrevMapping`
- L944 — variável: `action`
- L945 — variável: `shouldAdvance`
- L948 — parâmetro: `trx`
- L948 — retorno da função: `<anônima>()`
- L997 — variável: `raw`
- L999 — variável: `previous`
- L1000 — variável: `auditPrev`
- L1003 — parâmetro: `trx`
- L1003 — retorno da função: `<anônima>()`
- L1020 — variável: `resolved`
- L1021 — variável: `previous`
- L1022 — variável: `auditPrev`
- L1025 — variável: `previousAssignee`
- L1026 — variável: `auditPrevAssignee`
- L1029 — variável: `action`
- L1030 — parâmetro: `trx`
- L1030 — retorno da função: `<anônima>()`
- L1079 — variável: `isTriageAssignee`
- L1081 — variável: `isMappingAssignee`
- L1106 — parâmetro: `trx`
- L1106 — retorno da função: `<anônima>()`
- L1127 — variável: `request`
- L1132 — variável: `target`
- L1137 — variável: `isAdmin`
- L1151 — variável: `isAssignee`
- L1153 — variável: `isMappingAssignee`
- L1156 — variável: `isAnalystAssignee`
- L1222 — variável: `changeOrigin`
- L1224 — parâmetro: `trx`
- L1224 — retorno da função: `<anônima>()`
- L1224 — variável: `lastUpdate`
- L1225 — variável: `persistedAt`

### [src/modules/requests/statusTransition.ts](../src/modules/requests/statusTransition.ts)

- L29 — variável: `lastTechnicalMessage`
- L38 — variável: `query`
- L42 — variável: `rows`
- L43 — variável: `row`

### [src/modules/requests/triage/triage.controller.ts](../src/modules/requests/triage/triage.controller.ts)

- L9 — variável: `protocolParamsSchema`
- L18 — variável: `id`
- L32 — variável: `parsed`
- L40 — variável: `getTriage`
- L41 — variável: `protocol`
- L42 — variável: `actor`
- L44 — variável: `triage`
- L49 — variável: `saveTriage`
- L50 — variável: `protocol`
- L51 — variável: `actor`
- L53 — variável: `parsed`
- L55 — variável: `{ message, fields }`
- L59 — variável: `triage`

### [src/modules/requests/triage/triage.repository.ts](../src/modules/requests/triage/triage.repository.ts)

- L69 — variável: `TRIAGE_COLUMNS`
- L122 — variável: `row`
- L151 — retorno da função: `<anônima>()`
- L162 — variável: `raw`
- L181 — variável: `source`
- L210 — variável: `updatedRows`
- L278 — parâmetro: `trx`
- L278 — retorno da função: `<anônima>()`

### [src/modules/requests/triage/triage.router.ts](../src/modules/requests/triage/triage.router.ts)

- L6 — variável: `triageRoutes`

### [src/modules/requests/triage/triage.schema.ts](../src/modules/requests/triage/triage.schema.ts)

- L33 — variável: `triageChoice`
- L35 — retorno da função: `<anônima>()`
- L35 — variável: `textField`
- L42 — variável: `createTriagePayloadSchema`
- L80 — parâmetro: `ctx`
- L80 — parâmetro: `value`
- L80 — retorno da função: `<anônima>()`

### [src/modules/requests/triage/triage.service.ts](../src/modules/requests/triage/triage.service.ts)

- L28 — parâmetro: `trx`
- L28 — retorno da função: `<anônima>()`
- L44 — variável: `request`
- L51 — variável: `canAccess`
- L66 — variável: `request`
- L87 — variável: `canAccess`
- L102 — variável: `exitStatus`
- L123 — variável: `categoryName`
- L125 — variável: `newCategory`

### [src/modules/users/users.controller.ts](../src/modules/users/users.controller.ts)

- L18 — variável: `id`
- L25 — variável: `getUserMetrics`
- L26 — variável: `metrics`
- L31 — variável: `listAnalysts`
- L32 — variável: `analysts`
- L36 — variável: `listUsers`
- L37 — variável: `parsed`
- L43 — variável: `users`
- L48 — variável: `createUser`
- L49 — variável: `parsed`
- L52 — variável: `{ message, fields }`
- L56 — variável: `created`
- L61 — variável: `updateUser`
- L62 — variável: `parsed`
- L65 — variável: `{ message, fields }`
- L69 — variável: `updated`
- L79 — variável: `getUser`
- L80 — variável: `user`
- L85 — variável: `changeUserStatus`
- L86 — variável: `parsed`
- L92 — variável: `updated`
- L102 — variável: `resetUserPassword`
- L103 — variável: `reset`
- L112 — variável: `getMyProfile`
- L113 — variável: `profile`
- L124 — variável: `updateMyProfile`
- L145 — variável: `rawReq`
- L162 — variável: `parsed`
- L167 — variável: `updated`

### [src/modules/users/users.repository.ts](../src/modules/users/users.repository.ts)

- L27 — variável: `row`
- L57 — variável: `PROFESSIONAL_PROFILES`
- L92 — variável: `inserted`
- L102 — variável: `row`
- L136 — variável: `corporateEmail`
- L140 — variável: `hasRequester`
- L201 — variável: `user`
- L208 — variável: `[requester, professional]`
- L236 — retorno da função: `<anônima>()`
- L269 — variável: `updated`
- L280 — variável: `adopted`
- L317 — variável: `specialties`
- L318 — variável: `attendedCategoryIds`
- L321 — variável: `updated`
- L359 — retorno da função: `baseQuery()`
- L362 — parâmetro: `builder`
- L362 — retorno da função: `<anônima>()`
- L367 — variável: `escapedSearch`
- L368 — parâmetro: `inner`
- L368 — retorno da função: `<anônima>()`
- L378 — variável: `countRows`
- L381 — variável: `total`
- L383 — variável: `rows`
- L400 — parâmetro: `row`
- L400 — retorno da função: `<anônima>()`
- L423 — variável: `updated`
- L444 — variável: `updated`
- L473 — variável: `updated`
- L496 — variável: `rows`
- L506 — parâmetro: `builder`
- L506 — retorno da função: `<anônima>()`
- L522 — variável: `categoryMap`
- L523 — variável: `categories`
- L526 — variável: `cat`
- L534 — variável: `professionalIds`
- L535 — parâmetro: `r`
- L535 — retorno da função: `<anônima>()`
- L536 — parâmetro: `id`
- L537 — variável: `counts`
- L542 — variável: `countByProfessional`
- L543 — variável: `c`
- L547 — parâmetro: `row`
- L547 — retorno da função: `<anônima>()`
- L550 — variável: `part`
- L551 — variável: `id`
- L553 — variável: `name`
- L574 — variável: `fetchUserMetrics`
- L575 — variável: `result`
- L616 — variável: `next`
- L634 — variável: `anon`

### [src/modules/users/users.router.ts](../src/modules/users/users.router.ts)

- L18 — variável: `usersRoutes`

### [src/modules/users/users.schema.ts](../src/modules/users/users.schema.ts)

- L14 — variável: `professionalSchema`
- L24 — variável: `PROFESSIONAL_ROLE`
- L26 — variável: `requesterSchema`
- L33 — variável: `createUserSchema`
- L41 — parâmetro: `ctx`
- L41 — parâmetro: `value`
- L41 — retorno da função: `<anônima>()`
- L42 — variável: `isAnalyst`
- L59 — variável: `listUsersQuerySchema`
- L81 — variável: `requesterPatchSchema`
- L88 — variável: `changeUserStatusSchema`
- L92 — variável: `updateUserSchema`
- L105 — parâmetro: `ctx`
- L105 — parâmetro: `value`
- L105 — retorno da função: `<anônima>()`
- L107 — variável: `isAnalyst`

### [src/modules/users/users.service.ts](../src/modules/users/users.service.ts)

- L35 — variável: `AVATAR_DIR`
- L36 — variável: `ROLE_ANALYST`
- L38 — variável: `CHANGE_ORIGIN_ADMIN`
- L47 — variável: `id`
- L70 — variável: `profileId`
- L83 — variável: `getUserMetrics`
- L95 — variável: `profileId`
- L103 — variável: `temporaryPassword`
- L104 — variável: `passwordHash`
- L111 — parâmetro: `trx`
- L111 — retorno da função: `<anônima>()`
- L112 — variável: `created`
- L125 — variável: `professional`
- L148 — variável: `error`
- L177 — variável: `id`
- L183 — variável: `user`
- L192 — parâmetro: `trx`
- L192 — retorno da função: `<anônima>()`
- L215 — variável: `id`
- L221 — variável: `user`
- L228 — variável: `temporaryPassword`
- L229 — variável: `passwordHash`
- L233 — parâmetro: `trx`
- L233 — retorno da função: `<anônima>()`
- L282 — variável: `row`
- L336 — variável: `user`
- L342 — variável: `snapshot`
- L343 — variável: `previousValue`
- L350 — parâmetro: `trx`
- L350 — retorno da função: `<anônima>()`
- L362 — variável: `changesAdministrativeFields`
- L397 — variável: `url`
- L400 — variável: `url`
- L428 — variável: `saved`
- L429 — variável: `attachment`
- L437 — variável: `key`
- L438 — variável: `storagePath`
- L439 — retorno da função: `<anônima>()`
- L456 — variável: `id`
- L462 — variável: `target`
- L467 — variável: `isTargetAdmin`
- L468 — variável: `hasNonRequesterPatch`
- L481 — variável: `pid`
- L485 — variável: `role`
- L490 — variável: `finalRoleName`
- L491 — variável: `isFinalAnalyst`
- L492 — variável: `wasAnalyst`
- L510 — variável: `before`
- L513 — parâmetro: `trx`
- L513 — retorno da função: `<anônima>()`
- L523 — variável: `fullName`
- L524 — variável: `corporateEmail`
- L537 — variável: `fullName`
- L538 — variável: `corporateEmail`
- L558 — variável: `error`
- L565 — variável: `updated`
- L576 — retorno da função: `<anônima>()`

### [src/router.ts](../src/router.ts)

- L16 — variável: `router`

### [src/server.ts](../src/server.ts)

- L5 — variável: `PORT`
- L8 — parâmetro: `e`
- L8 — retorno da função: `<anônima>()`
- L10 — retorno da função: `<anônima>()`

### [src/shared/audit/auditCatalog.ts](../src/shared/audit/auditCatalog.ts)

- L13 — variável: `auditCatalog`
- L71 — variável: `CHANGE_ORIGINS`
- L100 — parâmetro: `action`
- L100 — retorno da função: `<anônima>()`

### [src/shared/catalog/fieldCatalog.ts](../src/shared/catalog/fieldCatalog.ts)

- L6 — variável: `FIELD_KEYS`
- L162 — variável: `value`
- L164 — variável: `date`

### [src/shared/errors/AppError.ts](../src/shared/errors/AppError.ts)

- L5 — parâmetro: `statusCode`

### [src/shared/middleware/accessMode.ts](../src/shared/middleware/accessMode.ts)

- L19 — retorno da função: `requireAccessMode()`
- L27 — variável: `error`

### [src/shared/middleware/auth.ts](../src/shared/middleware/auth.ts)

- L9 — variável: `{ JsonWebTokenError, NotBeforeError, TokenExpiredError }`
- L10 — variável: `COOKIE_NAME`
- L25 — variável: `token`
- L35 — variável: `userState`
- L47 — variável: `scope`
- L54 — variável: `isPendingChangeAllowedRoute`
- L66 — variável: `tokenPasswordChangedAt`
- L67 — variável: `currentPasswordChangedAt`
- L87 — variável: `error`

### [src/shared/middleware/dualAuth.ts](../src/shared/middleware/dualAuth.ts)

- L20 — variável: `hasCookie`
- L27 — variável: `identity`

### [src/shared/middleware/errorHandler.ts](../src/shared/middleware/errorHandler.ts)

- L25 — variável: `fields`
- L34 — variável: `maybeHttp`
- L35 — variável: `statusCode`

### [src/shared/middleware/rateLimit.ts](../src/shared/middleware/rateLimit.ts)

- L7 — retorno da função: `createRateLimiter()`
- L8 — variável: `{ windowMs, limit, keyGenerator }`
- L9 — variável: `buckets`
- L12 — variável: `normalized`
- L13 — variável: `now`
- L14 — variável: `arr`
- L15 — parâmetro: `t`
- L15 — retorno da função: `<anônima>()`
- L15 — variável: `recent`

### [src/shared/middleware/requireRole.ts](../src/shared/middleware/requireRole.ts)

- L9 — retorno da função: `requireRole()`
- L21 — variável: `expected`

### [src/shared/middleware/upload.ts](../src/shared/middleware/upload.ts)

- L5 — variável: `ALLOWED_MIMES`
- L13 — variável: `MAX_FILE_SIZE_BYTES`
- L14 — variável: `MAX_ATTACHMENT_COUNT`
- L15 — variável: `MAX_FIELD_SIZE_BYTES`
- L17 — variável: `upload`
- L24 — parâmetro: `_req`
- L24 — parâmetro: `cb`
- L24 — parâmetro: `file`
- L24 — retorno da função: `<anônima>()`
- L35 — variável: `multerFields`
- L49 — parâmetro: `err`
- L49 — retorno da função: `<anônima>()`

### [src/shared/middleware/uploadAssets.ts](../src/shared/middleware/uploadAssets.ts)

- L57 — parâmetro: `r`
- L57 — retorno da função: `<anônima>()`
- L57 — variável: `MAX_FILE_SIZE`
- L58 — variável: `MAX_FIELD_SIZE`
- L60 — variável: `upload`
- L68 — parâmetro: `_req`
- L68 — parâmetro: `cb`
- L68 — parâmetro: `file`
- L68 — retorno da função: `<anônima>()`
- L69 — variável: `rules`
- L75 — variável: `ext`
- L100 — variável: `multerFields`
- L124 — parâmetro: `err`
- L124 — retorno da função: `<anônima>()`
- L131 — variável: `message`
- L132 — variável: `statusCode`
- L147 — variável: `files`
- L153 — variável: `[fieldName, fileArray]`
- L154 — variável: `rules`
- L157 — variável: `file`
- L159 — variável: `maxMb`

### [src/shared/middleware/uploadAvatar.ts](../src/shared/middleware/uploadAvatar.ts)

- L14 — variável: `avatarRules`
- L20 — variável: `MAX_FIELD_SIZE`
- L22 — variável: `upload`
- L30 — parâmetro: `_req`
- L30 — parâmetro: `cb`
- L30 — parâmetro: `file`
- L30 — retorno da função: `<anônima>()`
- L36 — variável: `ext`
- L61 — variável: `single`
- L70 — parâmetro: `err`
- L70 — retorno da função: `<anônima>()`
- L77 — variável: `message`
- L78 — variável: `statusCode`

### [src/shared/protocol/generateProtocol.ts](../src/shared/protocol/generateProtocol.ts)

- L4 — variável: `ALPHABET`
- L5 — variável: `CODE_LENGTH`
- L6 — variável: `CODE_BITS`
- L7 — variável: `HALF_BITS`
- L8 — variável: `HALF_MASK`
- L9 — variável: `DOMAIN`
- L10 — variável: `ROUNDS`
- L15 — variável: `digest`
- L18 — variável: `chunk`
- L23 — variável: `left`
- L24 — variável: `right`
- L26 — variável: `round`
- L27 — variável: `nextLeft`
- L28 — variável: `nextRight`
- L37 — variável: `code`
- L38 — variável: `index`
- L39 — variável: `shift`
- L40 — variável: `charIndex`
- L50 — variável: `value`
- L56 — variável: `code`

### [src/shared/storage/fileStorage.ts](../src/shared/storage/fileStorage.ts)

- L22 — variável: `dir`
- L27 — variável: `i`
- L28 — variável: `file`
- L30 — variável: `prefix`
- L31 — variável: `filename`
- L32 — variável: `storagePath`
- L42 — variável: `err`
- L52 — parâmetro: `attachment`
- L52 — retorno da função: `<anônima>()`

### [src/shared/types/criteria.ts](../src/shared/types/criteria.ts)

- L22 — parâmetro: `[key, id]`
- L22 — retorno da função: `<anônima>()`

### [src/shared/types/portalConfig.ts](../src/shared/types/portalConfig.ts)

- L33 — variável: `ASSET_KEYS`
- L55 — variável: `THEME_TOKEN_KEYS`
- L151 — variável: `PRIORITIZATION_CRITERIA`

### [src/shared/types/requests.ts](../src/shared/types/requests.ts)

- L10 — variável: `REQUEST_PRIORITIES`
- L21 — variável: `TERMINAL_STATUSES`

### [src/shared/types/role.ts](../src/shared/types/role.ts)

- L1 — variável: `ROLES`

### [src/shared/types/status.ts](../src/shared/types/status.ts)

- L10 — variável: `STATUS_IDS`
- L23 — variável: `CORE_STATUS_IDS`

### [src/shared/types/systemTheme.ts](../src/shared/types/systemTheme.ts)

- L2 — variável: `STATUS_TONES`
- L6 — variável: `THEME_TOKEN_KEYS`

### [src/shared/utils/date.ts](../src/shared/utils/date.ts)

- L13 — variável: `date`
- L32 — variável: `date`
- L38 — retorno da função: `<anônima>()`
- L38 — variável: `pad`
- L49 — variável: `date`
- L69 — variável: `year`
- L70 — variável: `month`
- L71 — variável: `day`
- L81 — variável: `year`
- L82 — variável: `month`
- L83 — variável: `day`
- L84 — variável: `hours`
- L85 — variável: `minutes`

### [src/shared/utils/ensureDefaultAssets.ts](../src/shared/utils/ensureDefaultAssets.ts)

- L19 — variável: `uploadRoot`
- L20 — variável: `assetsRootCandidates`
- L30 — variável: `p`
- L46 — variável: `[srcName, destRel]`
- L47 — variável: `src`
- L48 — variável: `dest`
- L58 — variável: `e`
- L66 — variável: `destToColumn`
- L76 — variável: `[, destRel]`
- L77 — variável: `column`
- L79 — variável: `url`
- L81 — variável: `hasCol`
- L85 — parâmetro: `qb`
- L85 — retorno da função: `<anônima>()`
- L89 — variável: `e`

### [src/shared/utils/json.ts](../src/shared/utils/json.ts)

- L8 — parâmetro: `_`
- L8 — parâmetro: `v`
- L8 — retorno da função: `<anônima>()`
- L11 — parâmetro: `[a]`
- L11 — parâmetro: `[b]`
- L11 — retorno da função: `<anônima>()`

### [src/shared/utils/jwtUtil.ts](../src/shared/utils/jwtUtil.ts)

- L7 — variável: `{ sign, verify }`
- L23 — variável: `secret`
- L24 — variável: `expiresIn`
- L34 — variável: `secret`
- L40 — variável: `decoded`
- L54 — variável: `scope`

### [src/shared/utils/passwordHandler.ts](../src/shared/utils/passwordHandler.ts)

- L7 — variável: `salt`
- L9 — variável: `hashedPassword`
- L19 — variável: `match`
- L31 — parâmetro: `length`

### [src/shared/utils/requesterIdentity.ts](../src/shared/utils/requesterIdentity.ts)

- L7 — variável: `obj`

### [src/shared/utils/roleUtils.ts](../src/shared/utils/roleUtils.ts)

- L15 — variável: `role`

### [src/shared/validation/fieldSchemas.ts](../src/shared/validation/fieldSchemas.ts)

- L3 — retorno da função: `<anônima>()`
- L3 — variável: `ptNumber`
- L5 — retorno da função: `<anônima>()`
- L5 — variável: `requiredString`
- L12 — retorno da função: `<anônima>()`
- L12 — variável: `optionalString`
- L17 — parâmetro: `value`
- L17 — retorno da função: `<anônima>()`
- L20 — variável: `emailSchema`
- L27 — variável: `passwordSchema`
- L30 — parâmetro: `value`
- L30 — retorno da função: `<anônima>()`
- L32 — variável: `TEXT_PATTERN`
- L38 — variável: `PROFILE_AREA_MAX_LENGTH`
- L39 — variável: `PROFILE_DEPARTMENT_MAX_LENGTH`
- L40 — variável: `PROFILE_MANAGER_MAX_LENGTH`
- L41 — variável: `PROFILE_ADDITIONAL_CONTACT_MAX_LENGTH`
- L43 — retorno da função: `<anônima>()`
- L43 — variável: `requiredText`
- L44 — parâmetro: `value`
- L44 — retorno da função: `<anônima>()`
- L48 — retorno da função: `<anônima>()`
- L48 — variável: `optionalText`
- L53 — parâmetro: `value`
- L53 — retorno da função: `<anônima>()`
- L56 — parâmetro: `value`
- L56 — retorno da função: `<anônima>()`
- L59 — retorno da função: `<anônima>()`
- L59 — variável: `nullableOptionalString`
- L66 — parâmetro: `value`
- L66 — retorno da função: `<anônima>()`

### [src/shared/validation/zodErrors.ts](../src/shared/validation/zodErrors.ts)

- L11 — variável: `MAX_PATH_LENGTH`
- L28 — variável: `isMissing`
- L34 — variável: `match`
- L35 — variável: `translated`
- L41 — variável: `raw`
- L46 — variável: `key`
- L53 — parâmetro: `issue`
- L53 — retorno da função: `<anônima>()`
- L62 — variável: `seen`
- L66 — variável: `missingFields`
- L67 — parâmetro: `issue`
- L67 — retorno da função: `<anônima>()`
- L72 — variável: `details`
- L73 — parâmetro: `issue`
- L73 — retorno da função: `<anônima>()`
- L77 — parâmetro: `detail`
- L77 — retorno da função: `<anônima>()`
- L82 — parâmetro: `detail`
- L82 — retorno da função: `<anônima>()`
- L89 — parâmetro: `rootLabel`
- L102 — parâmetro: `rootLabel`
- L104 — variável: `grouped`
- L107 — variável: `issue`
- L110 — variável: `issue`
- L111 — variável: `key`

## 3. Declarações com tipo efetivo `any`

### [src/modules/auth/auth.repository.ts](../src/modules/auth/auth.repository.ts)

- L87 — variável: `passwordChangedAt`

### [src/modules/pendingItems/pendingItems.repository.ts](../src/modules/pendingItems/pendingItems.repository.ts)

- L23 — variável: `row`
- L44 — variável: `row`
- L62 — variável: `row`
- L85 — variável: `row`
- L231 — variável: `row`
- L281 — variável: `row`
- L303 — variável: `row`
- L308 — variável: `row`
- L439 — variável: `requiresAttachment`
- L624 — variável: `requesterRow`
- L649 — variável: `category`

### [src/modules/pendingItems/pendingItems.router.ts](../src/modules/pendingItems/pendingItems.router.ts)

- L54 — parâmetro: `err`

### [src/modules/portalConfig/portalConfig.controller.ts](../src/modules/portalConfig/portalConfig.controller.ts)

- L106 — variável: `rawAssets`

### [src/modules/portalConfig/portalConfig.repository.ts](../src/modules/portalConfig/portalConfig.repository.ts)

- L251 — variável: `row`

### [src/modules/prioritization/prioritization.repository.ts](../src/modules/prioritization/prioritization.repository.ts)

- L17 — variável: `row`
- L24 — variável: `row`
- L57 — variável: `row`

### [src/modules/queue/mapping.repository.ts](../src/modules/queue/mapping.repository.ts)

- L86 — variável: `row`
- L154 — variável: `row`
- L177 — variável: `row`
- L191 — variável: `row`
- L206 — variável: `row`
- L262 — parâmetro: `r`
- L262 — variável: `row`
- L271 — parâmetro: `row`
- L290 — variável: `[row]`

### [src/modules/queue/queue.repository.ts](../src/modules/queue/queue.repository.ts)

- L51 — variável: `result`

### [src/modules/requests/requests.repository.ts](../src/modules/requests/requests.repository.ts)

- L125 — variável: `row`
- L340 — variável: `row`
- L433 — variável: `response`
- L653 — variável: `row`
- L761 — variável: `row`
- L871 — variável: `row`

### [src/modules/requests/requests.service.ts](../src/modules/requests/requests.service.ts)

- L191 — parâmetro: `value`

### [src/modules/requests/triage/triage.repository.ts](../src/modules/requests/triage/triage.repository.ts)

- L122 — variável: `row`

### [src/modules/users/users.repository.ts](../src/modules/users/users.repository.ts)

- L27 — variável: `row`
- L201 — variável: `user`
- L208 — variável: `[requester, professional]`
- L575 — variável: `result`
- L634 — variável: `anon`

### [src/server.ts](../src/server.ts)

- L8 — parâmetro: `e`

### [src/shared/middleware/auth.ts](../src/shared/middleware/auth.ts)

- L25 — variável: `token`

### [src/shared/middleware/upload.ts](../src/shared/middleware/upload.ts)

- L49 — parâmetro: `err`

### [src/shared/middleware/uploadAssets.ts](../src/shared/middleware/uploadAssets.ts)

- L124 — parâmetro: `err`

### [src/shared/middleware/uploadAvatar.ts](../src/shared/middleware/uploadAvatar.ts)

- L70 — parâmetro: `err`

### [src/shared/utils/json.ts](../src/shared/utils/json.ts)

- L8 — parâmetro: `v`
- L8 — retorno da função: `<anônima>()`
