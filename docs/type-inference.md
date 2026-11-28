# Inventário de tipagens TypeScript

> Arquivo gerado por `npm run docs:types` a partir dos arquivos `src/**/*.ts` e do `tsconfig.json` do projeto. Não edite manualmente: rode o comando para atualizar. Não inclui dependências nem arquivos `.d.ts`.

## Resumo

- Arquivos-fonte analisados: **201**.
- Tipos nomeados: **395** — 271 interfaces, 122 aliases `type`, 2 classes e 0 enums.
- Declarações sem anotação explícita: **2371** — 1728 variáveis, 316 parâmetros e 327 retornos de funções/métodos.
- Declarações com tipo efetivo `any` detectado pelo checker: **50**; ocorrências com a palavra-chave `any` explícita no código-fonte: **0**.
- Arquivos com pelo menos uma declaração sem anotação: **153**; arquivos sem ocorrências são omitidos das seções 2 e 3.
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

#### L6 — interface AuditAccessScope

```ts
export interface AuditAccessScope {
  readonly responsibleUserId: number | null;
}
```

#### L10 — interface AuditSummaryRow

```ts
interface AuditSummaryRow {
  audit_id: number;
  entity_type: string;
  action_type: string;
  user_id: number | null;
  actor_name: string | null;
  actor_profile_id: number | null;
  actor_profile_name: string | null;
  occurred_at: Date;
}
```

#### L21 — interface AuditCountRow

```ts
interface AuditCountRow {
  total: number | string;
}
```

#### L25 — interface AuditHistoryDetailRow

```ts
interface AuditHistoryDetailRow {
  audit_id: number | string;
  entity_type: string;
  entity_id: string;
  action_type: string;
  user_id: number | string | null;
  actor_name: string | null;
  actor_profile_id: number | null;
  actor_profile_name: string | null;
  previous_value: string | null;
  new_value: string | null;
  note: string | null;
  last_technical_message: string | null;
  previous_meeting: unknown;
  ip_address: string | null;
  change_origin: string | null;
  denied_permission_keys: string[] | null;
  occurred_at: Date | string;
}
```

### [src/modules/auth/auth.repository.ts](../src/modules/auth/auth.repository.ts)

#### L52 — interface AuthState

```ts
export interface AuthState {
  is_active: boolean;
  full_name: string;
  email: string;
  profile_id: number;
  profile_is_active: boolean;
  profile_name: string;
  must_change_password: boolean;
  password_changed_at: Date;
}
```

#### L80 — interface UserPermissionRow

```ts
export interface UserPermissionRow {
  permission_key: string;
  custody: string;
}
```

### [src/modules/auth/auth.service.ts](../src/modules/auth/auth.service.ts)

#### L14 — interface SessionUserResult

```ts
export interface SessionUserResult {
  id: string;
  name: string;
  email: string;
  avatarUrl: string | null;
  profile: SessionProfileReference;
  mustChangePassword: boolean;
  /** Época (ms) de `users.password_changed_at` — vai no payload do JWT. */
  passwordChangedAt: number;
}
```

#### L26 — interface SessionUserWithPermissions

```ts
export interface SessionUserWithPermissions extends SessionUserResult {
  permissions: EffectivePermission[];
}
```

### [src/modules/DTOs/auditHistory/AuditHistory.dto.ts](../src/modules/DTOs/auditHistory/AuditHistory.dto.ts)

#### L4 — interface AuditHistoryQuery

```ts
export interface AuditHistoryQuery {
  page?: number;
  limit?: number;
  entityType?: AuditEntityType;
}
```

#### L10 — interface AuditActor

```ts
export interface AuditActor {
  kind: "system" | "user";
  userId: number | null;
  displayName: string | null;
  /**
   * Snapshot do Perfil do ator no momento do evento. `null` em ações de
   * sistema e em eventos anteriores ao snapshot — nunca inferido do nome.
   */
  profile: ProfileReference | null;
}
```

#### L21 — interface AuditHistorySummary

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

#### L31 — interface AuditHistoryDetail

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
  /** Reunião legada arquivada na reabertura, quando havia apenas projeção vigente. */
  previous_meeting?: { scheduledFor: string | null; link: string | null };
  ip_address: string | null;
  /** Valor persistido em `audit_history.change_origin`; histórico pode estar fora de `ChangeOrigin`. */
  change_origin: string | null;
  /** Chaves exigidas e ausentes nas recusas; vazio nas demais ações. */
  denied_permission_keys: string[];
  occurred_at: string;
}
```

#### L54 — interface AuditHistoryListResponse

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
  profile: ProfileReference;
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
  profile: SessionProfileReference;
  mustChangePassword: boolean;
}
```

### [src/modules/DTOs/auth/MeResponse.dto.ts](../src/modules/DTOs/auth/MeResponse.dto.ts)

#### L4 — interface MeResponseDTO

```ts
export interface MeResponseDTO {
  id: string;
  name: string;
  email: string;
  avatarUrl: string | null;
  profile: ProfileReference;
  mustChangePassword: boolean;
  /** Lista efetiva do Perfil vigente, na ordem do catálogo de Permissões (§ 8). */
  permissions: EffectivePermission[];
}
```

### [src/modules/DTOs/internalNotes/InternalNotes.dto.ts](../src/modules/DTOs/internalNotes/InternalNotes.dto.ts)

#### L9 — interface TimelineActorDTO

```ts
export interface TimelineActorDTO {
  id: string;
  name: string;
  /**
   * Snapshot do Perfil no momento do registro. `null` quando o evento não
   * guardou Perfil; em notas antigas, `id` é `null` porque só o nome foi
   * preservado — nunca inferido do nome.
   */
  profile: ProfileSnapshot | null;
}
```

#### L20 — interface TimelineNote

```ts
export interface TimelineNote {
  type: "note";
  id: string;
  content: string;
  createdAt: string;
  author: TimelineActorDTO;
}
```

#### L28 — interface TimelineEvent

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

#### L45 — alias TimelineItem

```ts
export type TimelineItem = TimelineNote | TimelineEvent;
```

#### L47 — interface TriageHistoryEntry

```ts
export interface TriageHistoryEntry {
  triage: TriageAssessment;
  occurredAt: string;
}
```

#### L52 — interface MappingHistoryEntry

```ts
export interface MappingHistoryEntry {
  mapping: MappingResponseDTO;
  occurredAt: string;
}
```

#### L57 — interface InternalNotesResponse

```ts
export interface InternalNotesResponse {
  items: TimelineItem[];
  nextCursor: string | null;
  unseenCount: number;
  triages: TriageHistoryEntry[];
  mappings: MappingHistoryEntry[];
}
```

#### L65 — interface CreateInternalNoteRequest

```ts
export interface CreateInternalNoteRequest {
  content: string;
}
```

#### L69 — interface MarkInternalNotesReadRequest

```ts
export interface MarkInternalNotesReadRequest {
  lastReadNoteId: string;
}
```

### [src/modules/DTOs/notifications/Notifications.dto.ts](../src/modules/DTOs/notifications/Notifications.dto.ts)

#### L7 — interface NotificationItem

```ts
export interface NotificationItem {
  id: string;
  type: NotificationEventType;
  payload: NotificationPayload;
  readAt: string | null;
  createdAt: string;
}
```

#### L15 — interface NotificationListResponse

```ts
export interface NotificationListResponse {
  items: NotificationItem[];
  /** Cursor opaco para a próxima página; `null` na última. */
  nextCursor: string | null;
}
```

#### L21 — interface NotificationUnreadCountResponse

```ts
export interface NotificationUnreadCountResponse {
  unreadCount: number;
}
```

#### L25 — interface NotificationMarkReadResponse

```ts
export interface NotificationMarkReadResponse {
  id: string;
  readAt: string;
}
```

#### L30 — interface NotificationMarkAllReadResponse

```ts
export interface NotificationMarkAllReadResponse {
  markedRead: number;
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
export type PortalAssetsPatchDto = Partial<Record<AssetKey, string>> & {
  logoUsePrimaryColor?: boolean;
};
```

#### L35 — interface UpdateCategoriesRequest

```ts
export interface UpdateCategoriesRequest {
  categories: CategoriesSection["categories"];
}
```

#### L40 — interface UpdateStatusesRequest

```ts
export interface UpdateStatusesRequest {
  statuses: StatusesSection["statuses"];
}
```

#### L45 — interface UpdatePrioritizationWeightsRequest

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

### [src/modules/DTOs/profiles/Profiles.dto.ts](../src/modules/DTOs/profiles/Profiles.dto.ts)

#### L8 — interface ProfilePermissionInput

```ts
export interface ProfilePermissionInput {
  key: string;
  custody: Custody;
}
```

#### L14 — interface ProfileDTO

```ts
export interface ProfileDTO {
  id: string;
  name: string;
  description: string | null;
  isActive: boolean;
  /** `true` apenas no próprio Perfil Admin Root (contrato RBAC § 4.2). */
  isRoot: boolean;
  isAssignableTriage: boolean;
  isAssignableMapping: boolean;
  /** Contas vinculadas — todas, inclusive inativas (guarda de desativação). */
  userCount: number;
  /** Composição efetiva na ordem do catálogo. */
  permissions: EffectivePermission[];
}
```

#### L30 — interface PermissionCatalogEntryDTO

```ts
export interface PermissionCatalogEntryDTO {
  key: PermissionKey;
  custodyType: "global" | "custodial";
  allowedCustodies: readonly Custody[];
  dependencies: readonly PermissionKey[];
}
```

#### L38 — interface PermissionCatalogResponse

```ts
export interface PermissionCatalogResponse {
  /** As 37 chaves na ordem de referência da matriz. */
  permissions: PermissionCatalogEntryDTO[];
  /** Predicados de Atribuibilidade por etapa (flag + chaves de trabalho). */
  assignabilityPredicates: {
    triage: readonly PermissionKey[];
    mapping: readonly PermissionKey[];
  };
}
```

#### L49 — interface CreateProfileRequest

```ts
export interface CreateProfileRequest {
  name: string;
  description?: string | null;
  isAssignableTriage?: boolean;
  isAssignableMapping?: boolean;
  permissions: ProfilePermissionInput[];
}
```

#### L58 — interface UpdateProfileRequest

```ts
export interface UpdateProfileRequest {
  name?: string;
  description?: string | null;
  isAssignableTriage?: boolean;
  isAssignableMapping?: boolean;
  permissions?: ProfilePermissionInput[];
}
```

#### L67 — interface ChangeProfileStatusRequest

```ts
export interface ChangeProfileStatusRequest {
  isActive: boolean;
}
```

#### L72 — interface DuplicateProfileRequest

```ts
export interface DuplicateProfileRequest {
  name: string;
  description?: string | null;
}
```

#### L78 — interface ChangeProfileStatusResponse

```ts
export interface ChangeProfileStatusResponse {
  id: string;
  isActive: boolean;
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

#### L60 — interface MappingAssignee

```ts
export interface MappingAssignee {
  id: string;
  userId: string;
  name: string;
  email: string;
  jobTitle: string | null;
}
```

#### L72 — interface MappingResponseDTO

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

#### L102 — interface MappingPayloadDTO

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

#### L119 — alias MappingActor

```ts
export type MappingActor = PermissionActor;
```

### [src/modules/DTOs/queue/queue.dto.ts](../src/modules/DTOs/queue/queue.dto.ts)

#### L7 — interface FindQueueParams

```ts
export interface FindQueueParams extends QueueFilterQuery, QueueSortQuery {
  /**
   * Escopo de visibilidade por usuário (issue #102). Quando definido, restringe
   * o resultado às solicitações em que o usuário é responsável — de triagem ou
   * de mapeamento. `undefined` = sem restrição (perfis Gestor/Administrador).
   */
  scopedUserId?: number;
  /**
   * Custódia de `internal_note:read` aplicada somente à correspondência em
   * notas. `undefined` = sem restrição (Gestor/Administrador e exportação CSV).
   */
  noteCustodianUserId?: number;
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
   * Nome legado de `statuses.is_terminal` (ver `docs/rules/reports.md`).
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

#### L56 — interface UpdateStatusResponse

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
  canCancel: boolean;
  cancelCycleRef?: string;
  canReopen: boolean;
  closureRef?: string;
  operational: RequesterOperational;
  complementary?: ComplementaryBlock;
  schedulePreferences: string[] | null;
  mappingDate: string | null;
  attachments: RequesterAttachment[];
}
```

#### L81 — alias TrackingDetailsResponse

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
  profile: ProfileReference;
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

#### L1 — interface CreateProfessionalInput

```ts
export interface CreateProfessionalInput {
  /** Cargo da Extensão de profissional (`job_title` → `specialty` no diretório). */
  jobTitle: string;
  /** Especialidades (vira `specialties`, texto separado por vírgula). */
  specialties: string[];
  /** Ids das categorias atendidas (vira `attended_category_ids`). */
  attendedCategoryIds: number[];
  notes?: string;
}
```

#### L11 — interface RequesterInput

```ts
export interface RequesterInput {
  area: string;
  department?: string;
  manager: string;
  additionalContact?: string | null;
}
```

#### L18 — interface CreateUserRequest

```ts
export interface CreateUserRequest {
  fullName: string;
  email: string;
  /** Identidade estável do Perfil. */
  profileId: string;
  /** Opcional; permitido somente para Perfil ativo com flag de Atribuibilidade. */
  professional?: CreateProfessionalInput;
  requester: RequesterInput;
}
```

#### L28 — interface UpdateUserRequest

```ts
export interface UpdateUserRequest {
  fullName?: string;
  email?: string;
  /** Identidade estável do Perfil de destino. */
  profileId?: string;
  professional?: CreateProfessionalInput;
  requester?: {
    area?: string;
    department?: string | null;
    manager?: string;
    additionalContact?: string | null;
  };
}
```

#### L42 — interface ListUsersQuery

```ts
export interface ListUsersQuery {
  profileId?: string;
  search?: string;
  page: number;
  pageSize: number;
}
```

#### L49 — interface ChangeUserStatusRequest

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
  profile: ProfileReference;
  isActive: boolean;
  mustChangePassword: boolean;
  createdAt: string;
}
```

#### L15 — interface AssignableProfessional

```ts
export interface AssignableProfessional {
  id: string;
  fullName: string;
  email: string;
  specialty: string;
  categories: RequestCategoryName[];
  notes: string | null;
  requestLoad: number;
}
```

#### L25 — interface CreateUserResponse

```ts
export interface CreateUserResponse extends Omit<UserSummary, "avatarUrl"> {
  /** Exibida uma única vez — não recuperável depois. */
  temporaryPassword: string;
}
```

#### L30 — interface ResetPasswordResponse

```ts
export interface ResetPasswordResponse {
  id: string;
  temporaryPassword: string;
}
```

#### L35 — interface ChangeUserStatusResponse

```ts
export interface ChangeUserStatusResponse {
  id: string;
  isActive: boolean;
}
```

### [src/modules/internalNotes/internalNotes.repository.ts](../src/modules/internalNotes/internalNotes.repository.ts)

#### L14 — interface RequestIdentityRow

```ts
interface RequestIdentityRow {
  request_id: string;
  responsible_user_id: number | null;
  mapping_user_id: number | null;
}
```

#### L182 — alias MappingHistoryBaseRow

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

#### L53 — interface InternalNotesActor

```ts
export interface InternalNotesActor extends PermissionActor {
  readonly profileId: string;
  readonly profileName: string;
}
```

#### L95 — interface TimelineEntry

```ts
interface TimelineEntry {
  item: TimelineItem;
  timeMs: number;
  rank: number;
  id: bigint;
}
```

#### L203 — interface ActorSource

```ts
interface ActorSource {
  actor_user_id: number | null;
  actor_name: string | null;
  actor_profile_id: number | null;
  actor_profile_name: string | null;
}
```

### [src/modules/notifications/notifications.repository.ts](../src/modules/notifications/notifications.repository.ts)

#### L4 — interface NotificationRow

```ts
export interface NotificationRow {
  notification_id: string;
  event_type: string;
  payload: unknown;
  read_at: Date | string | null;
  created_at: Date | string;
}
```

#### L12 — interface NotificationCursor

```ts
export interface NotificationCursor {
  notificationId: string;
}
```

#### L134 — interface MarkReadRow

```ts
export interface MarkReadRow {
  notification_id: string;
  read_at: Date | string;
}
```

### [src/modules/notifications/notifications.schema.ts](../src/modules/notifications/notifications.schema.ts)

#### L12 — alias NotificationCursorPayload

```ts
export type NotificationCursorPayload = z.infer<typeof notificationCursorPayloadSchema>;
```

#### L65 — alias ListNotificationsQuery

```ts
export type ListNotificationsQuery = z.infer<typeof listNotificationsQuerySchema>;
```

### [src/modules/pendingItems/pendingItems.repository.ts](../src/modules/pendingItems/pendingItems.repository.ts)

#### L12 — interface RequestRef

```ts
export interface RequestRef {
  request_id: string;
  protocol: string;
  title: string;
  status: string;
  status_id: number;
  reopen_ref: string | null;
  requester_user_id: number | null;
  requester_name: string;
  requester_email: string;
  responsible_user_id: number | null;
}
```

#### L56 — alias PendingItemRow

```ts
export type PendingItemRow = z.infer<typeof pendingItemRowSchema>;
```

#### L68 — alias PendingAttachmentRow

```ts
export type PendingAttachmentRow = z.infer<typeof pendingAttachmentRowSchema>;
```

#### L412 — alias PendingItemInsert

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

#### L425 — alias RespondFacts

```ts
export type RespondFacts = {
  requestedRemaining: number;
  attachmentSatisfied: boolean;
  currentStatusName: string;
};
```

#### L431 — alias ReviewDecisionInput

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

#### L441 — alias ReviewFacts

```ts
export type ReviewFacts = { hasReopen: boolean };
```

#### L443 — alias SavedPendingAttachment

```ts
export type SavedPendingAttachment = {
  fileName: string;
  mimeType: string;
  sizeBytes: number;
  storageKey: string;
};
```

#### L591 — alias PendingItemResponsePatch

```ts
export type PendingItemResponsePatch = { corrected_value: string } | { response_text: string };
```

#### L593 — interface PendingItemResponseInput

```ts
export interface PendingItemResponseInput {
  requestId: string;
  protocol: string;
  pendingItemId: string;
  batchId: string;
  patch: PendingItemResponsePatch;
  actorEmail: string | undefined;
  changeOrigin: "admin" | "requester";
  ip: string | undefined;
  decideStatus: (facts: RespondFacts) => string | null;
}
```

#### L605 — interface PendingItemResponseResult

```ts
export interface PendingItemResponseResult {
  row: PendingItemRow;
  /** `audit_id` da resposta; base da `eventKey` do Evento de Notificação. */
  auditId: string;
}
```

### [src/modules/pendingItems/pendingItems.schema.ts](../src/modules/pendingItems/pendingItems.schema.ts)

#### L52 — alias PendingItemResponseBody

```ts
export type PendingItemResponseBody = z.infer<typeof pendingItemResponseBodySchema>;
```

#### L75 — alias CreatePendingItemsInput

```ts
export type CreatePendingItemsInput = z.infer<typeof createPendingItemsSchema>;
```

#### L76 — alias VerifyInput

```ts
export type VerifyInput = z.infer<typeof verifySchema>;
```

#### L77 — alias ReviewInput

```ts
export type ReviewInput = z.infer<typeof reviewSchema>;
```

### [src/modules/pendingItems/pendingItems.service.ts](../src/modules/pendingItems/pendingItems.service.ts)

#### L299 — alias PendingCaller

```ts
export type PendingCaller = {
  user?: AuthenticatedUser;
  permissions?: readonly EffectivePermission[];
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

### [src/modules/prioritization/prioritization.repository.ts](../src/modules/prioritization/prioritization.repository.ts)

#### L16 — interface RequestEvaluationContext

```ts
interface RequestEvaluationContext {
  requestId: string;
  assigneeUserId: number | null;
  reopenRef: string | null;
}
```

### [src/modules/profiles/profiles.audit.ts](../src/modules/profiles/profiles.audit.ts)

#### L15 — alias ProfileAuditAction

```ts
export type ProfileAuditAction = ComposedAuditAction<"profile">;
```

#### L22 — interface ProfileAuditState

```ts
export interface ProfileAuditState {
  row: ProfileWithUserCountRow;
  permissions: readonly EffectivePermission[];
}
```

#### L27 — interface ProfileAuditEntry

```ts
export interface ProfileAuditEntry {
  actorUserId: number;
  profileId: number;
  actionType: ProfileAuditAction;
  /** Estado anterior; `null` em criação e duplicação. */
  previous: ProfileAuditState | null;
  next: ProfileAuditState;
  ipAddress: string | undefined;
  /** Justificativa interna, quando a ação tiver uma (ex.: origem da duplicação). */
  note?: string | null;
}
```

### [src/modules/profiles/profiles.composition.ts](../src/modules/profiles/profiles.composition.ts)

#### L22 — alias AssignabilityStage

```ts
export type AssignabilityStage = "triage" | "mapping";
```

#### L43 — interface CompositionState

```ts
export interface CompositionState {
  isAssignableTriage: boolean;
  isAssignableMapping: boolean;
  permissions: readonly EffectivePermission[];
}
```

#### L201 — interface WorkKeyLoss

```ts
export interface WorkKeyLoss {
  stage: AssignabilityStage;
  missingKeys: readonly PermissionKey[];
  sourceFlag: boolean;
  targetFlag: boolean;
}
```

#### L275 — interface ProfileSnapshotSource

```ts
export interface ProfileSnapshotSource {
  name: string;
  description: string | null;
  isActive: boolean;
  isRoot: boolean;
  isAssignableTriage: boolean;
  isAssignableMapping: boolean;
  permissions: readonly EffectivePermission[];
}
```

### [src/modules/profiles/profiles.repository.ts](../src/modules/profiles/profiles.repository.ts)

#### L29 — interface ProfileWithCountRow

```ts
interface ProfileWithCountRow extends Omit<ProfileWithUserCountRow, "user_count"> {
  user_count: string;
}
```

### [src/modules/profiles/profiles.service.ts](../src/modules/profiles/profiles.service.ts)

#### L38 — interface ProfileActor

```ts
export interface ProfileActor {
  userId: number;
  permissions: readonly EffectivePermission[];
}
```

### [src/modules/queue/mapping.repository.ts](../src/modules/queue/mapping.repository.ts)

#### L19 — interface MappingRow

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

#### L43 — interface MappingParticipantRow

```ts
export interface MappingParticipantRow {
  userId: number | null;
  name: string;
  email: string;
}
```

#### L50 — interface MappingRequestContext

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
  /** Conta que criou a solicitação; `null` nas linhas anônimas e legadas. */
  requester_user_id: number | null;
  /** Motor de Status v4 (issue #124): flags do status vigente. */
  status_id: number | null;
  is_terminal: boolean;
  is_restricted: boolean;
  /** Título da solicitação — compõe a Allowlist do Evento de Agendamento. */
  title: string;
}
```

#### L70 — interface MappingAssigneeCandidate

```ts
export interface MappingAssigneeCandidate {
  id: string;
  userId: number;
  name: string;
  email: string;
  jobTitle: string | null;
  professional_status: "active" | "inactive";
  user_is_active: boolean;
  profile_id: number;
  profile_is_active: boolean;
}
```

#### L130 — interface MappingTargetRow

```ts
export interface MappingTargetRow {
  status_id: number;
  name: string;
  isPublic: boolean;
}
```

### [src/modules/queue/mapping.schemas.ts](../src/modules/queue/mapping.schemas.ts)

#### L123 — alias MappingPayload

```ts
export type MappingPayload = z.infer<typeof mappingPayloadSchema>;
```

### [src/modules/queue/queue.filters.ts](../src/modules/queue/queue.filters.ts)

#### L5 — interface QueueRepositoryFilters

```ts
export interface QueueRepositoryFilters extends QueueFilterQuery {
  scopedUserId?: number;
  noteCustodianUserId?: number;
}
```

#### L10 — alias MappingAssigneeSelector

```ts
type MappingAssigneeSelector = {
  readonly field: "user_id" | "professional_id";
  readonly value: number | string;
};
```

### [src/modules/reports/reports.repository.ts](../src/modules/reports/reports.repository.ts)

#### L15 — interface DashboardSummaryRow

```ts
interface DashboardSummaryRow {
  total: number | string;
  open: number | string;
  closed: number | string;
  overdue: number | string;
  unassigned: number | string;
}
```

#### L23 — interface DashboardStatusRow

```ts
interface DashboardStatusRow {
  id: number | string;
  name: string;
  count: number | string;
  tone: string;
  closesRequest: boolean;
}
```

#### L31 — interface DashboardPriorityRow

```ts
interface DashboardPriorityRow {
  id: number | string | null;
  label: string;
  count: number | string;
}
```

#### L37 — interface DashboardCategoryRow

```ts
interface DashboardCategoryRow {
  id: number | string;
  name: string;
  count: number | string;
}
```

#### L43 — interface DashboardTrendRow

```ts
interface DashboardTrendRow {
  period: string;
  count: number | string;
}
```

#### L48 — interface DashboardStatusOptionRow

```ts
interface DashboardStatusOptionRow {
  id: number | string;
  name: string;
}
```

#### L53 — interface DashboardCategoryOptionRow

```ts
interface DashboardCategoryOptionRow {
  id: number | string;
  name: string;
}
```

#### L58 — interface DashboardPriorityOptionRow

```ts
interface DashboardPriorityOptionRow {
  id: number | string;
  label: string;
}
```

#### L63 — interface DashboardFilterOptionRows

```ts
export interface DashboardFilterOptionRows {
  statuses: DashboardStatusOptionRow[];
  categories: DashboardCategoryOptionRow[];
  priorities: DashboardPriorityOptionRow[];
}
```

### [src/modules/requests/requests-reopen.service.ts](../src/modules/requests/requests-reopen.service.ts)

#### L21 — interface ReopenRequestInput

```ts
interface ReopenRequestInput {
  actor: PermissionActor;
  protocol: string;
  justification: string;
  closureRef: string;
  ipAddress?: string;
}
```

#### L29 — interface ReopenRequestResult

```ts
interface ReopenRequestResult {
  protocol: string;
  statusId: typeof REOPEN_TARGET.status_id;
  status: typeof REOPEN_TARGET.name;
}
```

### [src/modules/requests/requests.repository.ts](../src/modules/requests/requests.repository.ts)

#### L46 — interface LockedRequestClosure

```ts
interface LockedRequestClosure {
  request_id: string;
  status_id: number;
  closure_ref: string | null;
  meeting_scheduled_for: string | null;
  meeting_link: string | null;
}
```

#### L67 — interface RequestWriteState

```ts
interface RequestWriteState {
  status_id: number;
  closure_ref: string | null;
  reopen_ref: string | null;
  professional_id: string | null;
  mapping_professional_id: string | null;
}
```

#### L120 — interface YesNoDetailColumns

```ts
interface YesNoDetailColumns {
  flag: boolean | null;
  detail: string | null;
}
```

#### L235 — interface RequestInsertReturning

```ts
interface RequestInsertReturning {
  request_id: string;
  protocol: string;
  created_at: Date;
}
```

#### L424 — interface RequestSummaryRow

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

#### L504 — interface RequestWithOwner

```ts
export interface RequestWithOwner {
  detail: RequestDetail;
  requesterEmail: string;
  requesterUserId: number | null;
}
```

#### L579 — interface RequestAttachmentRow

```ts
export interface RequestAttachmentRow {
  attachment_id: string;
  file_name: string;
  content_type: string;
  size_bytes: string; // bigint do pg
}
```

#### L587 — interface SchedulePreferenceRow

```ts
export interface SchedulePreferenceRow {
  scheduled_for: Date | string;
}
```

#### L938 — interface CancellationContext

```ts
interface CancellationContext {
  request_id: string;
  protocol: string;
  requester_user_id: number | null;
  status_id: number;
  has_triage: boolean;
  reopen_ref: string | null;
}
```

#### L984 — interface RequestStatusContext

```ts
export interface RequestStatusContext {
  request_id: string;
  protocol: string;
  title: string;
  requester_user_id: number | null;
  current_status_id: number | null;
  closure_ref: string | null;
  reopen_ref: string | null;
  current_status_name: string | null;
  current_is_terminal: boolean;
  current_is_restricted: boolean;
  /** `details_professional.user_id` do responsável pela triagem. */
  assignee_user_id: number | null;
  /** `details_professional.user_id` do designado do mapeamento. */
  mapping_assignee_user_id: number | null;
}
```

#### L1002 — interface RequestStatusTarget

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

#### L157 — alias UpdateRequestPayload

```ts
export type UpdateRequestPayload = z.infer<typeof updateRequestPayloadSchema>;
```

#### L188 — alias AssignRequestPayload

```ts
export type AssignRequestPayload = z.infer<typeof assignRequestSchema>;
```

#### L212 — alias AssignAnalystPayload

```ts
export type AssignAnalystPayload = z.infer<typeof assignAnalystSchema>;
```

#### L228 — alias CancelRequestPayload

```ts
export type CancelRequestPayload = z.infer<typeof cancelRequestSchema>;
```

#### L241 — alias UpdateStatusPayload

```ts
export type UpdateStatusPayload = z.infer<typeof updateStatusSchema>;
```

### [src/modules/requests/requests.service.ts](../src/modules/requests/requests.service.ts)

#### L92 — interface AuthenticatedIdentity

```ts
interface AuthenticatedIdentity {
  fullName: string;
  email: string;
}
```

#### L97 — alias RequestActor

```ts
type RequestActor = PermissionActor;
```

#### L99 — interface RequestMutationAcknowledgement

```ts
interface RequestMutationAcknowledgement {
  readonly protocol: string;
  readonly updated: true;
}
```

#### L523 — interface TrackingCaller

```ts
export interface TrackingCaller {
  user?: AuthenticatedUser;
  requesterIdentity?: { name: string; email: string } | null;
}
```

#### L831 — interface InternalRequestRow

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
export interface StatusRow {
  status_id: number;
  name: string;
  isPublic: boolean;
  isRestricted: boolean;
}
```

#### L14 — interface CategoryRow

```ts
interface CategoryRow {
  category_id: number;
  name: string;
}
```

#### L19 — interface RequestContextRow

```ts
export interface RequestContextRow {
  request_id: string;
  protocol: string;
  professional_id: string | null;
  assignee_user_id: number | null;
  mapping_assignee_user_id: number | null;
  status_id: number;
  reopen_ref: string | null;
  status_name: string | null;
  status_is_restricted: boolean;
  status_is_terminal: boolean;
  category_name: string | null;
  requester_user_id: number | null;
  title: string;
}
```

#### L60 — interface TriageRow

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

#### L196 — interface ApplyRequestOutcomeInput

```ts
export interface ApplyRequestOutcomeInput {
  protocol: string;
  categoryId: number | null;
  statusId: number;
  isStatusPublic: boolean;
  lastTechnicalMessage: string | null;
  expectedStatusId: number;
  updatedBy: string;
  trx?: Knex.Transaction;
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

#### L64 — interface CommitTriageDecisionInput

```ts
interface CommitTriageDecisionInput {
  protocol: string;
  request: RequestContextRow;
  triage: TriageAssessment;
  categoryId: number | null;
  exitStatus: StatusRow;
  actor: NamedPermissionActor;
  ipAddress?: string;
}
```

### [src/modules/users/users.repository.ts](../src/modules/users/users.repository.ts)

#### L19 — interface UserSummaryRow

```ts
interface UserSummaryRow {
  user_id: number;
  full_name: string;
  email: string;
  avatar_url: string | null;
  profile_id: number;
  profile_name: string;
  is_active: boolean;
  must_change_password: boolean;
  created_at: Date;
}
```

#### L31 — interface ProfileLookupRow

```ts
export interface ProfileLookupRow {
  profile_id: number;
  name: string;
  is_root: boolean;
  is_active: boolean;
  is_assignable_triage: boolean;
  is_assignable_mapping: boolean;
}
```

#### L56 — interface FindProfileByIdOptions

```ts
export interface FindProfileByIdOptions {
  readonly queryable?: Knex;
  readonly shouldLockForShare?: boolean;
}
```

#### L268 — interface UserProfileRow

```ts
export interface UserProfileRow {
  user_id: number;
  profile_id: number;
  full_name: string;
  email: string;
  avatar_url: string | null;
  profile_name: string;
  is_active: boolean;
  is_assignable_triage: boolean;
  is_assignable_mapping: boolean;
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

#### L614 — interface AssignableProfessionalRow

```ts
interface AssignableProfessionalRow {
  user_id: number;
  full_name: string;
  email: string;
  job_title: string | null;
  attended_category_ids: string | null;
  notes: string | null;
  professional_id: string;
}
```

### [src/modules/users/users.service.ts](../src/modules/users/users.service.ts)

#### L91 — alias AccountActor

```ts
export type AccountActor = Pick<PermissionActor, "id" | "permissions">;
```

#### L93 — interface ActorAuthority

```ts
interface ActorAuthority {
  readonly isRoot: boolean;
  readonly grants: readonly EffectivePermission[];
}
```

### [src/shared/access/assignability.ts](../src/shared/access/assignability.ts)

#### L10 — alias AssignabilityStage

```ts
export type AssignabilityStage = "triage" | "mapping";
```

#### L17 — interface AssigneeEligibilityRow

```ts
export interface AssigneeEligibilityRow {
  readonly professional_status: string;
  readonly user_is_active: boolean;
  readonly profile_is_active: boolean;
}
```

#### L61 — interface FindAssignableProfilesOptions

```ts
export interface FindAssignableProfilesOptions {
  readonly queryable?: Knex;
  /** Omit to return profiles assignable to either stage. */
  readonly stage?: AssignabilityStage;
}
```

#### L67 — interface IsProfileAssignableOptions

```ts
export interface IsProfileAssignableOptions {
  readonly queryable?: Knex;
}
```

#### L71 — interface ProfileAssignablePermissionsOptions

```ts
export interface ProfileAssignablePermissionsOptions {
  readonly queryable?: Knex;
  readonly requireFlag?: boolean;
  readonly requireActive?: boolean;
}
```

#### L77 — interface PermissionKeysPredicate

```ts
export interface PermissionKeysPredicate {
  readonly sql: string;
  readonly bindings: Array<string | number>;
}
```

### [src/shared/access/custody.ts](../src/shared/access/custody.ts)

#### L12 — interface CustodyActor

```ts
export interface CustodyActor {
  readonly userId: number;
  readonly email: string;
}
```

#### L22 — interface CustodySubject

```ts
export interface CustodySubject {
  readonly responsibleIds?: readonly number[];
  readonly requesterEmail?: string | null;
}
```

#### L27 — alias ResponsibleScope

```ts
export type ResponsibleScope =
  { readonly kind: "all" } | { readonly kind: "assigned"; readonly userId: number };
```

### [src/shared/access/permissionActor.ts](../src/shared/access/permissionActor.ts)

#### L5 — interface PermissionActor

```ts
export interface PermissionActor {
  readonly id: number;
  readonly email: string;
  readonly permissions: readonly EffectivePermission[];
}
```

#### L11 — interface NamedPermissionActor

```ts
export interface NamedPermissionActor extends PermissionActor {
  readonly name: string;
}
```

### [src/shared/access/requestAccess.ts](../src/shared/access/requestAccess.ts)

#### L17 — interface PermissionActor

```ts
export interface PermissionActor {
  readonly id: number;
  readonly email: string;
  readonly permissions: readonly EffectivePermission[];
}
```

#### L24 — interface RequestActorSource

```ts
export interface RequestActorSource {
  readonly user?: { readonly id: string; readonly email: string };
  readonly permissions?: readonly EffectivePermission[];
}
```

### [src/shared/audit/accessDenied.ts](../src/shared/audit/accessDenied.ts)

#### L5 — alias AccessDeniedEntity

```ts
export type AccessDeniedEntity = "request" | "queue" | "reports" | "prioritization";
```

#### L7 — interface AccessDeniedAttempt

```ts
export interface AccessDeniedAttempt {
  readonly entityType: AccessDeniedEntity;
  readonly entityId: string;
  readonly userId: number;
  readonly note: string;
  readonly ipAddress?: string;
  /**
   * Chaves de Permissão avaliadas na recusa: ausentes no gate ou presentes sem
   * o vínculo suficiente (Custódia ou Posse) na linha. Vazio quando a recusa não é de Permissão.
   */
  readonly deniedPermissionKeys?: readonly PermissionKey[];
}
```

### [src/shared/audit/auditCatalog.ts](../src/shared/audit/auditCatalog.ts)

#### L74 — alias AuditEntityType

```ts
export type AuditEntityType = keyof typeof auditCatalog;
```

#### L82 — alias ChangeOrigin

```ts
export type ChangeOrigin =
  "user" | "admin" | "system" | "requester" | "manual" | "internal" | "self";
```

#### L86 — alias AuditActionOf

```ts
export type AuditActionOf<E extends AuditEntityType> = (typeof auditCatalog)[E]["actions"][number];
```

#### L89 — alias ComposedAuditAction

```ts
export type ComposedAuditAction<E extends AuditEntityType> = `${E}.${AuditActionOf<E>}`;
```

### [src/shared/audit/auditLogger.ts](../src/shared/audit/auditLogger.ts)

#### L13 — interface AuditEntryBase

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
  previousMeeting?: { scheduledFor: string | null; link: string | null };
  /** Origem da alteração — restrita aos valores gravados pelo sistema. */
  changeOrigin?: ChangeOrigin | null;
  /**
   * Chaves de Permissão avaliadas na recusa (`*.access_denied`): ausentes no
   * gate ou presentes sem o vínculo suficiente (Custódia ou Posse) na linha.
   * Vazio nas demais ações: a chave que **autorizou** não é registrada.
   */
  deniedPermissionKeys?: readonly PermissionKey[];
}
```

#### L41 — alias AuditEntry

```ts
export type AuditEntry<
  E extends AuditEntityType = AuditEntityType,
  A extends ComposedAuditAction<E> = ComposedAuditAction<E>,
> = AuditEntryBase & { entityType: E; actionType: A };
```

#### L46 — interface ActorProfileRow

```ts
interface ActorProfileRow {
  profile_id: number;
  name: string;
}
```

### [src/shared/catalog/baseProfiles.ts](../src/shared/catalog/baseProfiles.ts)

#### L14 — interface BaseProfilePermission

```ts
export interface BaseProfilePermission {
  readonly key: PermissionKey;
  readonly custody: Custody;
}
```

#### L19 — interface BaseProfile

```ts
export interface BaseProfile {
  /** Rótulo de exibição atual em `profiles.name`. */
  readonly profileName: string;
  /** Marca de Perfil Admin Root — escrita exclusiva do seed (§ 4.2). */
  readonly isRoot: boolean;
  readonly isAssignableTriage: boolean;
  readonly isAssignableMapping: boolean;
  readonly permissions: readonly BaseProfilePermission[];
}
```

#### L30 — alias CustodialPolicy

```ts
type CustodialPolicy = Extract<Custody, "assigned" | "all">;
```

### [src/shared/catalog/fieldCatalog.ts](../src/shared/catalog/fieldCatalog.ts)

#### L42 — alias FieldKey

```ts
export type FieldKey = (typeof FIELD_KEYS)[number];
```

### [src/shared/catalog/permissionCatalog.ts](../src/shared/catalog/permissionCatalog.ts)

#### L14 — alias Custody

```ts
export type Custody = (typeof CUSTODIES)[number];
```

#### L17 — alias CustodyType

```ts
export type CustodyType = "global" | "custodial";
```

#### L19 — interface PermissionDefinition

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

#### L269 — alias PermissionKey

```ts
export type PermissionKey = (typeof PERMISSION_CATALOG)[number]["key"];
```

#### L271 — alias CatalogEntry

```ts
export type CatalogEntry = (typeof PERMISSION_CATALOG)[number];
```

#### L312 — interface PermissionGrantSource

```ts
export interface PermissionGrantSource {
  readonly permission_key: string;
  readonly custody: string;
}
```

#### L318 — interface EffectivePermission

```ts
export interface EffectivePermission {
  readonly key: PermissionKey;
  readonly custody: Custody;
}
```

### [src/shared/datetime/businessDay.ts](../src/shared/datetime/businessDay.ts)

#### L8 — interface DayRange

```ts
export interface DayRange {
  from?: string;
  to?: string;
}
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

### [src/shared/notifications/emitNotification.ts](../src/shared/notifications/emitNotification.ts)

#### L9 — interface CommittedNotification

```ts
export interface CommittedNotification {
  notificationId: string;
  recipientUserId: number;
}
```

### [src/shared/notifications/inAppNotificationChannel.ts](../src/shared/notifications/inAppNotificationChannel.ts)

#### L8 — interface InsertedNotificationRow

```ts
interface InsertedNotificationRow {
  notification_id: string;
  recipient_user_id: number;
}
```

### [src/shared/notifications/mappingScheduledNotification.ts](../src/shared/notifications/mappingScheduledNotification.ts)

#### L5 — interface MappingScheduledNotificationInput

```ts
export interface MappingScheduledNotificationInput extends Omit<
  MappingScheduledNotificationPayload,
  "type"
> {
  /** `audit_id` do `mapping.complete`; junto do prefixo forma a `eventKey`. */
  auditId: string;
  requestId: string;
  actorUserId: number;
  /** Solicitante autenticado (`requests.requester_user_id`). */
  requesterUserId: number | null;
  /**
   * Designado de custódia da solicitação (`requests.mapping_professional_id`)
   * — a audiência declarada na matriz #156.
   */
  requestMappingAssigneeUserId: number | null;
}
```

### [src/shared/notifications/notificationChannel.ts](../src/shared/notifications/notificationChannel.ts)

#### L4 — interface NotificationToDeliver

```ts
export interface NotificationToDeliver {
  recipientUserId: number;
  eventType: NotificationEventType;
  requestId: string;
  payload: NotificationPayload;
  dedupKey: string;
}
```

#### L12 — interface NotificationDelivery

```ts
export interface NotificationDelivery {
  notificationId: string;
  recipientUserId: number;
}
```

#### L23 — interface NotificationChannel

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

#### L6 — interface NotificationCommittedPayload

```ts
export interface NotificationCommittedPayload {
  userId: number;
  notificationIds: string[];
}
```

### [src/shared/notifications/notificationEvents.ts](../src/shared/notifications/notificationEvents.ts)

#### L21 — alias RequestPointer

```ts
export type RequestPointer = z.infer<typeof requestPointerPayloadSchema>;
```

#### L85 — alias StatusChangedNotificationPayload

```ts
export type StatusChangedNotificationPayload = z.infer<typeof statusChangedPayloadSchema>;
```

#### L86 — alias MappingScheduledNotificationPayload

```ts
export type MappingScheduledNotificationPayload = z.infer<typeof mappingScheduledPayloadSchema>;
```

#### L87 — alias PendingItemRespondedNotificationPayload

```ts
export type PendingItemRespondedNotificationPayload = z.infer<
  typeof pendingItemRespondedPayloadSchema
>;
```

#### L90 — alias PendingItemRespondedUnassignedNotificationPayload

```ts
export type PendingItemRespondedUnassignedNotificationPayload = z.infer<
  typeof pendingItemRespondedUnassignedPayloadSchema
>;
```

#### L93 — alias ResponsibleAssignedNotificationPayload

```ts
export type ResponsibleAssignedNotificationPayload = z.infer<
  typeof responsibleAssignedPayloadSchema
>;
```

#### L96 — alias NotificationPayload

```ts
export type NotificationPayload = z.infer<typeof notificationPayloadSchema>;
```

#### L121 — alias NotificationEventBase

```ts
export type NotificationEventBase = z.infer<typeof notificationEventBaseSchema>;
```

#### L208 — alias StatusChangedNotificationEvent

```ts
export type StatusChangedNotificationEvent = z.infer<typeof statusChangedEventSchema>;
```

#### L209 — alias MappingScheduledNotificationEvent

```ts
export type MappingScheduledNotificationEvent = z.infer<typeof mappingScheduledEventSchema>;
```

#### L210 — alias PendingItemRespondedNotificationEvent

```ts
export type PendingItemRespondedNotificationEvent = z.infer<typeof pendingItemRespondedEventSchema>;
```

#### L211 — alias PendingItemRespondedUnassignedNotificationEvent

```ts
export type PendingItemRespondedUnassignedNotificationEvent = z.infer<
  typeof pendingItemRespondedUnassignedEventSchema
>;
```

#### L214 — alias ResponsibleAssignedNotificationEvent

```ts
export type ResponsibleAssignedNotificationEvent = z.infer<typeof responsibleAssignedEventSchema>;
```

#### L215 — alias NotificationEvent

```ts
export type NotificationEvent = z.infer<typeof notificationEventSchema>;
```

#### L216 — alias NotificationEventType

```ts
export type NotificationEventType = NotificationEvent["type"];
```

#### L225 — alias PendingItemEventType

```ts
export type PendingItemEventType = (typeof PENDING_ITEM_EVENT_TYPES)[number];
```

#### L227 — alias PendingItemNotificationEvent

```ts
export type PendingItemNotificationEvent = Extract<
  NotificationEvent,
  { type: PendingItemEventType }
>;
```

### [src/shared/notifications/pendingItemNotification.ts](../src/shared/notifications/pendingItemNotification.ts)

#### L11 — alias PendingItemNotificationAction

```ts
export type PendingItemNotificationAction = "create" | "reopen" | "validate";
```

#### L14 — interface PendingItemNotificationRequest

```ts
export interface PendingItemNotificationRequest {
  readonly requestId: string;
  readonly requesterUserId: number | null;
  readonly pointer: RequestPointer;
}
```

#### L21 — interface PendingItemNotificationEventInput

```ts
export interface PendingItemNotificationEventInput {
  readonly action: PendingItemNotificationAction;
  readonly auditId: string;
}
```

#### L26 — interface PendingItemNotificationsInput

```ts
export interface PendingItemNotificationsInput {
  readonly request: PendingItemNotificationRequest;
  readonly actorUserId: number;
  readonly events: readonly PendingItemNotificationEventInput[];
}
```

#### L32 — interface PendingItemEventBuilder

```ts
interface PendingItemEventBuilder {
  readonly eventKeyPrefix: string;
  readonly build: (
    eventBase: NotificationEventBase,
    requestPointer: RequestPointer,
  ) => PendingItemNotificationEvent;
}
```

### [src/shared/notifications/pendingItemRespondedNotification.ts](../src/shared/notifications/pendingItemRespondedNotification.ts)

#### L14 — alias PendingItemRespondedAudience

```ts
export type PendingItemRespondedAudience =
  { kind: "assignee"; userId: number } | { kind: "active_admins"; userIds: readonly number[] };
```

#### L17 — interface PendingItemRespondedNotificationInput

```ts
export interface PendingItemRespondedNotificationInput {
  /** `audit_id` da resposta; junto do prefixo forma a `eventKey`. */
  auditId: string;
  requestId: string;
  /** Protocolo e título da solicitação — ponteiro da Allowlist. */
  requestPointer: RequestPointer;
  /** Ator da resposta; `null` em solicitação anônima sem usuário vinculado. */
  actorUserId: number | null;
  /** Resolvida pelo chamador antes da emissão, já sem o ator. */
  audience: PendingItemRespondedAudience;
}
```

#### L29 — alias PendingItemRespondedEvent

```ts
type PendingItemRespondedEvent =
  PendingItemRespondedNotificationEvent | PendingItemRespondedUnassignedNotificationEvent;
```

#### L32 — interface NotificationEventBase

```ts
interface NotificationEventBase {
  eventKey: string;
  requestId: string;
  actorUserId: number | null;
}
```

### [src/shared/notifications/responsibleAssignedNotification.ts](../src/shared/notifications/responsibleAssignedNotification.ts)

#### L5 — interface ResponsibleAssignedNotificationInput

```ts
export interface ResponsibleAssignedNotificationInput extends Omit<
  ResponsibleAssignedNotificationPayload,
  "type"
> {
  /** Usuário designado — o único destinatário. */
  recipientUserId: number;
  /** `audit_id` da designação; junto do prefixo forma a `eventKey`. */
  auditId: string;
  requestId: string;
  /** Ator da designação (o Administrador); não recebe Notificação própria. */
  actorUserId: number;
}
```

### [src/shared/notifications/statusChangedNotification.ts](../src/shared/notifications/statusChangedNotification.ts)

#### L6 — alias StatusChangeSource

```ts
export type StatusChangeSource = "status_patch" | "triage_verdict";
```

#### L14 — interface StatusTarget

```ts
export interface StatusTarget {
  statusId: number;
  isPublic: boolean;
  isRestricted: boolean;
}
```

#### L20 — interface StatusChangedNotificationInput

```ts
export interface StatusChangedNotificationInput extends Omit<
  StatusChangedNotificationPayload,
  "type"
> {
  source: StatusChangeSource;
  /** `audit_id` do evento de negócio; junto da origem forma a `eventKey`. */
  auditId: string;
  requestId: string;
  actorUserId: number;
  requesterUserId: number | null;
  /** Status anterior; igual ao destino significa que não houve mudança. */
  previousStatusId: number | null;
  /** Status de destino; a visibilidade decide a audiência. */
  targetStatus: StatusTarget;
}
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

#### L1 — interface InternalNoteRow

```ts
export interface InternalNoteRow {
  internal_note_id: string;
  request_id: string;
  author_user_id: number;
  /** Snapshot da identidade do Perfil na criação; `null` em notas antigas. */
  author_profile_id_at_creation: number | null;
  /** Snapshot do nome do Perfil na criação; não participa da autorização. */
  author_profile_name_at_creation: string;
  content: string;
  created_at: Date;
  author_name: string;
}
```

#### L14 — interface InternalNoteReadStateRow

```ts
export interface InternalNoteReadStateRow {
  request_id: string;
  user_id: number;
  last_read_note_id: string;
  read_at: Date;
}
```

#### L21 — alias TimelineEventAction

```ts
export type TimelineEventAction =
  | "request.assign"
  | "request.reassign"
  | "request.unassign"
  | "request.status_change"
  | "request.reopen"
  | "mapping.assign";
```

#### L36 — alias AuditTimelineAction

```ts
export type AuditTimelineAction =
  TimelineEventAction | "request.override_status_admin" | "request.status_override";
```

#### L39 — alias TimelineChangeOrigin

```ts
export type TimelineChangeOrigin = "admin" | "system" | "internal" | "requester" | null;
```

#### L41 — interface TimelineCursor

```ts
export interface TimelineCursor {
  t: Date;
  type: "note" | "event";
  id: string;
}
```

#### L47 — interface TimelineEventRow

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
  /** Snapshot da identidade do Perfil do ator; `null` em eventos antigos. */
  actor_profile_id: number | null;
  /** Snapshot do nome do Perfil do ator; `null` em eventos antigos. */
  actor_profile_name: string | null;
}
```

#### L67 — interface TriageHistoryRow

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

#### L88 — interface MappingHistoryParticipant

```ts
export interface MappingHistoryParticipant {
  userId: number | null;
  name: string;
  email: string;
}
```

#### L95 — interface MappingHistoryAssignee

```ts
export interface MappingHistoryAssignee {
  id: string;
  userId: number;
  name: string;
  email: string;
  jobTitle: string | null;
}
```

#### L104 — interface MappingHistoryRow

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

#### L15 — alias SolicitationMode

```ts
export type SolicitationMode = "PUBLIC" | "AUTHENTICATED";
```

#### L20 — interface PortalAssets

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

#### L45 — alias AssetKey

```ts
export type AssetKey = (typeof ASSET_KEYS)[number];
```

#### L49 — alias PortalAssetsPatch

```ts
export type PortalAssetsPatch = Partial<Record<AssetKey, string>> & {
  logoUsePrimaryColor?: boolean;
};
```

#### L74 — alias ThemeTokenKey

```ts
export type ThemeTokenKey = (typeof THEME_TOKEN_KEYS)[number];
```

#### L78 — interface StatusToneTokens

```ts
export interface StatusToneTokens {
  color: string;
  background: string;
  backgroundLocked: boolean;
}
```

#### L85 — interface ThemeGradient

```ts
export interface ThemeGradient {
  from: string; // hex #RRGGBB / #RRGGBBAA
  to: string; // hex #RRGGBB / #RRGGBBAA
  angle?: number; // graus 0..360 (default 143 quando ausente)
}
```

#### L94 — interface ThemeTokens

```ts
export interface ThemeTokens extends Record<ThemeTokenKey, string> {
  gradient: ThemeGradient;
  statuses: Record<StatusTone, StatusToneTokens>;
}
```

#### L100 — interface PortalTheme

```ts
export interface PortalTheme {
  light: ThemeTokens;
  dark: ThemeTokens;
}
```

#### L108 — interface PortalCategory

```ts
export interface PortalCategory {
  id: number;
  name: string;
  description: string;
  isActive: boolean;
}
```

#### L123 — alias StatusMode

```ts
export type StatusMode = (typeof STATUS_MODES)[number];
```

#### L139 — interface PortalStatus

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

#### L166 — alias PrioritizationCriterion

```ts
export type PrioritizationCriterion = (typeof PRIORITIZATION_CRITERIA)[number];
```

#### L171 — alias PrioritizationWeights

```ts
export type PrioritizationWeights = Record<PrioritizationCriterion, number>;
```

#### L174 — interface PortalConfig

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

#### L190 — alias PortalSections

```ts
export type PortalSections = Partial<PortalConfig>;
```

#### L192 — alias AccessSection

```ts
export type AccessSection = Pick<PortalConfig, "solicitationMode">;
```

#### L193 — alias IdentitySection

```ts
export type IdentitySection = Pick<PortalConfig, "platformName" | "protocolMask">;
```

#### L194 — alias ThemeSection

```ts
export type ThemeSection = Pick<PortalConfig, "theme">;
```

#### L195 — alias AssetsSection

```ts
export type AssetsSection = Pick<PortalConfig, "assets">;
```

#### L196 — alias CategoriesSection

```ts
export type CategoriesSection = Pick<PortalConfig, "categories">;
```

#### L197 — alias StatusesSection

```ts
export type StatusesSection = Pick<PortalConfig, "statuses">;
```

#### L198 — alias PrioritizationWeightsSection

```ts
export type PrioritizationWeightsSection = Pick<PortalConfig, "prioritizationWeights">;
```

#### L201 — interface CategoryRow

```ts
export interface CategoryRow {
  category_id: number;
  name: string;
  description: string | null;
  status: "active" | "inactive";
  display_order: number | null;
}
```

#### L210 — interface StatusRow

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

### [src/shared/types/profile.ts](../src/shared/types/profile.ts)

#### L9 — interface ProfileRow

```ts
export interface ProfileRow {
  profile_id: number;
  name: string;
  description: string | null;
  is_active: boolean;
  is_root: boolean;
  is_assignable_triage: boolean;
  is_assignable_mapping: boolean;
  created_at: Date;
  updated_at: Date;
}
```

#### L22 — interface ProfileWithUserCountRow

```ts
export interface ProfileWithUserCountRow extends ProfileRow {
  user_count: number;
}
```

#### L27 — interface ProfilePermissionRow

```ts
export interface ProfilePermissionRow {
  profile_id: number;
  permission_key: string;
  custody: string;
}
```

#### L41 — interface ProfileReference

```ts
export interface ProfileReference {
  id: string;
  name: string;
}
```

#### L51 — interface ProfileSnapshot

```ts
export interface ProfileSnapshot {
  id: string | null;
  name: string;
}
```

#### L68 — interface SessionProfileReference

```ts
export interface SessionProfileReference extends ProfileReference {
  isRoot: boolean;
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

#### L25 — alias QueueSortBy

```ts
export type QueueSortBy = (typeof QUEUE_SORT_BY)[number];
```

#### L29 — alias QueueSortOrder

```ts
export type QueueSortOrder = (typeof QUEUE_SORT_ORDER)[number];
```

#### L32 — interface QueueFilterQuery

```ts
export interface QueueFilterQuery {
  search?: string;
  status?: RequestStatus;
  priority?: QueuePriorityFilter;
  assigneeId?: string | "unassigned";
  unassigned?: boolean;
  /** Data inicial de abertura (`AAAA-MM-DD`), inclusiva em UTC. */
  createdFrom?: string;
  /** Data final de abertura (`AAAA-MM-DD`), inclusiva em UTC. */
  createdTo?: string;
  /** Departamento do solicitante, comparado de forma exata e case-insensitive. */
  department?: string;
}
```

#### L47 — interface QueueSortQuery

```ts
export interface QueueSortQuery {
  sortBy?: QueueSortBy;
  sortOrder?: QueueSortOrder;
}
```

#### L53 — alias QueueExportQuery

```ts
export type QueueExportQuery = QueueFilterQuery & QueueSortQuery;
```

#### L56 — interface QueueQuery

```ts
export interface QueueQuery extends QueueFilterQuery, QueueSortQuery {
  page: number;
  pageSize: number;
}
```

#### L61 — interface QueueAssignee

```ts
export interface QueueAssignee {
  id: string;
  name: string;
}
```

#### L66 — interface QueueItem

```ts
export interface QueueItem extends RequestSummary {
  requesterEmail: string;
  assigneeId: string | null;
}
```

#### L71 — interface QueueResponse

```ts
export interface QueueResponse extends PaginatedResponse<QueueItem> {
  assignees: QueueAssignee[];
  /** Departamentos distintos e globais do solicitante, ordenados. */
  departments: string[];
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

#### L46 — alias RequestCategoryName

```ts
export type RequestCategoryName = string;
```

#### L48 — interface AttachmentMetadata

```ts
export interface AttachmentMetadata {
  fileName: string; // nome original do arquivo — máx. 255
  mimeType: string; // PDF, DOCX, XLSX, PNG ou JPG
  sizeBytes: number; // máximo 10 * 1024 * 1024 (10MB)
}
```

#### L54 — interface RequesterBlock

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

#### L65 — interface DemandBlock

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

#### L78 — interface OperationalBlock

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

#### L96 — interface ComplementaryBlock

```ts
export interface ComplementaryBlock {
  hasProcessDocumentation?: YesNoDetail; // existência de documentação do processo (+ links)
  hasSimilarSolution?: YesNoDetail; // existência de solução semelhante
  dependsOnOtherAreas?: YesNoDetail; // dependência de outras áreas (+ quais)
  handlesRestrictedInfo?: YesNoDetail; // tratamento de informações restritas (LGPD/sigilo)
  additionalNotes?: string; // observações adicionais, máx. 2.000
}
```

#### L104 — alias SchedulePreferences

```ts
export type SchedulePreferences = string[];
```

#### L106 — interface RequesterTable

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

#### L118 — interface AssignmentContextRow

```ts
export interface AssignmentContextRow {
  status_id: number;
  closure_ref: string | null;
  reopen_ref: string | null;
  request_id: string;
  protocol: string;
  title: string;
  professional_id: string | null;
  mapping_professional_id: string | null;
  status: RequestStatus;
  category: string;
  screening_result: string | null;
  /** Conta do Solicitante; `null` nas linhas anônimas e legadas sem vínculo. */
  requester_user_id: number | null;
  /** `details_professional.user_id` do responsável da triagem (issue #124). */
  assignee_user_id: number | null;
  /** `details_professional.user_id` do designado do mapeamento (issue #124). */
  mapping_assignee_user_id: number | null;
}
```

#### L138 — interface AssignmentCandidateRow

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

#### L162 — interface InternalRequestRow

```ts
export interface InternalRequestRow {
  // requests
  request_id: string; // bigint serializado pelo pg
  requester_id: string; // uuid
  professional_id: string | null;
  requester_user_id: number | null;
  protocol: string;
  title: string;
  status_id: number;
  closure_ref: string | null;
  has_triage: boolean;
  reopen_ref: string | null;
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

### [src/shared/types/status.ts](../src/shared/types/status.ts)

#### L20 — alias StatusId

```ts
export type StatusId = (typeof STATUS_IDS)[keyof typeof STATUS_IDS];
```

### [src/shared/types/systemSettings.ts](../src/shared/types/systemSettings.ts)

#### L4 — alias PortalSolicitationMode

```ts
export type PortalSolicitationMode = SolicitationMode;
```

#### L20 — interface SystemSettingsRow

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

#### L1 — interface User

```ts
export interface User {
  id: string;
  email: string;
  name: string;
  password: string;
  /** `String(profiles.profile_id)` — identidade estável do Perfil. */
  profileId: string;
  /** Nome vigente do Perfil — rótulo, nunca autorização. */
  profileName: string;
}
```

#### L12 — alias AuthenticatedUser

```ts
export type AuthenticatedUser = Omit<User, "password">;
```

#### L13 — alias UserRequestDTO

```ts
export type UserRequestDTO = Omit<User, "id">;
```

#### L16 — interface UserRow

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

#### L31 — interface AuthUserRow

```ts
export interface AuthUserRow extends UserRow {
  profile_name: string;
  profile_is_active: boolean;
  /** Marca de Perfil Admin Root — a conta é única e fora das rotas administrativas. */
  profile_is_root: boolean;
}
```

#### L39 — interface UserMetricsResponse

```ts
export interface UserMetricsResponse {
  total: number;
  active: number;
  pending: number;
  admins: number;
}
```

### [src/shared/utils/jwtUtil.ts](../src/shared/utils/jwtUtil.ts)

#### L8 — alias TokenScope

```ts
export type TokenScope = "session" | "change_password";
```

#### L10 — interface TokenPayload

```ts
export interface TokenPayload {
  id: string;
  name: string;
  email: string;
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
- L34 — variável: `num`
- L35 — variável: `unit`

### [src/database/conection.ts](../src/database/conection.ts)

- L10 — variável: `db`

### [src/docs/components/parameters.ts](../src/docs/components/parameters.ts)

- L3 — variável: `protocolParam`
- L11 — variável: `searchParam`
- L24 — variável: `createdFromParam`
- L34 — variável: `createdToParam`
- L43 — variável: `departmentParam`
- L52 — variável: `sortByParam`
- L65 — variável: `sortOrderParam`

### [src/docs/components/responses.ts](../src/docs/components/responses.ts)

- L1 — retorno da função: `<anônima>()`
- L1 — variável: `json`
- L5 — parâmetro: `schema`
- L5 — retorno da função: `<anônima>()`
- L5 — variável: `error`

### [src/docs/components/security.ts](../src/docs/components/security.ts)

- L1 — variável: `securitySchemes`

### [src/docs/openapi.ts](../src/docs/openapi.ts)

- L1 — variável: `openapiBase`

### [src/docs/paths/index.ts](../src/docs/paths/index.ts)

- L14 — variável: `paths`

### [src/docs/paths/pendingItems.ts](../src/docs/paths/pendingItems.ts)

- L4 — variável: `dualAuth`
- L6 — variável: `pendingItemParam`

### [src/docs/paths/profiles.ts](../src/docs/paths/profiles.ts)

- L1 — retorno da função: `<anônima>()`
- L1 — variável: `errorResponse`
- L10 — retorno da função: `<anônima>()`
- L10 — variável: `validationErrorResponse`
- L20 — retorno da função: `<anônima>()`
- L20 — variável: `formatErrorCodes`
- L21 — parâmetro: `code`
- L21 — retorno da função: `<anônima>()`
- L24 — variável: `COMPOSITION_ERROR_CODES`
- L36 — variável: `CREATE_ERROR_CODES`
- L38 — variável: `UPDATE_ERROR_CODES`
- L50 — variável: `CONFLICT_ERROR_CODES`
- L52 — variável: `STATUS_ERROR_CODES`

### [src/docs/paths/users.ts](../src/docs/paths/users.ts)

- L3 — variável: `idParam`

### [src/docs/schemas/auditHistory.ts](../src/docs/schemas/auditHistory.ts)

- L5 — variável: `AuditActor`
- L21 — variável: `AuditHistorySummary`
- L34 — variável: `AuditHistoryDetail`
- L84 — variável: `AuditHistoryListResponse`

### [src/docs/schemas/auth.ts](../src/docs/schemas/auth.ts)

- L8 — variável: `SessionProfileReference`
- L22 — variável: `AuthenticatedUser`
- L35 — variável: `LoginRequest`
- L44 — variável: `LoginResponse`
- L57 — variável: `LogoutResponse`
- L65 — variável: `ChangePasswordRequest`
- L75 — variável: `ChangePasswordResponse`

### [src/docs/schemas/common.ts](../src/docs/schemas/common.ts)

- L1 — variável: `ErrorResponse`
- L22 — variável: `ValidationErrorResponse`

### [src/docs/schemas/index.ts](../src/docs/schemas/index.ts)

- L191 — variável: `schemas`

### [src/docs/schemas/internalNotes.ts](../src/docs/schemas/internalNotes.ts)

- L8 — variável: `TimelineActor`
- L24 — variável: `TimelineNote`
- L36 — variável: `TimelineEvent`
- L73 — variável: `InternalNotesResponse`
- L93 — variável: `CreateInternalNoteRequest`
- L101 — variável: `MarkInternalNotesReadRequest`

### [src/docs/schemas/notifications.ts](../src/docs/schemas/notifications.ts)

- L3 — variável: `NotificationStatusChangedPayload`
- L17 — variável: `NotificationPendingItemRespondedPayload`
- L33 — variável: `NotificationPendingItemRespondedUnassignedPayload`
- L54 — variável: `NotificationResponsibleAssignedPayload`
- L72 — variável: `NotificationMappingScheduledPayload`
- L89 — variável: `NotificationPendingItemLifecyclePayload`
- L106 — variável: `NotificationPayload`
- L120 — variável: `NotificationItem`
- L145 — variável: `NotificationListResponse`
- L162 — variável: `NotificationUnreadCountResponse`
- L170 — variável: `NotificationMarkReadResponse`
- L183 — variável: `NotificationMarkAllReadResponse`

### [src/docs/schemas/pendingItems.ts](../src/docs/schemas/pendingItems.ts)

- L1 — variável: `PendingFieldRef`
- L19 — variável: `PendingAttachment`
- L31 — variável: `PendingItem`
- L90 — variável: `ListPendingItemsResponse`
- L103 — variável: `CreatePendingItemsBody`
- L133 — variável: `CreatePendingItemsResponse`
- L143 — variável: `ReviewPendingItemsBody`
- L169 — variável: `ReviewDecisionValidate`
- L179 — variável: `ReviewDecisionReopen`
- L189 — variável: `ReviewPendingItemsResponse`
- L198 — variável: `RespondPendingItemBody`
- L221 — variável: `PublicVerifyBody`
- L235 — variável: `PublicVerifyResponse`

### [src/docs/schemas/portal.ts](../src/docs/schemas/portal.ts)

- L7 — variável: `StatusMode`
- L17 — variável: `StatusToneTokens`
- L35 — variável: `ThemeGradient`
- L49 — variável: `ThemeTokens`
- L136 — variável: `PortalTheme`
- L149 — variável: `PortalAssets`
- L179 — variável: `PortalCategory`
- L194 — variável: `PortalStatus`
- L230 — variável: `PrioritizationWeights`
- L262 — variável: `PortalConfig`
- L296 — variável: `PortalSections`
- L324 — variável: `PortalAccessPatchBody`
- L337 — variável: `PortalIdentityPatchBody`
- L351 — variável: `PortalThemePatchBody`
- L360 — variável: `PortalCategoriesPatchBody`
- L374 — variável: `PortalStatusesPatchBody`
- L388 — variável: `PortalPrioritizationWeightsPatchBody`

### [src/docs/schemas/prioritization.ts](../src/docs/schemas/prioritization.ts)

- L1 — variável: `PrioritizationCriterion`
- L11 — variável: `PrioritizationCriteriaList`
- L22 — variável: `EvaluatePrioritizationRequest`
- L39 — variável: `EvaluatePrioritizationResponse`

### [src/docs/schemas/profile.ts](../src/docs/schemas/profile.ts)

- L1 — variável: `profilePermission`
- L10 — variável: `ProfilePermission`
- L20 — variável: `ProfileReference`
- L41 — variável: `ProfileSnapshot`
- L59 — variável: `Profile`
- L99 — variável: `ProfilePermissionCatalogEntry`
- L119 — variável: `ProfileKeyCatalog`
- L147 — variável: `ProfileCreateRequest`
- L176 — variável: `ProfileUpdateRequest`
- L193 — variável: `ProfileStatusRequest`
- L201 — variável: `ProfileStatusResponse`
- L210 — variável: `ProfileDuplicateRequest`

### [src/docs/schemas/queue.ts](../src/docs/schemas/queue.ts)

- L1 — variável: `QueueMetrics`
- L12 — variável: `QueueAssignee`
- L21 — variável: `QueueItem`
- L57 — variável: `QueueResponse`
- L81 — variável: `MappingParticipant`
- L95 — variável: `MappingParticipantInput`
- L109 — variável: `MappingAssignee`
- L125 — variável: `MappingResponse`
- L171 — variável: `MappingHistoryResponse`
- L192 — variável: `MappingPayload`

### [src/docs/schemas/reports.ts](../src/docs/schemas/reports.ts)

- L1 — variável: `DashboardSituation`
- L6 — variável: `DashboardSummary`
- L26 — variável: `DashboardStatusMetric`
- L41 — variável: `DashboardPriorityMetric`
- L54 — variável: `DashboardCategoryMetric`
- L64 — variável: `DashboardTrendPoint`
- L73 — variável: `DashboardResponse`

### [src/docs/schemas/request.ts](../src/docs/schemas/request.ts)

- L1 — variável: `dateTime`
- L2 — variável: `nullableDateTime`
- L3 — variável: `nullableString`
- L6 — variável: `RequestStatus`
- L13 — variável: `RequestPriority`
- L19 — variável: `RequestCategory`
- L31 — variável: `YesNoDetail`
- L37 — variável: `RequesterBlock`
- L60 — variável: `DemandBlock`
- L84 — variável: `OperationalBlock`
- L124 — variável: `ComplementaryBlock`
- L135 — variável: `CreateRequestPayload`
- L152 — variável: `CreateRequestResponse`
- L162 — variável: `RequestSummary`
- L189 — variável: `PaginatedRequestSummary`
- L201 — variável: `PublicMeeting`
- L210 — variável: `PublicRequestDetail`
- L261 — variável: `Assignee`
- L275 — variável: `PrioritizationBlock`
- L293 — variável: `PendingSummary`
- L304 — variável: `UnreadState`
- L314 — variável: `CorrectionAlert`
- L323 — variável: `InternalAttachment`
- L335 — variável: `InternalRequestDetail`
- L408 — variável: `UpdateRequesterBlock`
- L419 — variável: `UpdateInternalRequestPayload`
- L432 — variável: `PublicOperationalImpacts`
- L453 — variável: `RequesterOperational`
- L486 — variável: `RequesterAttachment`
- L499 — variável: `PublicRequestDetails`
- L529 — variável: `ReopenRequestPayload`
- L549 — variável: `ReopenRequestResponse`
- L559 — variável: `CancelRequestPayload`
- L581 — variável: `CancelRequestResponse`
- L587 — variável: `RequesterRequestDetails`
- L672 — variável: `PublicTrackingResponse`
- L681 — variável: `AuthenticatedTrackingResponse`
- L690 — variável: `TrackingResponse`
- L698 — variável: `AssigneeSummary`
- L710 — variável: `AssignRequestPayload`
- L724 — variável: `AssignRequestResponse`
- L743 — variável: `AssignAnalystPayload`
- L766 — variável: `UpdateStatusPayload`
- L794 — variável: `UpdateStatusResponse`

### [src/docs/schemas/requestsInternal.ts](../src/docs/schemas/requestsInternal.ts)

- L1 — variável: `AssigneeSummary`
- L13 — variável: `RequestMutationAcknowledgement`
- L22 — variável: `RequestInternalDetail`
- L219 — variável: `AssignRequestResponse`
- L238 — variável: `RequestStatusChangeResponse`
- L250 — variável: `InternalRequestUpdate`

### [src/docs/schemas/triage.ts](../src/docs/schemas/triage.ts)

- L1 — variável: `TriageAssignee`
- L11 — variável: `TriagemResponse`
- L64 — variável: `CreateTriagePayload`

### [src/docs/schemas/user.ts](../src/docs/schemas/user.ts)

- L2 — variável: `UserMetrics`
- L29 — variável: `UserSummary`
- L53 — variável: `UserListResponse`
- L65 — variável: `RequesterProfileBlock`
- L76 — variável: `ProfessionalProfileBlock`
- L87 — variável: `UserProfileResponse`
- L109 — variável: `AssignableProfessional`
- L127 — variável: `RequesterInput`
- L138 — variável: `ProfessionalInput`
- L157 — variável: `CreateUserRequest`
- L176 — variável: `CreateUserResponse`
- L203 — variável: `UpdateUserRequest`
- L228 — variável: `UpdateProfilePayload`
- L249 — variável: `ChangeUserStatusRequest`
- L257 — variável: `ChangeUserStatusResponse`
- L266 — variável: `ResetPasswordResponse`

### [src/docs/swagger.ts](../src/docs/swagger.ts)

- L30 — variável: `openapiSpec`
- L39 — variável: `swaggerOptions`
- L48 — retorno da função: `<anônima>()`
- L61 — parâmetro: `_req`
- L61 — parâmetro: `res`
- L61 — retorno da função: `<anônima>()`

### [src/modules/auditHistory/auditHistory.controller.ts](../src/modules/auditHistory/auditHistory.controller.ts)

- L13 — variável: `parsed`
- L28 — variável: `id`
- L34 — variável: `detail`
- L42 — variável: `protocol`
- L47 — variável: `logs`

### [src/modules/auditHistory/auditHistory.repository.ts](../src/modules/auditHistory/auditHistory.repository.ts)

- L46 — retorno da função: `responsibleProtocols()`
- L54 — retorno da função: `responsibleMappingIds()`
- L63 — retorno da função: `responsiblePendingItemIds()`
- L80 — variável: `userId`
- L82 — parâmetro: `where`
- L82 — retorno da função: `<anônima>()`
- L84 — parâmetro: `requestScope`
- L84 — retorno da função: `<anônima>()`
- L89 — parâmetro: `mappingScope`
- L89 — retorno da função: `<anônima>()`
- L94 — parâmetro: `pendingScope`
- L94 — retorno da função: `<anônima>()`
- L95 — parâmetro: `pendingTarget`
- L95 — retorno da função: `<anônima>()`
- L108 — variável: `query`
- L127 — variável: `countQuery`
- L133 — variável: `totalRow`
- L134 — variável: `total`
- L136 — variável: `page`
- L137 — variável: `limit`
- L138 — variável: `offset`
- L139 — variável: `items`
- L186 — variável: `row`
- L194 — variável: `byProtocol`
- L199 — variável: `byItem`
- L244 — parâmetro: `rows`
- L244 — retorno da função: `<anônima>()`

### [src/modules/auditHistory/auditHistory.router.ts](../src/modules/auditHistory/auditHistory.router.ts)

- L10 — variável: `noStore`
- L19 — variável: `auditHistoryRoutes`
- L46 — variável: `auditLogsRouter`

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

- L29 — variável: `custody`
- L45 — variável: `{ items, total }`
- L47 — parâmetro: `row`
- L47 — retorno da função: `<anônima>()`
- L71 — variável: `previousMeetingSchema`
- L79 — variável: `occurredAt`
- L81 — variável: `userId`
- L82 — variável: `previousMeeting`
- L118 — variável: `row`
- L129 — variável: `scope`
- L131 — variável: `protocol`
- L132 — variável: `request`
- L133 — variável: `isVisible`
- L165 — variável: `normalized`
- L167 — variável: `request`
- L180 — variável: `rows`
- L181 — parâmetro: `row`
- L181 — retorno da função: `<anônima>()`

### [src/modules/auth/auth.controller.ts](../src/modules/auth/auth.controller.ts)

- L12 — variável: `COOKIE_OPTIONS`
- L26 — retorno da função: `<anônima>()`
- L26 — variável: `logout`
- L31 — retorno da função: `<anônima>()`
- L31 — variável: `authenticate`
- L32 — variável: `parsed`
- L38 — variável: `foundUser`
- L41 — variável: `changeToken`
- L63 — variável: `sessionToken`
- L85 — retorno da função: `<anônima>()`
- L85 — variável: `me`
- L86 — variável: `userId`
- L87 — variável: `sessionUser`
- L102 — retorno da função: `<anônima>()`
- L102 — variável: `changePassword`
- L103 — variável: `parsed`
- L109 — variável: `userId`
- L110 — variável: `updated`
- L112 — variável: `sessionToken`

### [src/modules/auth/auth.repository.ts](../src/modules/auth/auth.repository.ts)

- L6 — retorno da função: `authUserQuery()`
- L102 — variável: `updated`
- L112 — variável: `passwordChangedAt`

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

- L32 — variável: `DUMMY_PASSWORD_HASH`
- L35 — variável: `email`
- L37 — variável: `user`
- L53 — variável: `isPasswordValid`
- L73 — variável: `user`
- L79 — variável: `grants`
- L98 — variável: `user`
- L108 — variável: `isCurrentPasswordValid`
- L114 — variável: `isSamePassword`
- L120 — variável: `newPasswordHash`
- L124 — parâmetro: `trx`
- L124 — retorno da função: `<anônima>()`
- L124 — variável: `{ password_changed_at }`
- L125 — variável: `result`

### [src/modules/DTOs/users/UpdateProfileRequest.dto.ts](../src/modules/DTOs/users/UpdateProfileRequest.dto.ts)

- L15 — variável: `updateRequesterSelfSchema`
- L29 — variável: `updateRequesterSchema`
- L47 — variável: `updateProfileSchema`

### [src/modules/internalNotes/internalNotes.controller.ts](../src/modules/internalNotes/internalNotes.controller.ts)

- L15 — variável: `parsed`
- L23 — variável: `actor`
- L24 — variável: `profileId`
- L25 — variável: `profileName`
- L34 — variável: `listInternalNotes`
- L35 — variável: `parsed`
- L40 — variável: `response`
- L49 — variável: `createInternalNote`
- L50 — variável: `parsed`
- L55 — variável: `response`
- L64 — variável: `markInternalNotesRead`
- L65 — variável: `parsed`

### [src/modules/internalNotes/internalNotes.repository.ts](../src/modules/internalNotes/internalNotes.repository.ts)

- L33 — variável: `MAPPING_RECORD_ACTIONS`
- L35 — variável: `NOTE_COLUMNS`
- L79 — variável: `query`
- L85 — parâmetro: `builder`
- L85 — retorno da função: `<anônima>()`
- L86 — parâmetro: `nested`
- L86 — retorno da função: `<anônima>()`
- L110 — variável: `query`
- L112 — parâmetro: `scope`
- L112 — retorno da função: `<anônima>()`
- L114 — parâmetro: `requestScope`
- L114 — retorno da função: `<anônima>()`
- L120 — parâmetro: `mappingScope`
- L120 — retorno da função: `<anônima>()`
- L133 — variável: `auditId`
- L134 — parâmetro: `builder`
- L134 — retorno da função: `<anônima>()`
- L135 — parâmetro: `nested`
- L135 — retorno da função: `<anônima>()`
- L169 — variável: `query`
- L177 — variável: `row`
- L184 — variável: `TRIAGE_HISTORY_COLUMNS`
- L231 — variável: `latestAudit`
- L240 — variável: `rows`
- L242 — retorno da função: `<anônima>()`
- L268 — parâmetro: `row`
- L268 — retorno da função: `<anônima>()`
- L268 — variável: `mappingIds`
- L269 — variável: `professionalIds`
- L270 — parâmetro: `id`
- L270 — parâmetro: `row`
- L270 — retorno da função: `<anônima>()`
- L273 — variável: `[participantRows, assigneeRows]`
- L300 — variável: `participantsByMapping`
- L301 — variável: `participant`
- L302 — variável: `list`
- L311 — parâmetro: `assignee`
- L311 — retorno da função: `<anônima>()`
- L311 — variável: `assigneeById`
- L313 — parâmetro: `row`
- L313 — retorno da função: `<anônima>()`
- L330 — parâmetro: `row`
- L330 — retorno da função: `<anônima>()`
- L338 — variável: `rows`
- L342 — parâmetro: `row`
- L342 — retorno da função: `<anônima>()`
- L359 — parâmetro: `row`
- L359 — retorno da função: `<anônima>()`
- L376 — variável: `rows`
- L386 — variável: `row`

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

- L32 — variável: `EVENT_ID_PREFIX`
- L33 — variável: `NOTE_RANK`
- L34 — variável: `EVENT_RANK`
- L64 — variável: `request`
- L88 — variável: `payload`
- L126 — variável: `entries`
- L127 — variável: `page`
- L128 — variável: `oldest`
- L129 — variável: `nextCursor`
- L131 — parâmetro: `entry`
- L131 — retorno da função: `<anônima>()`
- L136 — variável: `parsed`
- L176 — variável: `numericId`
- L177 — variável: `statusName`
- L181 — variável: `userId`
- L182 — variável: `name`
- L186 — variável: `userId`
- L187 — variável: `name`
- L194 — variável: `name`
- L226 — variável: `date`
- L270 — parâmetro: `participant`
- L270 — retorno da função: `<anônima>()`
- L294 — variável: `userIds`
- L295 — variável: `professionalIds`
- L296 — variável: `statusIds`
- L298 — variável: `row`
- L300 — variável: `userId`
- L305 — variável: `statusId`
- L314 — variável: `[userNames, professionalNames, statusNames]`
- L320 — parâmetro: `row`
- L320 — retorno da função: `<anônima>()`
- L343 — variável: `requestId`
- L344 — variável: `cursor`
- L345 — variável: `pageLimit`
- L347 — variável: `readState`
- L349 — variável: `[noteRows, eventRows, unseenCount, triageRows, mappingRows]`
- L357 — variável: `events`
- L358 — variável: `notes`
- L359 — variável: `{ items, nextCursor }`
- L376 — variável: `requestId`
- L377 — variável: `internalNoteId`
- L382 — variável: `note`
- L396 — variável: `requestId`
- L397 — variável: `note`

### [src/modules/notifications/notifications.controller.ts](../src/modules/notifications/notifications.controller.ts)

- L16 — variável: `HEARTBEAT_INTERVAL_MS`
- L17 — variável: `SSE_RETRY_MS`
- L24 — variável: `userId`
- L34 — variável: `parsed`
- L40 — variável: `result`
- L45 — variável: `result`
- L50 — variável: `parsed`
- L56 — variável: `result`
- L61 — variável: `result`
- L66 — variável: `header`
- L67 — variável: `raw`
- L83 — variável: `userId`
- L95 — variável: `sentIds`
- L97 — variável: `writeNotification`
- L104 — variável: `deliver`
- L105 — variável: `items`
- L106 — variável: `item`
- L111 — variável: `isReplaying`
- L112 — variável: `isClosed`
- L115 — parâmetro: `payload`
- L115 — retorno da função: `<anônima>()`
- L115 — variável: `unsubscribe`
- L123 — retorno da função: `<anônima>()`
- L129 — retorno da função: `<anônima>()`
- L129 — variável: `heartbeat`
- L151 — variável: `lastEventId`
- L154 — variável: `missed`
- L155 — variável: `item`
- L162 — variável: `payload`
- L165 — variável: `error`

### [src/modules/notifications/notifications.repository.ts](../src/modules/notifications/notifications.repository.ts)

- L16 — variável: `NOTIFICATION_COLUMNS`
- L34 — variável: `row`
- L50 — variável: `query`
- L63 — variável: `anchorCreatedAt`
- L106 — variável: `anchorCreatedAt`
- L125 — variável: `row`
- L143 — variável: `updated`
- L152 — variável: `row`
- L156 — variável: `existing`
- L167 — variável: `updated`

### [src/modules/notifications/notifications.router.ts](../src/modules/notifications/notifications.router.ts)

- L11 — variável: `notificationsRoutes`

### [src/modules/notifications/notifications.schema.ts](../src/modules/notifications/notifications.schema.ts)

- L3 — variável: `notificationIdSchema`
- L5 — variável: `CURSOR_SEPARATOR`
- L7 — variável: `notificationCursorPayloadSchema`
- L14 — variável: `listNotificationsQuerySchema`
- L26 — parâmetro: `ctx`
- L26 — parâmetro: `raw`
- L34 — variável: `text`
- L35 — variável: `separatorIndex`
- L50 — variável: `payload`
- L61 — variável: `notificationIdParamSchema`

### [src/modules/notifications/notifications.service.ts](../src/modules/notifications/notifications.service.ts)

- L15 — variável: `CURSOR_SEPARATOR`
- L18 — variável: `payload`
- L19 — variável: `createdAt`
- L53 — variável: `rows`
- L59 — variável: `hasNextPage`
- L60 — variável: `pageRows`
- L61 — variável: `items`
- L62 — variável: `lastItem`
- L80 — variável: `row`
- L86 — variável: `readAt`
- L104 — variável: `rows`
- L112 — variável: `rows`

### [src/modules/pendingItems/pendingItems.controller.ts](../src/modules/pendingItems/pendingItems.controller.ts)

- L9 — variável: `{ checkRateLimit }`
- L28 — variável: `p`
- L35 — variável: `protocol`
- L36 — variável: `parsed`
- L38 — variável: `result`
- L48 — variável: `protocol`
- L49 — variável: `result`
- L54 — variável: `protocol`
- L55 — variável: `pendingItemId`
- L58 — variável: `item`
- L69 — variável: `protocol`
- L70 — variável: `pendingItemId`
- L73 — variável: `file`
- L75 — variável: `result`
- L86 — variável: `protocol`
- L87 — variável: `parsed`
- L89 — variável: `result`
- L99 — variável: `protocol`
- L100 — variável: `body`
- L105 — variável: `key`
- L109 — variável: `parsed`

### [src/modules/pendingItems/pendingItems.repository.ts](../src/modules/pendingItems/pendingItems.repository.ts)

- L26 — variável: `pendingFieldValueSchema`
- L29 — variável: `dbBigIntStringSchema`
- L31 — parâmetro: `value`
- L31 — retorno da função: `<anônima>()`
- L33 — variável: `dbTimestampSchema`
- L36 — variável: `pendingItemRowSchema`
- L59 — variável: `pendingAttachmentRowSchema`
- L65 — parâmetro: `value`
- L65 — retorno da função: `<anônima>()`
- L71 — variável: `parsed`
- L94 — variável: `conn`
- L95 — variável: `row`
- L128 — variável: `conn`
- L129 — variável: `row`
- L158 — retorno da função: `currentPendingRows()`
- L165 — parâmetro: `query`
- L165 — retorno da função: `<anônima>()`
- L173 — retorno da função: `lockActiveRequest()`
- L174 — variável: `request`
- L176 — variável: `status`
- L192 — variável: `custodian`
- L222 — variável: `row`
- L235 — variável: `conn`
- L236 — variável: `row`
- L246 — variável: `conn`
- L247 — variável: `rows`
- L257 — variável: `conn`
- L258 — variável: `row`
- L269 — variável: `grouped`
- L272 — variável: `conn`
- L273 — variável: `rows`
- L278 — variável: `row`
- L279 — variável: `attachment`
- L280 — variável: `list`
- L292 — variável: `conn`
- L293 — variável: `row`
- L306 — variável: `conn`
- L307 — variável: `rows`
- L312 — parâmetro: `r`
- L312 — retorno da função: `<anônima>()`
- L312 — variável: `map`
- L313 — variável: `requested`
- L314 — variável: `responded`
- L315 — variável: `validated`
- L328 — variável: `conn`
- L330 — variável: `rows`
- L339 — variável: `byBatch`
- L340 — variável: `row`
- L341 — variável: `entry`
- L342 — variável: `count`
- L349 — variável: `candidates`
- L350 — parâmetro: `[, s]`
- L350 — retorno da função: `<anônima>()`
- L354 — variável: `requiresAttachment`
- L358 — parâmetro: `[batchId]`
- L358 — retorno da função: `<anônima>()`
- L362 — parâmetro: `r`
- L362 — retorno da função: `<anônima>()`
- L362 — variável: `requiresSet`
- L364 — variável: `attachmentCounts`
- L366 — variável: `counts`
- L376 — variável: `c`
- L379 — variável: `[batchId, summary]`
- L390 — variável: `conn`
- L391 — variável: `row`
- L397 — variável: `count`
- L399 — variável: `lastUnreadAt`
- L404 — variável: `row`
- L497 — variável: `conn`
- L498 — variável: `rows`
- L518 — variável: `current`
- L531 — parâmetro: `row`
- L531 — retorno da função: `<anônima>()`
- L531 — variável: `toInsert`
- L547 — variável: `pendingStatusId`
- L582 — variável: `rows`
- L619 — variável: `current`
- L620 — variável: `row`
- L621 — variável: `currentItem`
- L634 — variável: `auditId`
- L645 — variável: `requestedCount`
- L649 — variável: `requestedRemaining`
- L651 — variável: `requiresAttachment`
- L654 — variável: `attachmentSatisfied`
- L658 — variável: `nextStatusName`
- L665 — variável: `statusId`
- L679 — variável: `updated`
- L692 — parâmetro: `trx`
- L692 — retorno da função: `<anônima>()`
- L735 — variável: `current`
- L737 — variável: `currentBatch`
- L742 — parâmetro: `{ id }`
- L742 — retorno da função: `<anônima>()`
- L745 — variável: `currentStatuses`
- L746 — parâmetro: `{ pending_item_id, status }`
- L746 — retorno da função: `<anônima>()`
- L748 — parâmetro: `{ id }`
- L748 — retorno da função: `<anônima>()`
- L754 — variável: `hasReopen`
- L756 — variável: `actionAuditIds`
- L757 — variável: `rememberFirstAudit`
- L761 — variável: `dec`
- L762 — variável: `currentStatus`
- L774 — variável: `validateAuditId`
- L800 — variável: `reopenAuditId`
- L815 — variável: `nextStatusName`
- L817 — variável: `statusId`
- L829 — variável: `rows`
- L832 — parâmetro: `d`
- L832 — retorno da função: `<anônima>()`
- L855 — variável: `col`
- L857 — variável: `v`
- L861 — variável: `requesterRow`
- L883 — variável: `col`
- L886 — variável: `category`
- L929 — variável: `col`
- L956 — variável: `entry`

### [src/modules/pendingItems/pendingItems.router.ts](../src/modules/pendingItems/pendingItems.router.ts)

- L20 — variável: `router`
- L22 — variável: `upload`
- L25 — parâmetro: `_req`
- L25 — parâmetro: `cb`
- L25 — parâmetro: `file`
- L25 — retorno da função: `<anônima>()`
- L36 — variável: `uploadSingle`
- L62 — parâmetro: `next`
- L62 — parâmetro: `req`
- L62 — parâmetro: `res`
- L62 — retorno da função: `<anônima>()`
- L63 — parâmetro: `err`
- L63 — retorno da função: `<anônima>()`
- L78 — variável: `publicVerifyRouter`

### [src/modules/pendingItems/pendingItems.schema.ts](../src/modules/pendingItems/pendingItems.schema.ts)

- L7 — variável: `createPendingItemsSchema`
- L21 — parâmetro: `ctx`
- L21 — parâmetro: `data`
- L21 — retorno da função: `<anônima>()`
- L22 — variável: `hasObservation`
- L24 — variável: `hasItems`
- L34 — variável: `verifySchema`
- L45 — variável: `pendingItemResponseBodySchema`
- L54 — variável: `reviewSchema`

### [src/modules/pendingItems/pendingItems.service.ts](../src/modules/pendingItems/pendingItems.service.ts)

- L43 — variável: `TERMINAL_STATUSES`
- L55 — variável: `request`
- L74 — variável: `{ result, notifications }`
- L100 — parâmetro: `userId`
- L100 — retorno da função: `<anônima>()`
- L108 — variável: `assigneeUserId`
- L126 — parâmetro: `row`
- L126 — retorno da função: `<anônima>()`
- L126 — variável: `bases`
- L127 — variável: `base`
- L131 — parâmetro: `b`
- L131 — retorno da função: `<anônima>()`
- L131 — variável: `attachmentsByItem`
- L134 — variável: `base`
- L135 — variável: `atts`
- L136 — parâmetro: `a`
- L136 — retorno da função: `<anônima>()`
- L136 — variável: `attachments`
- L144 — variável: `currentValue`
- L147 — variável: `parsed`
- L156 — variável: `corrected`
- L159 — variável: `parsed`
- L179 — variável: `request`
- L195 — variável: `observation`
- L196 — variável: `items`
- L197 — variável: `hasObservation`
- L198 — variável: `hasItems`
- L208 — variável: `raw`
- L214 — variável: `item`
- L215 — variável: `fieldKey`
- L237 — variável: `batchId`
- L238 — variável: `requestAttachment`
- L255 — variável: `item`
- L256 — variável: `fieldKey`
- L257 — variável: `snapshot`
- L274 — parâmetro: `trx`
- L274 — retorno da função: `<anônima>()`
- L274 — variável: `createdRows`
- L275 — variável: `{ rows: insertedRows, auditId }`
- L286 — variável: `notifications`
- L295 — variável: `mapped`
- L305 — variável: `TRACKING_INVALID_IDENTITY`
- L322 — variável: `nameOk`
- L323 — variável: `emailOk`
- L340 — variável: `request`
- L343 — variável: `actor`
- L348 — variável: `canReadAssigned`
- L353 — variável: `canRespondOwn`
- L382 — variável: `request`
- L385 — variável: `actor`
- L407 — variável: `request`
- L408 — variável: `rows`
- L409 — variável: `items`
- L418 — variável: `openRow`
- L419 — parâmetro: `row`
- L419 — retorno da função: `<anônima>()`
- L421 — variável: `targetRow`
- L422 — variável: `batchId`
- L423 — variável: `requestAttachment`
- L425 — parâmetro: `row`
- L425 — retorno da função: `<anônima>()`
- L437 — variável: `{ request, actorEmail }`
- L443 — variável: `row`
- L451 — variável: `type`
- L469 — variável: `response`
- L482 — parâmetro: `trx`
- L482 — retorno da função: `<anônima>()`
- L482 — variável: `updated`
- L483 — variável: `result`
- L492 — parâmetro: `facts`
- L492 — retorno da função: `<anônima>()`
- L500 — variável: `actorUserId`
- L501 — variável: `audience`
- L507 — variável: `committedNotifications`
- L521 — variável: `list`
- L538 — variável: `{ request }`
- L544 — variável: `row`
- L560 — variável: `[saved]`
- L570 — variável: `err`
- L610 — variável: `date`
- L632 — variável: `nullableComplement`
- L662 — variável: `request`
- L672 — variável: `batchId`
- L673 — variável: `batchRows`
- L676 — parâmetro: `row`
- L676 — retorno da função: `<anônima>()`
- L676 — variável: `byId`
- L678 — variável: `decision`
- L679 — variável: `row`
- L681 — variável: `status`
- L693 — parâmetro: `decision`
- L693 — retorno da função: `<anônima>()`
- L697 — variável: `row`
- L698 — variável: `fieldKey`
- L707 — parâmetro: `trx`
- L707 — retorno da função: `<anônima>()`
- L707 — variável: `decidedRows`
- L708 — variável: `{ rows: reviewedRows, actionAuditIds }`
- L718 — parâmetro: `facts`
- L718 — retorno da função: `<anônima>()`
- L722 — variável: `notifications`
- L725 — parâmetro: `[action, auditId]`
- L725 — retorno da função: `<anônima>()`
- L731 — variável: `mapped`
- L741 — variável: `mode`
- L746 — variável: `found`
- L748 — variável: `nameOk`
- L749 — variável: `emailOk`

### [src/modules/portalConfig/portalConfig.controller.ts](../src/modules/portalConfig/portalConfig.controller.ts)

- L27 — variável: `id`
- L38 — variável: `getSections`
- L43 — variável: `response`
- L64 — variável: `getConfig`
- L65 — variável: `response`
- L73 — variável: `updateAccess`
- L74 — variável: `parsed`
- L79 — variável: `response`
- L87 — variável: `updateIdentity`
- L88 — variável: `parsed`
- L93 — variável: `response`
- L101 — variável: `updateTheme`
- L102 — variável: `parsed`
- L107 — variável: `response`
- L115 — variável: `updateAssets`
- L120 — variável: `rawAssets`
- L121 — variável: `filesMap`
- L122 — parâmetro: `list`
- L122 — retorno da função: `<anônima>()`
- L122 — variável: `hasBinary`
- L135 — variável: `validated`
- L143 — variável: `files`
- L151 — variável: `[fieldName, fileArray]`
- L153 — variável: `file`
- L159 — variável: `targetDir`
- L161 — variável: `saved`
- L162 — parâmetro: `[, file]`
- L162 — retorno da função: `<anônima>()`
- L164 — parâmetro: `[fieldName]`
- L164 — retorno da função: `<anônima>()`
- L168 — parâmetro: `attachment`
- L168 — parâmetro: `index`
- L168 — retorno da função: `<anônima>()`
- L169 — variável: `fieldName`
- L179 — variável: `response`
- L181 — variável: `err`
- L194 — variável: `updateCategories`
- L195 — variável: `parsed`
- L200 — variável: `response`
- L208 — variável: `updateStatuses`
- L209 — variável: `parsed`
- L214 — variável: `response`
- L222 — variável: `updatePrioritizationWeights`
- L226 — variável: `parsed`
- L231 — variável: `response`

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

- L21 — variável: `portalConfigRoutes`

### [src/modules/portalConfig/portalConfig.schema.ts](../src/modules/portalConfig/portalConfig.schema.ts)

- L22 — variável: `hexColorSchema`
- L26 — variável: `ThemeGradientSchema`
- L39 — variável: `StatusToneSchema`
- L47 — variável: `statusTonesShape`
- L48 — parâmetro: `tone`
- L48 — retorno da função: `<anônima>()`
- L51 — variável: `tokenShape`
- L52 — parâmetro: `key`
- L52 — retorno da função: `<anônima>()`
- L55 — variável: `ThemePaletteSchema`
- L63 — variável: `updateThemeSchema`
- L74 — variável: `updateAccessSchema`
- L82 — variável: `updateIdentitySchema`
- L99 — parâmetro: `identity`
- L99 — retorno da função: `<anônima>()`
- L106 — variável: `portalCategorySchema`
- L115 — variável: `updateCategoriesSchema`
- L121 — parâmetro: `categories`
- L121 — parâmetro: `ctx`
- L121 — retorno da função: `<anônima>()`
- L122 — variável: `seen`
- L123 — parâmetro: `category`
- L123 — parâmetro: `index`
- L123 — retorno da função: `<anônima>()`
- L124 — variável: `key`
- L134 — parâmetro: `category`
- L134 — retorno da função: `<anônima>()`
- L145 — variável: `StatusModeSchema`
- L149 — variável: `portalStatusSchema`
- L169 — parâmetro: `ctx`
- L169 — parâmetro: `status`
- L169 — retorno da função: `<anônima>()`
- L179 — variável: `updateStatusesSchema`
- L185 — parâmetro: `ctx`
- L185 — parâmetro: `statuses`
- L185 — retorno da função: `<anônima>()`
- L186 — variável: `seenNames`
- L187 — parâmetro: `index`
- L187 — parâmetro: `status`
- L187 — retorno da função: `<anônima>()`
- L188 — variável: `nameKey`
- L216 — parâmetro: `status`
- L216 — retorno da função: `<anônima>()`
- L232 — variável: `prioritizationWeightSchema`
- L238 — variável: `updatePrioritizationWeightsSchema`
- L246 — parâmetro: `ctx`
- L246 — parâmetro: `{ prioritizationWeights }`
- L246 — retorno da função: `<anônima>()`
- L247 — variável: `missing`
- L248 — parâmetro: `criterion`
- L248 — retorno da função: `<anônima>()`
- L265 — variável: `assetUrlSchema`
- L271 — parâmetro: `url`
- L271 — retorno da função: `<anônima>()`
- L275 — variável: `portalAssetsPatchSchema`
- L289 — parâmetro: `assets`
- L289 — retorno da função: `<anônima>()`

### [src/modules/portalConfig/portalConfig.service.ts](../src/modules/portalConfig/portalConfig.service.ts)

- L35 — retorno da função: `assetsFromRow()`
- L77 — parâmetro: `permission`
- L77 — retorno da função: `<anônima>()`
- L77 — variável: `readableKeys`
- L78 — variável: `config`
- L113 — variável: `[settings, themeRow, categories, statuses, criteria]`
- L121 — variável: `theme`
- L129 — parâmetro: `cat`
- L129 — retorno da função: `<anônima>()`
- L137 — parâmetro: `c`
- L137 — retorno da função: `<anônima>()`
- L138 — variável: `key`
- L153 — parâmetro: `trx`
- L153 — retorno da função: `<anônima>()`
- L156 — variável: `settings`
- L157 — variável: `previous`
- L182 — parâmetro: `trx`
- L182 — retorno da função: `<anônima>()`
- L185 — variável: `settings`
- L186 — variável: `previous`
- L193 — variável: `updated`
- L194 — variável: `newValue`
- L220 — parâmetro: `trx`
- L220 — retorno da função: `<anônima>()`
- L224 — variável: `themeRow`
- L225 — variável: `previousTheme`
- L226 — variável: `columns`
- L251 — parâmetro: `trx`
- L251 — retorno da função: `<anônima>()`
- L254 — variável: `settings`
- L255 — variável: `previous`
- L259 — variável: `updated`
- L260 — variável: `newValue`
- L283 — parâmetro: `trx`
- L283 — retorno da função: `<anônima>()`
- L286 — variável: `prevRows`
- L287 — parâmetro: `cat`
- L287 — retorno da função: `<anônima>()`
- L287 — variável: `previous`
- L317 — parâmetro: `trx`
- L317 — retorno da função: `<anônima>()`
- L320 — variável: `prevRows`
- L321 — variável: `previous`
- L322 — parâmetro: `st`
- L322 — retorno da função: `<anônima>()`
- L322 — variável: `prevById`
- L323 — parâmetro: `s`
- L323 — retorno da função: `<anônima>()`
- L323 — variável: `incomingById`
- L325 — variável: `coreId`
- L326 — variável: `existing`
- L335 — variável: `incoming`
- L404 — parâmetro: `trx`
- L404 — retorno da função: `<anônima>()`
- L407 — variável: `prevRows`
- L408 — variável: `previous`
- L409 — parâmetro: `c`
- L409 — retorno da função: `<anônima>()`
- L410 — variável: `key`

### [src/modules/prioritization/prioritization.controller.ts](../src/modules/prioritization/prioritization.controller.ts)

- L10 — variável: `protocolParamsSchema`
- L14 — variável: `listCriteria`
- L15 — variável: `response`
- L20 — variável: `evaluateScore`
- L21 — variável: `parsedParams`
- L26 — variável: `parsed`
- L32 — variável: `response`

### [src/modules/prioritization/prioritization.repository.ts](../src/modules/prioritization/prioritization.repository.ts)

- L39 — variável: `scoreRounded`
- L58 — variável: `row`
- L73 — variável: `data`
- L83 — variável: `rows`
- L89 — variável: `row`

### [src/modules/prioritization/prioritization.router.ts](../src/modules/prioritization/prioritization.router.ts)

- L9 — variável: `prioritizationRoutes`

### [src/modules/prioritization/prioritization.schema.ts](../src/modules/prioritization/prioritization.schema.ts)

- L5 — variável: `noteSchema`
- L12 — variável: `criterionKeySchema`
- L24 — variável: `evaluateScoreSchema`
- L25 — parâmetro: `notes`
- L25 — retorno da função: `<anônima>()`

### [src/modules/prioritization/prioritization.service.ts](../src/modules/prioritization/prioritization.service.ts)

- L22 — variável: `rows`
- L23 — parâmetro: `row`
- L23 — retorno da função: `<anônima>()`
- L43 — variável: `observed`
- L47 — retorno da função: `<anônima>()`
- L47 — variável: `canEvaluate`
- L67 — variável: `criteria`
- L71 — variável: `score`
- L72 — variável: `classification`
- L80 — parâmetro: `trx`
- L80 — retorno da função: `<anônima>()`
- L80 — variável: `evaluation`
- L82 — variável: `current`
- L95 — variável: `previous`
- L104 — variável: `row`
- L151 — parâmetro: `row`
- L151 — retorno da função: `<anônima>()`
- L151 — variável: `validIds`
- L153 — parâmetro: `row`
- L153 — retorno da função: `<anônima>()`
- L153 — variável: `missing`
- L155 — parâmetro: `row`
- L155 — retorno da função: `<anônima>()`
- L155 — variável: `list`
- L159 — parâmetro: `key`
- L159 — retorno da função: `<anônima>()`
- L159 — variável: `unknown`
- L167 — variável: `shown`
- L173 — variável: `somaPonderada`
- L174 — parâmetro: `acc`
- L174 — parâmetro: `row`
- L174 — retorno da função: `<anônima>()`
- L177 — parâmetro: `acc`
- L177 — parâmetro: `row`
- L177 — retorno da função: `<anônima>()`
- L177 — variável: `somaPesos`
- L188 — variável: `range`

### [src/modules/profiles/profiles.composition.ts](../src/modules/profiles/profiles.composition.ts)

- L25 — variável: `ASSIGNABILITY_STAGES`
- L31 — variável: `STAGE_FLAG_FIELD`
- L37 — variável: `STAGE_LABEL`
- L51 — parâmetro: `entry`
- L51 — retorno da função: `<anônima>()`
- L79 — parâmetro: `grant`
- L79 — retorno da função: `<anônima>()`
- L105 — variável: `seen`
- L107 — variável: `grant`
- L108 — variável: `entry`
- L140 — variável: `grant`
- L141 — variável: `entry`
- L143 — variável: `dependency`
- L160 — parâmetro: `permission`
- L160 — retorno da função: `<anônima>()`
- L160 — variável: `keys`
- L162 — variável: `stage`
- L163 — variável: `flagOn`
- L169 — parâmetro: `key`
- L169 — retorno da função: `<anônima>()`
- L169 — variável: `missing`
- L187 — parâmetro: `permission`
- L187 — retorno da função: `<anônima>()`
- L187 — variável: `hasAssigned`
- L217 — parâmetro: `permission`
- L217 — retorno da função: `<anônima>()`
- L217 — variável: `sourceKeys`
- L218 — parâmetro: `permission`
- L218 — retorno da função: `<anônima>()`
- L218 — variável: `targetKeys`
- L221 — variável: `stage`
- L222 — variável: `predicate`
- L223 — parâmetro: `key`
- L223 — retorno da função: `<anônima>()`
- L223 — variável: `hadCompletePredicate`
- L224 — parâmetro: `key`
- L224 — retorno da função: `<anônima>()`
- L224 — variável: `missingKeys`
- L227 — variável: `flagField`
- L249 — variável: `actorCustodyByKey`
- L250 — parâmetro: `permission`
- L250 — retorno da função: `<anônima>()`
- L253 — variável: `grant`
- L254 — variável: `actorCustody`

### [src/modules/profiles/profiles.controller.ts](../src/modules/profiles/profiles.controller.ts)

- L17 — variável: `parsed`
- L32 — variável: `actor`
- L37 — variável: `listProfiles`
- L41 — variável: `getKeyCatalog`
- L45 — variável: `getProfile`
- L49 — variável: `createProfile`
- L50 — variável: `parsed`
- L53 — variável: `{ message, fields }`
- L57 — variável: `created`
- L62 — variável: `updateProfile`
- L63 — variável: `parsed`
- L66 — variável: `{ message, fields }`
- L70 — variável: `updated`
- L80 — variável: `changeProfileStatus`
- L81 — variável: `parsed`
- L84 — variável: `{ message, fields }`
- L88 — variável: `updated`
- L98 — variável: `duplicateProfile`
- L99 — variável: `parsed`
- L102 — variável: `{ message, fields }`
- L106 — variável: `created`

### [src/modules/profiles/profiles.repository.ts](../src/modules/profiles/profiles.repository.ts)

- L17 — variável: `PROFILE_COLUMNS`
- L34 — parâmetro: `row`
- L34 — retorno da função: `<anônima>()`
- L39 — variável: `rows`
- L42 — parâmetro: `column`
- L42 — retorno da função: `<anônima>()`
- L50 — variável: `rows`
- L54 — parâmetro: `column`
- L54 — retorno da função: `<anônima>()`
- L78 — variável: `query`
- L84 — parâmetro: `column`
- L84 — retorno da função: `<anônima>()`
- L89 — variável: `row`
- L107 — variável: `inserted`
- L116 — variável: `row`
- L155 — variável: `updated`
- L175 — parâmetro: `permission`
- L175 — retorno da função: `<anônima>()`
- L223 — variável: `assignedColumn`
- L225 — variável: `rows`
- L234 — parâmetro: `row`
- L234 — retorno da função: `<anônima>()`

### [src/modules/profiles/profiles.router.ts](../src/modules/profiles/profiles.router.ts)

- L14 — variável: `profilesRoutes`

### [src/modules/profiles/profiles.schema.ts](../src/modules/profiles/profiles.schema.ts)

- L6 — variável: `profileNameSchema`
- L9 — variável: `profileDescriptionSchema`
- L12 — variável: `profilePermissionSchema`
- L18 — variável: `profileIdParamSchema`
- L22 — variável: `profilePermissionsSchema`
- L26 — variável: `createProfileSchema`
- L34 — variável: `updateProfileSchema`
- L42 — parâmetro: `ctx`
- L42 — parâmetro: `value`
- L42 — retorno da função: `<anônima>()`
- L43 — variável: `hasField`
- L59 — variável: `changeProfileStatusSchema`
- L63 — variável: `duplicateProfileSchema`

### [src/modules/profiles/profiles.service.ts](../src/modules/profiles/profiles.service.ts)

- L44 — variável: `id`
- L59 — variável: `PROFILE_NAME_CONSTRAINTS`
- L67 — parâmetro: `conflictMessage`
- L71 — variável: `error`
- L72 — variável: `hasNameConflict`
- L117 — variável: `existing`
- L141 — variável: `loss`
- L160 — variável: `loss`
- L165 — variável: `protocols`
- L180 — variável: `rows`
- L181 — parâmetro: `row`
- L181 — retorno da função: `<anônima>()`
- L181 — variável: `grants`
- L182 — variável: `grantsByProfile`
- L184 — variável: `grant`
- L185 — variável: `list`
- L190 — parâmetro: `row`
- L190 — retorno da função: `<anônima>()`
- L197 — variável: `id`
- L198 — variável: `row`
- L210 — parâmetro: `entry`
- L210 — retorno da função: `<anônima>()`
- L229 — variável: `permissions`
- L230 — variável: `flags`
- L240 — retorno da função: `<anônima>()`
- L240 — variável: `created`
- L241 — parâmetro: `trx`
- L241 — retorno da função: `<anônima>()`
- L242 — variável: `row`
- L272 — variável: `id`
- L273 — variável: `current`
- L279 — variável: `currentPermissions`
- L290 — variável: `nextPermissions`
- L294 — variável: `nextFlags`
- L301 — parâmetro: `permission`
- L301 — retorno da função: `<anônima>()`
- L322 — variável: `currentState`
- L323 — variável: `nextState`
- L342 — retorno da função: `<anônima>()`
- L343 — parâmetro: `trx`
- L343 — retorno da função: `<anônima>()`
- L385 — variável: `id`
- L386 — variável: `current`
- L413 — variável: `currentPermissions`
- L416 — retorno da função: `<anônima>()`
- L417 — parâmetro: `trx`
- L417 — retorno da função: `<anônima>()`
- L450 — variável: `id`
- L451 — variável: `source`
- L457 — variável: `sourcePermissions`
- L458 — variável: `flags`
- L468 — variável: `description`
- L470 — retorno da função: `<anônima>()`
- L470 — variável: `created`
- L471 — parâmetro: `trx`
- L471 — retorno da função: `<anônima>()`
- L472 — variável: `row`

### [src/modules/queue/mapping.controller.ts](../src/modules/queue/mapping.controller.ts)

- L13 — variável: `protocol`
- L22 — variável: `getMappingController`
- L23 — variável: `protocol`
- L30 — variável: `putMappingController`
- L31 — variável: `protocol`
- L35 — variável: `actor`
- L42 — variável: `parsed`
- L44 — variável: `{ message, fields }`
- L48 — variável: `response`

### [src/modules/queue/mapping.repository.ts](../src/modules/queue/mapping.repository.ts)

- L93 — variável: `findMappingRequestContext`
- L97 — variável: `row`
- L136 — variável: `resolveMappingTarget`
- L146 — retorno da função: `<anônima>()`
- L158 — variável: `findMappingAssigneeCandidate`
- L166 — variável: `row`
- L185 — retorno da função: `currentMappingRows()`
- L192 — parâmetro: `query`
- L192 — retorno da função: `<anônima>()`
- L212 — variável: `findCurrentMapping`
- L216 — variável: `row`
- L225 — variável: `findLatestOpenMapping`
- L229 — variável: `row`
- L239 — variável: `findMappingById`
- L244 — variável: `row`
- L258 — variável: `findMappingParticipants`
- L280 — variável: `resolveParticipantUsers`
- L288 — variável: `rows`
- L299 — parâmetro: `id`
- L299 — retorno da função: `<anônima>()`
- L299 — variável: `invalid`
- L300 — parâmetro: `r`
- L300 — retorno da função: `<anônima>()`
- L300 — variável: `row`
- L309 — parâmetro: `row`
- L309 — retorno da função: `<anônima>()`
- L316 — variável: `insertMapping`
- L328 — variável: `[row]`
- L349 — variável: `updateMapping`
- L387 — variável: `clearRequestMappingAssignee`
- L400 — variável: `replaceMappingParticipants`
- L412 — parâmetro: `participant`
- L412 — retorno da função: `<anônima>()`

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

- L122 — variável: `date`
- L185 — parâmetro: `participant`
- L185 — retorno da função: `<anônima>()`
- L217 — parâmetro: `participant`
- L217 — retorno da função: `<anônima>()`
- L248 — variável: `textField`
- L249 — variável: `next`
- L250 — variável: `normalized`
- L297 — parâmetro: `participant`
- L297 — retorno da função: `<anônima>()`
- L297 — variável: `userIds`
- L301 — variável: `usersById`
- L303 — parâmetro: `participant`
- L303 — variável: `resolved`
- L308 — variável: `user`
- L315 — variável: `seenEmails`
- L316 — variável: `seenUserIds`
- L317 — variável: `participant`
- L318 — variável: `emailKey`
- L346 — variável: `getMappingService`
- L351 — variável: `context`
- L368 — variável: `mapping`
- L373 — variável: `[participants, assigneeCandidate]`
- L386 — variável: `upsertMappingService`
- L392 — variável: `result`
- L398 — parâmetro: `trx`
- L398 — retorno da função: `<anônima>()`
- L401 — variável: `context`
- L452 — variável: `mapping`
- L463 — variável: `previousProfessionalId`
- L470 — variável: `explicitDesignation`
- L471 — variável: `isNullOnCreate`
- L472 — variável: `designationAction`
- L476 — variável: `contentAction`
- L513 — variável: `candidate`
- L546 — variável: `currentValues`
- L547 — variável: `values`
- L549 — variável: `concluding`
- L559 — variável: `target`
- L590 — variável: `missing`
- L600 — variável: `resolvedParticipants`
- L607 — variável: `designationChanged`
- L642 — variável: `changeOrigin`
- L646 — variável: `previousAuditValues`
- L653 — variável: `nextAuditValues`
- L665 — variável: `mappingAuditId`
- L750 — parâmetro: `participant`
- L750 — retorno da função: `<anônima>()`
- L757 — variável: `assigneeCandidate`
- L767 — variável: `scheduledAt`
- L768 — variável: `committedNotifications`
- L782 — variável: `response`

### [src/modules/queue/queue.controller.ts](../src/modules/queue/queue.controller.ts)

- L8 — variável: `getMetricsController`
- L9 — variável: `metrics`
- L14 — variável: `centralizedQueue`
- L15 — variável: `parsed`
- L21 — variável: `result`

### [src/modules/queue/queue.filters.ts](../src/modules/queue/queue.filters.ts)

- L19 — parâmetro: `mappingFilter`
- L19 — retorno da função: `<anônima>()`
- L21 — parâmetro: `currentMapping`
- L21 — retorno da função: `<anônima>()`
- L44 — parâmetro: `initialMappingAssignee`
- L44 — retorno da função: `<anônima>()`
- L50 — parâmetro: `mapping`
- L50 — retorno da função: `<anônima>()`
- L79 — variável: `{ search, status, priority, assigneeId, unassigned, createdFrom, createdTo, department, scopedUserId, noteCustodianUserId, }`
- L93 — variável: `searchPattern`
- L95 — parâmetro: `builder`
- L95 — retorno da função: `<anônima>()`
- L105 — parâmetro: `notesQuery`
- L105 — retorno da função: `<anônima>()`
- L116 — parâmetro: `custody`
- L116 — retorno da função: `<anônima>()`
- L150 — parâmetro: `builder`
- L150 — retorno da função: `<anônima>()`
- L158 — parâmetro: `builder`
- L158 — retorno da função: `<anônima>()`
- L170 — parâmetro: `builder`
- L170 — retorno da função: `<anônima>()`

### [src/modules/queue/queue.repository.ts](../src/modules/queue/queue.repository.ts)

- L18 — variável: `IN_PROGRESS_STATUS_NAMES`
- L26 — variável: `fetchQueueMetrics`
- L27 — variável: `query`
- L42 — variável: `result`
- L49 — retorno da função: `<anônima>()`
- L68 — variável: `findQueueRequests`
- L71 — variável: `{ limit, offset }`
- L73 — variável: `baseQuery`
- L86 — variável: `countQuery`
- L88 — variável: `itemsQuery`
- L104 — variável: `[countResult, items]`
- L105 — variável: `total`
- L116 — variável: `fetchAllDepartments`
- L117 — variável: `rows`
- L125 — variável: `seen`
- L127 — parâmetro: `row`
- L127 — retorno da função: `<anônima>()`
- L128 — parâmetro: `department`
- L128 — retorno da função: `<anônima>()`
- L129 — variável: `key`
- L136 — variável: `fetchAllAssignees`
- L137 — variável: `profileIds`

### [src/modules/queue/queue.router.ts](../src/modules/queue/queue.router.ts)

- L7 — variável: `queueRoutes`

### [src/modules/queue/queue.schemas.ts](../src/modules/queue/queue.schemas.ts)

- L12 — variável: `queueFilterShape`
- L32 — parâmetro: `value`
- L32 — retorno da função: `<anônima>()`
- L44 — variável: `queueSortShape`
- L58 — retorno da função: `applyQueueRefinements()`
- L66 — parâmetro: `filters`
- L66 — retorno da função: `<anônima>()`
- L76 — variável: `queueFilterQuerySchema`
- L93 — variável: `queueQuerySchema`

### [src/modules/queue/queue.service.ts](../src/modules/queue/queue.service.ts)

- L21 — variável: `resolveQueueScope`
- L22 — variável: `scope`
- L36 — variável: `resolveNoteCustodianUserId`
- L37 — variável: `custody`
- L45 — variável: `getQueueMetricsService`
- L56 — variável: `listQueueService`
- L60 — variável: `{ page, pageSize, assigneeId, sortBy, sortOrder, ...queueFilters }`
- L61 — variável: `offset`
- L63 — variável: `repoUnassigned`
- L64 — variável: `repoAssigneeId`
- L66 — variável: `scopedUserId`
- L67 — variável: `noteCustodianUserId`
- L69 — variável: `[{ items, total }, assignees, departments]`
- L87 — variável: `totalPages`
- L90 — variável: `effectivePage`
- L92 — parâmetro: `item`
- L92 — retorno da função: `<anônima>()`
- L92 — variável: `formattedData`

### [src/modules/queue/queue.sort.ts](../src/modules/queue/queue.sort.ts)

- L10 — variável: `SORT_COLUMNS`
- L34 — variável: `direction`

### [src/modules/reports/reports.controller.ts](../src/modules/reports/reports.controller.ts)

- L10 — variável: `parsed`
- L20 — variável: `parsed`
- L26 — variável: `file`

### [src/modules/reports/reports.repository.ts](../src/modules/reports/reports.repository.ts)

- L10 — variável: `OPENED_MONTH_SQL`
- L104 — variável: `query`
- L132 — variável: `query`
- L151 — variável: `query`
- L166 — variável: `query`
- L180 — variável: `query`
- L194 — variável: `[statuses, categories, priorities]`
- L216 — variável: `query`

### [src/modules/reports/reports.router.ts](../src/modules/reports/reports.router.ts)

- L6 — variável: `reportsRoutes`

### [src/modules/reports/reports.schema.ts](../src/modules/reports/reports.schema.ts)

- L5 — variável: `optionalDate`
- L6 — variável: `optionalId`
- L8 — variável: `dashboardQuerySchema`
- L18 — parâmetro: `query`
- L18 — retorno da função: `<anônima>()`

### [src/modules/reports/reports.service.ts](../src/modules/reports/reports.service.ts)

- L16 — variável: `CSV_HEADERS`
- L31 — variável: `dateTimeFormatter`
- L41 — variável: `filenameDateFormatter`
- L49 — variável: `[summary, byStatus, byPriority, byCategory, openedOverTime, filterOptions]`
- L69 — parâmetro: `item`
- L69 — retorno da função: `<anônima>()`
- L73 — parâmetro: `item`
- L73 — retorno da função: `<anônima>()`
- L77 — parâmetro: `item`
- L77 — retorno da função: `<anônima>()`
- L89 — parâmetro: `item`
- L89 — retorno da função: `<anônima>()`
- L96 — parâmetro: `item`
- L101 — parâmetro: `item`
- L101 — retorno da função: `<anônima>()`
- L106 — parâmetro: `item`
- L106 — retorno da função: `<anônima>()`
- L116 — variável: `date`
- L127 — variável: `record`
- L128 — variável: `assessment`
- L141 — variável: `raw`
- L142 — variável: `protectedValue`
- L171 — variável: `scope`
- L175 — variável: `scopedUserId`
- L176 — variável: `rows`
- L177 — variável: `lines`

### [src/modules/requests/requests-reopen.service.ts](../src/modules/requests/requests-reopen.service.ts)

- L14 — variável: `REOPEN_TARGET`
- L19 — variável: `REOPEN_PUBLIC_MESSAGE`
- L44 — variável: `protocol`
- L49 — variável: `justification`
- L57 — parâmetro: `trx`
- L57 — retorno da função: `<anônima>()`
- L58 — variável: `request`
- L63 — variável: `previousStatusId`
- L83 — variável: `previousMeeting`

### [src/modules/requests/requests.controller.ts](../src/modules/requests/requests.controller.ts)

- L30 — variável: `userId`
- L39 — variável: `getRequestsByProtocol`
- L40 — variável: `protocol`
- L42 — variável: `foundRequest`
- L50 — variável: `getTracking`
- L51 — variável: `protocol`
- L53 — variável: `response`
- L61 — variável: `postReopenRequest`
- L62 — variável: `protocol`
- L63 — variável: `parsed`
- L65 — variável: `{ message, fields }`
- L72 — variável: `response`
- L85 — variável: `getInternalRequestByProtocol`
- L89 — variável: `protocol`
- L91 — variável: `request`
- L98 — variável: `protocol`
- L116 — variável: `id`
- L129 — variável: `patchInternalRequestByProtocol`
- L133 — variável: `protocol`
- L135 — variável: `parsed`
- L137 — variável: `{ message, fields }`
- L141 — variável: `updated`
- L151 — variável: `postRequest`
- L165 — variável: `parsed`
- L169 — variável: `multerFiles`
- L170 — variável: `attachments`
- L172 — variável: `savedAttachments`
- L174 — variável: `response`
- L183 — variável: `getRequestsByEmail`
- L191 — variável: `parsed`
- L197 — variável: `requests`
- L209 — variável: `parsed`
- L215 — variável: `requests`
- L220 — variável: `getAssignees`
- L224 — variável: `patchAssignee`
- L225 — variável: `protocol`
- L227 — variável: `parsed`
- L232 — variável: `response`
- L242 — variável: `patchInternalAssignee`
- L243 — variável: `protocol`
- L245 — variável: `parsed`
- L250 — variável: `response`
- L260 — variável: `patchRequestStatus`
- L261 — variável: `protocol`
- L263 — variável: `parsed`
- L268 — variável: `response`
- L278 — variável: `postCancelRequest`
- L279 — variável: `protocol`
- L280 — variável: `parsed`
- L282 — variável: `{ fields, message }`
- L286 — variável: `response`

### [src/modules/requests/requests.repository.ts](../src/modules/requests/requests.repository.ts)

- L44 — variável: `INITIAL_STATUS`
- L90 — variável: `{ request_id, meeting_scheduled_for, meeting_link }`
- L93 — variável: `mapping`
- L101 — variável: `reopenedAt`
- L158 — variável: `email`
- L205 — variável: `row`
- L219 — variável: `requesterId`
- L242 — variável: `result`
- L246 — variável: `row`
- L263 — variável: `email`
- L264 — variável: `requestId`
- L266 — variável: `manualControls`
- L267 — variável: `processDocumentation`
- L268 — variável: `similarSolution`
- L269 — variável: `otherAreas`
- L270 — variável: `restrictedInfo`
- L272 — variável: `insertedRows`
- L331 — variável: `row`
- L350 — parâmetro: `scheduledFor`
- L350 — retorno da função: `<anônima>()`
- L369 — parâmetro: `attachment`
- L369 — retorno da função: `<anônima>()`
- L386 — parâmetro: `trx`
- L386 — retorno da função: `<anônima>()`
- L387 — variável: `categoryId`
- L393 — variável: `statusId`
- L394 — variável: `requesterId`
- L395 — variável: `saved`
- L404 — variável: `email`
- L419 — variável: `row`
- L434 — variável: `PUBLIC_STATUS_SUMMARY_SQL`
- L437 — retorno da função: `baseSummaryQuery()`
- L454 — parâmetro: `builder`
- L454 — retorno da função: `<anônima>()`
- L464 — variável: `countRows`
- L470 — variável: `total`
- L472 — variável: `rows`
- L487 — parâmetro: `row`
- L487 — retorno da função: `<anônima>()`
- L513 — variável: `response`
- L546 — variável: `meetingScheduledFor`
- L548 — variável: `meeting`
- L552 — variável: `openedAt`
- L594 — variável: `hasMapping`
- L596 — variável: `query`
- L624 — variável: `baseSelect`
- L695 — variável: `mappingSelect`
- L739 — variável: `row`
- L742 — parâmetro: `query`
- L742 — retorno da função: `<anônima>()`
- L767 — variável: `profileIds`
- L793 — variável: `numericId`
- L845 — variável: `hasMapping`
- L866 — variável: `query`
- L878 — variável: `row`
- L926 — variável: `statusId`
- L927 — variável: `expectedStatusId`
- L959 — variável: `triages`
- L1017 — variável: `hasMappingColumn`
- L1035 — variável: `query`
- L1047 — variável: `row`
- L1075 — retorno da função: `<anônima>()`
- L1134 — variável: `manualControls`
- L1135 — variável: `processDocumentation`
- L1136 — variável: `similarSolution`
- L1137 — variável: `otherAreas`
- L1138 — variável: `restrictedInfo`

### [src/modules/requests/requests.router.ts](../src/modules/requests/requests.router.ts)

- L25 — variável: `requestsRoutes`

### [src/modules/requests/requests.schema.ts](../src/modules/requests/requests.schema.ts)

- L15 — variável: `reopenJustificationSchema`
- L17 — variável: `reopenRequestSchema`
- L22 — variável: `yesNoDetailSchema`
- L32 — variável: `requesterSchema`
- L41 — variável: `demandSchema`
- L52 — variável: `operationalSchema`
- L79 — variável: `complementarySchema`
- L87 — variável: `isRealCalendarDateTime`
- L88 — variável: `[datePart, timePart]`
- L89 — variável: `[year, month, day]`
- L90 — variável: `[hour = 0, minute = 0]`
- L93 — variável: `lastDay`
- L97 — variável: `createRequestPayloadSchema`
- L116 — parâmetro: `preferences`
- L116 — retorno da função: `<anônima>()`
- L133 — variável: `todaySaoPauloYmd`
- L135 — variável: `desiredDeadlineUpdateSchema`
- L138 — parâmetro: `value`
- L138 — retorno da função: `<anônima>()`
- L142 — variável: `operationalUpdateSchema`
- L148 — variável: `updateRequesterSchema`
- L150 — variável: `updateRequestPayloadSchema`
- L159 — variável: `listRequestsQuerySchema`
- L180 — variável: `listAuthenticatedRequestsQuerySchema`
- L182 — variável: `assignRequestSchema`
- L193 — variável: `analystIdSchema`
- L195 — variável: `assignAnalystSchema`
- L200 — parâmetro: `ctx`
- L200 — parâmetro: `data`
- L200 — retorno da função: `<anônima>()`
- L201 — variável: `hasAssignee`
- L202 — variável: `hasMapping`
- L221 — variável: `cancelRequestSchema`
- L230 — variável: `updateStatusSchema`

### [src/modules/requests/requests.service.ts](../src/modules/requests/requests.service.ts)

- L131 — variável: `user`
- L144 — variável: `normalizedProtocol`
- L146 — variável: `found`
- L156 — variável: `identity`
- L157 — variável: `isOwner`
- L173 — retorno da função: `registerRequest()`
- L181 — variável: `payload`
- L187 — variável: `err`
- L197 — variável: `identity`
- L214 — variável: `email`
- L223 — variável: `normalizedEmail`
- L259 — parâmetro: `value`
- L259 — retorno da função: `<anônima>()`
- L267 — variável: `request`
- L279 — parâmetro: `row`
- L279 — retorno da função: `<anônima>()`
- L289 — variável: `canReadInternalNotes`
- L293 — variável: `canReadPendingItems`
- L299 — variável: `requestId`
- L300 — variável: `[attachments, schedulePreferences, evaluation]`
- L309 — variável: `meeting`
- L319 — retorno da função: `<anônima>()`
- L319 — variável: `pendingSummary`
- L329 — variável: `summary`
- L330 — variável: `correctionAlert`
- L331 — variável: `unreadRaw`
- L370 — variável: `openedAt`
- L371 — variável: `lastUpdate`
- L373 — variável: `assigneeUserId`
- L374 — variável: `mappingUserId`
- L376 — variável: `assignee`
- L385 — variável: `mappingAssignee`
- L449 — parâmetro: `row`
- L449 — retorno da função: `<anônima>()`
- L453 — parâmetro: `attachment`
- L453 — retorno da função: `<anônima>()`
- L492 — variável: `trimmed`
- L499 — variável: `record`
- L503 — variável: `{ __triage: _triage, observations: _obs, ...rest }`
- L528 — variável: `TRACKING_INVALID_IDENTITY`
- L531 — variável: `scheduledFor`
- L597 — variável: `openedAt`
- L615 — variável: `INITIAL_CANCEL_CYCLE`
- L627 — parâmetro: `trx`
- L627 — retorno da função: `<anônima>()`
- L628 — variável: `locked`
- L630 — variável: `request`
- L649 — variável: `lastTechnicalMessage`
- L678 — variável: `requestId`
- L679 — variável: `[attachments, schedulePreferences]`
- L684 — variável: `meeting`
- L685 — variável: `complementary`
- L688 — variável: `{ impacts, ...base }`
- L689 — variável: `closureRef`
- L694 — variável: `canCancel`
- L719 — parâmetro: `preference`
- L719 — retorno da função: `<anônima>()`
- L724 — parâmetro: `attachment`
- L724 — retorno da função: `<anônima>()`
- L756 — variável: `row`
- L773 — variável: `mode`
- L784 — variável: `row`
- L786 — variável: `nameOk`
- L789 — variável: `emailOk`
- L811 — variável: `normalizedProtocol`
- L938 — variável: `request`
- L944 — parâmetro: `row`
- L944 — retorno da função: `<anônima>()`
- L949 — parâmetro: `trx`
- L949 — retorno da função: `<anônima>()`
- L968 — variável: `updatedRequest`
- L990 — variável: `RN010_ELIGIBLE_SCREENING`
- L1027 — variável: `candidate`
- L1028 — variável: `assignable`
- L1042 — variável: `candidate`
- L1043 — variável: `assignable`
- L1060 — variável: `error`
- L1084 — variável: `request`
- L1090 — parâmetro: `row`
- L1090 — retorno da função: `<anônima>()`
- L1100 — variável: `assignee`
- L1103 — retorno da função: `<anônima>()`
- L1107 — variável: `previousId`
- L1108 — variável: `nextId`
- L1110 — variável: `auditNext`
- L1111 — variável: `auditPrev`
- L1114 — variável: `action`
- L1116 — variável: `shouldAdvanceStatus`
- L1124 — variável: `previousMapping`
- L1125 — variável: `auditPrevMapping`
- L1131 — parâmetro: `trx`
- L1131 — retorno da função: `<anônima>()`
- L1135 — variável: `auditId`
- L1219 — variável: `request`
- L1225 — parâmetro: `row`
- L1225 — retorno da função: `<anônima>()`
- L1235 — variável: `hasAssignee`
- L1236 — variável: `hasMapping`
- L1241 — variável: `raw`
- L1243 — variável: `previous`
- L1244 — variável: `auditPrev`
- L1247 — parâmetro: `trx`
- L1247 — retorno da função: `<anônima>()`
- L1265 — retorno da função: `<anônima>()`
- L1265 — variável: `resolved`
- L1268 — variável: `previous`
- L1269 — variável: `auditPrev`
- L1272 — variável: `previousMapping`
- L1273 — variável: `auditPrevMapping`
- L1276 — variável: `action`
- L1277 — variável: `shouldAdvance`
- L1280 — parâmetro: `trx`
- L1280 — retorno da função: `<anônima>()`
- L1288 — variável: `auditId`
- L1351 — variável: `raw`
- L1353 — variável: `previous`
- L1354 — variável: `auditPrev`
- L1357 — parâmetro: `trx`
- L1357 — retorno da função: `<anônima>()`
- L1375 — retorno da função: `<anônima>()`
- L1375 — variável: `resolved`
- L1378 — variável: `previous`
- L1379 — variável: `auditPrev`
- L1382 — variável: `previousAssignee`
- L1383 — variável: `auditPrevAssignee`
- L1386 — variável: `action`
- L1387 — parâmetro: `trx`
- L1387 — retorno da função: `<anônima>()`
- L1395 — variável: `auditId`
- L1443 — variável: `updatedRequest`
- L1513 — variável: `current`
- L1547 — variável: `request`
- L1553 — parâmetro: `row`
- L1553 — retorno da função: `<anônima>()`
- L1561 — variável: `target`
- L1589 — variável: `requiresOverride`
- L1591 — variável: `hasStatusOverride`
- L1614 — variável: `changeOrigin`
- L1616 — parâmetro: `trx`
- L1616 — retorno da função: `<anônima>()`
- L1616 — variável: `{ lastUpdate, committed }`
- L1617 — variável: `locked`
- L1631 — variável: `current`
- L1644 — variável: `persistedAt`
- L1656 — variável: `auditId`
- L1681 — variável: `committedNotifications`

### [src/modules/requests/statusTransition.ts](../src/modules/requests/statusTransition.ts)

- L29 — variável: `lastTechnicalMessage`
- L38 — variável: `query`
- L42 — variável: `rows`
- L43 — variável: `row`

### [src/modules/requests/triage/triage.controller.ts](../src/modules/requests/triage/triage.controller.ts)

- L10 — variável: `protocolParamsSchema`
- L15 — variável: `parsed`
- L23 — variável: `getTriage`
- L24 — variável: `protocol`
- L25 — variável: `actor`
- L27 — variável: `triage`
- L32 — variável: `saveTriage`
- L33 — variável: `protocol`
- L34 — variável: `actor`
- L36 — variável: `parsed`
- L38 — variável: `{ message, fields }`
- L42 — variável: `triage`

### [src/modules/requests/triage/triage.repository.ts](../src/modules/requests/triage/triage.repository.ts)

- L79 — variável: `TRIAGE_COLUMNS`
- L132 — variável: `row`
- L166 — retorno da função: `<anônima>()`
- L188 — variável: `raw`
- L208 — variável: `{ protocol, categoryId, statusId, isStatusPublic, lastTechnicalMessage, expectedStatusId, updatedBy, trx, }`
- L218 — variável: `source`
- L245 — variável: `updatedRows`

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

- L82 — variável: `{ protocol, request, triage, categoryId, exitStatus, actor, ipAddress }`
- L84 — parâmetro: `trx`
- L84 — retorno da função: `<anônima>()`
- L85 — variável: `current`
- L106 — variável: `triageAuditId`
- L174 — variável: `request`
- L179 — variável: `canAccess`
- L196 — variável: `request`
- L219 — variável: `canAccess`
- L236 — variável: `exitStatus`
- L257 — variável: `categoryName`
- L259 — variável: `newCategory`
- L294 — variável: `committedNotifications`

### [src/modules/users/users.controller.ts](../src/modules/users/users.controller.ts)

- L22 — variável: `id`
- L36 — variável: `id`
- L37 — variável: `permissions`
- L41 — variável: `getUserMetrics`
- L42 — variável: `metrics`
- L47 — variável: `listAssignableProfessionals`
- L51 — variável: `parsed`
- L57 — variável: `professionals`
- L64 — variável: `listUsers`
- L65 — variável: `parsed`
- L71 — variável: `users`
- L76 — variável: `createUser`
- L77 — variável: `parsed`
- L80 — variável: `{ message, fields }`
- L84 — variável: `created`
- L89 — variável: `updateUser`
- L90 — variável: `parsed`
- L93 — variável: `{ message, fields }`
- L97 — variável: `updated`
- L107 — variável: `getUser`
- L108 — variável: `user`
- L113 — variável: `changeUserStatus`
- L114 — variável: `parsed`
- L120 — variável: `updated`
- L130 — variável: `resetUserPassword`
- L131 — variável: `reset`
- L140 — variável: `getMyProfile`
- L141 — variável: `profile`
- L152 — variável: `updateMyProfile`
- L153 — variável: `actor`
- L168 — variável: `parsed`
- L174 — variável: `updated`

### [src/modules/users/users.repository.ts](../src/modules/users/users.repository.ts)

- L40 — variável: `PROFILE_LOOKUP_COLUMNS`
- L66 — variável: `{ queryable = db, shouldLockForShare = false }`
- L67 — variável: `query`
- L104 — variável: `conn`
- L105 — variável: `rows`
- L115 — parâmetro: `row`
- L115 — retorno da função: `<anônima>()`
- L129 — variável: `row`
- L180 — variável: `inserted`
- L190 — variável: `row`
- L224 — variável: `corporateEmail`
- L228 — variável: `hasRequester`
- L293 — variável: `user`
- L310 — variável: `[requester, professional]`
- L342 — retorno da função: `<anônima>()`
- L375 — variável: `updated`
- L386 — variável: `adopted`
- L423 — variável: `specialties`
- L424 — variável: `attendedCategoryIds`
- L427 — variável: `updated`
- L465 — retorno da função: `baseQuery()`
- L468 — parâmetro: `builder`
- L468 — retorno da função: `<anônima>()`
- L473 — variável: `escapedSearch`
- L474 — parâmetro: `inner`
- L474 — retorno da função: `<anônima>()`
- L484 — variável: `countRows`
- L487 — variável: `total`
- L489 — variável: `rows`
- L507 — parâmetro: `row`
- L507 — retorno da função: `<anônima>()`
- L530 — variável: `updated`
- L551 — variável: `updated`
- L567 — variável: `rows`
- L569 — retorno da função: `<anônima>()`
- L581 — parâmetro: `row`
- L581 — retorno da função: `<anônima>()`
- L602 — variável: `updated`
- L631 — variável: `row`
- L641 — variável: `assignableProfileIds`
- L644 — variável: `query`
- L656 — variável: `rows`
- L670 — variável: `categoryMap`
- L671 — variável: `categories`
- L674 — variável: `cat`
- L682 — parâmetro: `row`
- L682 — retorno da função: `<anônima>()`
- L682 — variável: `professionalIds`
- L683 — variável: `counts`
- L688 — variável: `countByProfessional`
- L689 — variável: `c`
- L693 — parâmetro: `row`
- L693 — retorno da função: `<anônima>()`
- L696 — variável: `part`
- L697 — variável: `id`
- L699 — variável: `name`
- L718 — variável: `fetchUserMetrics`
- L719 — variável: `result`
- L753 — variável: `existing`
- L758 — variável: `next`
- L776 — variável: `anon`
- L810 — retorno da função: `findRequesterByUserId()`

### [src/modules/users/users.router.ts](../src/modules/users/users.router.ts)

- L18 — variável: `usersRoutes`

### [src/modules/users/users.schema.ts](../src/modules/users/users.schema.ts)

- L14 — variável: `professionalSchema`
- L23 — variável: `requesterSchema`
- L31 — variável: `profileIdSchema`
- L37 — variável: `createUserSchema`
- L48 — variável: `listUsersQuerySchema`
- L69 — variável: `listAssignableProfessionalsQuerySchema`
- L80 — variável: `requesterPatchSchema`
- L87 — variável: `changeUserStatusSchema`
- L91 — variável: `updateUserSchema`
- L100 — parâmetro: `ctx`
- L100 — parâmetro: `value`
- L100 — retorno da função: `<anônima>()`

### [src/modules/users/users.service.ts](../src/modules/users/users.service.ts)

- L43 — variável: `AVATAR_DIR`
- L45 — variável: `CHANGE_ORIGIN_ADMIN`
- L48 — variável: `CODE_ACCOUNT_OUT_OF_AUTHORITY`
- L49 — variável: `CODE_ROOT_ACCOUNT_PROTECTED`
- L50 — variável: `CODE_SELF_MANAGEMENT_FORBIDDEN`
- L51 — variável: `CODE_PROFILE_INACTIVE`
- L52 — variável: `CODE_USER_MANAGE_REQUIRED`
- L53 — variável: `CODE_PROFESSIONAL_PROFILE_NOT_ASSIGNABLE`
- L54 — variável: `CODE_USER_HAS_OPEN_ASSIGNMENTS`
- L73 — variável: `shouldHaveExtension`
- L99 — variável: `id`
- L108 — variável: `id`
- L117 — variável: `actorUser`
- L131 — variável: `actorUser`
- L137 — variável: `grants`
- L144 — variável: `grants`
- L167 — variável: `assignedProtocols`
- L202 — variável: `targetGrants`
- L229 — variável: `profileGrants`
- L249 — variável: `profile`
- L271 — variável: `requesterUserId`
- L280 — variável: `getUserMetrics`
- L292 — variável: `profile`
- L299 — variável: `actorAuthority`
- L302 — variável: `profileId`
- L304 — variável: `temporaryPassword`
- L305 — variável: `passwordHash`
- L312 — parâmetro: `trx`
- L312 — retorno da função: `<anônima>()`
- L313 — variável: `currentProfile`
- L327 — variável: `needsProfessionalExtension`
- L332 — variável: `created`
- L361 — variável: `error`
- L390 — variável: `id`
- L394 — variável: `user`
- L399 — variável: `actorAuthority`
- L404 — parâmetro: `trx`
- L404 — retorno da função: `<anônima>()`
- L431 — variável: `id`
- L435 — variável: `user`
- L440 — variável: `actorAuthority`
- L443 — variável: `temporaryPassword`
- L444 — variável: `passwordHash`
- L448 — parâmetro: `trx`
- L448 — retorno da função: `<anônima>()`
- L501 — variável: `row`
- L506 — variável: `isAssignable`
- L542 — variável: `userId`
- L551 — variável: `user`
- L557 — variável: `snapshot`
- L558 — variável: `previousValue`
- L565 — parâmetro: `trx`
- L565 — retorno da função: `<anônima>()`
- L577 — variável: `changesAdministrativeFields`
- L584 — variável: `canManageAccounts`
- L585 — parâmetro: `permission`
- L585 — retorno da função: `<anônima>()`
- L618 — variável: `url`
- L621 — variável: `url`
- L649 — variável: `saved`
- L650 — variável: `attachment`
- L658 — variável: `key`
- L659 — variável: `storagePath`
- L660 — retorno da função: `<anônima>()`
- L677 — variável: `id`
- L681 — variável: `target`
- L686 — variável: `actorAuthority`
- L693 — variável: `profile`
- L704 — variável: `before`
- L707 — parâmetro: `trx`
- L707 — retorno da função: `<anônima>()`
- L708 — variável: `sourceProfile`
- L715 — variável: `destinationProfileId`
- L716 — variável: `destinationProfile`
- L729 — variável: `needsProfessionalExtension`
- L743 — variável: `fullName`
- L744 — variável: `corporateEmail`
- L760 — variável: `fullName`
- L761 — variável: `corporateEmail`
- L781 — variável: `error`
- L788 — variável: `updated`
- L792 — variável: `isUpdatedProfileAssignable`
- L793 — variável: `professional`

### [src/router.ts](../src/router.ts)

- L18 — variável: `router`

### [src/server.ts](../src/server.ts)

- L5 — variável: `PORT`
- L8 — parâmetro: `e`
- L8 — retorno da função: `<anônima>()`
- L10 — retorno da função: `<anônima>()`

### [src/shared/access/accountAuthority.ts](../src/shared/access/accountAuthority.ts)

- L29 — parâmetro: `grant`
- L29 — retorno da função: `<anônima>()`
- L29 — variável: `actorCustodyByKey`
- L31 — parâmetro: `grant`
- L31 — retorno da função: `<anônima>()`
- L32 — variável: `actorCustody`

### [src/shared/access/assignability.ts](../src/shared/access/assignability.ts)

- L12 — variável: `CODE_ASSIGNEE_NOT_ASSIGNABLE`
- L15 — variável: `CODE_ASSIGNEE_IS_REQUESTER`
- L56 — variável: `ASSIGNABILITY_FLAGS`
- L87 — retorno da função: `<anônima>()`
- L87 — variável: `placeholders`
- L98 — parâmetro: `stage`
- L98 — retorno da função: `<anônima>()`
- L98 — variável: `predicates`
- L105 — parâmetro: `{ stage, predicate }`
- L105 — retorno da função: `<anônima>()`
- L109 — parâmetro: `{ predicate }`
- L109 — retorno da função: `<anônima>()`
- L117 — variável: `{ queryable = db, stage }`
- L119 — variável: `predicate`
- L121 — variável: `rows`
- L126 — parâmetro: `row`
- L126 — retorno da função: `<anônima>()`
- L134 — variável: `{ queryable = db }`
- L135 — variável: `predicate`
- L136 — variável: `row`
- L155 — variável: `{ queryable = db, requireFlag = false, requireActive = false }`
- L156 — variável: `keys`
- L157 — variável: `predicate`
- L159 — variável: `query`
- L170 — variável: `row`

### [src/shared/access/currentMapping.ts](../src/shared/access/currentMapping.ts)

- L13 — variável: `CURRENT_MAPPING_ASSIGNEE_JOIN`

### [src/shared/access/custody.ts](../src/shared/access/custody.ts)

- L60 — variável: `custody`
- L63 — variável: `validResponsibleIds`
- L64 — parâmetro: `userId`
- L76 — parâmetro: `permission`
- L76 — retorno da função: `<anônima>()`
- L99 — variável: `custody`

### [src/shared/access/permissionActor.ts](../src/shared/access/permissionActor.ts)

- L20 — variável: `id`
- L41 — variável: `actor`
- L42 — variável: `name`

### [src/shared/access/portalSections.ts](../src/shared/access/portalSections.ts)

- L10 — variável: `PORTAL_SECTION_READ_KEY`

### [src/shared/access/requestAccess.ts](../src/shared/access/requestAccess.ts)

- L35 — variável: `id`
- L51 — parâmetro: `permission`
- L51 — retorno da função: `<anônima>()`
- L60 — variável: `custody`
- L85 — variável: `responsibleIds`
- L86 — parâmetro: `value`
- L86 — retorno da função: `<anônima>()`
- L87 — parâmetro: `value`
- L87 — retorno da função: `<anônima>()`
- L103 — variável: `requesterUserId`
- L125 — parâmetro: `trx`
- L125 — retorno da função: `<anônima>()`

### [src/shared/audit/accessDenied.ts](../src/shared/audit/accessDenied.ts)

- L21 — parâmetro: `trx`
- L21 — retorno da função: `<anônima>()`

### [src/shared/audit/auditCatalog.ts](../src/shared/audit/auditCatalog.ts)

- L13 — variável: `auditCatalog`
- L102 — parâmetro: `action`
- L102 — retorno da função: `<anônima>()`

### [src/shared/audit/auditLogger.ts](../src/shared/audit/auditLogger.ts)

- L106 — variável: `actorProfile`
- L108 — variável: `rows`
- L128 — variável: `row`

### [src/shared/catalog/baseProfiles.ts](../src/shared/catalog/baseProfiles.ts)

- L33 — variável: `entry`
- L47 — parâmetro: `key`
- L47 — retorno da função: `<anônima>()`
- L52 — parâmetro: `entry`
- L52 — retorno da função: `<anônima>()`
- L147 — parâmetro: `profile`
- L147 — retorno da função: `<anônima>()`
- L147 — variável: `rootProfiles`
- L153 — variável: `seenNames`
- L155 — variável: `profile`
- L161 — variável: `seenKeys`
- L163 — variável: `grant`

### [src/shared/catalog/fieldCatalog.ts](../src/shared/catalog/fieldCatalog.ts)

- L6 — variável: `FIELD_KEYS`
- L162 — variável: `value`
- L164 — variável: `date`

### [src/shared/catalog/permissionCatalog.ts](../src/shared/catalog/permissionCatalog.ts)

- L12 — variável: `CUSTODIES`
- L37 — variável: `PERMISSION_CATALOG`
- L274 — variável: `ASSIGNABILITY_PREDICATES`
- L279 — variável: `DEFINITION_BY_KEY`
- L280 — parâmetro: `entry`
- L280 — retorno da função: `<anônima>()`
- L283 — variável: `ORDER_BY_KEY`
- L284 — parâmetro: `entry`
- L284 — parâmetro: `index`
- L284 — retorno da função: `<anônima>()`
- L288 — variável: `entry`
- L331 — variável: `seen`
- L334 — variável: `grant`
- L335 — variável: `entry`
- L363 — variável: `permission`
- L364 — variável: `dependency`
- L371 — parâmetro: `left`
- L371 — parâmetro: `right`
- L371 — retorno da função: `<anônima>()`
- L373 — parâmetro: `{ key, custody }`
- L373 — retorno da função: `<anônima>()`
- L381 — variável: `keys`
- L383 — variável: `entry`
- L393 — variável: `acceptsGlobal`
- L404 — variável: `entry`
- L405 — variável: `dependency`

### [src/shared/datetime/businessDay.ts](../src/shared/datetime/businessDay.ts)

- L4 — variável: `BUSINESS_TIME_ZONE`
- L6 — variável: `UTC_TIME_ZONE`

### [src/shared/errors/AppError.ts](../src/shared/errors/AppError.ts)

- L5 — parâmetro: `statusCode`

### [src/shared/middleware/accessMode.ts](../src/shared/middleware/accessMode.ts)

- L7 — variável: `COOKIE_NAME`
- L24 — retorno da função: `requireAccessMode()`
- L32 — variável: `error`
- L39 — variável: `hasSessionCookie`

### [src/shared/middleware/auth.ts](../src/shared/middleware/auth.ts)

- L8 — variável: `{ JsonWebTokenError, NotBeforeError, TokenExpiredError }`
- L9 — variável: `COOKIE_NAME`
- L24 — variável: `token`
- L34 — variável: `userState`
- L46 — variável: `scope`
- L53 — variável: `isPendingChangeAllowedRoute`
- L65 — variável: `tokenPasswordChangedAt`
- L66 — variável: `currentPasswordChangedAt`
- L85 — variável: `error`

### [src/shared/middleware/dualAuth.ts](../src/shared/middleware/dualAuth.ts)

- L24 — variável: `hasCookie`
- L31 — variável: `identity`

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

### [src/shared/middleware/requirePermission.ts](../src/shared/middleware/requirePermission.ts)

- L12 — variável: `protocol`
- L13 — variável: `note`
- L26 — variável: `resource`
- L29 — variável: `routePath`
- L62 — retorno da função: `requireAnyPermission()`
- L63 — variável: `requiredKeys`
- L80 — variável: `grants`
- L81 — variável: `permissions`
- L83 — parâmetro: `permission`
- L83 — retorno da função: `<anônima>()`
- L95 — retorno da função: `requirePermission()`
- L103 — retorno da função: `requirePermissionIfSession()`
- L104 — variável: `gate`

### [src/shared/middleware/upload.ts](../src/shared/middleware/upload.ts)

- L6 — variável: `ALLOWED_MIMES`
- L14 — variável: `ALLOWED_EXTENSIONS`
- L16 — variável: `MAX_FILE_SIZE_BYTES`
- L17 — variável: `MAX_ATTACHMENT_COUNT`
- L18 — variável: `MAX_FIELD_SIZE_BYTES`
- L20 — variável: `upload`
- L27 — parâmetro: `_req`
- L27 — parâmetro: `cb`
- L27 — parâmetro: `file`
- L27 — retorno da função: `<anônima>()`
- L28 — variável: `extension`
- L43 — variável: `multerFields`
- L57 — parâmetro: `err`
- L57 — retorno da função: `<anônima>()`

### [src/shared/middleware/uploadAssets.ts](../src/shared/middleware/uploadAssets.ts)

- L58 — parâmetro: `r`
- L58 — retorno da função: `<anônima>()`
- L58 — variável: `MAX_FILE_SIZE`
- L59 — variável: `MAX_FIELD_SIZE`
- L61 — variável: `upload`
- L69 — parâmetro: `_req`
- L69 — parâmetro: `cb`
- L69 — parâmetro: `file`
- L69 — retorno da função: `<anônima>()`
- L70 — variável: `rules`
- L76 — variável: `ext`
- L101 — variável: `multerFields`
- L125 — parâmetro: `err`
- L125 — retorno da função: `<anônima>()`
- L132 — variável: `message`
- L133 — variável: `statusCode`
- L148 — variável: `files`
- L154 — variável: `[fieldName, fileArray]`
- L155 — variável: `rules`
- L158 — variável: `file`
- L160 — variável: `maxMb`

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

### [src/shared/notifications/emitNotification.ts](../src/shared/notifications/emitNotification.ts)

- L32 — variável: `parsed`
- L38 — variável: `data`
- L39 — variável: `recipients`
- L40 — parâmetro: `userId`
- L40 — retorno da função: `<anônima>()`
- L45 — variável: `recipientUserId`
- L46 — variável: `channel`
- L47 — variável: `delivery`

### [src/shared/notifications/inAppNotificationChannel.ts](../src/shared/notifications/inAppNotificationChannel.ts)

- L25 — variável: `rows`
- L37 — variável: `row`

### [src/shared/notifications/mappingScheduledNotification.ts](../src/shared/notifications/mappingScheduledNotification.ts)

- L38 — variável: `recipientUserIds`
- L39 — parâmetro: `userId`

### [src/shared/notifications/notificationEmitter.ts](../src/shared/notifications/notificationEmitter.ts)

- L4 — variável: `NOTIFICATIONS_COMMITTED`
- L15 — variável: `emitter`
- L23 — retorno da função: `<anônima>()`
- L27 — variável: `idsByUser`
- L29 — variável: `notification`
- L30 — variável: `ids`
- L39 — variável: `[userId, notificationIds]`

### [src/shared/notifications/notificationEvents.ts](../src/shared/notifications/notificationEvents.ts)

- L13 — variável: `PENDING_ITEM_RESPONDED_UNASSIGNED_NOTICE`
- L16 — variável: `requestPointerPayloadSchema`
- L24 — retorno da função: `pendingItemPayloadSchema()`
- L32 — variável: `pendingItemCreatedPayloadSchema`
- L33 — variável: `pendingItemReopenedPayloadSchema`
- L34 — variável: `pendingItemValidatedPayloadSchema`
- L36 — variável: `statusChangedPayloadSchema`
- L44 — variável: `mappingScheduledPayloadSchema`
- L51 — variável: `pendingItemRespondedPayloadSchema`
- L57 — variável: `pendingItemRespondedUnassignedPayloadSchema`
- L64 — variável: `responsibleAssignedPayloadSchema`
- L74 — variável: `notificationPayloadSchema`
- L102 — variável: `notificationEventFields`
- L110 — variável: `notificationEventBaseSchema`
- L124 — retorno da função: `notificationEventSchemaFor()`
- L133 — variável: `statusChangedEventSchema`
- L141 — variável: `mappingScheduledEventSchema`
- L146 — variável: `pendingItemCreatedEventSchema`
- L151 — variável: `pendingItemReopenedEventSchema`
- L156 — variável: `pendingItemValidatedEventSchema`
- L165 — variável: `pendingItemEventBaseSchema`
- L172 — variável: `pendingItemRespondedEventSchema`
- L179 — variável: `pendingItemRespondedUnassignedEventSchema`
- L186 — variável: `responsibleAssignedEventSchema`
- L197 — variável: `notificationEventSchema`
- L219 — variável: `PENDING_ITEM_EVENT_TYPES`
- L233 — variável: `NOTIFICATION_EVENT_TYPES`

### [src/shared/notifications/pendingItemNotification.ts](../src/shared/notifications/pendingItemNotification.ts)

- L45 — variável: `PENDING_ITEM_EVENT_BY_ACTION`
- L48 — parâmetro: `eventBase`
- L48 — parâmetro: `requestPointer`
- L48 — retorno da função: `<anônima>()`
- L56 — parâmetro: `eventBase`
- L56 — parâmetro: `requestPointer`
- L56 — retorno da função: `<anônima>()`
- L64 — parâmetro: `eventBase`
- L64 — parâmetro: `requestPointer`
- L64 — retorno da função: `<anônima>()`
- L77 — variável: `{ request, actorUserId }`
- L80 — variável: `eventBuilder`
- L108 — variável: `eventInput`

### [src/shared/notifications/pendingItemRespondedNotification.ts](../src/shared/notifications/pendingItemRespondedNotification.ts)

- L11 — variável: `EVENT_KEY_PREFIX`
- L62 — variável: `recipientUserIds`
- L93 — variável: `event`

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

- L34 — variável: `ASSET_KEYS`
- L56 — variável: `THEME_TOKEN_KEYS`
- L122 — variável: `STATUS_MODES`
- L153 — variável: `PRIORITIZATION_CRITERIA`

### [src/shared/types/queue.types.ts](../src/shared/types/queue.types.ts)

- L24 — variável: `QUEUE_SORT_BY`
- L28 — variável: `QUEUE_SORT_ORDER`

### [src/shared/types/requests.ts](../src/shared/types/requests.ts)

- L10 — variável: `REQUEST_PRIORITIES`
- L21 — variável: `TERMINAL_STATUSES`

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

- L6 — variável: `{ sign, verify }`
- L21 — variável: `secret`
- L22 — variável: `expiresIn`
- L32 — variável: `secret`
- L38 — variável: `decoded`
- L50 — variável: `scope`

### [src/shared/utils/passwordHandler.ts](../src/shared/utils/passwordHandler.ts)

- L7 — variável: `salt`
- L9 — variável: `hashedPassword`
- L19 — variável: `match`
- L31 — parâmetro: `length`

### [src/shared/utils/requesterIdentity.ts](../src/shared/utils/requesterIdentity.ts)

- L1 — variável: `EMAIL_PATTERN`
- L9 — variável: `obj`
- L12 — variável: `name`
- L13 — variável: `email`

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

- L112 — variável: `passwordChangedAt`

### [src/modules/pendingItems/pendingItems.repository.ts](../src/modules/pendingItems/pendingItems.repository.ts)

- L95 — variável: `row`
- L129 — variável: `row`
- L176 — variável: `status`
- L192 — variável: `custodian`
- L236 — variável: `row`
- L404 — variável: `row`
- L651 — variável: `requiresAttachment`
- L861 — variável: `requesterRow`
- L886 — variável: `category`

### [src/modules/pendingItems/pendingItems.router.ts](../src/modules/pendingItems/pendingItems.router.ts)

- L63 — parâmetro: `err`

### [src/modules/pendingItems/pendingItems.service.ts](../src/modules/pendingItems/pendingItems.service.ts)

- L147 — variável: `parsed`
- L159 — variável: `parsed`

### [src/modules/portalConfig/portalConfig.controller.ts](../src/modules/portalConfig/portalConfig.controller.ts)

- L120 — variável: `rawAssets`

### [src/modules/portalConfig/portalConfig.repository.ts](../src/modules/portalConfig/portalConfig.repository.ts)

- L251 — variável: `row`

### [src/modules/prioritization/prioritization.repository.ts](../src/modules/prioritization/prioritization.repository.ts)

- L58 — variável: `row`

### [src/modules/profiles/profiles.repository.ts](../src/modules/profiles/profiles.repository.ts)

- L89 — variável: `row`

### [src/modules/queue/mapping.repository.ts](../src/modules/queue/mapping.repository.ts)

- L97 — variável: `row`
- L166 — variável: `row`
- L216 — variável: `row`
- L229 — variável: `row`
- L244 — variável: `row`
- L300 — parâmetro: `r`
- L300 — variável: `row`
- L309 — parâmetro: `row`
- L328 — variável: `[row]`

### [src/modules/queue/queue.repository.ts](../src/modules/queue/queue.repository.ts)

- L42 — variável: `result`

### [src/modules/requests/requests.repository.ts](../src/modules/requests/requests.repository.ts)

- L93 — variável: `mapping`
- L205 — variável: `row`
- L419 — variável: `row`
- L513 — variável: `response`
- L739 — variável: `row`
- L878 — variável: `row`
- L1047 — variável: `row`

### [src/modules/requests/requests.service.ts](../src/modules/requests/requests.service.ts)

- L259 — parâmetro: `value`

### [src/modules/requests/triage/triage.repository.ts](../src/modules/requests/triage/triage.repository.ts)

- L132 — variável: `row`

### [src/modules/users/users.repository.ts](../src/modules/users/users.repository.ts)

- L293 — variável: `user`
- L310 — variável: `[requester, professional]`
- L719 — variável: `result`
- L753 — variável: `existing`
- L776 — variável: `anon`

### [src/server.ts](../src/server.ts)

- L8 — parâmetro: `e`

### [src/shared/access/assignability.ts](../src/shared/access/assignability.ts)

- L136 — variável: `row`
- L170 — variável: `row`

### [src/shared/middleware/auth.ts](../src/shared/middleware/auth.ts)

- L24 — variável: `token`

### [src/shared/middleware/upload.ts](../src/shared/middleware/upload.ts)

- L57 — parâmetro: `err`

### [src/shared/middleware/uploadAssets.ts](../src/shared/middleware/uploadAssets.ts)

- L125 — parâmetro: `err`

### [src/shared/middleware/uploadAvatar.ts](../src/shared/middleware/uploadAvatar.ts)

- L70 — parâmetro: `err`

### [src/shared/utils/json.ts](../src/shared/utils/json.ts)

- L8 — parâmetro: `v`
- L8 — retorno da função: `<anônima>()`
