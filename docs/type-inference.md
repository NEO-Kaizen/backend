# InventÃ¡rio de tipagens TypeScript

> Arquivo gerado por `npm run docs:types` a partir dos arquivos `src/**/*.ts` e do `tsconfig.json` do projeto. NÃ£o edite manualmente: rode o comando para atualizar. NÃ£o inclui dependÃªncias nem arquivos `.d.ts`.

## Resumo

- Arquivos-fonte analisados: **177**.
- Tipos nomeados: **313** â€” 219 interfaces, 92 aliases `type`, 2 classes e 0 enums.
- DeclaraÃ§Ãµes sem anotaÃ§Ã£o explÃ­cita: **1910** â€” 1401 variÃ¡veis, 252 parÃ¢metros e 257 retornos de funÃ§Ãµes/mÃ©todos.
- DeclaraÃ§Ãµes com tipo efetivo `any` detectado pelo checker: **46**; ocorrÃªncias com a palavra-chave `any` explÃ­cita no cÃ³digo-fonte: **0**.
- Arquivos com pelo menos uma declaraÃ§Ã£o sem anotaÃ§Ã£o: **133**; arquivos sem ocorrÃªncias sÃ£o omitidos das seÃ§Ãµes 2 e 3.
- Erros de typecheck no momento da geraÃ§Ã£o: **0** (mesmo `tsconfig.json`; 0 significa que `npm run typecheck` passa).

## Como interpretar

- **Tipados:** as definiÃ§Ãµes abaixo mostram os tipos nomeados (interfaces, aliases, classes e enums) como estÃ£o declarados no cÃ³digo. As anotaÃ§Ãµes de propriedades e membros aparecem nas prÃ³prias definiÃ§Ãµes.
- **Sem anotaÃ§Ã£o explÃ­cita:** a declaraÃ§Ã£o nÃ£o traz `: Tipo` no local indicado. Isso **nÃ£o** significa necessariamente falta de tipo: o compilador pode inferi-lo pelo inicializador, contexto ou assinatura. A lista inclui variÃ¡veis (inclusive destructuring, `for...of`/`for...in` e variÃ¡vel de `catch`), parÃ¢metros e retornos de funÃ§Ãµes, mÃ©todos e getters.
- **`any`:** o checker determinou tipo efetivo `any` para os itens listados. Em destructuring, o item Ã© marcado quando o padrÃ£o ou qualquer elemento tem tipo `any`. A lista deve ser revisada priorizando as fronteiras com bibliotecas e APIs sem tipo suficientemente especÃ­fico.
- **Linhas:** referem-se ao estado do cÃ³digo no momento da geraÃ§Ã£o. Como os nÃºmeros mudam a cada alteraÃ§Ã£o em `src/`, valide com `npm run docs:types:check` antes de publicar mudanÃ§as de tipagem.

## 1. Tipos nomeados e suas definiÃ§Ãµes

### [src/docs/swagger.ts](../src/docs/swagger.ts)

#### L24 â€” interface SwaggerInterceptorRequest

```ts
interface SwaggerInterceptorRequest {
  withCredentials: boolean;
  headers: Record<string, string>;
  [key: string]: unknown;
}
```

### [src/modules/auditHistory/auditHistory.repository.ts](../src/modules/auditHistory/auditHistory.repository.ts)

#### L6 â€” interface AuditAccessScope

```ts
export interface AuditAccessScope {
  readonly responsibleUserId: number | null;
}
```

#### L10 â€” interface AuditSummaryRow

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

#### L19 â€” interface AuditCountRow

```ts
interface AuditCountRow {
  total: number | string;
}
```

#### L23 â€” interface AuditHistoryDetailRow

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

#### L52 â€” interface AuthState

```ts
export interface AuthState {
  is_active: boolean;
  profile_is_active: boolean;
  profile_name: string;
  must_change_password: boolean;
  password_changed_at: Date;
}
```

#### L74 â€” interface UserPermissionRow

```ts
export interface UserPermissionRow {
  permission_key: string;
  custody: string;
}
```

### [src/modules/auth/auth.service.ts](../src/modules/auth/auth.service.ts)

#### L15 â€” interface SessionUserResult

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

#### L27 â€” interface SessionUserWithPermissions

```ts
export interface SessionUserWithPermissions extends SessionUserResult {
  permissions: EffectivePermission[];
}
```

### [src/modules/DTOs/auditHistory/AuditHistory.dto.ts](../src/modules/DTOs/auditHistory/AuditHistory.dto.ts)

#### L3 â€” interface AuditHistoryQuery

```ts
export interface AuditHistoryQuery {
  page?: number;
  limit?: number;
  entityType?: AuditEntityType;
}
```

#### L9 â€” interface AuditActor

```ts
export interface AuditActor {
  kind: "system" | "user";
  userId: number | null;
  displayName: string | null;
}
```

#### L15 â€” interface AuditHistorySummary

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

#### L25 â€” interface AuditHistoryDetail

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

#### L44 â€” interface AuditHistoryListResponse

```ts
export interface AuditHistoryListResponse {
  items: AuditHistorySummary[];
  total: number;
  page: number;
  limit: number;
}
```

### [src/modules/DTOs/auth/ChangePasswordRequest.dto.ts](../src/modules/DTOs/auth/ChangePasswordRequest.dto.ts)

#### L1 â€” interface ChangePasswordRequest

```ts
export interface ChangePasswordRequest {
  currentPassword: string;
  newPassword: string;
  confirmNewPassword: string;
}
```

### [src/modules/DTOs/auth/ChangePasswordResponse.dto.ts](../src/modules/DTOs/auth/ChangePasswordResponse.dto.ts)

#### L3 â€” interface ChangePasswordResponseDTO

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

#### L1 â€” interface LoginRequestDTO

```ts
export interface LoginRequestDTO {
  email: string;
  password: string;
}
```

### [src/modules/DTOs/auth/LoginResponse.dto.ts](../src/modules/DTOs/auth/LoginResponse.dto.ts)

#### L3 â€” interface LoginResponseDTO

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

#### L4 â€” interface MeResponseDTO

```ts
export interface MeResponseDTO {
  id: string;
  name: string;
  email: string;
  avatarUrl: string | null;
  role: Role;
  mustChangePassword: boolean;
  /** Lista efetiva do Perfil vigente, na ordem do catálogo de Permissões (§ 8). */
  permissions: EffectivePermission[];
}
```

### [src/modules/DTOs/internalNotes/InternalNotes.dto.ts](../src/modules/DTOs/internalNotes/InternalNotes.dto.ts)

#### L9 â€” interface TimelineActorDTO

```ts
export interface TimelineActorDTO {
  id: string;
  name: string;
  role: Role;
}
```

#### L15 â€” interface TimelineNote

```ts
export interface TimelineNote {
  type: "note";
  id: string;
  content: string;
  createdAt: string;
  author: TimelineActorDTO;
}
```

#### L23 â€” interface TimelineEvent

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

#### L40 â€” alias TimelineItem

```ts
export type TimelineItem = TimelineNote | TimelineEvent;
```

#### L42 â€” interface TriageHistoryEntry

```ts
export interface TriageHistoryEntry {
  triage: TriageAssessment;
  occurredAt: string;
}
```

#### L47 â€” interface MappingHistoryEntry

```ts
export interface MappingHistoryEntry {
  mapping: MappingResponseDTO;
  occurredAt: string;
}
```

#### L52 â€” interface InternalNotesResponse

```ts
export interface InternalNotesResponse {
  items: TimelineItem[];
  nextCursor: string | null;
  unseenCount: number;
  triages: TriageHistoryEntry[];
  mappings: MappingHistoryEntry[];
}
```

#### L60 â€” interface CreateInternalNoteRequest

```ts
export interface CreateInternalNoteRequest {
  content: string;
}
```

#### L64 â€” interface MarkInternalNotesReadRequest

```ts
export interface MarkInternalNotesReadRequest {
  lastReadNoteId: string;
}
```

### [src/modules/DTOs/notifications/Notifications.dto.ts](../src/modules/DTOs/notifications/Notifications.dto.ts)

#### L7 â€” interface NotificationItem

```ts
export interface NotificationItem {
  id: string;
  type: NotificationEventType;
  payload: NotificationPayload;
  readAt: string | null;
  createdAt: string;
}
```

#### L15 â€” interface NotificationListResponse

```ts
export interface NotificationListResponse {
  items: NotificationItem[];
  /** Cursor opaco para a próxima página; `null` na última. */
  nextCursor: string | null;
}
```

#### L21 â€” interface NotificationUnreadCountResponse

```ts
export interface NotificationUnreadCountResponse {
  unreadCount: number;
}
```

#### L25 â€” interface NotificationMarkReadResponse

```ts
export interface NotificationMarkReadResponse {
  id: string;
  readAt: string;
}
```

#### L30 â€” interface NotificationMarkAllReadResponse

```ts
export interface NotificationMarkAllReadResponse {
  markedRead: number;
}
```

### [src/modules/DTOs/pendingItems/PendingItems.dto.ts](../src/modules/DTOs/pendingItems/PendingItems.dto.ts)

#### L23 â€” interface PendingItem

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

#### L40 â€” interface CreatePendingItemsBody

```ts
export interface CreatePendingItemsBody {
  observation?: string;
  requestAttachment?: boolean;
  items?: Array<{ fieldKey: string; comment: string }>;
}
```

#### L46 â€” interface CreatePendingItemsResponse

```ts
export interface CreatePendingItemsResponse {
  batchId: string;
  requestAttachment: boolean;
  items: PendingItem[];
}
```

#### L57 â€” interface ListPendingItemsResponse

```ts
export interface ListPendingItemsResponse {
  batchId: string | null;
  requestAttachment: boolean;
  items: PendingItem[];
}
```

#### L63 â€” alias ReviewDecision

```ts
export type ReviewDecision = "validate" | "reopen";
```

#### L65 â€” alias ReviewPendingItemDecision

```ts
export type ReviewPendingItemDecision =
  | { id: string; decision: "validate"; note?: string }
  | { id: string; decision: "reopen"; comment: string };
```

#### L69 â€” interface ReviewPendingItemsBody

```ts
export interface ReviewPendingItemsBody {
  batchId: string;
  requestAttachment?: boolean;
  items: ReviewPendingItemDecision[];
}
```

#### L75 â€” interface ReviewPendingItemsResponse

```ts
export interface ReviewPendingItemsResponse {
  batchId: string;
  items: PendingItem[];
}
```

### [src/modules/DTOs/portalConfig/PortalConfigRequests.dto.ts](../src/modules/DTOs/portalConfig/PortalConfigRequests.dto.ts)

#### L10 â€” interface UpdateAccessRequest

```ts
export interface UpdateAccessRequest {
  solicitationMode: "PUBLIC" | "AUTHENTICATED";
}
```

#### L15 â€” interface UpdateIdentityRequest

```ts
export interface UpdateIdentityRequest {
  platformName?: string;
  protocolMask?: string;
}
```

#### L21 â€” interface UpdateThemeRequest

```ts
export interface UpdateThemeRequest {
  theme: ThemeSection["theme"];
}
```

#### L30 â€” alias PortalAssetsPatchDto

```ts
export type PortalAssetsPatchDto = Partial<Record<AssetKey, string>> & {
  logoUsePrimaryColor?: boolean;
};
```

#### L35 â€” interface UpdateCategoriesRequest

```ts
export interface UpdateCategoriesRequest {
  categories: CategoriesSection["categories"];
}
```

#### L40 â€” interface UpdateStatusesRequest

```ts
export interface UpdateStatusesRequest {
  statuses: StatusesSection["statuses"];
}
```

#### L45 â€” interface UpdatePrioritizationWeightsRequest

```ts
export interface UpdatePrioritizationWeightsRequest {
  prioritizationWeights: PrioritizationWeightsSection["prioritizationWeights"];
}
```

### [src/modules/DTOs/portalConfig/PortalConfigResponse.dto.ts](../src/modules/DTOs/portalConfig/PortalConfigResponse.dto.ts)

#### L2 â€” alias PortalConfigResponse

```ts
export type PortalConfigResponse = import("../../../shared/types/portalConfig.ts").PortalConfig;
```

### [src/modules/DTOs/prioritization/PrioritizationRequests.dto.ts](../src/modules/DTOs/prioritization/PrioritizationRequests.dto.ts)

#### L4 â€” interface EvaluatePrioritizationRequest

```ts
export interface EvaluatePrioritizationRequest {
  notes: Record<string, number>;
  justification?: string;
}
```

#### L10 â€” interface EvaluationSnapshot

```ts
export interface EvaluationSnapshot {
  notes: Record<string, number>;
  score: number;
  classification: Classification;
}
```

### [src/modules/DTOs/prioritization/PrioritizationResponse.dto.ts](../src/modules/DTOs/prioritization/PrioritizationResponse.dto.ts)

#### L4 â€” interface CriterionResponse

```ts
export interface CriterionResponse {
  id: string;
  name: string;
  weight: number;
}
```

#### L11 â€” interface ListCriteriaResponse

```ts
export interface ListCriteriaResponse {
  criteria: CriterionResponse[];
}
```

#### L16 â€” interface EvaluatePrioritizationResponse

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

#### L9 â€” alias MappingModality

```ts
export type MappingModality = "REMOTE" | "IN_PERSON";
```

#### L16 â€” interface MappingParticipant

```ts
export interface MappingParticipant {
  id: string | null;
  name: string;
  email: string;
}
```

#### L27 â€” interface MappingParticipantInput

```ts
export interface MappingParticipantInput {
  id?: string;
  name: string;
  email: string;
}
```

#### L34 â€” interface MappingValues

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

#### L44 â€” interface ResolvedParticipant

```ts
export interface ResolvedParticipant {
  userId: number | null;
  name: string;
  email: string;
}
```

#### L60 â€” interface MappingAssignee

```ts
export interface MappingAssignee {
  id: string;
  userId: string;
  name: string;
  email: string;
  jobTitle: string | null;
}
```

#### L72 â€” interface MappingResponseDTO

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

#### L102 â€” interface MappingPayloadDTO

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

#### L120 â€” interface MappingActor

```ts
export interface MappingActor {
  id: number;
  email: string;
  role: Role;
}
```

### [src/modules/DTOs/queue/queue.dto.ts](../src/modules/DTOs/queue/queue.dto.ts)

#### L7 â€” interface FindQueueParams

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

#### L4 â€” alias DashboardSituation

```ts
export type DashboardSituation = "open" | "closed" | "overdue" | "unassigned";
```

#### L11 â€” alias DashboardPriorityFilter

```ts
export type DashboardPriorityFilter = number | "unassigned";
```

#### L13 â€” interface DashboardQuery

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

#### L22 â€” interface DashboardSummary

```ts
export interface DashboardSummary {
  total: number;
  open: number;
  closed: number;
  overdue: number;
  unassigned: number;
}
```

#### L30 â€” interface DashboardStatusMetric

```ts
export interface DashboardStatusMetric {
  id: number;
  name: string;
  count: number;
  tone: StatusTone;
  /**
   * Nome legado de `statuses.is_terminal` (ver `docs/rules/reports.md`).
   * O Motor de Status v4 expõe o mesmo conceito como `isTerminal` em
   * `PortalStatus`; mantido por compatibilidade do contrato do dashboard.
   */
  closesRequest: boolean;
}
```

#### L43 â€” interface DashboardPriorityMetric

```ts
export interface DashboardPriorityMetric {
  id: number | null;
  label: RequestPriority | "Não priorizada";
  count: number;
}
```

#### L49 â€” interface DashboardFilterOptions

```ts
export interface DashboardFilterOptions {
  statuses: Array<{ id: number; name: string }>;
  categories: Array<{ id: number; name: string }>;
  priorities: Array<{ id: number; label: RequestPriority }>;
}
```

#### L55 â€” interface DashboardCategoryMetric

```ts
export interface DashboardCategoryMetric {
  id: number;
  name: string;
  count: number;
}
```

#### L61 â€” interface DashboardTrendPoint

```ts
export interface DashboardTrendPoint {
  period: string;
  count: number;
}
```

#### L66 â€” interface DashboardResponse

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

#### L1 â€” interface QueueExportRow

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

#### L16 â€” interface QueueCsvExport

```ts
export interface QueueCsvExport {
  content: string;
  filename: string;
}
```

### [src/modules/DTOs/requests/RequestInternalDetail.dto.ts](../src/modules/DTOs/requests/RequestInternalDetail.dto.ts)

#### L27 â€” interface Assignee

```ts
export interface Assignee {
  /** `details_professional.user_id` serializado, ou `null` quando ausente. */
  id: string | null;
  name: string;
  email: string | null;
}
```

#### L34 â€” interface Prioritization

```ts
export interface Prioritization {
  score: number | null; // 10–50 (RN-007/RN-008, issue #51); null até ser avaliado
  maxScore: 50; // escala normalizada fixa — fonte: prioritization_evaluations
  label: string | null; // classificação RN-008 (ex.: "Alta"); null sem avaliação
}
```

#### L40 â€” interface Meeting

```ts
export interface Meeting {
  scheduledFor: string;
  link: string | null;
}
```

#### L45 â€” interface RequestInternalDetailDTO

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

#### L9 â€” interface CreateRequestPayload

```ts
export interface CreateRequestPayload {
  requester: RequesterBlock;
  demand: DemandBlock;
  operational: OperationalBlock;
  complementary?: ComplementaryBlock;
  schedulePreferences?: SchedulePreferences; // até 3 horários
}
```

#### L20 â€” interface UpdateRequesterBlock

```ts
export interface UpdateRequesterBlock {
  area: string;
  department?: string;
  manager: string;
  additionalContact?: string;
}
```

#### L30 â€” interface UpdateInternalRequestPayload

```ts
export interface UpdateInternalRequestPayload {
  requester: UpdateRequesterBlock;
  demand: DemandBlock;
  operational: OperationalBlock;
  complementary?: ComplementaryBlock;
}
```

#### L37 â€” interface ListRequestsQuery

```ts
export interface ListRequestsQuery {
  email: string;
  status?: string;
  page: number;
  pageSize: number;
}
```

#### L49 â€” alias ListRequestsInput

```ts
export type ListRequestsInput = Omit<ListRequestsQuery, "email"> & { email?: string };
```

#### L56 â€” interface UpdateStatusResponse

```ts
export interface UpdateStatusResponse {
  protocol: string;
  status: string;
  previous: string;
  next: string;
  lastUpdate: string;
}
```

#### L68 â€” interface RequestMutationAcknowledgement

```ts
export interface RequestMutationAcknowledgement {
  readonly protocol: string;
  readonly updated: true;
}
```

### [src/modules/DTOs/requests/RequestResponse.dto.ts](../src/modules/DTOs/requests/RequestResponse.dto.ts)

#### L3 â€” interface RequestDetail

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

#### L26 â€” interface CreateRequestResponse

```ts
export interface CreateRequestResponse {
  protocol: string; // "MAAT-8K3P-9X2M" — protocolo único de rastreio,
  // não enumerável (FPE/Feistel sobre o ID interno —
  // Especificação 3.0 §5.2)
  status: RequestStatus; // "Solicitação enviada"
  createdAt: string; // ISO datetime
}
```

#### L36 â€” interface AssigneeSummary

```ts
export interface AssigneeSummary {
  id: string; // professional_id
  name: string; // users.full_name
  email: string; // users.email
  jobTitle: string | null;
  capacity: number;
}
```

#### L44 â€” interface AssignRequestResponse

```ts
export interface AssignRequestResponse {
  protocol: string;
  assignee: { id: string; name: string; email: string } | null;
  /** Status após a operação — muda para "Aguardando mapeamento" quando a RN-010 dispara. */
  status: RequestStatus;
}
```

### [src/modules/DTOs/requests/RequestTracking.dto.ts](../src/modules/DTOs/requests/RequestTracking.dto.ts)

#### L21 â€” alias TrackingMode

```ts
export type TrackingMode = "public" | "authenticated";
```

#### L23 â€” interface Meeting

```ts
export interface Meeting {
  scheduledFor: string;
  link: string | null;
}
```

#### L28 â€” interface PublicOperationalImpacts

```ts
export interface PublicOperationalImpacts {
  mainRisks: string;
  clientImpact: string;
  operationalImpact: OperationalImpact;
  perceivedCriticality: RequestPriority;
  desiredDeadline: string;
}
```

#### L36 â€” interface RequesterOperational

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

#### L48 â€” interface RequesterAttachment

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

#### L57 â€” interface PublicRequestDetails

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

#### L69 â€” interface RequesterRequestDetails

```ts
export interface RequesterRequestDetails extends Omit<PublicRequestDetails, "impacts"> {
  operational: RequesterOperational;
  complementary?: ComplementaryBlock;
  schedulePreferences: string[] | null;
  mappingDate: string | null;
  attachments: RequesterAttachment[];
}
```

#### L77 â€” alias TrackingDetailsResponse

```ts
export type TrackingDetailsResponse =
  | { mode: "public"; details: PublicRequestDetails }
  | { mode: "authenticated"; details: RequesterRequestDetails };
```

### [src/modules/DTOs/users/UpdateProfileRequest.dto.ts](../src/modules/DTOs/users/UpdateProfileRequest.dto.ts)

#### L36 â€” alias UpdateRequesterBlock

```ts
export type UpdateRequesterBlock = z.infer<typeof updateRequesterSchema>;
```

#### L55 â€” alias UpdateProfilePayload

```ts
export type UpdateProfilePayload = z.infer<typeof updateProfileSchema>;
```

### [src/modules/DTOs/users/UserProfileResponse.dto.ts](../src/modules/DTOs/users/UserProfileResponse.dto.ts)

#### L4 â€” interface UserProfileResponseDTO

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

#### L15 â€” interface RequesterProfileBlock

```ts
export interface RequesterProfileBlock {
  area: string | null;
  department: string | null;
  manager: string | null;
  additionalContact: string | null;
}
```

#### L23 â€” interface ProfessionalProfileBlock

```ts
export interface ProfessionalProfileBlock {
  jobTitle: string | null;
  specialties: string[];
  attendedCategoryIds: number[];
  notes: string | null;
}
```

### [src/modules/DTOs/users/UserRequests.dto.ts](../src/modules/DTOs/users/UserRequests.dto.ts)

#### L3 â€” interface CreateProfessionalInput

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

#### L13 â€” interface RequesterInput

```ts
export interface RequesterInput {
  area: string;
  department?: string;
  manager: string;
  additionalContact?: string | null;
}
```

#### L20 â€” interface CreateUserRequest

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

#### L30 â€” interface UpdateUserRequest

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

#### L43 â€” interface ListUsersQuery

```ts
export interface ListUsersQuery {
  profile?: ProfileName;
  search?: string;
  page: number;
  pageSize: number;
}
```

#### L50 â€” interface ChangeUserStatusRequest

```ts
export interface ChangeUserStatusRequest {
  isActive: boolean;
}
```

### [src/modules/DTOs/users/UserResponse.dto.ts](../src/modules/DTOs/users/UserResponse.dto.ts)

#### L4 â€” interface UserSummary

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

#### L15 â€” interface AssignAnalyst

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

#### L27 â€” alias Analyst

```ts
export type Analyst = AssignAnalyst;
```

#### L29 â€” interface CreateUserResponse

```ts
export interface CreateUserResponse extends Omit<UserSummary, "profile" | "avatarUrl"> {
  /** Vocabulário de exibição — capitalizado (ex.: "Analista"). */
  role: Role;
  /** Exibida uma única vez — não recuperável depois. */
  temporaryPassword: string;
}
```

#### L36 â€” interface ResetPasswordResponse

```ts
export interface ResetPasswordResponse {
  id: string;
  temporaryPassword: string;
}
```

#### L41 â€” interface ChangeUserStatusResponse

```ts
export interface ChangeUserStatusResponse {
  id: string;
  isActive: boolean;
}
```

### [src/modules/internalNotes/internalNotes.repository.ts](../src/modules/internalNotes/internalNotes.repository.ts)

#### L15 â€” interface RequestIdentityRow

```ts
interface RequestIdentityRow {
  request_id: string;
  responsible_user_id: number | null;
}
```

#### L173 â€” alias MappingHistoryBaseRow

```ts
type MappingHistoryBaseRow = Omit<MappingHistoryRow, "participants" | "mappingAssignee">;
```

### [src/modules/internalNotes/internalNotes.schema.ts](../src/modules/internalNotes/internalNotes.schema.ts)

#### L35 â€” alias TimelineCursorPayload

```ts
export type TimelineCursorPayload = z.infer<typeof cursorPayloadSchema>;
```

#### L70 â€” alias ListTimelineQuery

```ts
export type ListTimelineQuery = z.infer<typeof listTimelineQuerySchema>;
```

### [src/modules/internalNotes/internalNotes.service.ts](../src/modules/internalNotes/internalNotes.service.ts)

#### L51 â€” interface InternalNotesActor

```ts
export interface InternalNotesActor extends PermissionActor {
  readonly role: Role;
}
```

#### L85 â€” interface TimelineEntry

```ts
interface TimelineEntry {
  item: TimelineItem;
  timeMs: number;
  rank: number;
  id: bigint;
}
```

#### L190 â€” interface ActorSource

```ts
interface ActorSource {
  actor_user_id: number | null;
  actor_name: string | null;
  actor_profile_name: string | null;
}
```

### [src/modules/notifications/notifications.repository.ts](../src/modules/notifications/notifications.repository.ts)

#### L4 â€” interface NotificationRow

```ts
export interface NotificationRow {
  notification_id: string;
  event_type: string;
  payload: unknown;
  read_at: Date | string | null;
  created_at: Date | string;
}
```

#### L12 â€” interface NotificationCursor

```ts
export interface NotificationCursor {
  notificationId: string;
}
```

#### L115 â€” interface MarkReadRow

```ts
export interface MarkReadRow {
  notification_id: string;
  read_at: Date | string;
}
```

### [src/modules/notifications/notifications.schema.ts](../src/modules/notifications/notifications.schema.ts)

#### L12 â€” alias NotificationCursorPayload

```ts
export type NotificationCursorPayload = z.infer<typeof notificationCursorPayloadSchema>;
```

#### L65 â€” alias ListNotificationsQuery

```ts
export type ListNotificationsQuery = z.infer<typeof listNotificationsQuerySchema>;
```

### [src/modules/pendingItems/pendingItems.repository.ts](../src/modules/pendingItems/pendingItems.repository.ts)

#### L9 â€” interface RequestRef

```ts
export interface RequestRef {
  request_id: string;
  protocol: string;
  status: string;
  status_id: number;
  requester_user_id: number | null;
  requester_name: string;
  requester_email: string;
  responsible_user_id: number | null;
}
```

#### L263 â€” alias PendingItemInsert

```ts
export type PendingItemInsert = {
  request_id: string;
  batch_id: string;
  type: "field_edit" | "observation";
  field_key: string | null;
  field_label: string | null;
  current_value: PendingFieldValue;
  comment: string;
  description: string;
  request_attachment: boolean;
  created_by: string;
};
```

#### L276 â€” alias RespondFacts

```ts
export type RespondFacts = {
  requestedRemaining: number;
  attachmentSatisfied: boolean;
  currentStatusName: string;
};
```

#### L282 â€” alias ReviewDecisionInput

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

#### L292 â€” alias ReviewFacts

```ts
export type ReviewFacts = { hasReopen: boolean };
```

#### L294 â€” alias SavedPendingAttachment

```ts
export type SavedPendingAttachment = {
  fileName: string;
  mimeType: string;
  sizeBytes: number;
  storageKey: string;
};
```

### [src/modules/pendingItems/pendingItems.schema.ts](../src/modules/pendingItems/pendingItems.schema.ts)

#### L61 â€” alias CreatePendingItemsInput

```ts
export type CreatePendingItemsInput = z.infer<typeof createPendingItemsSchema>;
```

#### L62 â€” alias VerifyInput

```ts
export type VerifyInput = z.infer<typeof verifySchema>;
```

#### L63 â€” alias ReviewInput

```ts
export type ReviewInput = z.infer<typeof reviewSchema>;
```

### [src/modules/pendingItems/pendingItems.service.ts](../src/modules/pendingItems/pendingItems.service.ts)

#### L199 â€” alias PendingCaller

```ts
export type PendingCaller = {
  user?: AuthenticatedUser;
  permissions?: readonly EffectivePermission[];
  requesterIdentity?: { name: string; email: string } | null;
};
```

### [src/modules/portalConfig/portalConfig.mappers.ts](../src/modules/portalConfig/portalConfig.mappers.ts)

#### L29 â€” alias Palette

```ts
type Palette = "light" | "dark";
```

### [src/modules/portalConfig/portalConfig.repository.ts](../src/modules/portalConfig/portalConfig.repository.ts)

#### L67 â€” interface CriteriaRow

```ts
interface CriteriaRow {
  criterion_id: string;
  weight: number;
}
```

### [src/modules/prioritization/prioritization.service.ts](../src/modules/prioritization/prioritization.service.ts)

#### L33 â€” interface Actor

```ts
interface Actor {
  id: number;
  role: string;
}
```

### [src/modules/queue/mapping.repository.ts](../src/modules/queue/mapping.repository.ts)

#### L17 â€” interface MappingRow

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

#### L41 â€” interface MappingParticipantRow

```ts
export interface MappingParticipantRow {
  userId: number | null;
  name: string;
  email: string;
}
```

#### L48 â€” interface MappingRequestContext

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

#### L64 â€” interface MappingAssigneeCandidate

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

#### L119 â€” interface MappingTargetRow

```ts
export interface MappingTargetRow {
  status_id: number;
  name: string;
  isPublic: boolean;
}
```

### [src/modules/queue/mapping.schemas.ts](../src/modules/queue/mapping.schemas.ts)

#### L123 â€” alias MappingPayload

```ts
export type MappingPayload = z.infer<typeof mappingPayloadSchema>;
```

### [src/modules/queue/queue.filters.ts](../src/modules/queue/queue.filters.ts)

#### L4 â€” interface QueueRepositoryFilters

```ts
export interface QueueRepositoryFilters extends QueueFilterQuery {
  scopedUserId?: number;
}
```

### [src/modules/reports/reports.repository.ts](../src/modules/reports/reports.repository.ts)

#### L14 â€” interface DashboardSummaryRow

```ts
interface DashboardSummaryRow {
  total: number | string;
  open: number | string;
  closed: number | string;
  overdue: number | string;
  unassigned: number | string;
}
```

#### L22 â€” interface DashboardStatusRow

```ts
interface DashboardStatusRow {
  id: number | string;
  name: string;
  count: number | string;
  tone: string;
  closesRequest: boolean;
}
```

#### L30 â€” interface DashboardPriorityRow

```ts
interface DashboardPriorityRow {
  id: number | string | null;
  label: string;
  count: number | string;
}
```

#### L36 â€” interface DashboardCategoryRow

```ts
interface DashboardCategoryRow {
  id: number | string;
  name: string;
  count: number | string;
}
```

#### L42 â€” interface DashboardTrendRow

```ts
interface DashboardTrendRow {
  period: string;
  count: number | string;
}
```

#### L47 â€” interface DashboardStatusOptionRow

```ts
interface DashboardStatusOptionRow {
  id: number | string;
  name: string;
}
```

#### L52 â€” interface DashboardCategoryOptionRow

```ts
interface DashboardCategoryOptionRow {
  id: number | string;
  name: string;
}
```

#### L57 â€” interface DashboardPriorityOptionRow

```ts
interface DashboardPriorityOptionRow {
  id: number | string;
  label: string;
}
```

#### L62 â€” interface DashboardFilterOptionRows

```ts
export interface DashboardFilterOptionRows {
  statuses: DashboardStatusOptionRow[];
  categories: DashboardCategoryOptionRow[];
  priorities: DashboardPriorityOptionRow[];
}
```

### [src/modules/requests/requests.repository.ts](../src/modules/requests/requests.repository.ts)

#### L44 â€” interface YesNoDetailColumns

```ts
interface YesNoDetailColumns {
  flag: boolean | null;
  detail: string | null;
}
```

#### L159 â€” interface RequestInsertReturning

```ts
interface RequestInsertReturning {
  request_id: string;
  protocol: string;
  created_at: Date;
}
```

#### L348 â€” interface RequestSummaryRow

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

#### L428 â€” interface RequestWithOwner

```ts
export interface RequestWithOwner {
  detail: RequestDetail;
  requesterEmail: string;
  requesterUserId: number | null;
}
```

#### L503 â€” interface RequestAttachmentRow

```ts
export interface RequestAttachmentRow {
  attachment_id: string;
  file_name: string;
  content_type: string;
  size_bytes: string; // bigint do pg
}
```

#### L511 â€” interface SchedulePreferenceRow

```ts
export interface SchedulePreferenceRow {
  scheduled_for: Date | string;
}
```

#### L891 â€” interface RequestStatusContext

```ts
export interface RequestStatusContext {
  request_id: string;
  protocol: string;
  title: string;
  requester_user_id: number | null;
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

#### L907 â€” interface RequestStatusTarget

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

#### L150 â€” alias UpdateRequestPayload

```ts
export type UpdateRequestPayload = z.infer<typeof updateRequestPayloadSchema>;
```

#### L181 â€” alias AssignRequestPayload

```ts
export type AssignRequestPayload = z.infer<typeof assignRequestSchema>;
```

#### L205 â€” alias AssignAnalystPayload

```ts
export type AssignAnalystPayload = z.infer<typeof assignAnalystSchema>;
```

#### L225 â€” alias UpdateStatusPayload

```ts
export type UpdateStatusPayload = z.infer<typeof updateStatusSchema>;
```

### [src/modules/requests/requests.service.ts](../src/modules/requests/requests.service.ts)

#### L74 â€” interface AuthenticatedIdentity

```ts
interface AuthenticatedIdentity {
  fullName: string;
  email: string;
}
```

#### L79 â€” alias RequestActor

```ts
type RequestActor = PermissionActor;
```

#### L433 â€” interface TrackingCaller

```ts
export interface TrackingCaller {
  user?: AuthenticatedUser;
  requesterIdentity?: { name: string; email: string } | null;
}
```

### [src/modules/requests/statusTransition.ts](../src/modules/requests/statusTransition.ts)

#### L4 â€” interface StatusTransitionTarget

```ts
export interface StatusTransitionTarget {
  status_id: number;
  name: string;
  isPublic: boolean;
}
```

#### L10 â€” interface StatusTransitionInput

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

#### L7 â€” interface StatusRow

```ts
interface StatusRow {
  status_id: number;
  name: string;
  isPublic: boolean;
}
```

#### L13 â€” interface CategoryRow

```ts
interface CategoryRow {
  category_id: number;
  name: string;
}
```

#### L18 â€” interface RequestContextRow

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

#### L50 â€” interface TriageRow

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

#### L221 â€” interface TriageAuditContext

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

#### L3 â€” interface TriageAssignee

```ts
export interface TriageAssignee {
  id: string | null;
  name: string | null;
  email: string | null;
}
```

#### L9 â€” interface TriageAssessment

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

#### L26 â€” alias CreateTriagePayload

```ts
export type CreateTriagePayload = Omit<
  TriageAssessment,
  "id" | "assignee" | "lastTechnicalMessage"
> & {
  lastTechnicalMessage?: string | null;
};
```

### [src/modules/requests/triage/triage.service.ts](../src/modules/requests/triage/triage.service.ts)

#### L9 â€” interface Actor

```ts
interface Actor {
  id: number;
  email: string;
  name: string;
  role: string;
}
```

### [src/modules/users/users.repository.ts](../src/modules/users/users.repository.ts)

#### L15 â€” interface UserSummaryRow

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

#### L26 â€” interface ProfileLookupRow

```ts
export interface ProfileLookupRow {
  profile_id: number;
  is_root: boolean;
}
```

#### L191 â€” interface UserProfileRow

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

#### L496 â€” interface AnalystRow

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

### [src/shared/access/custody.ts](../src/shared/access/custody.ts)

#### L12 â€” interface CustodyActor

```ts
export interface CustodyActor {
  readonly userId: number;
  readonly email: string;
}
```

#### L22 â€” interface CustodySubject

```ts
export interface CustodySubject {
  readonly responsibleIds?: readonly number[];
  readonly requesterEmail?: string | null;
}
```

### [src/shared/access/requestAccess.ts](../src/shared/access/requestAccess.ts)

#### L17 â€” interface PermissionActor

```ts
export interface PermissionActor {
  readonly id: number;
  readonly email: string;
  readonly permissions: readonly EffectivePermission[];
}
```

#### L24 â€” interface RequestActorSource

```ts
export interface RequestActorSource {
  readonly user?: { readonly id: string; readonly email: string };
  readonly permissions?: readonly EffectivePermission[];
}
```

### [src/shared/audit/auditCatalog.ts](../src/shared/audit/auditCatalog.ts)

#### L61 â€” alias AuditEntityType

```ts
export type AuditEntityType = keyof typeof auditCatalog;
```

#### L69 â€” alias ChangeOrigin

```ts
export type ChangeOrigin =
  "user" | "admin" | "system" | "requester" | "manual" | "internal" | "self";
```

#### L73 â€” alias AuditActionOf

```ts
export type AuditActionOf<E extends AuditEntityType> = (typeof auditCatalog)[E]["actions"][number];
```

#### L76 â€” alias ComposedAuditAction

```ts
export type ComposedAuditAction<E extends AuditEntityType> = `${E}.${AuditActionOf<E>}`;
```

### [src/shared/audit/auditLogger.ts](../src/shared/audit/auditLogger.ts)

#### L12 â€” interface AuditEntryBase

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

#### L33 â€” alias AuditEntry

```ts
export type AuditEntry<
  E extends AuditEntityType = AuditEntityType,
  A extends ComposedAuditAction<E> = ComposedAuditAction<E>,
> = AuditEntryBase & { entityType: E; actionType: A };
```

### [src/shared/catalog/baseProfiles.ts](../src/shared/catalog/baseProfiles.ts)

#### L14 â€” interface BaseProfilePermission

```ts
export interface BaseProfilePermission {
  readonly key: PermissionKey;
  readonly custody: Custody;
}
```

#### L19 â€” interface BaseProfile

```ts
export interface BaseProfile {
  /** Nome atual em `profiles.name` (minúsculo no banco). */
  readonly profileName: string;
  /** Marca de Perfil Admin Root — escrita exclusiva do seed (§ 4.2). */
  readonly isRoot: boolean;
  readonly isAssignableTriage: boolean;
  readonly isAssignableMapping: boolean;
  readonly permissions: readonly BaseProfilePermission[];
}
```

#### L30 â€” alias CustodialPolicy

```ts
type CustodialPolicy = Extract<Custody, "assigned" | "all">;
```

### [src/shared/catalog/fieldCatalog.ts](../src/shared/catalog/fieldCatalog.ts)

#### L42 â€” alias FieldKey

```ts
export type FieldKey = (typeof FIELD_KEYS)[number];
```

### [src/shared/catalog/permissionCatalog.ts](../src/shared/catalog/permissionCatalog.ts)

#### L14 â€” alias Custody

```ts
export type Custody = (typeof CUSTODIES)[number];
```

#### L17 â€” alias CustodyType

```ts
export type CustodyType = "global" | "custodial";
```

#### L19 â€” interface PermissionDefinition

```ts
export interface PermissionDefinition {
  /** Chave `recurso:ação`, o vocabulário único de acesso. */
  readonly key: string;
  /** Se a chave depende da linha (`custodial`) ou não (`global`). */
  readonly custodyType: CustodyType;
  /**
   * Vínculos aceitos pela chave. Chave `global` aceita só `global`; chave
   * custodial aceita `assigned`/`all`, exceto as de posse fixa (`own`).
   */
  readonly allowedCustodies: readonly Custody[];
  /** Chaves que a composição precisa conter junto (§ 1.7 do contrato). */
  readonly dependencies: readonly string[];
}
```

#### L282 â€” alias PermissionKey

```ts
export type PermissionKey = (typeof PERMISSION_CATALOG)[number]["key"];
```

#### L284 â€” alias CatalogEntry

```ts
export type CatalogEntry = (typeof PERMISSION_CATALOG)[number];
```

#### L325 â€” interface PermissionGrantSource

```ts
export interface PermissionGrantSource {
  readonly permission_key: string;
  readonly custody: string;
}
```

#### L331 â€” interface EffectivePermission

```ts
export interface EffectivePermission {
  readonly key: PermissionKey;
  readonly custody: Custody;
}
```

### [src/shared/errors/AppError.ts](../src/shared/errors/AppError.ts)

#### L1 â€” class AppError

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

#### L10 â€” class ValidationError

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

#### L1 â€” alias RateLimitOptions

```ts
type RateLimitOptions = {
  windowMs: number;
  limit: number;
  keyGenerator?: (key: string) => string;
};
```

### [src/shared/notifications/emitNotification.ts](../src/shared/notifications/emitNotification.ts)

#### L9 â€” interface CommittedNotification

```ts
export interface CommittedNotification {
  notificationId: string;
  recipientUserId: number;
}
```

### [src/shared/notifications/inAppNotificationChannel.ts](../src/shared/notifications/inAppNotificationChannel.ts)

#### L8 â€” interface InsertedNotificationRow

```ts
interface InsertedNotificationRow {
  notification_id: string;
  recipient_user_id: number;
}
```

### [src/shared/notifications/notificationChannel.ts](../src/shared/notifications/notificationChannel.ts)

#### L4 â€” interface NotificationToDeliver

```ts
export interface NotificationToDeliver {
  recipientUserId: number;
  eventType: NotificationEventType;
  requestId: string;
  payload: NotificationPayload;
  dedupKey: string;
}
```

#### L12 â€” interface NotificationDelivery

```ts
export interface NotificationDelivery {
  notificationId: string;
  recipientUserId: number;
}
```

#### L23 â€” interface NotificationChannel

```ts
export interface NotificationChannel {
  readonly name: string;
  deliver(
    trx: Knex.Transaction,
    notification: NotificationToDeliver,
  ): Promise<NotificationDelivery | null>;
}
```

### [src/shared/notifications/notificationEmitter.ts](../src/shared/notifications/notificationEmitter.ts)

#### L6 â€” interface NotificationCommittedPayload

```ts
export interface NotificationCommittedPayload {
  userId: number;
  notificationIds: string[];
}
```

### [src/shared/notifications/notificationEvents.ts](../src/shared/notifications/notificationEvents.ts)

#### L22 â€” alias StatusChangedNotificationPayload

```ts
export type StatusChangedNotificationPayload = z.infer<typeof statusChangedPayloadSchema>;
```

#### L23 â€” alias NotificationPayload

```ts
export type NotificationPayload = z.infer<typeof notificationPayloadSchema>;
```

#### L42 â€” alias StatusChangedNotificationEvent

```ts
export type StatusChangedNotificationEvent = z.infer<typeof statusChangedEventSchema>;
```

#### L43 â€” alias NotificationEvent

```ts
export type NotificationEvent = z.infer<typeof notificationEventSchema>;
```

#### L44 â€” alias NotificationEventType

```ts
export type NotificationEventType = NotificationEvent["type"];
```

### [src/shared/storage/fileStorage.ts](../src/shared/storage/fileStorage.ts)

#### L6 â€” interface SavedAttachment

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

#### L4 â€” interface InternalNoteRow

```ts
export interface InternalNoteRow {
  internal_note_id: string;
  request_id: string;
  author_user_id: number;
  /** Snapshot do Perfil na época da criação; não participa da autorização. */
  author_role_at_creation: Role;
  content: string;
  created_at: Date;
  author_name: string;
}
```

#### L15 â€” interface InternalNoteReadStateRow

```ts
export interface InternalNoteReadStateRow {
  request_id: string;
  user_id: number;
  last_read_note_id: string;
  read_at: Date;
}
```

#### L22 â€” alias TimelineEventAction

```ts
export type TimelineEventAction =
  | "request.assign"
  | "request.reassign"
  | "request.unassign"
  | "request.status_change"
  | "mapping.assign";
```

#### L36 â€” alias AuditTimelineAction

```ts
export type AuditTimelineAction =
  TimelineEventAction | "request.override_status_admin" | "request.status_override";
```

#### L43 â€” alias TimelineChangeOrigin

```ts
export type TimelineChangeOrigin = Extract<ChangeOrigin, "admin" | "system" | "internal"> | null;
```

#### L45 â€” interface TimelineCursor

```ts
export interface TimelineCursor {
  t: Date;
  type: "note" | "event";
  id: string;
}
```

#### L51 â€” interface TimelineEventRow

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

#### L68 â€” interface TriageHistoryRow

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

#### L89 â€” interface MappingHistoryParticipant

```ts
export interface MappingHistoryParticipant {
  userId: number | null;
  name: string;
  email: string;
}
```

#### L96 â€” interface MappingHistoryAssignee

```ts
export interface MappingHistoryAssignee {
  id: string;
  userId: number;
  name: string;
  email: string;
  jobTitle: string | null;
}
```

#### L105 â€” interface MappingHistoryRow

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

#### L1 â€” interface PaginatedResponse

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

#### L8 â€” alias PendencyStatus

```ts
export type PendencyStatus = "requested" | "responded" | "validated";
```

#### L10 â€” alias PendingItemType

```ts
export type PendingItemType = "field_edit" | "observation";
```

#### L12 â€” alias PendingFieldValue

```ts
export type PendingFieldValue = string | number | boolean | null;
```

#### L14 â€” interface PendingFieldRef

```ts
export interface PendingFieldRef {
  fieldKey: string;
  /** Rótulo do catálogo (`fieldCatalog`) — ex.: "Nome completo". */
  fieldLabel: string;
  currentValue: PendingFieldValue;
}
```

#### L21 â€” interface InternalAttachment

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

#### L30 â€” interface UnreadState

```ts
export interface UnreadState {
  count: number;
  hasUnread: boolean;
  lastUnreadAt: string | null;
}
```

#### L36 â€” interface CorrectionAlert

```ts
export interface CorrectionAlert {
  count: number;
  batchId: string;
}
```

#### L41 â€” interface PendingSummary

```ts
export interface PendingSummary {
  total: number;
  requested: number;
  responded: number;
  validated: number;
}
```

### [src/shared/types/portalConfig.ts](../src/shared/types/portalConfig.ts)

#### L15 â€” alias SolicitationMode

```ts
export type SolicitationMode = "PUBLIC" | "AUTHENTICATED";
```

#### L20 â€” interface PortalAssets

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

#### L45 â€” alias AssetKey

```ts
export type AssetKey = (typeof ASSET_KEYS)[number];
```

#### L49 â€” alias PortalAssetsPatch

```ts
export type PortalAssetsPatch = Partial<Record<AssetKey, string>> & {
  logoUsePrimaryColor?: boolean;
};
```

#### L74 â€” alias ThemeTokenKey

```ts
export type ThemeTokenKey = (typeof THEME_TOKEN_KEYS)[number];
```

#### L78 â€” interface StatusToneTokens

```ts
export interface StatusToneTokens {
  color: string;
  background: string;
  backgroundLocked: boolean;
}
```

#### L85 â€” interface ThemeGradient

```ts
export interface ThemeGradient {
  from: string; // hex #RRGGBB / #RRGGBBAA
  to: string; // hex #RRGGBB / #RRGGBBAA
  angle?: number; // graus 0..360 (default 143 quando ausente)
}
```

#### L94 â€” interface ThemeTokens

```ts
export interface ThemeTokens extends Record<ThemeTokenKey, string> {
  gradient: ThemeGradient;
  statuses: Record<StatusTone, StatusToneTokens>;
}
```

#### L100 â€” interface PortalTheme

```ts
export interface PortalTheme {
  light: ThemeTokens;
  dark: ThemeTokens;
}
```

#### L108 â€” interface PortalCategory

```ts
export interface PortalCategory {
  id: number;
  name: string;
  description: string;
  isActive: boolean;
}
```

#### L123 â€” alias StatusMode

```ts
export type StatusMode = (typeof STATUS_MODES)[number];
```

#### L139 â€” interface PortalStatus

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

#### L166 â€” alias PrioritizationCriterion

```ts
export type PrioritizationCriterion = (typeof PRIORITIZATION_CRITERIA)[number];
```

#### L171 â€” alias PrioritizationWeights

```ts
export type PrioritizationWeights = Record<PrioritizationCriterion, number>;
```

#### L174 â€” interface PortalConfig

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

#### L185 â€” alias AccessSection

```ts
export type AccessSection = Pick<PortalConfig, "solicitationMode">;
```

#### L186 â€” alias IdentitySection

```ts
export type IdentitySection = Pick<PortalConfig, "platformName" | "protocolMask">;
```

#### L187 â€” alias ThemeSection

```ts
export type ThemeSection = Pick<PortalConfig, "theme">;
```

#### L188 â€” alias AssetsSection

```ts
export type AssetsSection = Pick<PortalConfig, "assets">;
```

#### L189 â€” alias CategoriesSection

```ts
export type CategoriesSection = Pick<PortalConfig, "categories">;
```

#### L190 â€” alias StatusesSection

```ts
export type StatusesSection = Pick<PortalConfig, "statuses">;
```

#### L191 â€” alias PrioritizationWeightsSection

```ts
export type PrioritizationWeightsSection = Pick<PortalConfig, "prioritizationWeights">;
```

#### L194 â€” interface CategoryRow

```ts
export interface CategoryRow {
  category_id: number;
  name: string;
  description: string | null;
  status: "active" | "inactive";
  display_order: number | null;
}
```

#### L203 â€” interface StatusRow

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

#### L2 â€” interface CriterionRow

```ts
export interface CriterionRow {
  criterion_id: string;
  name: string;
  weight: number;
  active: boolean;
  display_order: number;
}
```

#### L17 â€” alias Classification

```ts
export type Classification = RequestPriority;
```

#### L20 â€” interface PriorityRangeRow

```ts
export interface PriorityRangeRow {
  priority_id: number;
  level: Classification;
  min_score: number;
  max_score: number;
}
```

#### L28 â€” interface EvaluationRow

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

#### L4 â€” interface RequestSummary

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

#### L14 â€” interface QueueMetricsResponse

```ts
export interface QueueMetricsResponse {
  totalRequests: number;
  unassignedRequests: number;
  inProgressRequests: number;
  overdueRequests: number;
}
```

#### L21 â€” alias QueuePriorityFilter

```ts
export type QueuePriorityFilter = RequestPriority | "nenhum";
```

#### L24 â€” interface QueueFilterQuery

```ts
export interface QueueFilterQuery {
  search?: string;
  status?: RequestStatus;
  priority?: QueuePriorityFilter;
  assigneeId?: string | "unassigned";
  unassigned?: boolean;
}
```

#### L33 â€” interface QueueQuery

```ts
export interface QueueQuery extends QueueFilterQuery {
  page: number;
  pageSize: number;
}
```

#### L38 â€” interface QueueAssignee

```ts
export interface QueueAssignee {
  id: string;
  name: string;
}
```

#### L43 â€” interface QueueItem

```ts
export interface QueueItem extends RequestSummary {
  requesterEmail: string;
  assigneeId: string | null;
}
```

#### L48 â€” interface QueueResponse

```ts
export interface QueueResponse extends PaginatedResponse<QueueItem> {
  assignees: QueueAssignee[];
}
```

### [src/shared/types/requests.ts](../src/shared/types/requests.ts)

#### L7 â€” alias RequestStatus

```ts
export type RequestStatus = string;
```

#### L12 â€” alias RequestPriority

```ts
export type RequestPriority = (typeof REQUEST_PRIORITIES)[number];
```

#### L23 â€” alias TriageResult

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

#### L32 â€” alias OperationalImpact

```ts
export type OperationalImpact = "Baixo" | "Médio" | "Alto" | "Crítico";
```

#### L34 â€” alias YesNoDetail

```ts
export type YesNoDetail = false | string;
```

#### L46 â€” alias RequestCategoryName

```ts
export type RequestCategoryName = string;
```

#### L48 â€” interface AttachmentMetadata

```ts
export interface AttachmentMetadata {
  fileName: string; // nome original do arquivo — máx. 255
  mimeType: string; // PDF, DOCX, XLSX, PNG ou JPG
  sizeBytes: number; // máximo 10 * 1024 * 1024 (10MB)
}
```

#### L54 â€” interface RequesterBlock

```ts
export interface RequesterBlock {
  fullName: string; // obrigatório — máx. 150
  corporateEmail: string; // obrigatório — e-mail corporativo, máx. 254 (RFC 5321)
  area: string; // obrigatório — máx. 100
  department?: string; // opcional (padrão; Admin pode tornar obrigatório) — máx. 100
  // renderização híbrida: <Select> se houver departamentos
  // cadastrados; texto livre caso contrário
  manager: string; // obrigatório — gestor responsável, máx. 150
  additionalContact?: string; // opcional — telefone, ramal ou e-mail secundário, máx. 100
}
```

#### L65 â€” interface DemandBlock

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

#### L78 â€” interface OperationalBlock

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

#### L96 â€” interface ComplementaryBlock

```ts
export interface ComplementaryBlock {
  hasProcessDocumentation?: YesNoDetail; // existência de documentação do processo (+ links)
  hasSimilarSolution?: YesNoDetail; // existência de solução semelhante
  dependsOnOtherAreas?: YesNoDetail; // dependência de outras áreas (+ quais)
  handlesRestrictedInfo?: YesNoDetail; // tratamento de informações restritas (LGPD/sigilo)
  additionalNotes?: string; // observações adicionais, máx. 2.000
}
```

#### L104 â€” alias SchedulePreferences

```ts
export type SchedulePreferences = string[];
```

#### L106 â€” interface RequesterTable

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

#### L118 â€” interface AssignmentContextRow

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

#### L131 â€” interface AssignmentCandidateRow

```ts
export interface AssignmentCandidateRow {
  id: string;
  professional_id: string;
  user_id: number;
  name: string;
  email: string;
  professional_status: "active" | "inactive";
  user_is_active: boolean;
  profile_id: number;
  profile_is_active: boolean;
  is_assignable_triage: boolean;
  is_assignable_mapping: boolean;
}
```

#### L155 â€” interface InternalRequestRow

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
  category: string;
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

#### L3 â€” alias Role

```ts
export type Role = (typeof ROLES)[number];
```

#### L14 â€” alias ProfileName

```ts
export type ProfileName = string;
```

### [src/shared/types/status.ts](../src/shared/types/status.ts)

#### L20 â€” alias StatusId

```ts
export type StatusId = (typeof STATUS_IDS)[keyof typeof STATUS_IDS];
```

### [src/shared/types/systemSettings.ts](../src/shared/types/systemSettings.ts)

#### L4 â€” alias PortalSolicitationMode

```ts
export type PortalSolicitationMode = SolicitationMode;
```

#### L20 â€” interface SystemSettingsRow

```ts
export interface SystemSettingsRow {
  settings_id: number;
  platform_name: string;
  solicitation_mode: SolicitationMode;
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

#### L3 â€” alias StatusTone

```ts
export type StatusTone = (typeof STATUS_TONES)[number];
```

#### L21 â€” alias ThemeTokenKey

```ts
export type ThemeTokenKey = (typeof THEME_TOKEN_KEYS)[number];
```

#### L24 â€” alias ThemePalette

```ts
export type ThemePalette = "light" | "dark";
```

#### L36 â€” interface SystemThemeRow

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

#### L3 â€” interface User

```ts
export interface User {
  id: string;
  email: string;
  name: string;
  password: string;
  role: Role;
}
```

#### L11 â€” alias AuthenticatedUser

```ts
export type AuthenticatedUser = Omit<User, "password">;
```

#### L12 â€” alias UserRequestDTO

```ts
export type UserRequestDTO = Omit<User, "id">;
```

#### L15 â€” interface UserRow

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

#### L30 â€” interface AuthUserRow

```ts
export interface AuthUserRow extends UserRow {
  profile_name: string;
  profile_is_active: boolean;
  /** Marca de Perfil Admin Root — a conta é única e fora das rotas administrativas. */
  profile_is_root: boolean;
}
```

#### L38 â€” interface UserMetricsResponse

```ts
export interface UserMetricsResponse {
  total: number;
  active: number;
  pending: number;
  admins: number;
}
```

### [src/shared/utils/jwtUtil.ts](../src/shared/utils/jwtUtil.ts)

#### L9 â€” alias TokenScope

```ts
export type TokenScope = "session" | "change_password";
```

#### L11 â€” interface TokenPayload

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

#### L23 â€” interface GroupedIssues

```ts
interface GroupedIssues {
  missing: ZodError["issues"][number][];
  invalid: ZodError["issues"][number][];
}
```

## 2. DeclaraÃ§Ãµes sem anotaÃ§Ã£o explÃ­cita

### [src/app.ts](../src/app.ts)

- L10 â€” variÃ¡vel: `app`

### [src/configs.ts](../src/configs.ts)

- L1 â€” variÃ¡vel: `NODE_ENV`
- L4 â€” variÃ¡vel: `key`
- L14 â€” variÃ¡vel: `Config`
- L19 â€” parÃ¢metro: `s`
- L19 â€” retorno da funÃ§Ã£o: `<anÃ´nima>()`
- L34 â€” variÃ¡vel: `num`
- L35 â€” variÃ¡vel: `unit`

### [src/database/conection.ts](../src/database/conection.ts)

- L5 â€” variÃ¡vel: `db`

### [src/docs/components/parameters.ts](../src/docs/components/parameters.ts)

- L1 â€” variÃ¡vel: `protocolParam`

### [src/docs/components/responses.ts](../src/docs/components/responses.ts)

- L1 â€” retorno da funÃ§Ã£o: `<anÃ´nima>()`
- L1 â€” variÃ¡vel: `json`
- L5 â€” parÃ¢metro: `schema`
- L5 â€” retorno da funÃ§Ã£o: `<anÃ´nima>()`
- L5 â€” variÃ¡vel: `error`

### [src/docs/components/security.ts](../src/docs/components/security.ts)

- L1 â€” variÃ¡vel: `securitySchemes`

### [src/docs/openapi.ts](../src/docs/openapi.ts)

- L1 â€” variÃ¡vel: `openapiBase`

### [src/docs/paths/index.ts](../src/docs/paths/index.ts)

- L13 â€” variÃ¡vel: `paths`

### [src/docs/paths/pendingItems.ts](../src/docs/paths/pendingItems.ts)

- L4 â€” variÃ¡vel: `dualAuth`
- L6 â€” variÃ¡vel: `pendingItemParam`

### [src/docs/paths/users.ts](../src/docs/paths/users.ts)

- L3 â€” variÃ¡vel: `idParam`

### [src/docs/schemas/auditHistory.ts](../src/docs/schemas/auditHistory.ts)

- L1 â€” variÃ¡vel: `AuditActor`
- L11 â€” variÃ¡vel: `AuditHistorySummary`
- L29 â€” variÃ¡vel: `AuditHistoryListResponse`
- L40 â€” variÃ¡vel: `AuditHistoryDetail`

### [src/docs/schemas/auth.ts](../src/docs/schemas/auth.ts)

- L1 â€” variÃ¡vel: `AuthenticatedUser`
- L18 â€” variÃ¡vel: `LoginRequest`
- L28 â€” variÃ¡vel: `LoginResponse`
- L32 â€” variÃ¡vel: `LogoutResponse`
- L40 â€” variÃ¡vel: `ChangePasswordRequest`
- L51 â€” variÃ¡vel: `ChangePasswordResponse`

### [src/docs/schemas/common.ts](../src/docs/schemas/common.ts)

- L1 â€” variÃ¡vel: `ErrorResponse`
- L23 â€” variÃ¡vel: `ValidationErrorResponse`

### [src/docs/schemas/index.ts](../src/docs/schemas/index.ts)

- L169 â€” variÃ¡vel: `schemas`

### [src/docs/schemas/internalNotes.ts](../src/docs/schemas/internalNotes.ts)

- L1 â€” variÃ¡vel: `TimelineActor`
- L11 â€” variÃ¡vel: `TimelineNote`
- L23 â€” variÃ¡vel: `TimelineEvent`
- L73 â€” variÃ¡vel: `TimelineItem`
- L81 â€” variÃ¡vel: `TriageHistoryEntry`
- L90 â€” variÃ¡vel: `MappingHistoryEntry`
- L99 â€” variÃ¡vel: `InternalNotesResponse`
- L130 â€” variÃ¡vel: `CreateInternalNoteRequest`
- L138 â€” variÃ¡vel: `MarkInternalNotesReadRequest`

### [src/docs/schemas/notifications.ts](../src/docs/schemas/notifications.ts)

- L1 â€” variÃ¡vel: `NotificationPayload`
- L15 â€” variÃ¡vel: `NotificationItem`
- L36 â€” variÃ¡vel: `NotificationListResponse`
- L53 â€” variÃ¡vel: `NotificationUnreadCountResponse`
- L61 â€” variÃ¡vel: `NotificationMarkReadResponse`
- L74 â€” variÃ¡vel: `NotificationMarkAllReadResponse`

### [src/docs/schemas/pendingItems.ts](../src/docs/schemas/pendingItems.ts)

- L1 â€” variÃ¡vel: `PendingFieldRef`
- L19 â€” variÃ¡vel: `PendingAttachment`
- L31 â€” variÃ¡vel: `PendingItem`
- L90 â€” variÃ¡vel: `ListPendingItemsResponse`
- L103 â€” variÃ¡vel: `CreatePendingItemsBody`
- L133 â€” variÃ¡vel: `CreatePendingItemsResponse`
- L143 â€” variÃ¡vel: `ReviewPendingItemsBody`
- L169 â€” variÃ¡vel: `ReviewDecisionValidate`
- L179 â€” variÃ¡vel: `ReviewDecisionReopen`
- L189 â€” variÃ¡vel: `ReviewPendingItemsResponse`
- L198 â€” variÃ¡vel: `RespondPendingItemBody`
- L221 â€” variÃ¡vel: `PublicVerifyBody`
- L235 â€” variÃ¡vel: `PublicVerifyResponse`

### [src/docs/schemas/portal.ts](../src/docs/schemas/portal.ts)

- L7 â€” variÃ¡vel: `StatusMode`
- L17 â€” variÃ¡vel: `StatusToneTokens`
- L35 â€” variÃ¡vel: `ThemeGradient`
- L49 â€” variÃ¡vel: `ThemeTokens`
- L136 â€” variÃ¡vel: `PortalTheme`
- L149 â€” variÃ¡vel: `PortalAssets`
- L179 â€” variÃ¡vel: `PortalCategory`
- L194 â€” variÃ¡vel: `PortalStatus`
- L230 â€” variÃ¡vel: `PrioritizationWeights`
- L262 â€” variÃ¡vel: `PortalConfig`
- L296 â€” variÃ¡vel: `PortalAccessPatchBody`
- L309 â€” variÃ¡vel: `PortalIdentityPatchBody`
- L323 â€” variÃ¡vel: `PortalThemePatchBody`
- L332 â€” variÃ¡vel: `PortalCategoriesPatchBody`
- L346 â€” variÃ¡vel: `PortalStatusesPatchBody`
- L360 â€” variÃ¡vel: `PortalPrioritizationWeightsPatchBody`

### [src/docs/schemas/prioritization.ts](../src/docs/schemas/prioritization.ts)

- L1 â€” variÃ¡vel: `PrioritizationCriterion`
- L11 â€” variÃ¡vel: `PrioritizationCriteriaList`
- L22 â€” variÃ¡vel: `EvaluatePrioritizationRequest`
- L39 â€” variÃ¡vel: `EvaluatePrioritizationResponse`

### [src/docs/schemas/queue.ts](../src/docs/schemas/queue.ts)

- L1 â€” variÃ¡vel: `QueueMetrics`
- L12 â€” variÃ¡vel: `QueueAssignee`
- L21 â€” variÃ¡vel: `QueueItem`
- L57 â€” variÃ¡vel: `QueueResponse`
- L74 â€” variÃ¡vel: `MappingParticipant`
- L88 â€” variÃ¡vel: `MappingParticipantInput`
- L102 â€” variÃ¡vel: `MappingAssignee`
- L118 â€” variÃ¡vel: `MappingResponse`
- L164 â€” variÃ¡vel: `MappingHistoryResponse`
- L185 â€” variÃ¡vel: `MappingPayload`

### [src/docs/schemas/reports.ts](../src/docs/schemas/reports.ts)

- L1 â€” variÃ¡vel: `DashboardSituation`
- L6 â€” variÃ¡vel: `DashboardSummary`
- L26 â€” variÃ¡vel: `DashboardStatusMetric`
- L41 â€” variÃ¡vel: `DashboardPriorityMetric`
- L54 â€” variÃ¡vel: `DashboardCategoryMetric`
- L64 â€” variÃ¡vel: `DashboardTrendPoint`
- L73 â€” variÃ¡vel: `DashboardResponse`

### [src/docs/schemas/request.ts](../src/docs/schemas/request.ts)

- L1 â€” variÃ¡vel: `dateTime`
- L2 â€” variÃ¡vel: `nullableDateTime`
- L3 â€” variÃ¡vel: `nullableString`
- L6 â€” variÃ¡vel: `RequestStatus`
- L13 â€” variÃ¡vel: `RequestPriority`
- L19 â€” variÃ¡vel: `RequestCategory`
- L31 â€” variÃ¡vel: `YesNoDetail`
- L37 â€” variÃ¡vel: `RequesterBlock`
- L60 â€” variÃ¡vel: `DemandBlock`
- L84 â€” variÃ¡vel: `OperationalBlock`
- L124 â€” variÃ¡vel: `ComplementaryBlock`
- L135 â€” variÃ¡vel: `CreateRequestPayload`
- L152 â€” variÃ¡vel: `CreateRequestResponse`
- L162 â€” variÃ¡vel: `RequestSummary`
- L189 â€” variÃ¡vel: `PaginatedRequestSummary`
- L201 â€” variÃ¡vel: `PublicMeeting`
- L210 â€” variÃ¡vel: `PublicRequestDetail`
- L261 â€” variÃ¡vel: `Assignee`
- L275 â€” variÃ¡vel: `PrioritizationBlock`
- L293 â€” variÃ¡vel: `PendingSummary`
- L304 â€” variÃ¡vel: `UnreadState`
- L314 â€” variÃ¡vel: `CorrectionAlert`
- L323 â€” variÃ¡vel: `InternalAttachment`
- L335 â€” variÃ¡vel: `InternalRequestDetail`
- L408 â€” variÃ¡vel: `UpdateRequesterBlock`
- L419 â€” variÃ¡vel: `UpdateInternalRequestPayload`
- L432 â€” variÃ¡vel: `RequestMutationAcknowledgement`
- L443 â€” variÃ¡vel: `PublicOperationalImpacts`
- L464 â€” variÃ¡vel: `RequesterOperational`
- L497 â€” variÃ¡vel: `RequesterAttachment`
- L510 â€” variÃ¡vel: `PublicRequestDetails`
- L540 â€” variÃ¡vel: `RequesterRequestDetails`
- L584 â€” variÃ¡vel: `PublicTrackingResponse`
- L593 â€” variÃ¡vel: `AuthenticatedTrackingResponse`
- L602 â€” variÃ¡vel: `TrackingResponse`
- L610 â€” variÃ¡vel: `AssigneeSummary`
- L622 â€” variÃ¡vel: `AssignRequestPayload`
- L636 â€” variÃ¡vel: `AssignRequestResponse`
- L655 â€” variÃ¡vel: `AssignAnalystPayload`
- L678 â€” variÃ¡vel: `UpdateStatusPayload`
- L706 â€” variÃ¡vel: `UpdateStatusResponse`

### [src/docs/schemas/triage.ts](../src/docs/schemas/triage.ts)

- L1 â€” variÃ¡vel: `TriageAssignee`
- L11 â€” variÃ¡vel: `TriagemResponse`
- L64 â€” variÃ¡vel: `CreateTriagePayload`

### [src/docs/schemas/user.ts](../src/docs/schemas/user.ts)

- L2 â€” variÃ¡vel: `Role`
- L9 â€” variÃ¡vel: `ProfileName`
- L17 â€” variÃ¡vel: `UserMetrics`
- L44 â€” variÃ¡vel: `UserSummary`
- L68 â€” variÃ¡vel: `UserListResponse`
- L80 â€” variÃ¡vel: `RequesterProfileBlock`
- L91 â€” variÃ¡vel: `ProfessionalProfileBlock`
- L102 â€” variÃ¡vel: `UserProfileResponse`
- L124 â€” variÃ¡vel: `AssignAnalyst`
- L149 â€” variÃ¡vel: `RequesterInput`
- L160 â€” variÃ¡vel: `ProfessionalInput`
- L179 â€” variÃ¡vel: `CreateUserRequest`
- L194 â€” variÃ¡vel: `CreateUserResponse`
- L221 â€” variÃ¡vel: `UpdateUserRequest`
- L243 â€” variÃ¡vel: `UpdateProfilePayload`
- L264 â€” variÃ¡vel: `ChangeUserStatusRequest`
- L272 â€” variÃ¡vel: `ChangeUserStatusResponse`
- L281 â€” variÃ¡vel: `ResetPasswordResponse`

### [src/docs/swagger.ts](../src/docs/swagger.ts)

- L30 â€” variÃ¡vel: `openapiSpec`
- L39 â€” variÃ¡vel: `swaggerOptions`
- L48 â€” retorno da funÃ§Ã£o: `<anÃ´nima>()`
- L61 â€” parÃ¢metro: `_req`
- L61 â€” parÃ¢metro: `res`
- L61 â€” retorno da funÃ§Ã£o: `<anÃ´nima>()`

### [src/modules/auditHistory/auditHistory.controller.ts](../src/modules/auditHistory/auditHistory.controller.ts)

- L13 â€” variÃ¡vel: `parsed`
- L28 â€” variÃ¡vel: `id`
- L34 â€” variÃ¡vel: `detail`
- L42 â€” variÃ¡vel: `protocol`
- L47 â€” variÃ¡vel: `logs`

### [src/modules/auditHistory/auditHistory.repository.ts](../src/modules/auditHistory/auditHistory.repository.ts)

- L40 â€” retorno da funÃ§Ã£o: `responsibleProtocols()`
- L48 â€” retorno da funÃ§Ã£o: `responsibleMappingIds()`
- L57 â€” retorno da funÃ§Ã£o: `responsiblePendingItemIds()`
- L74 â€” variÃ¡vel: `userId`
- L76 â€” parÃ¢metro: `where`
- L76 â€” retorno da funÃ§Ã£o: `<anÃ´nima>()`
- L78 â€” parÃ¢metro: `requestScope`
- L78 â€” retorno da funÃ§Ã£o: `<anÃ´nima>()`
- L83 â€” parÃ¢metro: `mappingScope`
- L83 â€” retorno da funÃ§Ã£o: `<anÃ´nima>()`
- L88 â€” parÃ¢metro: `pendingScope`
- L88 â€” retorno da funÃ§Ã£o: `<anÃ´nima>()`
- L89 â€” parÃ¢metro: `pendingTarget`
- L89 â€” retorno da funÃ§Ã£o: `<anÃ´nima>()`
- L102 â€” variÃ¡vel: `query`
- L119 â€” variÃ¡vel: `countQuery`
- L125 â€” variÃ¡vel: `totalRow`
- L126 â€” variÃ¡vel: `total`
- L128 â€” variÃ¡vel: `page`
- L129 â€” variÃ¡vel: `limit`
- L130 â€” variÃ¡vel: `offset`
- L131 â€” variÃ¡vel: `items`
- L174 â€” variÃ¡vel: `row`
- L182 â€” variÃ¡vel: `byProtocol`
- L187 â€” variÃ¡vel: `byItem`
- L228 â€” parÃ¢metro: `rows`
- L228 â€” retorno da funÃ§Ã£o: `<anÃ´nima>()`

### [src/modules/auditHistory/auditHistory.router.ts](../src/modules/auditHistory/auditHistory.router.ts)

- L10 â€” variÃ¡vel: `noStore`
- L19 â€” variÃ¡vel: `auditHistoryRoutes`
- L44 â€” variÃ¡vel: `auditLogsRouter`

### [src/modules/auditHistory/auditHistory.schema.ts](../src/modules/auditHistory/auditHistory.schema.ts)

- L5 â€” variÃ¡vel: `optionalPositiveInt`
- L9 â€” variÃ¡vel: `auditEntityNames`
- L11 â€” variÃ¡vel: `auditHistoryQuerySchema`
- L18 â€” parÃ¢metro: `query`
- L18 â€” retorno da funÃ§Ã£o: `<anÃ´nima>()`
- L22 â€” parÃ¢metro: `query`
- L22 â€” retorno da funÃ§Ã£o: `<anÃ´nima>()`
- L26 â€” parÃ¢metro: `query`
- L26 â€” retorno da funÃ§Ã£o: `<anÃ´nima>()`
- L30 â€” parÃ¢metro: `query`
- L30 â€” retorno da funÃ§Ã£o: `<anÃ´nima>()`

### [src/modules/auditHistory/auditHistory.service.ts](../src/modules/auditHistory/auditHistory.service.ts)

- L27 â€” variÃ¡vel: `custody`
- L43 â€” variÃ¡vel: `{ items, total }`
- L45 â€” parÃ¢metro: `row`
- L45 â€” retorno da funÃ§Ã£o: `<anÃ´nima>()`
- L71 â€” variÃ¡vel: `occurredAt`
- L73 â€” variÃ¡vel: `userId`
- L103 â€” variÃ¡vel: `row`
- L114 â€” variÃ¡vel: `scope`
- L116 â€” variÃ¡vel: `protocol`
- L117 â€” variÃ¡vel: `request`
- L118 â€” variÃ¡vel: `isVisible`
- L145 â€” variÃ¡vel: `normalized`
- L147 â€” variÃ¡vel: `request`
- L154 â€” parÃ¢metro: `row`
- L154 â€” retorno da funÃ§Ã£o: `<anÃ´nima>()`
- L157 â€” variÃ¡vel: `rows`
- L158 â€” parÃ¢metro: `row`
- L158 â€” retorno da funÃ§Ã£o: `<anÃ´nima>()`

### [src/modules/auth/auth.controller.ts](../src/modules/auth/auth.controller.ts)

- L12 â€” variÃ¡vel: `COOKIE_OPTIONS`
- L26 â€” retorno da funÃ§Ã£o: `<anÃ´nima>()`
- L26 â€” variÃ¡vel: `logout`
- L31 â€” retorno da funÃ§Ã£o: `<anÃ´nima>()`
- L31 â€” variÃ¡vel: `authenticate`
- L32 â€” variÃ¡vel: `parsed`
- L38 â€” variÃ¡vel: `foundUser`
- L41 â€” variÃ¡vel: `changeToken`
- L64 â€” variÃ¡vel: `sessionToken`
- L87 â€” retorno da funÃ§Ã£o: `<anÃ´nima>()`
- L87 â€” variÃ¡vel: `me`
- L88 â€” variÃ¡vel: `userId`
- L89 â€” variÃ¡vel: `sessionUser`
- L104 â€” retorno da funÃ§Ã£o: `<anÃ´nima>()`
- L104 â€” variÃ¡vel: `changePassword`
- L105 â€” variÃ¡vel: `parsed`
- L111 â€” variÃ¡vel: `userId`
- L112 â€” variÃ¡vel: `updated`
- L114 â€” variÃ¡vel: `sessionToken`

### [src/modules/auth/auth.repository.ts](../src/modules/auth/auth.repository.ts)

- L6 â€” retorno da funÃ§Ã£o: `authUserQuery()`
- L96 â€” variÃ¡vel: `updated`
- L106 â€” variÃ¡vel: `passwordChangedAt`

### [src/modules/auth/auth.router.ts](../src/modules/auth/auth.router.ts)

- L2 â€” variÃ¡vel: `authRoutes`

### [src/modules/auth/auth.schema.ts](../src/modules/auth/auth.schema.ts)

- L4 â€” variÃ¡vel: `maxPasswordBytes`
- L7 â€” parÃ¢metro: `value`
- L7 â€” retorno da funÃ§Ã£o: `<anÃ´nima>()`
- L9 â€” variÃ¡vel: `loginSchema`
- L14 â€” variÃ¡vel: `changePasswordSchema`
- L20 â€” parÃ¢metro: `data`
- L20 â€” retorno da funÃ§Ã£o: `<anÃ´nima>()`
- L24 â€” parÃ¢metro: `data`
- L24 â€” retorno da funÃ§Ã£o: `<anÃ´nima>()`

### [src/modules/auth/auth.service.ts](../src/modules/auth/auth.service.ts)

- L33 â€” variÃ¡vel: `DUMMY_PASSWORD_HASH`
- L36 â€” variÃ¡vel: `email`
- L38 â€” variÃ¡vel: `user`
- L54 â€” variÃ¡vel: `isPasswordValid`
- L74 â€” variÃ¡vel: `user`
- L80 â€” variÃ¡vel: `grants`
- L99 â€” variÃ¡vel: `user`
- L109 â€” variÃ¡vel: `isCurrentPasswordValid`
- L115 â€” variÃ¡vel: `isSamePassword`
- L121 â€” variÃ¡vel: `newPasswordHash`
- L125 â€” parÃ¢metro: `trx`
- L125 â€” retorno da funÃ§Ã£o: `<anÃ´nima>()`
- L125 â€” variÃ¡vel: `{ password_changed_at }`
- L126 â€” variÃ¡vel: `result`

### [src/modules/DTOs/users/UpdateProfileRequest.dto.ts](../src/modules/DTOs/users/UpdateProfileRequest.dto.ts)

- L15 â€” variÃ¡vel: `updateRequesterSelfSchema`
- L29 â€” variÃ¡vel: `updateRequesterSchema`
- L47 â€” variÃ¡vel: `updateProfileSchema`

### [src/modules/internalNotes/internalNotes.controller.ts](../src/modules/internalNotes/internalNotes.controller.ts)

- L15 â€” variÃ¡vel: `parsed`
- L23 â€” variÃ¡vel: `actor`
- L24 â€” variÃ¡vel: `role`
- L33 â€” variÃ¡vel: `listInternalNotes`
- L34 â€” variÃ¡vel: `parsed`
- L39 â€” variÃ¡vel: `response`
- L48 â€” variÃ¡vel: `createInternalNote`
- L49 â€” variÃ¡vel: `parsed`
- L54 â€” variÃ¡vel: `response`
- L63 â€” variÃ¡vel: `markInternalNotesRead`
- L64 â€” variÃ¡vel: `parsed`

### [src/modules/internalNotes/internalNotes.repository.ts](../src/modules/internalNotes/internalNotes.repository.ts)

- L32 â€” variÃ¡vel: `MAPPING_RECORD_ACTIONS`
- L34 â€” variÃ¡vel: `NOTE_COLUMNS`
- L70 â€” variÃ¡vel: `query`
- L76 â€” parÃ¢metro: `builder`
- L76 â€” retorno da funÃ§Ã£o: `<anÃ´nima>()`
- L77 â€” parÃ¢metro: `nested`
- L77 â€” retorno da funÃ§Ã£o: `<anÃ´nima>()`
- L101 â€” variÃ¡vel: `query`
- L104 â€” parÃ¢metro: `scope`
- L104 â€” retorno da funÃ§Ã£o: `<anÃ´nima>()`
- L106 â€” parÃ¢metro: `requestScope`
- L106 â€” retorno da funÃ§Ã£o: `<anÃ´nima>()`
- L112 â€” parÃ¢metro: `mappingScope`
- L112 â€” retorno da funÃ§Ã£o: `<anÃ´nima>()`
- L125 â€” variÃ¡vel: `auditId`
- L126 â€” parÃ¢metro: `builder`
- L126 â€” retorno da funÃ§Ã£o: `<anÃ´nima>()`
- L127 â€” parÃ¢metro: `nested`
- L127 â€” retorno da funÃ§Ã£o: `<anÃ´nima>()`
- L160 â€” variÃ¡vel: `query`
- L168 â€” variÃ¡vel: `row`
- L175 â€” variÃ¡vel: `TRIAGE_HISTORY_COLUMNS`
- L222 â€” variÃ¡vel: `latestAudit`
- L231 â€” variÃ¡vel: `rows`
- L233 â€” retorno da funÃ§Ã£o: `<anÃ´nima>()`
- L259 â€” parÃ¢metro: `row`
- L259 â€” retorno da funÃ§Ã£o: `<anÃ´nima>()`
- L259 â€” variÃ¡vel: `mappingIds`
- L260 â€” variÃ¡vel: `professionalIds`
- L261 â€” parÃ¢metro: `id`
- L261 â€” parÃ¢metro: `row`
- L261 â€” retorno da funÃ§Ã£o: `<anÃ´nima>()`
- L264 â€” variÃ¡vel: `[participantRows, assigneeRows]`
- L291 â€” variÃ¡vel: `participantsByMapping`
- L292 â€” variÃ¡vel: `participant`
- L293 â€” variÃ¡vel: `list`
- L302 â€” parÃ¢metro: `assignee`
- L302 â€” retorno da funÃ§Ã£o: `<anÃ´nima>()`
- L302 â€” variÃ¡vel: `assigneeById`
- L304 â€” parÃ¢metro: `row`
- L304 â€” retorno da funÃ§Ã£o: `<anÃ´nima>()`
- L321 â€” parÃ¢metro: `row`
- L321 â€” retorno da funÃ§Ã£o: `<anÃ´nima>()`
- L329 â€” variÃ¡vel: `rows`
- L333 â€” parÃ¢metro: `row`
- L333 â€” retorno da funÃ§Ã£o: `<anÃ´nima>()`
- L350 â€” parÃ¢metro: `row`
- L350 â€” retorno da funÃ§Ã£o: `<anÃ´nima>()`
- L367 â€” variÃ¡vel: `rows`
- L376 â€” variÃ¡vel: `row`

### [src/modules/internalNotes/internalNotes.router.ts](../src/modules/internalNotes/internalNotes.router.ts)

- L10 â€” variÃ¡vel: `internalNotesRoutes`

### [src/modules/internalNotes/internalNotes.schema.ts](../src/modules/internalNotes/internalNotes.schema.ts)

- L3 â€” variÃ¡vel: `protocolParamsSchema`
- L7 â€” variÃ¡vel: `createInternalNoteSchema`
- L15 â€” variÃ¡vel: `markInternalNotesReadSchema`
- L22 â€” variÃ¡vel: `cursorPayloadSchema`
- L28 â€” parÃ¢metro: `ctx`
- L28 â€” parÃ¢metro: `cursor`
- L28 â€” retorno da funÃ§Ã£o: `<anÃ´nima>()`
- L29 â€” variÃ¡vel: `pattern`
- L37 â€” variÃ¡vel: `listTimelineQuerySchema`
- L48 â€” parÃ¢metro: `ctx`
- L48 â€” parÃ¢metro: `raw`
- L61 â€” variÃ¡vel: `payload`

### [src/modules/internalNotes/internalNotes.service.ts](../src/modules/internalNotes/internalNotes.service.ts)

- L33 â€” variÃ¡vel: `EVENT_ID_PREFIX`
- L34 â€” variÃ¡vel: `NOTE_RANK`
- L35 â€” variÃ¡vel: `EVENT_RANK`
- L61 â€” variÃ¡vel: `request`
- L78 â€” variÃ¡vel: `payload`
- L116 â€” variÃ¡vel: `entries`
- L117 â€” variÃ¡vel: `page`
- L118 â€” variÃ¡vel: `oldest`
- L119 â€” variÃ¡vel: `nextCursor`
- L121 â€” parÃ¢metro: `entry`
- L121 â€” retorno da funÃ§Ã£o: `<anÃ´nima>()`
- L126 â€” variÃ¡vel: `parsed`
- L163 â€” variÃ¡vel: `numericId`
- L164 â€” variÃ¡vel: `statusName`
- L168 â€” variÃ¡vel: `userId`
- L169 â€” variÃ¡vel: `name`
- L173 â€” variÃ¡vel: `userId`
- L174 â€” variÃ¡vel: `name`
- L181 â€” variÃ¡vel: `name`
- L212 â€” variÃ¡vel: `date`
- L256 â€” parÃ¢metro: `participant`
- L256 â€” retorno da funÃ§Ã£o: `<anÃ´nima>()`
- L280 â€” variÃ¡vel: `userIds`
- L281 â€” variÃ¡vel: `professionalIds`
- L282 â€” variÃ¡vel: `statusIds`
- L284 â€” variÃ¡vel: `row`
- L286 â€” variÃ¡vel: `userId`
- L291 â€” variÃ¡vel: `statusId`
- L300 â€” variÃ¡vel: `[userNames, professionalNames, statusNames]`
- L306 â€” parÃ¢metro: `row`
- L306 â€” retorno da funÃ§Ã£o: `<anÃ´nima>()`
- L329 â€” variÃ¡vel: `requestId`
- L330 â€” variÃ¡vel: `cursor`
- L331 â€” variÃ¡vel: `pageLimit`
- L333 â€” variÃ¡vel: `readState`
- L335 â€” variÃ¡vel: `[noteRows, eventRows, unseenCount, triageRows, mappingRows]`
- L343 â€” variÃ¡vel: `events`
- L344 â€” variÃ¡vel: `notes`
- L345 â€” variÃ¡vel: `{ items, nextCursor }`
- L362 â€” variÃ¡vel: `requestId`
- L363 â€” variÃ¡vel: `internalNoteId`
- L368 â€” variÃ¡vel: `note`
- L382 â€” variÃ¡vel: `requestId`
- L383 â€” variÃ¡vel: `note`

### [src/modules/notifications/notifications.controller.ts](../src/modules/notifications/notifications.controller.ts)

- L16 â€” variÃ¡vel: `HEARTBEAT_INTERVAL_MS`
- L17 â€” variÃ¡vel: `SSE_RETRY_MS`
- L24 â€” variÃ¡vel: `userId`
- L34 â€” variÃ¡vel: `parsed`
- L40 â€” variÃ¡vel: `result`
- L45 â€” variÃ¡vel: `result`
- L50 â€” variÃ¡vel: `parsed`
- L56 â€” variÃ¡vel: `result`
- L61 â€” variÃ¡vel: `result`
- L66 â€” variÃ¡vel: `header`
- L67 â€” variÃ¡vel: `raw`
- L83 â€” variÃ¡vel: `userId`
- L95 â€” variÃ¡vel: `sentIds`
- L97 â€” variÃ¡vel: `writeNotification`
- L104 â€” variÃ¡vel: `deliver`
- L105 â€” variÃ¡vel: `items`
- L106 â€” variÃ¡vel: `item`
- L111 â€” variÃ¡vel: `isReplaying`
- L112 â€” variÃ¡vel: `isClosed`
- L115 â€” parÃ¢metro: `payload`
- L115 â€” retorno da funÃ§Ã£o: `<anÃ´nima>()`
- L115 â€” variÃ¡vel: `unsubscribe`
- L123 â€” retorno da funÃ§Ã£o: `<anÃ´nima>()`
- L129 â€” retorno da funÃ§Ã£o: `<anÃ´nima>()`
- L129 â€” variÃ¡vel: `heartbeat`
- L151 â€” variÃ¡vel: `lastEventId`
- L154 â€” variÃ¡vel: `missed`
- L155 â€” variÃ¡vel: `item`
- L162 â€” variÃ¡vel: `payload`
- L165 â€” variÃ¡vel: `error`

### [src/modules/notifications/notifications.repository.ts](../src/modules/notifications/notifications.repository.ts)

- L16 â€” variÃ¡vel: `NOTIFICATION_COLUMNS`
- L29 â€” variÃ¡vel: `query`
- L44 â€” variÃ¡vel: `anchor`
- L86 â€” variÃ¡vel: `anchor`
- L106 â€” variÃ¡vel: `row`
- L124 â€” variÃ¡vel: `updated`
- L133 â€” variÃ¡vel: `row`
- L137 â€” variÃ¡vel: `existing`
- L148 â€” variÃ¡vel: `updated`

### [src/modules/notifications/notifications.router.ts](../src/modules/notifications/notifications.router.ts)

- L11 â€” variÃ¡vel: `notificationsRoutes`

### [src/modules/notifications/notifications.schema.ts](../src/modules/notifications/notifications.schema.ts)

- L3 â€” variÃ¡vel: `notificationIdSchema`
- L5 â€” variÃ¡vel: `CURSOR_SEPARATOR`
- L7 â€” variÃ¡vel: `notificationCursorPayloadSchema`
- L14 â€” variÃ¡vel: `listNotificationsQuerySchema`
- L26 â€” parÃ¢metro: `ctx`
- L26 â€” parÃ¢metro: `raw`
- L34 â€” variÃ¡vel: `text`
- L35 â€” variÃ¡vel: `separatorIndex`
- L50 â€” variÃ¡vel: `payload`
- L61 â€” variÃ¡vel: `notificationIdParamSchema`

### [src/modules/notifications/notifications.service.ts](../src/modules/notifications/notifications.service.ts)

- L15 â€” variÃ¡vel: `CURSOR_SEPARATOR`
- L18 â€” variÃ¡vel: `payload`
- L19 â€” variÃ¡vel: `createdAt`
- L53 â€” variÃ¡vel: `rows`
- L59 â€” variÃ¡vel: `hasNextPage`
- L60 â€” variÃ¡vel: `pageRows`
- L61 â€” variÃ¡vel: `items`
- L62 â€” variÃ¡vel: `lastItem`
- L80 â€” variÃ¡vel: `row`
- L86 â€” variÃ¡vel: `readAt`
- L104 â€” variÃ¡vel: `rows`
- L112 â€” variÃ¡vel: `rows`

### [src/modules/pendingItems/pendingItems.controller.ts](../src/modules/pendingItems/pendingItems.controller.ts)

- L9 â€” variÃ¡vel: `{ checkRateLimit }`
- L28 â€” variÃ¡vel: `p`
- L35 â€” variÃ¡vel: `protocol`
- L36 â€” variÃ¡vel: `parsed`
- L38 â€” variÃ¡vel: `result`
- L48 â€” variÃ¡vel: `protocol`
- L49 â€” variÃ¡vel: `result`
- L54 â€” variÃ¡vel: `protocol`
- L55 â€” variÃ¡vel: `pendingItemId`
- L58 â€” variÃ¡vel: `item`
- L69 â€” variÃ¡vel: `protocol`
- L70 â€” variÃ¡vel: `pendingItemId`
- L73 â€” variÃ¡vel: `file`
- L75 â€” variÃ¡vel: `result`
- L86 â€” variÃ¡vel: `protocol`
- L87 â€” variÃ¡vel: `parsed`
- L89 â€” variÃ¡vel: `result`
- L99 â€” variÃ¡vel: `protocol`
- L100 â€” variÃ¡vel: `body`
- L105 â€” variÃ¡vel: `key`
- L109 â€” variÃ¡vel: `parsed`

### [src/modules/pendingItems/pendingItems.repository.ts](../src/modules/pendingItems/pendingItems.repository.ts)

- L24 â€” variÃ¡vel: `conn`
- L25 â€” variÃ¡vel: `row`
- L56 â€” variÃ¡vel: `conn`
- L57 â€” variÃ¡vel: `row`
- L85 â€” variÃ¡vel: `conn`
- L86 â€” variÃ¡vel: `row`
- L97 â€” variÃ¡vel: `conn`
- L108 â€” variÃ¡vel: `conn`
- L109 â€” variÃ¡vel: `row`
- L118 â€” variÃ¡vel: `grouped`
- L121 â€” variÃ¡vel: `conn`
- L122 â€” variÃ¡vel: `rows`
- L127 â€” variÃ¡vel: `row`
- L128 â€” variÃ¡vel: `key`
- L129 â€” variÃ¡vel: `list`
- L141 â€” variÃ¡vel: `conn`
- L142 â€” variÃ¡vel: `row`
- L155 â€” variÃ¡vel: `conn`
- L156 â€” variÃ¡vel: `rows`
- L162 â€” parÃ¢metro: `r`
- L162 â€” retorno da funÃ§Ã£o: `<anÃ´nima>()`
- L162 â€” variÃ¡vel: `map`
- L163 â€” variÃ¡vel: `requested`
- L164 â€” variÃ¡vel: `responded`
- L165 â€” variÃ¡vel: `validated`
- L178 â€” variÃ¡vel: `conn`
- L180 â€” variÃ¡vel: `rows`
- L190 â€” variÃ¡vel: `byBatch`
- L191 â€” variÃ¡vel: `row`
- L192 â€” variÃ¡vel: `entry`
- L193 â€” variÃ¡vel: `count`
- L200 â€” variÃ¡vel: `candidates`
- L201 â€” parÃ¢metro: `[, s]`
- L201 â€” retorno da funÃ§Ã£o: `<anÃ´nima>()`
- L205 â€” variÃ¡vel: `requiresAttachment`
- L209 â€” parÃ¢metro: `[batchId]`
- L209 â€” retorno da funÃ§Ã£o: `<anÃ´nima>()`
- L213 â€” parÃ¢metro: `r`
- L213 â€” retorno da funÃ§Ã£o: `<anÃ´nima>()`
- L213 â€” variÃ¡vel: `requiresSet`
- L215 â€” variÃ¡vel: `attachmentCounts`
- L217 â€” variÃ¡vel: `counts`
- L227 â€” variÃ¡vel: `c`
- L230 â€” variÃ¡vel: `[batchId, summary]`
- L241 â€” variÃ¡vel: `conn`
- L242 â€” variÃ¡vel: `row`
- L248 â€” variÃ¡vel: `count`
- L250 â€” variÃ¡vel: `lastUnreadAt`
- L255 â€” variÃ¡vel: `row`
- L305 â€” variÃ¡vel: `row`
- L331 â€” variÃ¡vel: `conn`
- L346 â€” parÃ¢metro: `trx`
- L346 â€” retorno da funÃ§Ã£o: `<anÃ´nima>()`
- L347 â€” parÃ¢metro: `row`
- L347 â€” retorno da funÃ§Ã£o: `<anÃ´nima>()`
- L347 â€” variÃ¡vel: `toInsert`
- L363 â€” variÃ¡vel: `current`
- L364 â€” variÃ¡vel: `pendingStatusId`
- L419 â€” parÃ¢metro: `trx`
- L419 â€” retorno da funÃ§Ã£o: `<anÃ´nima>()`
- L420 â€” variÃ¡vel: `row`
- L447 â€” variÃ¡vel: `requestedCount`
- L451 â€” variÃ¡vel: `requestedRemaining`
- L453 â€” variÃ¡vel: `requiresAttachment`
- L456 â€” variÃ¡vel: `attachmentSatisfied`
- L460 â€” variÃ¡vel: `current`
- L461 â€” variÃ¡vel: `nextStatusName`
- L468 â€” variÃ¡vel: `statusId`
- L494 â€” parÃ¢metro: `trx`
- L494 â€” retorno da funÃ§Ã£o: `<anÃ´nima>()`
- L530 â€” parÃ¢metro: `trx`
- L530 â€” retorno da funÃ§Ã£o: `<anÃ´nima>()`
- L537 â€” variÃ¡vel: `hasReopen`
- L539 â€” variÃ¡vel: `dec`
- L540 â€” variÃ¡vel: `row`
- L544 â€” variÃ¡vel: `currentStatus`
- L590 â€” variÃ¡vel: `nextStatusName`
- L592 â€” variÃ¡vel: `statusId`
- L609 â€” parÃ¢metro: `d`
- L609 â€” retorno da funÃ§Ã£o: `<anÃ´nima>()`
- L631 â€” variÃ¡vel: `col`
- L633 â€” variÃ¡vel: `v`
- L637 â€” variÃ¡vel: `requesterRow`
- L659 â€” variÃ¡vel: `col`
- L662 â€” variÃ¡vel: `category`
- L705 â€” variÃ¡vel: `col`
- L732 â€” variÃ¡vel: `entry`

### [src/modules/pendingItems/pendingItems.router.ts](../src/modules/pendingItems/pendingItems.router.ts)

- L20 â€” variÃ¡vel: `router`
- L22 â€” variÃ¡vel: `upload`
- L25 â€” parÃ¢metro: `_req`
- L25 â€” parÃ¢metro: `cb`
- L25 â€” parÃ¢metro: `file`
- L25 â€” retorno da funÃ§Ã£o: `<anÃ´nima>()`
- L36 â€” variÃ¡vel: `uploadSingle`
- L62 â€” parÃ¢metro: `next`
- L62 â€” parÃ¢metro: `req`
- L62 â€” parÃ¢metro: `res`
- L62 â€” retorno da funÃ§Ã£o: `<anÃ´nima>()`
- L63 â€” parÃ¢metro: `err`
- L63 â€” retorno da funÃ§Ã£o: `<anÃ´nima>()`
- L78 â€” variÃ¡vel: `publicVerifyRouter`

### [src/modules/pendingItems/pendingItems.schema.ts](../src/modules/pendingItems/pendingItems.schema.ts)

- L7 â€” variÃ¡vel: `createPendingItemsSchema`
- L21 â€” parÃ¢metro: `ctx`
- L21 â€” parÃ¢metro: `data`
- L21 â€” retorno da funÃ§Ã£o: `<anÃ´nima>()`
- L22 â€” variÃ¡vel: `hasObservation`
- L24 â€” variÃ¡vel: `hasItems`
- L34 â€” variÃ¡vel: `verifySchema`
- L40 â€” variÃ¡vel: `reviewSchema`

### [src/modules/pendingItems/pendingItems.service.ts](../src/modules/pendingItems/pendingItems.service.ts)

- L31 â€” variÃ¡vel: `TERMINAL_STATUSES`
- L60 â€” parÃ¢metro: `row`
- L60 â€” retorno da funÃ§Ã£o: `<anÃ´nima>()`
- L60 â€” variÃ¡vel: `bases`
- L61 â€” variÃ¡vel: `base`
- L65 â€” parÃ¢metro: `b`
- L65 â€” retorno da funÃ§Ã£o: `<anÃ´nima>()`
- L65 â€” variÃ¡vel: `attachmentsByItem`
- L68 â€” variÃ¡vel: `base`
- L69 â€” variÃ¡vel: `atts`
- L70 â€” parÃ¢metro: `a`
- L70 â€” retorno da funÃ§Ã£o: `<anÃ´nima>()`
- L70 â€” variÃ¡vel: `attachments`
- L78 â€” variÃ¡vel: `currentValue`
- L94 â€” variÃ¡vel: `request`
- L108 â€” variÃ¡vel: `observation`
- L109 â€” variÃ¡vel: `items`
- L110 â€” variÃ¡vel: `hasObservation`
- L111 â€” variÃ¡vel: `hasItems`
- L122 â€” variÃ¡vel: `raw`
- L126 â€” variÃ¡vel: `item`
- L127 â€” variÃ¡vel: `fieldKey`
- L150 â€” variÃ¡vel: `batchId`
- L151 â€” variÃ¡vel: `requestAttachment`
- L168 â€” variÃ¡vel: `{ item, fieldKey }`
- L169 â€” variÃ¡vel: `snapshot`
- L186 â€” variÃ¡vel: `createdRows`
- L195 â€” variÃ¡vel: `mapped`
- L205 â€” variÃ¡vel: `TRACKING_INVALID_IDENTITY`
- L222 â€” variÃ¡vel: `nameOk`
- L223 â€” variÃ¡vel: `emailOk`
- L240 â€” variÃ¡vel: `request`
- L243 â€” variÃ¡vel: `actor`
- L248 â€” variÃ¡vel: `canReadAssigned`
- L253 â€” variÃ¡vel: `canRespondOwn`
- L280 â€” variÃ¡vel: `request`
- L283 â€” variÃ¡vel: `actor`
- L305 â€” variÃ¡vel: `request`
- L306 â€” variÃ¡vel: `rows`
- L307 â€” variÃ¡vel: `items`
- L316 â€” variÃ¡vel: `openRow`
- L317 â€” parÃ¢metro: `row`
- L317 â€” retorno da funÃ§Ã£o: `<anÃ´nima>()`
- L319 â€” variÃ¡vel: `targetRow`
- L320 â€” variÃ¡vel: `batchId`
- L321 â€” variÃ¡vel: `requestAttachment`
- L323 â€” parÃ¢metro: `row`
- L323 â€” retorno da funÃ§Ã£o: `<anÃ´nima>()`
- L335 â€” variÃ¡vel: `{ request, actorEmail }`
- L341 â€” variÃ¡vel: `row`
- L349 â€” variÃ¡vel: `type`
- L367 â€” variÃ¡vel: `response`
- L380 â€” variÃ¡vel: `updated`
- L389 â€” parÃ¢metro: `facts`
- L389 â€” retorno da funÃ§Ã£o: `<anÃ´nima>()`
- L397 â€” variÃ¡vel: `list`
- L414 â€” variÃ¡vel: `{ request }`
- L420 â€” variÃ¡vel: `row`
- L436 â€” variÃ¡vel: `[saved]`
- L446 â€” variÃ¡vel: `err`
- L486 â€” variÃ¡vel: `date`
- L508 â€” variÃ¡vel: `nullableComplement`
- L538 â€” variÃ¡vel: `request`
- L546 â€” variÃ¡vel: `batchId`
- L547 â€” variÃ¡vel: `batchRows`
- L550 â€” parÃ¢metro: `row`
- L550 â€” retorno da funÃ§Ã£o: `<anÃ´nima>()`
- L550 â€” variÃ¡vel: `byId`
- L552 â€” variÃ¡vel: `decision`
- L553 â€” variÃ¡vel: `row`
- L555 â€” variÃ¡vel: `status`
- L567 â€” parÃ¢metro: `decision`
- L567 â€” retorno da funÃ§Ã£o: `<anÃ´nima>()`
- L571 â€” variÃ¡vel: `row`
- L572 â€” variÃ¡vel: `fieldKey`
- L581 â€” variÃ¡vel: `decidedRows`
- L590 â€” parÃ¢metro: `facts`
- L590 â€” retorno da funÃ§Ã£o: `<anÃ´nima>()`
- L593 â€” variÃ¡vel: `mapped`
- L603 â€” variÃ¡vel: `mode`
- L608 â€” variÃ¡vel: `found`
- L610 â€” variÃ¡vel: `nameOk`
- L611 â€” variÃ¡vel: `emailOk`

### [src/modules/portalConfig/portalConfig.controller.ts](../src/modules/portalConfig/portalConfig.controller.ts)

- L27 â€” variÃ¡vel: `id`
- L50 â€” variÃ¡vel: `getConfig`
- L51 â€” variÃ¡vel: `response`
- L59 â€” variÃ¡vel: `updateAccess`
- L60 â€” variÃ¡vel: `parsed`
- L65 â€” variÃ¡vel: `response`
- L73 â€” variÃ¡vel: `updateIdentity`
- L74 â€” variÃ¡vel: `parsed`
- L79 â€” variÃ¡vel: `response`
- L87 â€” variÃ¡vel: `updateTheme`
- L88 â€” variÃ¡vel: `parsed`
- L93 â€” variÃ¡vel: `response`
- L101 â€” variÃ¡vel: `updateAssets`
- L106 â€” variÃ¡vel: `rawAssets`
- L107 â€” variÃ¡vel: `filesMap`
- L108 â€” parÃ¢metro: `list`
- L108 â€” retorno da funÃ§Ã£o: `<anÃ´nima>()`
- L108 â€” variÃ¡vel: `hasBinary`
- L121 â€” variÃ¡vel: `validated`
- L129 â€” variÃ¡vel: `files`
- L137 â€” variÃ¡vel: `[fieldName, fileArray]`
- L139 â€” variÃ¡vel: `file`
- L145 â€” variÃ¡vel: `targetDir`
- L147 â€” variÃ¡vel: `saved`
- L148 â€” parÃ¢metro: `[, file]`
- L148 â€” retorno da funÃ§Ã£o: `<anÃ´nima>()`
- L150 â€” parÃ¢metro: `[fieldName]`
- L150 â€” retorno da funÃ§Ã£o: `<anÃ´nima>()`
- L154 â€” parÃ¢metro: `attachment`
- L154 â€” parÃ¢metro: `index`
- L154 â€” retorno da funÃ§Ã£o: `<anÃ´nima>()`
- L155 â€” variÃ¡vel: `fieldName`
- L165 â€” variÃ¡vel: `response`
- L167 â€” variÃ¡vel: `err`
- L180 â€” variÃ¡vel: `updateCategories`
- L181 â€” variÃ¡vel: `parsed`
- L186 â€” variÃ¡vel: `response`
- L194 â€” variÃ¡vel: `updateStatuses`
- L195 â€” variÃ¡vel: `parsed`
- L200 â€” variÃ¡vel: `response`
- L208 â€” variÃ¡vel: `updatePrioritizationWeights`
- L212 â€” variÃ¡vel: `parsed`
- L217 â€” variÃ¡vel: `response`

### [src/modules/portalConfig/portalConfig.mappers.ts](../src/modules/portalConfig/portalConfig.mappers.ts)

- L27 â€” variÃ¡vel: `TONES`
- L121 â€” variÃ¡vel: `palette`
- L122 â€” variÃ¡vel: `tokens`
- L123 â€” variÃ¡vel: `token`
- L130 â€” variÃ¡vel: `tone`
- L131 â€” variÃ¡vel: `{ color, background, backgroundLocked }`
- L151 â€” variÃ¡vel: `read`
- L155 â€” variÃ¡vel: `readGradient`
- L159 â€” variÃ¡vel: `readAngle`
- L163 â€” variÃ¡vel: `readStatus`
- L167 â€” variÃ¡vel: `{ color, background, backgroundLocked }`
- L181 â€” variÃ¡vel: `buildPalette`
- L182 â€” parÃ¢metro: `token`
- L182 â€” retorno da funÃ§Ã£o: `<anÃ´nima>()`
- L182 â€” variÃ¡vel: `tokenEntries`

### [src/modules/portalConfig/portalConfig.repository.ts](../src/modules/portalConfig/portalConfig.repository.ts)

- L22 â€” variÃ¡vel: `source`
- L23 â€” variÃ¡vel: `row`
- L46 â€” variÃ¡vel: `source`
- L54 â€” variÃ¡vel: `source`
- L60 â€” variÃ¡vel: `source`
- L73 â€” variÃ¡vel: `source`
- L129 â€” variÃ¡vel: `now`
- L147 â€” variÃ¡vel: `now`
- L175 â€” variÃ¡vel: `category`
- L193 â€” parÃ¢metro: `c`
- L193 â€” retorno da funÃ§Ã£o: `<anÃ´nima>()`
- L193 â€” variÃ¡vel: `keepIds`
- L215 â€” parÃ¢metro: `index`
- L215 â€” parÃ¢metro: `status`
- L215 â€” retorno da funÃ§Ã£o: `<anÃ´nima>()`
- L215 â€” variÃ¡vel: `orderById`
- L217 â€” variÃ¡vel: `status`
- L218 â€” variÃ¡vel: `orderNumber`
- L219 â€” variÃ¡vel: `triageMode`
- L220 â€” variÃ¡vel: `mappingMode`
- L221 â€” variÃ¡vel: `isTerminal`
- L222 â€” variÃ¡vel: `row`
- L243 â€” parÃ¢metro: `status`
- L243 â€” retorno da funÃ§Ã£o: `<anÃ´nima>()`
- L243 â€” variÃ¡vel: `keepIds`
- L245 â€” variÃ¡vel: `omitted`
- L250 â€” variÃ¡vel: `nextOrder`
- L251 â€” variÃ¡vel: `row`
- L275 â€” variÃ¡vel: `[contractKey, weight]`
- L276 â€” variÃ¡vel: `criterionId`

### [src/modules/portalConfig/portalConfig.router.ts](../src/modules/portalConfig/portalConfig.router.ts)

- L16 â€” variÃ¡vel: `portalConfigRoutes`

### [src/modules/portalConfig/portalConfig.schema.ts](../src/modules/portalConfig/portalConfig.schema.ts)

- L22 â€” variÃ¡vel: `hexColorSchema`
- L26 â€” variÃ¡vel: `ThemeGradientSchema`
- L39 â€” variÃ¡vel: `StatusToneSchema`
- L47 â€” variÃ¡vel: `statusTonesShape`
- L48 â€” parÃ¢metro: `tone`
- L48 â€” retorno da funÃ§Ã£o: `<anÃ´nima>()`
- L51 â€” variÃ¡vel: `tokenShape`
- L52 â€” parÃ¢metro: `key`
- L52 â€” retorno da funÃ§Ã£o: `<anÃ´nima>()`
- L55 â€” variÃ¡vel: `ThemePaletteSchema`
- L63 â€” variÃ¡vel: `updateThemeSchema`
- L74 â€” variÃ¡vel: `updateAccessSchema`
- L82 â€” variÃ¡vel: `updateIdentitySchema`
- L99 â€” parÃ¢metro: `identity`
- L99 â€” retorno da funÃ§Ã£o: `<anÃ´nima>()`
- L106 â€” variÃ¡vel: `portalCategorySchema`
- L115 â€” variÃ¡vel: `updateCategoriesSchema`
- L121 â€” parÃ¢metro: `categories`
- L121 â€” parÃ¢metro: `ctx`
- L121 â€” retorno da funÃ§Ã£o: `<anÃ´nima>()`
- L122 â€” variÃ¡vel: `seen`
- L123 â€” parÃ¢metro: `category`
- L123 â€” parÃ¢metro: `index`
- L123 â€” retorno da funÃ§Ã£o: `<anÃ´nima>()`
- L124 â€” variÃ¡vel: `key`
- L134 â€” parÃ¢metro: `category`
- L134 â€” retorno da funÃ§Ã£o: `<anÃ´nima>()`
- L145 â€” variÃ¡vel: `StatusModeSchema`
- L149 â€” variÃ¡vel: `portalStatusSchema`
- L169 â€” parÃ¢metro: `ctx`
- L169 â€” parÃ¢metro: `status`
- L169 â€” retorno da funÃ§Ã£o: `<anÃ´nima>()`
- L179 â€” variÃ¡vel: `updateStatusesSchema`
- L185 â€” parÃ¢metro: `ctx`
- L185 â€” parÃ¢metro: `statuses`
- L185 â€” retorno da funÃ§Ã£o: `<anÃ´nima>()`
- L186 â€” variÃ¡vel: `seenNames`
- L187 â€” parÃ¢metro: `index`
- L187 â€” parÃ¢metro: `status`
- L187 â€” retorno da funÃ§Ã£o: `<anÃ´nima>()`
- L188 â€” variÃ¡vel: `nameKey`
- L216 â€” parÃ¢metro: `status`
- L216 â€” retorno da funÃ§Ã£o: `<anÃ´nima>()`
- L232 â€” variÃ¡vel: `prioritizationWeightSchema`
- L238 â€” variÃ¡vel: `updatePrioritizationWeightsSchema`
- L246 â€” parÃ¢metro: `ctx`
- L246 â€” parÃ¢metro: `{ prioritizationWeights }`
- L246 â€” retorno da funÃ§Ã£o: `<anÃ´nima>()`
- L247 â€” variÃ¡vel: `missing`
- L248 â€” parÃ¢metro: `criterion`
- L248 â€” retorno da funÃ§Ã£o: `<anÃ´nima>()`
- L265 â€” variÃ¡vel: `assetUrlSchema`
- L271 â€” parÃ¢metro: `url`
- L271 â€” retorno da funÃ§Ã£o: `<anÃ´nima>()`
- L275 â€” variÃ¡vel: `portalAssetsPatchSchema`
- L289 â€” parÃ¢metro: `assets`
- L289 â€” retorno da funÃ§Ã£o: `<anÃ´nima>()`

### [src/modules/portalConfig/portalConfig.service.ts](../src/modules/portalConfig/portalConfig.service.ts)

- L32 â€” retorno da funÃ§Ã£o: `assetsFromRow()`
- L67 â€” variÃ¡vel: `[settings, themeRow, categories, statuses, criteria]`
- L75 â€” variÃ¡vel: `theme`
- L83 â€” parÃ¢metro: `cat`
- L83 â€” retorno da funÃ§Ã£o: `<anÃ´nima>()`
- L91 â€” parÃ¢metro: `c`
- L91 â€” retorno da funÃ§Ã£o: `<anÃ´nima>()`
- L92 â€” variÃ¡vel: `key`
- L107 â€” parÃ¢metro: `trx`
- L107 â€” retorno da funÃ§Ã£o: `<anÃ´nima>()`
- L110 â€” variÃ¡vel: `settings`
- L111 â€” variÃ¡vel: `previous`
- L136 â€” parÃ¢metro: `trx`
- L136 â€” retorno da funÃ§Ã£o: `<anÃ´nima>()`
- L139 â€” variÃ¡vel: `settings`
- L140 â€” variÃ¡vel: `previous`
- L147 â€” variÃ¡vel: `updated`
- L148 â€” variÃ¡vel: `newValue`
- L174 â€” parÃ¢metro: `trx`
- L174 â€” retorno da funÃ§Ã£o: `<anÃ´nima>()`
- L178 â€” variÃ¡vel: `themeRow`
- L179 â€” variÃ¡vel: `previousTheme`
- L180 â€” variÃ¡vel: `columns`
- L205 â€” parÃ¢metro: `trx`
- L205 â€” retorno da funÃ§Ã£o: `<anÃ´nima>()`
- L208 â€” variÃ¡vel: `settings`
- L209 â€” variÃ¡vel: `previous`
- L213 â€” variÃ¡vel: `updated`
- L214 â€” variÃ¡vel: `newValue`
- L237 â€” parÃ¢metro: `trx`
- L237 â€” retorno da funÃ§Ã£o: `<anÃ´nima>()`
- L240 â€” variÃ¡vel: `prevRows`
- L241 â€” parÃ¢metro: `cat`
- L241 â€” retorno da funÃ§Ã£o: `<anÃ´nima>()`
- L241 â€” variÃ¡vel: `previous`
- L271 â€” parÃ¢metro: `trx`
- L271 â€” retorno da funÃ§Ã£o: `<anÃ´nima>()`
- L274 â€” variÃ¡vel: `prevRows`
- L275 â€” variÃ¡vel: `previous`
- L276 â€” parÃ¢metro: `st`
- L276 â€” retorno da funÃ§Ã£o: `<anÃ´nima>()`
- L276 â€” variÃ¡vel: `prevById`
- L277 â€” parÃ¢metro: `s`
- L277 â€” retorno da funÃ§Ã£o: `<anÃ´nima>()`
- L277 â€” variÃ¡vel: `incomingById`
- L279 â€” variÃ¡vel: `coreId`
- L280 â€” variÃ¡vel: `existing`
- L289 â€” variÃ¡vel: `incoming`
- L358 â€” parÃ¢metro: `trx`
- L358 â€” retorno da funÃ§Ã£o: `<anÃ´nima>()`
- L361 â€” variÃ¡vel: `prevRows`
- L362 â€” variÃ¡vel: `previous`
- L363 â€” parÃ¢metro: `c`
- L363 â€” retorno da funÃ§Ã£o: `<anÃ´nima>()`
- L364 â€” variÃ¡vel: `key`

### [src/modules/prioritization/prioritization.controller.ts](../src/modules/prioritization/prioritization.controller.ts)

- L12 â€” variÃ¡vel: `id`
- L20 â€” variÃ¡vel: `protocolParamsSchema`
- L24 â€” variÃ¡vel: `listCriteria`
- L25 â€” variÃ¡vel: `response`
- L30 â€” variÃ¡vel: `evaluateScore`
- L31 â€” variÃ¡vel: `parsedParams`
- L36 â€” variÃ¡vel: `parsed`
- L42 â€” variÃ¡vel: `response`

### [src/modules/prioritization/prioritization.repository.ts](../src/modules/prioritization/prioritization.repository.ts)

- L17 â€” variÃ¡vel: `row`
- L24 â€” variÃ¡vel: `row`
- L38 â€” variÃ¡vel: `scoreRounded`
- L57 â€” variÃ¡vel: `row`
- L72 â€” variÃ¡vel: `data`
- L82 â€” variÃ¡vel: `rows`
- L88 â€” variÃ¡vel: `row`

### [src/modules/prioritization/prioritization.router.ts](../src/modules/prioritization/prioritization.router.ts)

- L6 â€” variÃ¡vel: `prioritizationRoutes`

### [src/modules/prioritization/prioritization.schema.ts](../src/modules/prioritization/prioritization.schema.ts)

- L5 â€” variÃ¡vel: `noteSchema`
- L12 â€” variÃ¡vel: `criterionKeySchema`
- L24 â€” variÃ¡vel: `evaluateScoreSchema`
- L25 â€” parÃ¢metro: `notes`
- L25 â€” retorno da funÃ§Ã£o: `<anÃ´nima>()`

### [src/modules/prioritization/prioritization.service.ts](../src/modules/prioritization/prioritization.service.ts)

- L18 â€” variÃ¡vel: `rows`
- L19 â€” parÃ¢metro: `row`
- L19 â€” retorno da funÃ§Ã£o: `<anÃ´nima>()`
- L49 â€” variÃ¡vel: `exists`
- L54 â€” variÃ¡vel: `assigneeUserId`
- L62 â€” variÃ¡vel: `criteria`
- L66 â€” variÃ¡vel: `score`
- L67 â€” variÃ¡vel: `classification`
- L75 â€” parÃ¢metro: `trx`
- L75 â€” retorno da funÃ§Ã£o: `<anÃ´nima>()`
- L75 â€” variÃ¡vel: `evaluation`
- L76 â€” variÃ¡vel: `previous`
- L85 â€” variÃ¡vel: `row`
- L132 â€” parÃ¢metro: `row`
- L132 â€” retorno da funÃ§Ã£o: `<anÃ´nima>()`
- L132 â€” variÃ¡vel: `validIds`
- L134 â€” parÃ¢metro: `row`
- L134 â€” retorno da funÃ§Ã£o: `<anÃ´nima>()`
- L134 â€” variÃ¡vel: `missing`
- L136 â€” parÃ¢metro: `row`
- L136 â€” retorno da funÃ§Ã£o: `<anÃ´nima>()`
- L136 â€” variÃ¡vel: `list`
- L140 â€” parÃ¢metro: `key`
- L140 â€” retorno da funÃ§Ã£o: `<anÃ´nima>()`
- L140 â€” variÃ¡vel: `unknown`
- L148 â€” variÃ¡vel: `shown`
- L154 â€” variÃ¡vel: `somaPonderada`
- L155 â€” parÃ¢metro: `acc`
- L155 â€” parÃ¢metro: `row`
- L155 â€” retorno da funÃ§Ã£o: `<anÃ´nima>()`
- L158 â€” parÃ¢metro: `acc`
- L158 â€” parÃ¢metro: `row`
- L158 â€” retorno da funÃ§Ã£o: `<anÃ´nima>()`
- L158 â€” variÃ¡vel: `somaPesos`
- L169 â€” variÃ¡vel: `range`

### [src/modules/queue/mapping.controller.ts](../src/modules/queue/mapping.controller.ts)

- L13 â€” variÃ¡vel: `protocol`
- L28 â€” variÃ¡vel: `id`
- L36 â€” variÃ¡vel: `getMappingController`
- L37 â€” variÃ¡vel: `protocol`
- L42 â€” variÃ¡vel: `putMappingController`
- L43 â€” variÃ¡vel: `protocol`
- L47 â€” variÃ¡vel: `actor`
- L54 â€” variÃ¡vel: `parsed`
- L56 â€” variÃ¡vel: `{ message, fields }`
- L60 â€” variÃ¡vel: `response`

### [src/modules/queue/mapping.repository.ts](../src/modules/queue/mapping.repository.ts)

- L82 â€” variÃ¡vel: `findMappingRequestContext`
- L86 â€” variÃ¡vel: `row`
- L125 â€” variÃ¡vel: `resolveMappingTarget`
- L135 â€” retorno da funÃ§Ã£o: `<anÃ´nima>()`
- L147 â€” variÃ¡vel: `findMappingAssigneeCandidate`
- L155 â€” variÃ¡vel: `row`
- L174 â€” variÃ¡vel: `findCurrentMapping`
- L178 â€” variÃ¡vel: `row`
- L188 â€” variÃ¡vel: `findLatestOpenMapping`
- L192 â€” variÃ¡vel: `row`
- L202 â€” variÃ¡vel: `findMappingById`
- L207 â€” variÃ¡vel: `row`
- L221 â€” variÃ¡vel: `findMappingParticipants`
- L243 â€” variÃ¡vel: `resolveParticipantUsers`
- L251 â€” variÃ¡vel: `rows`
- L262 â€” parÃ¢metro: `id`
- L262 â€” retorno da funÃ§Ã£o: `<anÃ´nima>()`
- L262 â€” variÃ¡vel: `invalid`
- L263 â€” parÃ¢metro: `r`
- L263 â€” retorno da funÃ§Ã£o: `<anÃ´nima>()`
- L263 â€” variÃ¡vel: `row`
- L272 â€” parÃ¢metro: `row`
- L272 â€” retorno da funÃ§Ã£o: `<anÃ´nima>()`
- L279 â€” variÃ¡vel: `insertMapping`
- L291 â€” variÃ¡vel: `[row]`
- L312 â€” variÃ¡vel: `updateMapping`
- L350 â€” variÃ¡vel: `clearRequestMappingAssignee`
- L363 â€” variÃ¡vel: `replaceMappingParticipants`
- L375 â€” parÃ¢metro: `participant`
- L375 â€” retorno da funÃ§Ã£o: `<anÃ´nima>()`

### [src/modules/queue/mapping.schemas.ts](../src/modules/queue/mapping.schemas.ts)

- L20 â€” variÃ¡vel: `participantIdSchema`
- L30 â€” parÃ¢metro: `value`
- L30 â€” retorno da funÃ§Ã£o: `<anÃ´nima>()`
- L33 â€” parÃ¢metro: `value`
- L33 â€” retorno da funÃ§Ã£o: `<anÃ´nima>()`
- L35 â€” variÃ¡vel: `mappingParticipantSchema`
- L41 â€” variÃ¡vel: `noDuplicateParticipants`
- L42 â€” variÃ¡vel: `seen`
- L44 â€” variÃ¡vel: `participant`
- L48 â€” variÃ¡vel: `key`
- L62 â€” variÃ¡vel: `mappingPayloadSchema`

### [src/modules/queue/mapping.service.ts](../src/modules/queue/mapping.service.ts)

- L40 â€” variÃ¡vel: `LEGACY_ASSIGNABLE_PROFILES`
- L49 â€” parÃ¢metro: `trx`
- L49 â€” retorno da funÃ§Ã£o: `<anÃ´nima>()`
- L68 â€” variÃ¡vel: `date`
- L131 â€” parÃ¢metro: `participant`
- L131 â€” retorno da funÃ§Ã£o: `<anÃ´nima>()`
- L163 â€” parÃ¢metro: `participant`
- L163 â€” retorno da funÃ§Ã£o: `<anÃ´nima>()`
- L194 â€” variÃ¡vel: `textField`
- L195 â€” variÃ¡vel: `next`
- L196 â€” variÃ¡vel: `normalized`
- L243 â€” parÃ¢metro: `participant`
- L243 â€” retorno da funÃ§Ã£o: `<anÃ´nima>()`
- L243 â€” variÃ¡vel: `userIds`
- L247 â€” variÃ¡vel: `usersById`
- L249 â€” parÃ¢metro: `participant`
- L249 â€” variÃ¡vel: `resolved`
- L254 â€” variÃ¡vel: `user`
- L261 â€” variÃ¡vel: `seenEmails`
- L262 â€” variÃ¡vel: `seenUserIds`
- L263 â€” variÃ¡vel: `participant`
- L264 â€” variÃ¡vel: `emailKey`
- L291 â€” variÃ¡vel: `getMappingService`
- L292 â€” variÃ¡vel: `context`
- L297 â€” variÃ¡vel: `mapping`
- L302 â€” variÃ¡vel: `[participants, assigneeCandidate]`
- L315 â€” variÃ¡vel: `upsertMappingService`
- L321 â€” parÃ¢metro: `trx`
- L321 â€” retorno da funÃ§Ã£o: `<anÃ´nima>()`
- L324 â€” variÃ¡vel: `context`
- L363 â€” variÃ¡vel: `isAdmin`
- L364 â€” variÃ¡vel: `isRequestAssignee`
- L366 â€” variÃ¡vel: `isRequestMappingAssignee`
- L370 â€” variÃ¡vel: `mapping`
- L381 â€” variÃ¡vel: `previousProfessionalId`
- L392 â€” variÃ¡vel: `explicitDesignation`
- L393 â€” variÃ¡vel: `isNullOnCreate`
- L394 â€” variÃ¡vel: `designationAction`
- L396 â€” variÃ¡vel: `priorDesigneeUserId`
- L401 â€” variÃ¡vel: `isPriorMappingAssignee`
- L405 â€” variÃ¡vel: `canCreateByInheritance`
- L409 â€” variÃ¡vel: `isCurrentMappingAssignee`
- L413 â€” variÃ¡vel: `canDesignate`
- L414 â€” variÃ¡vel: `canEditContent`
- L419 â€” variÃ¡vel: `contentAction`
- L467 â€” variÃ¡vel: `candidate`
- L487 â€” variÃ¡vel: `currentValues`
- L488 â€” variÃ¡vel: `values`
- L490 â€” variÃ¡vel: `concluding`
- L500 â€” variÃ¡vel: `target`
- L531 â€” variÃ¡vel: `missing`
- L541 â€” variÃ¡vel: `resolvedParticipants`
- L548 â€” variÃ¡vel: `designationChanged`
- L587 â€” variÃ¡vel: `changeOrigin`
- L591 â€” variÃ¡vel: `previousAuditValues`
- L598 â€” variÃ¡vel: `nextAuditValues`
- L702 â€” parÃ¢metro: `participant`
- L702 â€” retorno da funÃ§Ã£o: `<anÃ´nima>()`
- L709 â€” variÃ¡vel: `assigneeCandidate`

### [src/modules/queue/queue.controller.ts](../src/modules/queue/queue.controller.ts)

- L7 â€” variÃ¡vel: `getMetricsController`
- L8 â€” variÃ¡vel: `metrics`
- L13 â€” variÃ¡vel: `centralizedQueue`
- L14 â€” variÃ¡vel: `parsed`
- L20 â€” variÃ¡vel: `result`

### [src/modules/queue/queue.filters.ts](../src/modules/queue/queue.filters.ts)

- L14 â€” variÃ¡vel: `{ search, status, priority, assigneeId, unassigned, scopedUserId }`
- L17 â€” parÃ¢metro: `builder`
- L17 â€” retorno da funÃ§Ã£o: `<anÃ´nima>()`
- L45 â€” parÃ¢metro: `builder`
- L45 â€” retorno da funÃ§Ã£o: `<anÃ´nima>()`

### [src/modules/queue/queue.repository.ts](../src/modules/queue/queue.repository.ts)

- L16 â€” variÃ¡vel: `IN_PROGRESS_STATUS_NAMES`
- L24 â€” variÃ¡vel: `fetchQueueMetrics`
- L25 â€” variÃ¡vel: `query`
- L43 â€” parÃ¢metro: `builder`
- L43 â€” retorno da funÃ§Ã£o: `<anÃ´nima>()`
- L50 â€” variÃ¡vel: `result`
- L57 â€” retorno da funÃ§Ã£o: `<anÃ´nima>()`
- L76 â€” variÃ¡vel: `findQueueRequests`
- L79 â€” variÃ¡vel: `{ limit, offset }`
- L81 â€” variÃ¡vel: `baseQuery`
- L100 â€” variÃ¡vel: `countQuery`
- L102 â€” variÃ¡vel: `itemsQuery`
- L119 â€” variÃ¡vel: `[countResult, items]`
- L120 â€” variÃ¡vel: `total`
- L125 â€” variÃ¡vel: `fetchAllAssignees`
- L126 â€” variÃ¡vel: `rows`

### [src/modules/queue/queue.router.ts](../src/modules/queue/queue.router.ts)

- L7 â€” variÃ¡vel: `queueRoutes`

### [src/modules/queue/queue.schemas.ts](../src/modules/queue/queue.schemas.ts)

- L5 â€” variÃ¡vel: `queueFilterShape`
- L25 â€” parÃ¢metro: `value`
- L25 â€” retorno da funÃ§Ã£o: `<anÃ´nima>()`
- L38 â€” variÃ¡vel: `queueFilterQuerySchema`
- L50 â€” variÃ¡vel: `queueQuerySchema`

### [src/modules/queue/queue.service.ts](../src/modules/queue/queue.service.ts)

- L17 â€” variÃ¡vel: `resolveQueueScope`
- L20 â€” variÃ¡vel: `userId`
- L24 â€” variÃ¡vel: `getQueueMetricsService`
- L35 â€” variÃ¡vel: `listQueueService`
- L39 â€” variÃ¡vel: `{ page, pageSize, search, status, priority, assigneeId, unassigned }`
- L40 â€” variÃ¡vel: `offset`
- L42 â€” variÃ¡vel: `repoUnassigned`
- L43 â€” variÃ¡vel: `repoAssigneeId`
- L46 â€” variÃ¡vel: `[{ items, total }, assignees]`
- L60 â€” variÃ¡vel: `totalPages`
- L63 â€” variÃ¡vel: `effectivePage`
- L65 â€” parÃ¢metro: `item`
- L65 â€” retorno da funÃ§Ã£o: `<anÃ´nima>()`
- L65 â€” variÃ¡vel: `formattedData`

### [src/modules/reports/reports.controller.ts](../src/modules/reports/reports.controller.ts)

- L9 â€” variÃ¡vel: `parsed`
- L19 â€” variÃ¡vel: `parsed`
- L25 â€” variÃ¡vel: `file`

### [src/modules/reports/reports.repository.ts](../src/modules/reports/reports.repository.ts)

- L8 â€” variÃ¡vel: `BUSINESS_TIME_ZONE`
- L9 â€” variÃ¡vel: `OPENED_MONTH_SQL`
- L112 â€” variÃ¡vel: `query`
- L140 â€” variÃ¡vel: `query`
- L159 â€” variÃ¡vel: `query`
- L174 â€” variÃ¡vel: `query`
- L188 â€” variÃ¡vel: `query`
- L202 â€” variÃ¡vel: `[statuses, categories, priorities]`
- L221 â€” variÃ¡vel: `query`

### [src/modules/reports/reports.router.ts](../src/modules/reports/reports.router.ts)

- L6 â€” variÃ¡vel: `reportsRoutes`

### [src/modules/reports/reports.schema.ts](../src/modules/reports/reports.schema.ts)

- L4 â€” variÃ¡vel: `optionalDate`
- L5 â€” variÃ¡vel: `optionalId`
- L7 â€” variÃ¡vel: `dashboardQuerySchema`
- L17 â€” parÃ¢metro: `query`
- L17 â€” retorno da funÃ§Ã£o: `<anÃ´nima>()`

### [src/modules/reports/reports.service.ts](../src/modules/reports/reports.service.ts)

- L12 â€” variÃ¡vel: `BUSINESS_TIME_ZONE`
- L13 â€” variÃ¡vel: `CSV_HEADERS`
- L28 â€” variÃ¡vel: `dateTimeFormatter`
- L38 â€” variÃ¡vel: `filenameDateFormatter`
- L46 â€” variÃ¡vel: `[summary, byStatus, byPriority, byCategory, openedOverTime, filterOptions]`
- L66 â€” parÃ¢metro: `item`
- L66 â€” retorno da funÃ§Ã£o: `<anÃ´nima>()`
- L70 â€” parÃ¢metro: `item`
- L70 â€” retorno da funÃ§Ã£o: `<anÃ´nima>()`
- L74 â€” parÃ¢metro: `item`
- L74 â€” retorno da funÃ§Ã£o: `<anÃ´nima>()`
- L86 â€” parÃ¢metro: `item`
- L86 â€” retorno da funÃ§Ã£o: `<anÃ´nima>()`
- L93 â€” parÃ¢metro: `item`
- L98 â€” parÃ¢metro: `item`
- L98 â€” retorno da funÃ§Ã£o: `<anÃ´nima>()`
- L103 â€” parÃ¢metro: `item`
- L103 â€” retorno da funÃ§Ã£o: `<anÃ´nima>()`
- L113 â€” variÃ¡vel: `date`
- L124 â€” variÃ¡vel: `record`
- L125 â€” variÃ¡vel: `assessment`
- L138 â€” variÃ¡vel: `raw`
- L139 â€” variÃ¡vel: `protectedValue`
- L163 â€” variÃ¡vel: `rows`
- L164 â€” variÃ¡vel: `lines`

### [src/modules/requests/requests.controller.ts](../src/modules/requests/requests.controller.ts)

- L27 â€” variÃ¡vel: `userId`
- L36 â€” variÃ¡vel: `getRequestsByProtocol`
- L37 â€” variÃ¡vel: `protocol`
- L39 â€” variÃ¡vel: `foundRequest`
- L47 â€” variÃ¡vel: `getTracking`
- L48 â€” variÃ¡vel: `protocol`
- L50 â€” variÃ¡vel: `response`
- L61 â€” variÃ¡vel: `getInternalRequestByProtocol`
- L65 â€” variÃ¡vel: `protocol`
- L67 â€” variÃ¡vel: `request`
- L74 â€” variÃ¡vel: `protocol`
- L92 â€” variÃ¡vel: `id`
- L105 â€” variÃ¡vel: `patchInternalRequestByProtocol`
- L109 â€” variÃ¡vel: `protocol`
- L111 â€” variÃ¡vel: `parsed`
- L113 â€” variÃ¡vel: `{ message, fields }`
- L117 â€” variÃ¡vel: `updated`
- L127 â€” variÃ¡vel: `postRequest`
- L141 â€” variÃ¡vel: `parsed`
- L145 â€” variÃ¡vel: `multerFiles`
- L146 â€” variÃ¡vel: `attachments`
- L148 â€” variÃ¡vel: `savedAttachments`
- L150 â€” variÃ¡vel: `response`
- L159 â€” variÃ¡vel: `getRequestsByEmail`
- L167 â€” variÃ¡vel: `parsed`
- L173 â€” variÃ¡vel: `requests`
- L185 â€” variÃ¡vel: `parsed`
- L191 â€” variÃ¡vel: `requests`
- L196 â€” variÃ¡vel: `getAssignees`
- L200 â€” variÃ¡vel: `patchAssignee`
- L201 â€” variÃ¡vel: `protocol`
- L203 â€” variÃ¡vel: `parsed`
- L208 â€” variÃ¡vel: `response`
- L218 â€” variÃ¡vel: `patchInternalAssignee`
- L219 â€” variÃ¡vel: `protocol`
- L221 â€” variÃ¡vel: `parsed`
- L226 â€” variÃ¡vel: `response`
- L236 â€” variÃ¡vel: `patchRequestStatus`
- L237 â€” variÃ¡vel: `protocol`
- L239 â€” variÃ¡vel: `parsed`
- L244 â€” variÃ¡vel: `response`

### [src/modules/requests/requests.repository.ts](../src/modules/requests/requests.repository.ts)

- L42 â€” variÃ¡vel: `INITIAL_STATUS`
- L82 â€” variÃ¡vel: `email`
- L129 â€” variÃ¡vel: `row`
- L143 â€” variÃ¡vel: `requesterId`
- L166 â€” variÃ¡vel: `result`
- L170 â€” variÃ¡vel: `row`
- L187 â€” variÃ¡vel: `email`
- L188 â€” variÃ¡vel: `requestId`
- L190 â€” variÃ¡vel: `manualControls`
- L191 â€” variÃ¡vel: `processDocumentation`
- L192 â€” variÃ¡vel: `similarSolution`
- L193 â€” variÃ¡vel: `otherAreas`
- L194 â€” variÃ¡vel: `restrictedInfo`
- L196 â€” variÃ¡vel: `insertedRows`
- L255 â€” variÃ¡vel: `row`
- L274 â€” parÃ¢metro: `scheduledFor`
- L274 â€” retorno da funÃ§Ã£o: `<anÃ´nima>()`
- L293 â€” parÃ¢metro: `attachment`
- L293 â€” retorno da funÃ§Ã£o: `<anÃ´nima>()`
- L310 â€” parÃ¢metro: `trx`
- L310 â€” retorno da funÃ§Ã£o: `<anÃ´nima>()`
- L311 â€” variÃ¡vel: `categoryId`
- L317 â€” variÃ¡vel: `statusId`
- L318 â€” variÃ¡vel: `requesterId`
- L319 â€” variÃ¡vel: `saved`
- L328 â€” variÃ¡vel: `email`
- L343 â€” variÃ¡vel: `row`
- L358 â€” variÃ¡vel: `PUBLIC_STATUS_SUMMARY_SQL`
- L361 â€” retorno da funÃ§Ã£o: `baseSummaryQuery()`
- L378 â€” parÃ¢metro: `builder`
- L378 â€” retorno da funÃ§Ã£o: `<anÃ´nima>()`
- L388 â€” variÃ¡vel: `countRows`
- L394 â€” variÃ¡vel: `total`
- L396 â€” variÃ¡vel: `rows`
- L411 â€” parÃ¢metro: `row`
- L411 â€” retorno da funÃ§Ã£o: `<anÃ´nima>()`
- L437 â€” variÃ¡vel: `response`
- L470 â€” variÃ¡vel: `meetingScheduledFor`
- L472 â€” variÃ¡vel: `meeting`
- L476 â€” variÃ¡vel: `openedAt`
- L518 â€” variÃ¡vel: `hasMapping`
- L520 â€” variÃ¡vel: `query`
- L548 â€” variÃ¡vel: `baseSelect`
- L615 â€” variÃ¡vel: `mappingSelect`
- L659 â€” variÃ¡vel: `row`
- L671 â€” retorno da funÃ§Ã£o: `hasAllPermissionKeysPredicate()`
- L675 â€” retorno da funÃ§Ã£o: `<anÃ´nima>()`
- L675 â€” variÃ¡vel: `placeholders`
- L684 â€” variÃ¡vel: `triagePredicate`
- L688 â€” variÃ¡vel: `mappingPredicate`
- L692 â€” variÃ¡vel: `rows`
- L700 â€” parÃ¢metro: `row`
- L700 â€” retorno da funÃ§Ã£o: `<anÃ´nima>()`
- L704 â€” variÃ¡vel: `profileIds`
- L734 â€” variÃ¡vel: `predicate`
- L735 â€” variÃ¡vel: `row`
- L747 â€” variÃ¡vel: `keys`
- L757 â€” variÃ¡vel: `numericId`
- L808 â€” variÃ¡vel: `hasMapping`
- L824 â€” variÃ¡vel: `query`
- L835 â€” variÃ¡vel: `row`
- L879 â€” variÃ¡vel: `statusId`
- L921 â€” variÃ¡vel: `hasMappingColumn`
- L938 â€” variÃ¡vel: `query`
- L949 â€” variÃ¡vel: `row`
- L974 â€” retorno da funÃ§Ã£o: `<anÃ´nima>()`
- L1033 â€” variÃ¡vel: `manualControls`
- L1034 â€” variÃ¡vel: `processDocumentation`
- L1035 â€” variÃ¡vel: `similarSolution`
- L1036 â€” variÃ¡vel: `otherAreas`
- L1037 â€” variÃ¡vel: `restrictedInfo`

### [src/modules/requests/requests.router.ts](../src/modules/requests/requests.router.ts)

- L23 â€” variÃ¡vel: `requestsRoutes`

### [src/modules/requests/requests.schema.ts](../src/modules/requests/requests.schema.ts)

- L15 â€” variÃ¡vel: `yesNoDetailSchema`
- L25 â€” variÃ¡vel: `requesterSchema`
- L34 â€” variÃ¡vel: `demandSchema`
- L45 â€” variÃ¡vel: `operationalSchema`
- L72 â€” variÃ¡vel: `complementarySchema`
- L80 â€” variÃ¡vel: `isRealCalendarDateTime`
- L81 â€” variÃ¡vel: `[datePart, timePart]`
- L82 â€” variÃ¡vel: `[year, month, day]`
- L83 â€” variÃ¡vel: `[hour = 0, minute = 0]`
- L86 â€” variÃ¡vel: `lastDay`
- L90 â€” variÃ¡vel: `createRequestPayloadSchema`
- L109 â€” parÃ¢metro: `preferences`
- L109 â€” retorno da funÃ§Ã£o: `<anÃ´nima>()`
- L126 â€” variÃ¡vel: `todaySaoPauloYmd`
- L128 â€” variÃ¡vel: `desiredDeadlineUpdateSchema`
- L131 â€” parÃ¢metro: `value`
- L131 â€” retorno da funÃ§Ã£o: `<anÃ´nima>()`
- L135 â€” variÃ¡vel: `operationalUpdateSchema`
- L141 â€” variÃ¡vel: `updateRequesterSchema`
- L143 â€” variÃ¡vel: `updateRequestPayloadSchema`
- L152 â€” variÃ¡vel: `listRequestsQuerySchema`
- L173 â€” variÃ¡vel: `listAuthenticatedRequestsQuerySchema`
- L175 â€” variÃ¡vel: `assignRequestSchema`
- L186 â€” variÃ¡vel: `analystIdSchema`
- L188 â€” variÃ¡vel: `assignAnalystSchema`
- L193 â€” parÃ¢metro: `ctx`
- L193 â€” parÃ¢metro: `data`
- L193 â€” retorno da funÃ§Ã£o: `<anÃ´nima>()`
- L194 â€” variÃ¡vel: `hasAssignee`
- L195 â€” variÃ¡vel: `hasMapping`
- L214 â€” variÃ¡vel: `updateStatusSchema`

### [src/modules/requests/requests.service.ts](../src/modules/requests/requests.service.ts)

- L87 â€” variÃ¡vel: `user`
- L100 â€” variÃ¡vel: `normalizedProtocol`
- L102 â€” variÃ¡vel: `found`
- L112 â€” variÃ¡vel: `identity`
- L113 â€” variÃ¡vel: `isOwner`
- L129 â€” retorno da funÃ§Ã£o: `registerRequest()`
- L137 â€” variÃ¡vel: `payload`
- L143 â€” variÃ¡vel: `err`
- L153 â€” variÃ¡vel: `identity`
- L170 â€” variÃ¡vel: `email`
- L179 â€” variÃ¡vel: `normalizedEmail`
- L215 â€” parÃ¢metro: `value`
- L215 â€” retorno da funÃ§Ã£o: `<anÃ´nima>()`
- L223 â€” variÃ¡vel: `request`
- L230 â€” parÃ¢metro: `row`
- L230 â€” retorno da funÃ§Ã£o: `<anÃ´nima>()`
- L233 â€” variÃ¡vel: `requestId`
- L234 â€” variÃ¡vel: `[attachments, schedulePreferences, evaluation]`
- L243 â€” variÃ¡vel: `meeting`
- L252 â€” retorno da funÃ§Ã£o: `<anÃ´nima>()`
- L252 â€” variÃ¡vel: `pendingSummary`
- L254 â€” variÃ¡vel: `summary`
- L255 â€” variÃ¡vel: `correctionAlert`
- L256 â€” variÃ¡vel: `unreadRaw`
- L292 â€” variÃ¡vel: `openedAt`
- L293 â€” variÃ¡vel: `lastUpdate`
- L295 â€” variÃ¡vel: `assigneeUserId`
- L296 â€” variÃ¡vel: `mappingUserId`
- L298 â€” variÃ¡vel: `assignee`
- L307 â€” variÃ¡vel: `mappingAssignee`
- L372 â€” parÃ¢metro: `row`
- L372 â€” retorno da funÃ§Ã£o: `<anÃ´nima>()`
- L376 â€” parÃ¢metro: `attachment`
- L376 â€” retorno da funÃ§Ã£o: `<anÃ´nima>()`
- L402 â€” variÃ¡vel: `trimmed`
- L409 â€” variÃ¡vel: `record`
- L413 â€” variÃ¡vel: `{ __triage: _triage, observations: _obs, ...rest }`
- L438 â€” variÃ¡vel: `TRACKING_INVALID_IDENTITY`
- L448 â€” variÃ¡vel: `scheduledFor`
- L505 â€” variÃ¡vel: `openedAt`
- L524 â€” variÃ¡vel: `requestId`
- L525 â€” variÃ¡vel: `[attachments, schedulePreferences]`
- L530 â€” variÃ¡vel: `meeting`
- L531 â€” variÃ¡vel: `complementary`
- L534 â€” variÃ¡vel: `{ impacts, ...base }`
- L553 â€” parÃ¢metro: `preference`
- L553 â€” retorno da funÃ§Ã£o: `<anÃ´nima>()`
- L558 â€” parÃ¢metro: `attachment`
- L558 â€” retorno da funÃ§Ã£o: `<anÃ´nima>()`
- L590 â€” variÃ¡vel: `row`
- L607 â€” variÃ¡vel: `mode`
- L618 â€” variÃ¡vel: `row`
- L620 â€” variÃ¡vel: `nameOk`
- L622 â€” variÃ¡vel: `emailOk`
- L643 â€” variÃ¡vel: `normalizedProtocol`
- L727 â€” variÃ¡vel: `request`
- L734 â€” parÃ¢metro: `row`
- L734 â€” retorno da funÃ§Ã£o: `<anÃ´nima>()`
- L737 â€” parÃ¢metro: `trx`
- L737 â€” retorno da funÃ§Ã£o: `<anÃ´nima>()`
- L756 â€” variÃ¡vel: `updatedRequest`
- L775 â€” variÃ¡vel: `RN010_ELIGIBLE_SCREENING`
- L781 â€” retorno da funÃ§Ã£o: `<anÃ´nima>()`
- L781 â€” variÃ¡vel: `invalidTarget`
- L792 â€” variÃ¡vel: `flagEnabled`
- L808 â€” variÃ¡vel: `candidate`
- L809 â€” variÃ¡vel: `assignable`
- L823 â€” variÃ¡vel: `candidate`
- L824 â€” variÃ¡vel: `assignable`
- L841 â€” variÃ¡vel: `error`
- L855 â€” variÃ¡vel: `request`
- L862 â€” parÃ¢metro: `row`
- L862 â€” retorno da funÃ§Ã£o: `<anÃ´nima>()`
- L867 â€” variÃ¡vel: `assignee`
- L870 â€” retorno da funÃ§Ã£o: `<anÃ´nima>()`
- L874 â€” variÃ¡vel: `previousId`
- L875 â€” variÃ¡vel: `nextId`
- L877 â€” variÃ¡vel: `auditNext`
- L878 â€” variÃ¡vel: `auditPrev`
- L881 â€” variÃ¡vel: `action`
- L883 â€” variÃ¡vel: `shouldAdvanceStatus`
- L888 â€” parÃ¢metro: `trx`
- L888 â€” retorno da funÃ§Ã£o: `<anÃ´nima>()`
- L931 â€” variÃ¡vel: `request`
- L938 â€” parÃ¢metro: `row`
- L938 â€” retorno da funÃ§Ã£o: `<anÃ´nima>()`
- L943 â€” variÃ¡vel: `hasAssignee`
- L944 â€” variÃ¡vel: `hasMapping`
- L947 â€” variÃ¡vel: `raw`
- L949 â€” variÃ¡vel: `previous`
- L950 â€” variÃ¡vel: `auditPrev`
- L953 â€” parÃ¢metro: `trx`
- L953 â€” retorno da funÃ§Ã£o: `<anÃ´nima>()`
- L970 â€” retorno da funÃ§Ã£o: `<anÃ´nima>()`
- L970 â€” variÃ¡vel: `resolved`
- L973 â€” variÃ¡vel: `previous`
- L974 â€” variÃ¡vel: `auditPrev`
- L977 â€” variÃ¡vel: `previousMapping`
- L978 â€” variÃ¡vel: `auditPrevMapping`
- L981 â€” variÃ¡vel: `action`
- L982 â€” variÃ¡vel: `shouldAdvance`
- L985 â€” parÃ¢metro: `trx`
- L985 â€” retorno da funÃ§Ã£o: `<anÃ´nima>()`
- L1034 â€” variÃ¡vel: `raw`
- L1036 â€” variÃ¡vel: `previous`
- L1037 â€” variÃ¡vel: `auditPrev`
- L1040 â€” parÃ¢metro: `trx`
- L1040 â€” retorno da funÃ§Ã£o: `<anÃ´nima>()`
- L1057 â€” retorno da funÃ§Ã£o: `<anÃ´nima>()`
- L1057 â€” variÃ¡vel: `resolved`
- L1060 â€” variÃ¡vel: `previous`
- L1061 â€” variÃ¡vel: `auditPrev`
- L1064 â€” variÃ¡vel: `previousAssignee`
- L1065 â€” variÃ¡vel: `auditPrevAssignee`
- L1068 â€” variÃ¡vel: `action`
- L1069 â€” parÃ¢metro: `trx`
- L1069 â€” retorno da funÃ§Ã£o: `<anÃ´nima>()`
- L1106 â€” variÃ¡vel: `updatedRequest`
- L1128 â€” variÃ¡vel: `request`
- L1135 â€” parÃ¢metro: `row`
- L1135 â€” retorno da funÃ§Ã£o: `<anÃ´nima>()`
- L1138 â€” variÃ¡vel: `target`
- L1157 â€” variÃ¡vel: `requiresOverride`
- L1159 â€” variÃ¡vel: `hasStatusOverride`
- L1181 â€” variÃ¡vel: `changeOrigin`
- L1183 â€” parÃ¢metro: `trx`
- L1183 â€” retorno da funÃ§Ã£o: `<anÃ´nima>()`
- L1183 â€” variÃ¡vel: `{ lastUpdate, committed }`
- L1184 â€” variÃ¡vel: `persistedAt`
- L1196 â€” variÃ¡vel: `auditId`
- L1214 â€” variÃ¡vel: `requesterUserId`
- L1216 â€” variÃ¡vel: `committedNotifications`

### [src/modules/requests/statusTransition.ts](../src/modules/requests/statusTransition.ts)

- L29 â€” variÃ¡vel: `lastTechnicalMessage`
- L38 â€” variÃ¡vel: `query`
- L42 â€” variÃ¡vel: `rows`
- L43 â€” variÃ¡vel: `row`

### [src/modules/requests/triage/triage.controller.ts](../src/modules/requests/triage/triage.controller.ts)

- L9 â€” variÃ¡vel: `protocolParamsSchema`
- L18 â€” variÃ¡vel: `id`
- L32 â€” variÃ¡vel: `parsed`
- L40 â€” variÃ¡vel: `getTriage`
- L41 â€” variÃ¡vel: `protocol`
- L42 â€” variÃ¡vel: `actor`
- L44 â€” variÃ¡vel: `triage`
- L49 â€” variÃ¡vel: `saveTriage`
- L50 â€” variÃ¡vel: `protocol`
- L51 â€” variÃ¡vel: `actor`
- L53 â€” variÃ¡vel: `parsed`
- L55 â€” variÃ¡vel: `{ message, fields }`
- L59 â€” variÃ¡vel: `triage`

### [src/modules/requests/triage/triage.repository.ts](../src/modules/requests/triage/triage.repository.ts)

- L69 â€” variÃ¡vel: `TRIAGE_COLUMNS`
- L122 â€” variÃ¡vel: `row`
- L152 â€” retorno da funÃ§Ã£o: `<anÃ´nima>()`
- L163 â€” variÃ¡vel: `raw`
- L182 â€” variÃ¡vel: `source`
- L211 â€” variÃ¡vel: `updatedRows`
- L279 â€” parÃ¢metro: `trx`
- L279 â€” retorno da funÃ§Ã£o: `<anÃ´nima>()`

### [src/modules/requests/triage/triage.router.ts](../src/modules/requests/triage/triage.router.ts)

- L6 â€” variÃ¡vel: `triageRoutes`

### [src/modules/requests/triage/triage.schema.ts](../src/modules/requests/triage/triage.schema.ts)

- L33 â€” variÃ¡vel: `triageChoice`
- L35 â€” retorno da funÃ§Ã£o: `<anÃ´nima>()`
- L35 â€” variÃ¡vel: `textField`
- L42 â€” variÃ¡vel: `createTriagePayloadSchema`
- L81 â€” parÃ¢metro: `ctx`
- L81 â€” parÃ¢metro: `value`
- L81 â€” retorno da funÃ§Ã£o: `<anÃ´nima>()`

### [src/modules/requests/triage/triage.service.ts](../src/modules/requests/triage/triage.service.ts)

- L28 â€” parÃ¢metro: `trx`
- L28 â€” retorno da funÃ§Ã£o: `<anÃ´nima>()`
- L44 â€” variÃ¡vel: `request`
- L51 â€” variÃ¡vel: `canAccess`
- L66 â€” variÃ¡vel: `request`
- L88 â€” variÃ¡vel: `canAccess`
- L103 â€” variÃ¡vel: `exitStatus`
- L124 â€” variÃ¡vel: `categoryName`
- L126 â€” variÃ¡vel: `newCategory`

### [src/modules/users/users.controller.ts](../src/modules/users/users.controller.ts)

- L18 â€” variÃ¡vel: `id`
- L25 â€” variÃ¡vel: `getUserMetrics`
- L26 â€” variÃ¡vel: `metrics`
- L31 â€” variÃ¡vel: `listAnalysts`
- L32 â€” variÃ¡vel: `analysts`
- L36 â€” variÃ¡vel: `listUsers`
- L37 â€” variÃ¡vel: `parsed`
- L43 â€” variÃ¡vel: `users`
- L48 â€” variÃ¡vel: `createUser`
- L49 â€” variÃ¡vel: `parsed`
- L52 â€” variÃ¡vel: `{ message, fields }`
- L56 â€” variÃ¡vel: `created`
- L61 â€” variÃ¡vel: `updateUser`
- L62 â€” variÃ¡vel: `parsed`
- L65 â€” variÃ¡vel: `{ message, fields }`
- L69 â€” variÃ¡vel: `updated`
- L79 â€” variÃ¡vel: `getUser`
- L80 â€” variÃ¡vel: `user`
- L85 â€” variÃ¡vel: `changeUserStatus`
- L86 â€” variÃ¡vel: `parsed`
- L92 â€” variÃ¡vel: `updated`
- L102 â€” variÃ¡vel: `resetUserPassword`
- L103 â€” variÃ¡vel: `reset`
- L112 â€” variÃ¡vel: `getMyProfile`
- L113 â€” variÃ¡vel: `profile`
- L124 â€” variÃ¡vel: `updateMyProfile`
- L145 â€” variÃ¡vel: `rawReq`
- L162 â€” variÃ¡vel: `parsed`
- L167 â€” variÃ¡vel: `updated`

### [src/modules/users/users.repository.ts](../src/modules/users/users.repository.ts)

- L37 â€” variÃ¡vel: `profile`
- L68 â€” variÃ¡vel: `PROFESSIONAL_PROFILES`
- L103 â€” variÃ¡vel: `inserted`
- L113 â€” variÃ¡vel: `row`
- L147 â€” variÃ¡vel: `corporateEmail`
- L151 â€” variÃ¡vel: `hasRequester`
- L212 â€” variÃ¡vel: `user`
- L219 â€” variÃ¡vel: `[requester, professional]`
- L247 â€” retorno da funÃ§Ã£o: `<anÃ´nima>()`
- L280 â€” variÃ¡vel: `updated`
- L291 â€” variÃ¡vel: `adopted`
- L328 â€” variÃ¡vel: `specialties`
- L329 â€” variÃ¡vel: `attendedCategoryIds`
- L332 â€” variÃ¡vel: `updated`
- L370 â€” retorno da funÃ§Ã£o: `baseQuery()`
- L373 â€” parÃ¢metro: `builder`
- L373 â€” retorno da funÃ§Ã£o: `<anÃ´nima>()`
- L378 â€” variÃ¡vel: `escapedSearch`
- L379 â€” parÃ¢metro: `inner`
- L379 â€” retorno da funÃ§Ã£o: `<anÃ´nima>()`
- L389 â€” variÃ¡vel: `countRows`
- L392 â€” variÃ¡vel: `total`
- L394 â€” variÃ¡vel: `rows`
- L411 â€” parÃ¢metro: `row`
- L411 â€” retorno da funÃ§Ã£o: `<anÃ´nima>()`
- L434 â€” variÃ¡vel: `updated`
- L455 â€” variÃ¡vel: `updated`
- L484 â€” variÃ¡vel: `updated`
- L507 â€” variÃ¡vel: `rows`
- L517 â€” parÃ¢metro: `builder`
- L517 â€” retorno da funÃ§Ã£o: `<anÃ´nima>()`
- L533 â€” variÃ¡vel: `categoryMap`
- L534 â€” variÃ¡vel: `categories`
- L537 â€” variÃ¡vel: `cat`
- L545 â€” variÃ¡vel: `professionalIds`
- L546 â€” parÃ¢metro: `r`
- L546 â€” retorno da funÃ§Ã£o: `<anÃ´nima>()`
- L547 â€” parÃ¢metro: `id`
- L548 â€” variÃ¡vel: `counts`
- L553 â€” variÃ¡vel: `countByProfessional`
- L554 â€” variÃ¡vel: `c`
- L558 â€” parÃ¢metro: `row`
- L558 â€” retorno da funÃ§Ã£o: `<anÃ´nima>()`
- L561 â€” variÃ¡vel: `part`
- L562 â€” variÃ¡vel: `id`
- L564 â€” variÃ¡vel: `name`
- L585 â€” variÃ¡vel: `fetchUserMetrics`
- L586 â€” variÃ¡vel: `result`
- L627 â€” variÃ¡vel: `next`
- L645 â€” variÃ¡vel: `anon`
- L679 â€” retorno da funÃ§Ã£o: `findRequesterByUserId()`

### [src/modules/users/users.router.ts](../src/modules/users/users.router.ts)

- L18 â€” variÃ¡vel: `usersRoutes`

### [src/modules/users/users.schema.ts](../src/modules/users/users.schema.ts)

- L14 â€” variÃ¡vel: `professionalSchema`
- L24 â€” variÃ¡vel: `PROFESSIONAL_ROLE`
- L26 â€” variÃ¡vel: `requesterSchema`
- L33 â€” variÃ¡vel: `createUserSchema`
- L41 â€” parÃ¢metro: `ctx`
- L41 â€” parÃ¢metro: `value`
- L41 â€” retorno da funÃ§Ã£o: `<anÃ´nima>()`
- L42 â€” variÃ¡vel: `isAnalyst`
- L59 â€” variÃ¡vel: `listUsersQuerySchema`
- L81 â€” variÃ¡vel: `requesterPatchSchema`
- L88 â€” variÃ¡vel: `changeUserStatusSchema`
- L92 â€” variÃ¡vel: `updateUserSchema`
- L105 â€” parÃ¢metro: `ctx`
- L105 â€” parÃ¢metro: `value`
- L105 â€” retorno da funÃ§Ã£o: `<anÃ´nima>()`
- L107 â€” variÃ¡vel: `isAnalyst`

### [src/modules/users/users.service.ts](../src/modules/users/users.service.ts)

- L35 â€” variÃ¡vel: `AVATAR_DIR`
- L36 â€” variÃ¡vel: `ROLE_ANALYST`
- L38 â€” variÃ¡vel: `CHANGE_ORIGIN_ADMIN`
- L47 â€” variÃ¡vel: `id`
- L84 â€” variÃ¡vel: `profileId`
- L97 â€” variÃ¡vel: `getUserMetrics`
- L109 â€” variÃ¡vel: `profile`
- L117 â€” variÃ¡vel: `profileId`
- L122 â€” variÃ¡vel: `temporaryPassword`
- L123 â€” variÃ¡vel: `passwordHash`
- L130 â€” parÃ¢metro: `trx`
- L130 â€” retorno da funÃ§Ã£o: `<anÃ´nima>()`
- L131 â€” variÃ¡vel: `created`
- L144 â€” variÃ¡vel: `professional`
- L167 â€” variÃ¡vel: `error`
- L196 â€” variÃ¡vel: `id`
- L202 â€” variÃ¡vel: `user`
- L212 â€” parÃ¢metro: `trx`
- L212 â€” retorno da funÃ§Ã£o: `<anÃ´nima>()`
- L235 â€” variÃ¡vel: `id`
- L241 â€” variÃ¡vel: `user`
- L249 â€” variÃ¡vel: `temporaryPassword`
- L250 â€” variÃ¡vel: `passwordHash`
- L254 â€” parÃ¢metro: `trx`
- L254 â€” retorno da funÃ§Ã£o: `<anÃ´nima>()`
- L303 â€” variÃ¡vel: `row`
- L357 â€” variÃ¡vel: `user`
- L363 â€” variÃ¡vel: `snapshot`
- L364 â€” variÃ¡vel: `previousValue`
- L371 â€” parÃ¢metro: `trx`
- L371 â€” retorno da funÃ§Ã£o: `<anÃ´nima>()`
- L383 â€” variÃ¡vel: `changesAdministrativeFields`
- L418 â€” variÃ¡vel: `url`
- L421 â€” variÃ¡vel: `url`
- L449 â€” variÃ¡vel: `saved`
- L450 â€” variÃ¡vel: `attachment`
- L458 â€” variÃ¡vel: `key`
- L459 â€” variÃ¡vel: `storagePath`
- L460 â€” retorno da funÃ§Ã£o: `<anÃ´nima>()`
- L477 â€” variÃ¡vel: `id`
- L483 â€” variÃ¡vel: `target`
- L490 â€” variÃ¡vel: `isTargetAdmin`
- L491 â€” variÃ¡vel: `hasNonRequesterPatch`
- L505 â€” variÃ¡vel: `profile`
- L510 â€” variÃ¡vel: `role`
- L515 â€” variÃ¡vel: `finalRoleName`
- L516 â€” variÃ¡vel: `isFinalAnalyst`
- L517 â€” variÃ¡vel: `wasAnalyst`
- L535 â€” variÃ¡vel: `before`
- L538 â€” parÃ¢metro: `trx`
- L538 â€” retorno da funÃ§Ã£o: `<anÃ´nima>()`
- L548 â€” variÃ¡vel: `fullName`
- L549 â€” variÃ¡vel: `corporateEmail`
- L562 â€” variÃ¡vel: `fullName`
- L563 â€” variÃ¡vel: `corporateEmail`
- L583 â€” variÃ¡vel: `error`
- L590 â€” variÃ¡vel: `updated`
- L601 â€” retorno da funÃ§Ã£o: `<anÃ´nima>()`

### [src/router.ts](../src/router.ts)

- L17 â€” variÃ¡vel: `router`

### [src/server.ts](../src/server.ts)

- L5 â€” variÃ¡vel: `PORT`
- L8 â€” parÃ¢metro: `e`
- L8 â€” retorno da funÃ§Ã£o: `<anÃ´nima>()`
- L10 â€” retorno da funÃ§Ã£o: `<anÃ´nima>()`

### [src/shared/access/requestAccess.ts](../src/shared/access/requestAccess.ts)

- L35 â€” variÃ¡vel: `id`
- L51 â€” parÃ¢metro: `permission`
- L51 â€” retorno da funÃ§Ã£o: `<anÃ´nima>()`
- L60 â€” variÃ¡vel: `custody`
- L72 â€” variÃ¡vel: `responsibleId`
- L91 â€” variÃ¡vel: `requesterUserId`
- L112 â€” parÃ¢metro: `trx`
- L112 â€” retorno da funÃ§Ã£o: `<anÃ´nima>()`

### [src/shared/audit/auditCatalog.ts](../src/shared/audit/auditCatalog.ts)

- L13 â€” variÃ¡vel: `auditCatalog`
- L89 â€” parÃ¢metro: `action`
- L89 â€” retorno da funÃ§Ã£o: `<anÃ´nima>()`

### [src/shared/audit/auditLogger.ts](../src/shared/audit/auditLogger.ts)

- L66 â€” variÃ¡vel: `rows`
- L81 â€” variÃ¡vel: `row`

### [src/shared/catalog/baseProfiles.ts](../src/shared/catalog/baseProfiles.ts)

- L33 â€” variÃ¡vel: `entry`
- L47 â€” parÃ¢metro: `key`
- L47 â€” retorno da funÃ§Ã£o: `<anÃ´nima>()`
- L52 â€” parÃ¢metro: `entry`
- L52 â€” retorno da funÃ§Ã£o: `<anÃ´nima>()`
- L150 â€” parÃ¢metro: `profile`
- L150 â€” retorno da funÃ§Ã£o: `<anÃ´nima>()`
- L150 â€” variÃ¡vel: `rootProfiles`
- L156 â€” variÃ¡vel: `seenNames`
- L158 â€” variÃ¡vel: `profile`
- L164 â€” variÃ¡vel: `seenKeys`
- L166 â€” variÃ¡vel: `grant`

### [src/shared/catalog/fieldCatalog.ts](../src/shared/catalog/fieldCatalog.ts)

- L6 â€” variÃ¡vel: `FIELD_KEYS`
- L162 â€” variÃ¡vel: `value`
- L164 â€” variÃ¡vel: `date`

### [src/shared/catalog/permissionCatalog.ts](../src/shared/catalog/permissionCatalog.ts)

- L12 â€” variÃ¡vel: `CUSTODIES`
- L37 â€” variÃ¡vel: `PERMISSION_CATALOG`
- L287 â€” variÃ¡vel: `ASSIGNABILITY_PREDICATES`
- L292 â€” variÃ¡vel: `DEFINITION_BY_KEY`
- L293 â€” parÃ¢metro: `entry`
- L293 â€” retorno da funÃ§Ã£o: `<anÃ´nima>()`
- L296 â€” variÃ¡vel: `ORDER_BY_KEY`
- L297 â€” parÃ¢metro: `entry`
- L297 â€” parÃ¢metro: `index`
- L297 â€” retorno da funÃ§Ã£o: `<anÃ´nima>()`
- L301 â€” variÃ¡vel: `entry`
- L344 â€” variÃ¡vel: `seen`
- L347 â€” variÃ¡vel: `grant`
- L348 â€” variÃ¡vel: `entry`
- L376 â€” variÃ¡vel: `permission`
- L377 â€” variÃ¡vel: `dependency`
- L384 â€” parÃ¢metro: `left`
- L384 â€” parÃ¢metro: `right`
- L384 â€” retorno da funÃ§Ã£o: `<anÃ´nima>()`
- L386 â€” parÃ¢metro: `{ key, custody }`
- L386 â€” retorno da funÃ§Ã£o: `<anÃ´nima>()`
- L394 â€” variÃ¡vel: `keys`
- L396 â€” variÃ¡vel: `entry`
- L406 â€” variÃ¡vel: `acceptsGlobal`
- L417 â€” variÃ¡vel: `entry`
- L418 â€” variÃ¡vel: `dependency`

### [src/shared/errors/AppError.ts](../src/shared/errors/AppError.ts)

- L5 â€” parÃ¢metro: `statusCode`

### [src/shared/middleware/accessMode.ts](../src/shared/middleware/accessMode.ts)

- L7 â€” variÃ¡vel: `COOKIE_NAME`
- L24 â€” retorno da funÃ§Ã£o: `requireAccessMode()`
- L32 â€” variÃ¡vel: `error`
- L39 â€” variÃ¡vel: `hasSessionCookie`

### [src/shared/middleware/auth.ts](../src/shared/middleware/auth.ts)

- L9 â€” variÃ¡vel: `{ JsonWebTokenError, NotBeforeError, TokenExpiredError }`
- L10 â€” variÃ¡vel: `COOKIE_NAME`
- L25 â€” variÃ¡vel: `token`
- L35 â€” variÃ¡vel: `userState`
- L47 â€” variÃ¡vel: `scope`
- L54 â€” variÃ¡vel: `isPendingChangeAllowedRoute`
- L66 â€” variÃ¡vel: `tokenPasswordChangedAt`
- L67 â€” variÃ¡vel: `currentPasswordChangedAt`
- L87 â€” variÃ¡vel: `error`

### [src/shared/middleware/dualAuth.ts](../src/shared/middleware/dualAuth.ts)

- L20 â€” variÃ¡vel: `hasCookie`
- L27 â€” variÃ¡vel: `identity`

### [src/shared/middleware/errorHandler.ts](../src/shared/middleware/errorHandler.ts)

- L25 â€” variÃ¡vel: `fields`
- L34 â€” variÃ¡vel: `maybeHttp`
- L35 â€” variÃ¡vel: `statusCode`

### [src/shared/middleware/rateLimit.ts](../src/shared/middleware/rateLimit.ts)

- L7 â€” retorno da funÃ§Ã£o: `createRateLimiter()`
- L8 â€” variÃ¡vel: `{ windowMs, limit, keyGenerator }`
- L9 â€” variÃ¡vel: `buckets`
- L12 â€” variÃ¡vel: `normalized`
- L13 â€” variÃ¡vel: `now`
- L14 â€” variÃ¡vel: `arr`
- L15 â€” parÃ¢metro: `t`
- L15 â€” retorno da funÃ§Ã£o: `<anÃ´nima>()`
- L15 â€” variÃ¡vel: `recent`

### [src/shared/middleware/requirePermission.ts](../src/shared/middleware/requirePermission.ts)

- L29 â€” retorno da funÃ§Ã£o: `requireAnyPermission()`
- L41 â€” variÃ¡vel: `grants`
- L42 â€” variÃ¡vel: `permissions`
- L44 â€” parÃ¢metro: `permission`
- L44 â€” retorno da funÃ§Ã£o: `<anÃ´nima>()`
- L55 â€” retorno da funÃ§Ã£o: `requirePermission()`
- L64 â€” retorno da funÃ§Ã£o: `requirePermissionIfSession()`
- L65 â€” variÃ¡vel: `gate`

### [src/shared/middleware/requireRole.ts](../src/shared/middleware/requireRole.ts)

- L9 â€” retorno da funÃ§Ã£o: `requireRole()`
- L21 â€” variÃ¡vel: `expected`

### [src/shared/middleware/upload.ts](../src/shared/middleware/upload.ts)

- L5 â€” variÃ¡vel: `ALLOWED_MIMES`
- L13 â€” variÃ¡vel: `MAX_FILE_SIZE_BYTES`
- L14 â€” variÃ¡vel: `MAX_ATTACHMENT_COUNT`
- L15 â€” variÃ¡vel: `MAX_FIELD_SIZE_BYTES`
- L17 â€” variÃ¡vel: `upload`
- L24 â€” parÃ¢metro: `_req`
- L24 â€” parÃ¢metro: `cb`
- L24 â€” parÃ¢metro: `file`
- L24 â€” retorno da funÃ§Ã£o: `<anÃ´nima>()`
- L35 â€” variÃ¡vel: `multerFields`
- L49 â€” parÃ¢metro: `err`
- L49 â€” retorno da funÃ§Ã£o: `<anÃ´nima>()`

### [src/shared/middleware/uploadAssets.ts](../src/shared/middleware/uploadAssets.ts)

- L58 â€” parÃ¢metro: `r`
- L58 â€” retorno da funÃ§Ã£o: `<anÃ´nima>()`
- L58 â€” variÃ¡vel: `MAX_FILE_SIZE`
- L59 â€” variÃ¡vel: `MAX_FIELD_SIZE`
- L61 â€” variÃ¡vel: `upload`
- L69 â€” parÃ¢metro: `_req`
- L69 â€” parÃ¢metro: `cb`
- L69 â€” parÃ¢metro: `file`
- L69 â€” retorno da funÃ§Ã£o: `<anÃ´nima>()`
- L70 â€” variÃ¡vel: `rules`
- L76 â€” variÃ¡vel: `ext`
- L101 â€” variÃ¡vel: `multerFields`
- L125 â€” parÃ¢metro: `err`
- L125 â€” retorno da funÃ§Ã£o: `<anÃ´nima>()`
- L132 â€” variÃ¡vel: `message`
- L133 â€” variÃ¡vel: `statusCode`
- L148 â€” variÃ¡vel: `files`
- L154 â€” variÃ¡vel: `[fieldName, fileArray]`
- L155 â€” variÃ¡vel: `rules`
- L158 â€” variÃ¡vel: `file`
- L160 â€” variÃ¡vel: `maxMb`

### [src/shared/middleware/uploadAvatar.ts](../src/shared/middleware/uploadAvatar.ts)

- L14 â€” variÃ¡vel: `avatarRules`
- L20 â€” variÃ¡vel: `MAX_FIELD_SIZE`
- L22 â€” variÃ¡vel: `upload`
- L30 â€” parÃ¢metro: `_req`
- L30 â€” parÃ¢metro: `cb`
- L30 â€” parÃ¢metro: `file`
- L30 â€” retorno da funÃ§Ã£o: `<anÃ´nima>()`
- L36 â€” variÃ¡vel: `ext`
- L61 â€” variÃ¡vel: `single`
- L70 â€” parÃ¢metro: `err`
- L70 â€” retorno da funÃ§Ã£o: `<anÃ´nima>()`
- L77 â€” variÃ¡vel: `message`
- L78 â€” variÃ¡vel: `statusCode`

### [src/shared/notifications/emitNotification.ts](../src/shared/notifications/emitNotification.ts)

- L32 â€” variÃ¡vel: `parsed`
- L38 â€” variÃ¡vel: `data`
- L39 â€” variÃ¡vel: `recipients`
- L40 â€” parÃ¢metro: `userId`
- L40 â€” retorno da funÃ§Ã£o: `<anÃ´nima>()`
- L45 â€” variÃ¡vel: `recipientUserId`
- L46 â€” variÃ¡vel: `channel`
- L47 â€” variÃ¡vel: `delivery`

### [src/shared/notifications/inAppNotificationChannel.ts](../src/shared/notifications/inAppNotificationChannel.ts)

- L25 â€” variÃ¡vel: `rows`
- L37 â€” variÃ¡vel: `row`

### [src/shared/notifications/notificationEmitter.ts](../src/shared/notifications/notificationEmitter.ts)

- L4 â€” variÃ¡vel: `NOTIFICATIONS_COMMITTED`
- L15 â€” variÃ¡vel: `emitter`
- L23 â€” retorno da funÃ§Ã£o: `<anÃ´nima>()`
- L27 â€” variÃ¡vel: `idsByUser`
- L29 â€” variÃ¡vel: `notification`
- L30 â€” variÃ¡vel: `ids`
- L39 â€” variÃ¡vel: `[userId, notificationIds]`

### [src/shared/notifications/notificationEvents.ts](../src/shared/notifications/notificationEvents.ts)

- L11 â€” variÃ¡vel: `statusChangedPayloadSchema`
- L20 â€” variÃ¡vel: `notificationPayloadSchema`
- L25 â€” variÃ¡vel: `statusChangedEventSchema`
- L40 â€” variÃ¡vel: `notificationEventSchema`

### [src/shared/protocol/generateProtocol.ts](../src/shared/protocol/generateProtocol.ts)

- L4 â€” variÃ¡vel: `ALPHABET`
- L5 â€” variÃ¡vel: `CODE_LENGTH`
- L6 â€” variÃ¡vel: `CODE_BITS`
- L7 â€” variÃ¡vel: `HALF_BITS`
- L8 â€” variÃ¡vel: `HALF_MASK`
- L9 â€” variÃ¡vel: `DOMAIN`
- L10 â€” variÃ¡vel: `ROUNDS`
- L15 â€” variÃ¡vel: `digest`
- L18 â€” variÃ¡vel: `chunk`
- L23 â€” variÃ¡vel: `left`
- L24 â€” variÃ¡vel: `right`
- L26 â€” variÃ¡vel: `round`
- L27 â€” variÃ¡vel: `nextLeft`
- L28 â€” variÃ¡vel: `nextRight`
- L37 â€” variÃ¡vel: `code`
- L38 â€” variÃ¡vel: `index`
- L39 â€” variÃ¡vel: `shift`
- L40 â€” variÃ¡vel: `charIndex`
- L50 â€” variÃ¡vel: `value`
- L56 â€” variÃ¡vel: `code`

### [src/shared/storage/fileStorage.ts](../src/shared/storage/fileStorage.ts)

- L22 â€” variÃ¡vel: `dir`
- L27 â€” variÃ¡vel: `i`
- L28 â€” variÃ¡vel: `file`
- L30 â€” variÃ¡vel: `prefix`
- L31 â€” variÃ¡vel: `filename`
- L32 â€” variÃ¡vel: `storagePath`
- L42 â€” variÃ¡vel: `err`
- L52 â€” parÃ¢metro: `attachment`
- L52 â€” retorno da funÃ§Ã£o: `<anÃ´nima>()`

### [src/shared/types/criteria.ts](../src/shared/types/criteria.ts)

- L22 â€” parÃ¢metro: `[key, id]`
- L22 â€” retorno da funÃ§Ã£o: `<anÃ´nima>()`

### [src/shared/types/portalConfig.ts](../src/shared/types/portalConfig.ts)

- L34 â€” variÃ¡vel: `ASSET_KEYS`
- L56 â€” variÃ¡vel: `THEME_TOKEN_KEYS`
- L122 â€” variÃ¡vel: `STATUS_MODES`
- L153 â€” variÃ¡vel: `PRIORITIZATION_CRITERIA`

### [src/shared/types/requests.ts](../src/shared/types/requests.ts)

- L10 â€” variÃ¡vel: `REQUEST_PRIORITIES`
- L21 â€” variÃ¡vel: `TERMINAL_STATUSES`

### [src/shared/types/role.ts](../src/shared/types/role.ts)

- L1 â€” variÃ¡vel: `ROLES`

### [src/shared/types/status.ts](../src/shared/types/status.ts)

- L10 â€” variÃ¡vel: `STATUS_IDS`
- L23 â€” variÃ¡vel: `CORE_STATUS_IDS`

### [src/shared/types/systemTheme.ts](../src/shared/types/systemTheme.ts)

- L2 â€” variÃ¡vel: `STATUS_TONES`
- L6 â€” variÃ¡vel: `THEME_TOKEN_KEYS`

### [src/shared/utils/date.ts](../src/shared/utils/date.ts)

- L13 â€” variÃ¡vel: `date`
- L32 â€” variÃ¡vel: `date`
- L38 â€” retorno da funÃ§Ã£o: `<anÃ´nima>()`
- L38 â€” variÃ¡vel: `pad`
- L49 â€” variÃ¡vel: `date`
- L69 â€” variÃ¡vel: `year`
- L70 â€” variÃ¡vel: `month`
- L71 â€” variÃ¡vel: `day`
- L81 â€” variÃ¡vel: `year`
- L82 â€” variÃ¡vel: `month`
- L83 â€” variÃ¡vel: `day`
- L84 â€” variÃ¡vel: `hours`
- L85 â€” variÃ¡vel: `minutes`

### [src/shared/utils/ensureDefaultAssets.ts](../src/shared/utils/ensureDefaultAssets.ts)

- L19 â€” variÃ¡vel: `uploadRoot`
- L20 â€” variÃ¡vel: `assetsRootCandidates`
- L30 â€” variÃ¡vel: `p`
- L46 â€” variÃ¡vel: `[srcName, destRel]`
- L47 â€” variÃ¡vel: `src`
- L48 â€” variÃ¡vel: `dest`
- L58 â€” variÃ¡vel: `e`
- L66 â€” variÃ¡vel: `destToColumn`
- L76 â€” variÃ¡vel: `[, destRel]`
- L77 â€” variÃ¡vel: `column`
- L79 â€” variÃ¡vel: `url`
- L81 â€” variÃ¡vel: `hasCol`
- L85 â€” parÃ¢metro: `qb`
- L85 â€” retorno da funÃ§Ã£o: `<anÃ´nima>()`
- L89 â€” variÃ¡vel: `e`

### [src/shared/utils/json.ts](../src/shared/utils/json.ts)

- L8 â€” parÃ¢metro: `_`
- L8 â€” parÃ¢metro: `v`
- L8 â€” retorno da funÃ§Ã£o: `<anÃ´nima>()`
- L11 â€” parÃ¢metro: `[a]`
- L11 â€” parÃ¢metro: `[b]`
- L11 â€” retorno da funÃ§Ã£o: `<anÃ´nima>()`

### [src/shared/utils/jwtUtil.ts](../src/shared/utils/jwtUtil.ts)

- L7 â€” variÃ¡vel: `{ sign, verify }`
- L23 â€” variÃ¡vel: `secret`
- L24 â€” variÃ¡vel: `expiresIn`
- L34 â€” variÃ¡vel: `secret`
- L40 â€” variÃ¡vel: `decoded`
- L54 â€” variÃ¡vel: `scope`

### [src/shared/utils/passwordHandler.ts](../src/shared/utils/passwordHandler.ts)

- L7 â€” variÃ¡vel: `salt`
- L9 â€” variÃ¡vel: `hashedPassword`
- L19 â€” variÃ¡vel: `match`
- L31 â€” parÃ¢metro: `length`

### [src/shared/utils/requesterIdentity.ts](../src/shared/utils/requesterIdentity.ts)

- L7 â€” variÃ¡vel: `obj`

### [src/shared/utils/roleUtils.ts](../src/shared/utils/roleUtils.ts)

- L16 â€” variÃ¡vel: `role`

### [src/shared/validation/fieldSchemas.ts](../src/shared/validation/fieldSchemas.ts)

- L3 â€” retorno da funÃ§Ã£o: `<anÃ´nima>()`
- L3 â€” variÃ¡vel: `ptNumber`
- L5 â€” retorno da funÃ§Ã£o: `<anÃ´nima>()`
- L5 â€” variÃ¡vel: `requiredString`
- L12 â€” retorno da funÃ§Ã£o: `<anÃ´nima>()`
- L12 â€” variÃ¡vel: `optionalString`
- L17 â€” parÃ¢metro: `value`
- L17 â€” retorno da funÃ§Ã£o: `<anÃ´nima>()`
- L20 â€” variÃ¡vel: `emailSchema`
- L27 â€” variÃ¡vel: `passwordSchema`
- L30 â€” parÃ¢metro: `value`
- L30 â€” retorno da funÃ§Ã£o: `<anÃ´nima>()`
- L32 â€” variÃ¡vel: `TEXT_PATTERN`
- L38 â€” variÃ¡vel: `PROFILE_AREA_MAX_LENGTH`
- L39 â€” variÃ¡vel: `PROFILE_DEPARTMENT_MAX_LENGTH`
- L40 â€” variÃ¡vel: `PROFILE_MANAGER_MAX_LENGTH`
- L41 â€” variÃ¡vel: `PROFILE_ADDITIONAL_CONTACT_MAX_LENGTH`
- L43 â€” retorno da funÃ§Ã£o: `<anÃ´nima>()`
- L43 â€” variÃ¡vel: `requiredText`
- L44 â€” parÃ¢metro: `value`
- L44 â€” retorno da funÃ§Ã£o: `<anÃ´nima>()`
- L48 â€” retorno da funÃ§Ã£o: `<anÃ´nima>()`
- L48 â€” variÃ¡vel: `optionalText`
- L53 â€” parÃ¢metro: `value`
- L53 â€” retorno da funÃ§Ã£o: `<anÃ´nima>()`
- L56 â€” parÃ¢metro: `value`
- L56 â€” retorno da funÃ§Ã£o: `<anÃ´nima>()`
- L59 â€” retorno da funÃ§Ã£o: `<anÃ´nima>()`
- L59 â€” variÃ¡vel: `nullableOptionalString`
- L66 â€” parÃ¢metro: `value`
- L66 â€” retorno da funÃ§Ã£o: `<anÃ´nima>()`

### [src/shared/validation/zodErrors.ts](../src/shared/validation/zodErrors.ts)

- L11 â€” variÃ¡vel: `MAX_PATH_LENGTH`
- L28 â€” variÃ¡vel: `isMissing`
- L34 â€” variÃ¡vel: `match`
- L35 â€” variÃ¡vel: `translated`
- L41 â€” variÃ¡vel: `raw`
- L46 â€” variÃ¡vel: `key`
- L53 â€” parÃ¢metro: `issue`
- L53 â€” retorno da funÃ§Ã£o: `<anÃ´nima>()`
- L62 â€” variÃ¡vel: `seen`
- L66 â€” variÃ¡vel: `missingFields`
- L67 â€” parÃ¢metro: `issue`
- L67 â€” retorno da funÃ§Ã£o: `<anÃ´nima>()`
- L72 â€” variÃ¡vel: `details`
- L73 â€” parÃ¢metro: `issue`
- L73 â€” retorno da funÃ§Ã£o: `<anÃ´nima>()`
- L77 â€” parÃ¢metro: `detail`
- L77 â€” retorno da funÃ§Ã£o: `<anÃ´nima>()`
- L82 â€” parÃ¢metro: `detail`
- L82 â€” retorno da funÃ§Ã£o: `<anÃ´nima>()`
- L89 â€” parÃ¢metro: `rootLabel`
- L102 â€” parÃ¢metro: `rootLabel`
- L104 â€” variÃ¡vel: `grouped`
- L107 â€” variÃ¡vel: `issue`
- L110 â€” variÃ¡vel: `issue`
- L111 â€” variÃ¡vel: `key`

## 3. DeclaraÃ§Ãµes com tipo efetivo `any`

### [src/modules/auth/auth.repository.ts](../src/modules/auth/auth.repository.ts)

- L106 â€” variÃ¡vel: `passwordChangedAt`

### [src/modules/pendingItems/pendingItems.repository.ts](../src/modules/pendingItems/pendingItems.repository.ts)

- L25 â€” variÃ¡vel: `row`
- L57 â€” variÃ¡vel: `row`
- L86 â€” variÃ¡vel: `row`
- L109 â€” variÃ¡vel: `row`
- L255 â€” variÃ¡vel: `row`
- L305 â€” variÃ¡vel: `row`
- L453 â€” variÃ¡vel: `requiresAttachment`
- L637 â€” variÃ¡vel: `requesterRow`
- L662 â€” variÃ¡vel: `category`

### [src/modules/pendingItems/pendingItems.router.ts](../src/modules/pendingItems/pendingItems.router.ts)

- L63 â€” parÃ¢metro: `err`

### [src/modules/portalConfig/portalConfig.controller.ts](../src/modules/portalConfig/portalConfig.controller.ts)

- L106 â€” variÃ¡vel: `rawAssets`

### [src/modules/portalConfig/portalConfig.repository.ts](../src/modules/portalConfig/portalConfig.repository.ts)

- L251 â€” variÃ¡vel: `row`

### [src/modules/prioritization/prioritization.repository.ts](../src/modules/prioritization/prioritization.repository.ts)

- L17 â€” variÃ¡vel: `row`
- L24 â€” variÃ¡vel: `row`
- L57 â€” variÃ¡vel: `row`

### [src/modules/queue/mapping.repository.ts](../src/modules/queue/mapping.repository.ts)

- L86 â€” variÃ¡vel: `row`
- L155 â€” variÃ¡vel: `row`
- L178 â€” variÃ¡vel: `row`
- L192 â€” variÃ¡vel: `row`
- L207 â€” variÃ¡vel: `row`
- L263 â€” parÃ¢metro: `r`
- L263 â€” variÃ¡vel: `row`
- L272 â€” parÃ¢metro: `row`
- L291 â€” variÃ¡vel: `[row]`

### [src/modules/queue/queue.repository.ts](../src/modules/queue/queue.repository.ts)

- L50 â€” variÃ¡vel: `result`

### [src/modules/requests/requests.repository.ts](../src/modules/requests/requests.repository.ts)

- L129 â€” variÃ¡vel: `row`
- L343 â€” variÃ¡vel: `row`
- L437 â€” variÃ¡vel: `response`
- L659 â€” variÃ¡vel: `row`
- L735 â€” variÃ¡vel: `row`
- L835 â€” variÃ¡vel: `row`
- L949 â€” variÃ¡vel: `row`

### [src/modules/requests/requests.service.ts](../src/modules/requests/requests.service.ts)

- L215 â€” parÃ¢metro: `value`

### [src/modules/requests/triage/triage.repository.ts](../src/modules/requests/triage/triage.repository.ts)

- L122 â€” variÃ¡vel: `row`

### [src/modules/users/users.repository.ts](../src/modules/users/users.repository.ts)

- L212 â€” variÃ¡vel: `user`
- L219 â€” variÃ¡vel: `[requester, professional]`
- L586 â€” variÃ¡vel: `result`
- L645 â€” variÃ¡vel: `anon`

### [src/server.ts](../src/server.ts)

- L8 â€” parÃ¢metro: `e`

### [src/shared/middleware/auth.ts](../src/shared/middleware/auth.ts)

- L25 â€” variÃ¡vel: `token`

### [src/shared/middleware/upload.ts](../src/shared/middleware/upload.ts)

- L49 â€” parÃ¢metro: `err`

### [src/shared/middleware/uploadAssets.ts](../src/shared/middleware/uploadAssets.ts)

- L125 â€” parÃ¢metro: `err`

### [src/shared/middleware/uploadAvatar.ts](../src/shared/middleware/uploadAvatar.ts)

- L70 â€” parÃ¢metro: `err`

### [src/shared/utils/json.ts](../src/shared/utils/json.ts)

- L8 â€” parÃ¢metro: `v`
- L8 â€” retorno da funÃ§Ã£o: `<anÃ´nima>()`
