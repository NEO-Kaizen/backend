# Inventário de tipagens TypeScript

> Arquivo gerado por `npm run docs:types` a partir dos arquivos `src/**/*.ts` e do `tsconfig.json` do projeto. Não edite manualmente: rode o comando para atualizar. Não inclui dependências nem arquivos `.d.ts`.

## Resumo

- Arquivos-fonte analisados: **199**.
- Tipos nomeados: **388** — 265 interfaces, 121 aliases `type`, 2 classes e 0 enums.
- Declarações sem anotação explícita: **2305** — 1684 variáveis, 307 parâmetros e 314 retornos de funções/métodos.
- Declarações com tipo efetivo `any` detectado pelo checker: **50**; ocorrências com a palavra-chave `any` explícita no código-fonte: **0**.
- Arquivos com pelo menos uma declaração sem anotação: **151**; arquivos sem ocorrências são omitidos das seções 2 e 3.
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
  ip_address: string | null;
  /** Valor persistido em `audit_history.change_origin`; histórico pode estar fora de `ChangeOrigin`. */
  change_origin: string | null;
  /** Chaves exigidas e ausentes nas recusas; vazio nas demais ações. */
  denied_permission_keys: string[];
  occurred_at: string;
}
```

#### L52 — interface AuditHistoryListResponse

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
}
```

#### L173 — alias MappingHistoryBaseRow

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

#### L93 — interface TimelineEntry

```ts
interface TimelineEntry {
  item: TimelineItem;
  timeMs: number;
  rank: number;
  id: bigint;
}
```

#### L198 — interface ActorSource

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

#### L10 — interface RequestRef

```ts
export interface RequestRef {
  request_id: string;
  protocol: string;
  title: string;
  status: string;
  status_id: number;
  requester_user_id: number | null;
  requester_name: string;
  requester_email: string;
  responsible_user_id: number | null;
}
```

#### L53 — alias PendingItemRow

```ts
export type PendingItemRow = z.infer<typeof pendingItemRowSchema>;
```

#### L65 — alias PendingAttachmentRow

```ts
export type PendingAttachmentRow = z.infer<typeof pendingAttachmentRowSchema>;
```

#### L357 — alias PendingItemInsert

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

#### L370 — alias RespondFacts

```ts
export type RespondFacts = {
  requestedRemaining: number;
  attachmentSatisfied: boolean;
  currentStatusName: string;
};
```

#### L376 — alias ReviewDecisionInput

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

#### L386 — alias ReviewFacts

```ts
export type ReviewFacts = { hasReopen: boolean };
```

#### L388 — alias SavedPendingAttachment

```ts
export type SavedPendingAttachment = {
  fileName: string;
  mimeType: string;
  sizeBytes: number;
  storageKey: string;
};
```

#### L534 — alias PendingItemResponsePatch

```ts
export type PendingItemResponsePatch = { corrected_value: string } | { response_text: string };
```

#### L536 — interface PendingItemResponseInput

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

#### L548 — interface PendingItemResponseResult

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

#### L297 — alias PendingCaller

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

#### L18 — interface MappingRow

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

#### L42 — interface MappingParticipantRow

```ts
export interface MappingParticipantRow {
  userId: number | null;
  name: string;
  email: string;
}
```

#### L49 — interface MappingRequestContext

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

#### L69 — interface MappingAssigneeCandidate

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

#### L151 — interface MappingTargetRow

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

### [src/modules/requests/requests.repository.ts](../src/modules/requests/requests.repository.ts)

#### L44 — interface YesNoDetailColumns

```ts
interface YesNoDetailColumns {
  flag: boolean | null;
  detail: string | null;
}
```

#### L159 — interface RequestInsertReturning

```ts
interface RequestInsertReturning {
  request_id: string;
  protocol: string;
  created_at: Date;
}
```

#### L348 — interface RequestSummaryRow

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

#### L428 — interface RequestWithOwner

```ts
export interface RequestWithOwner {
  detail: RequestDetail;
  requesterEmail: string;
  requesterUserId: number | null;
}
```

#### L503 — interface RequestAttachmentRow

```ts
export interface RequestAttachmentRow {
  attachment_id: string;
  file_name: string;
  content_type: string;
  size_bytes: string; // bigint do pg
}
```

#### L511 — interface SchedulePreferenceRow

```ts
export interface SchedulePreferenceRow {
  scheduled_for: Date | string;
}
```

#### L842 — interface RequestStatusContext

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

#### L858 — interface RequestStatusTarget

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

#### L205 — alias AssignAnalystPayload

```ts
export type AssignAnalystPayload = z.infer<typeof assignAnalystSchema>;
```

#### L225 — alias UpdateStatusPayload

```ts
export type UpdateStatusPayload = z.infer<typeof updateStatusSchema>;
```

### [src/modules/requests/requests.service.ts](../src/modules/requests/requests.service.ts)

#### L87 — interface AuthenticatedIdentity

```ts
interface AuthenticatedIdentity {
  fullName: string;
  email: string;
}
```

#### L92 — alias RequestActor

```ts
type RequestActor = PermissionActor;
```

#### L94 — interface RequestMutationAcknowledgement

```ts
interface RequestMutationAcknowledgement {
  readonly protocol: string;
  readonly updated: true;
}
```

#### L519 — interface TrackingCaller

```ts
export interface TrackingCaller {
  user?: AuthenticatedUser;
  requesterIdentity?: { name: string; email: string } | null;
}
```

#### L764 — interface InternalRequestRow

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

#### L6 — interface StatusRow

```ts
export interface StatusRow {
  status_id: number;
  name: string;
  isPublic: boolean;
  isRestricted: boolean;
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
export interface RequestContextRow {
  request_id: string;
  protocol: string;
  professional_id: string | null;
  assignee_user_id: number | null;
  status_id: number;
  status_name: string | null;
  status_is_restricted: boolean;
  status_is_terminal: boolean;
  category_name: string | null;
  requester_user_id: number | null;
  title: string;
}
```

#### L54 — interface TriageRow

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

#### L190 — interface ApplyRequestOutcomeInput

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

#### L51 — interface CommitTriageDecisionInput

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

#### L73 — alias AuditEntityType

```ts
export type AuditEntityType = keyof typeof auditCatalog;
```

#### L81 — alias ChangeOrigin

```ts
export type ChangeOrigin =
  "user" | "admin" | "system" | "requester" | "manual" | "internal" | "self";
```

#### L85 — alias AuditActionOf

```ts
export type AuditActionOf<E extends AuditEntityType> = (typeof auditCatalog)[E]["actions"][number];
```

#### L88 — alias ComposedAuditAction

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

#### L40 — alias AuditEntry

```ts
export type AuditEntry<
  E extends AuditEntityType = AuditEntityType,
  A extends ComposedAuditAction<E> = ComposedAuditAction<E>,
> = AuditEntryBase & { entityType: E; actionType: A };
```

#### L45 — interface ActorProfileRow

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
  | "mapping.assign";
```

#### L35 — alias AuditTimelineAction

```ts
export type AuditTimelineAction =
  TimelineEventAction | "request.override_status_admin" | "request.status_override";
```

#### L38 — alias TimelineChangeOrigin

```ts
export type TimelineChangeOrigin = "admin" | "system" | "internal" | null;
```

#### L40 — interface TimelineCursor

```ts
export interface TimelineCursor {
  t: Date;
  type: "note" | "event";
  id: string;
}
```

#### L46 — interface TimelineEventRow

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

#### L66 — interface TriageHistoryRow

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

#### L87 — interface MappingHistoryParticipant

```ts
export interface MappingHistoryParticipant {
  userId: number | null;
  name: string;
  email: string;
}
```

#### L94 — interface MappingHistoryAssignee

```ts
export interface MappingHistoryAssignee {
  id: string;
  userId: number;
  name: string;
  email: string;
  jobTitle: string | null;
}
```

#### L103 — interface MappingHistoryRow

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

#### L135 — interface AssignmentCandidateRow

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

#### L159 — interface InternalRequestRow

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
- L74 — variável: `AuditHistoryListResponse`

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

- L187 — variável: `schemas`

### [src/docs/schemas/internalNotes.ts](../src/docs/schemas/internalNotes.ts)

- L8 — variável: `TimelineActor`
- L24 — variável: `TimelineNote`
- L36 — variável: `TimelineEvent`
- L72 — variável: `InternalNotesResponse`
- L92 — variável: `CreateInternalNoteRequest`
- L100 — variável: `MarkInternalNotesReadRequest`

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
- L529 — variável: `RequesterRequestDetails`
- L573 — variável: `PublicTrackingResponse`
- L582 — variável: `AuthenticatedTrackingResponse`
- L591 — variável: `TrackingResponse`
- L599 — variável: `AssigneeSummary`
- L611 — variável: `AssignRequestPayload`
- L625 — variável: `AssignRequestResponse`
- L644 — variável: `AssignAnalystPayload`
- L667 — variável: `UpdateStatusPayload`
- L695 — variável: `UpdateStatusResponse`

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

- L45 — retorno da função: `responsibleProtocols()`
- L53 — retorno da função: `responsibleMappingIds()`
- L62 — retorno da função: `responsiblePendingItemIds()`
- L79 — variável: `userId`
- L81 — parâmetro: `where`
- L81 — retorno da função: `<anônima>()`
- L83 — parâmetro: `requestScope`
- L83 — retorno da função: `<anônima>()`
- L88 — parâmetro: `mappingScope`
- L88 — retorno da função: `<anônima>()`
- L93 — parâmetro: `pendingScope`
- L93 — retorno da função: `<anônima>()`
- L94 — parâmetro: `pendingTarget`
- L94 — retorno da função: `<anônima>()`
- L107 — variável: `query`
- L126 — variável: `countQuery`
- L132 — variável: `totalRow`
- L133 — variável: `total`
- L135 — variável: `page`
- L136 — variável: `limit`
- L137 — variável: `offset`
- L138 — variável: `items`
- L184 — variável: `row`
- L192 — variável: `byProtocol`
- L197 — variável: `byItem`
- L241 — parâmetro: `rows`
- L241 — retorno da função: `<anônima>()`

### [src/modules/auditHistory/auditHistory.router.ts](../src/modules/auditHistory/auditHistory.router.ts)

- L10 — variável: `noStore`
- L19 — variável: `auditHistoryRoutes`
- L44 — variável: `auditLogsRouter`

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

- L28 — variável: `custody`
- L44 — variável: `{ items, total }`
- L46 — parâmetro: `row`
- L46 — retorno da função: `<anônima>()`
- L73 — variável: `occurredAt`
- L75 — variável: `userId`
- L107 — variável: `row`
- L118 — variável: `scope`
- L120 — variável: `protocol`
- L121 — variável: `request`
- L122 — variável: `isVisible`
- L154 — variável: `normalized`
- L156 — variável: `request`
- L169 — variável: `rows`
- L170 — parâmetro: `row`
- L170 — retorno da função: `<anônima>()`

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

- L31 — variável: `MAPPING_RECORD_ACTIONS`
- L33 — variável: `NOTE_COLUMNS`
- L70 — variável: `query`
- L76 — parâmetro: `builder`
- L76 — retorno da função: `<anônima>()`
- L77 — parâmetro: `nested`
- L77 — retorno da função: `<anônima>()`
- L101 — variável: `query`
- L103 — parâmetro: `scope`
- L103 — retorno da função: `<anônima>()`
- L105 — parâmetro: `requestScope`
- L105 — retorno da função: `<anônima>()`
- L111 — parâmetro: `mappingScope`
- L111 — retorno da função: `<anônima>()`
- L124 — variável: `auditId`
- L125 — parâmetro: `builder`
- L125 — retorno da função: `<anônima>()`
- L126 — parâmetro: `nested`
- L126 — retorno da função: `<anônima>()`
- L160 — variável: `query`
- L168 — variável: `row`
- L175 — variável: `TRIAGE_HISTORY_COLUMNS`
- L222 — variável: `latestAudit`
- L231 — variável: `rows`
- L233 — retorno da função: `<anônima>()`
- L259 — parâmetro: `row`
- L259 — retorno da função: `<anônima>()`
- L259 — variável: `mappingIds`
- L260 — variável: `professionalIds`
- L261 — parâmetro: `id`
- L261 — parâmetro: `row`
- L261 — retorno da função: `<anônima>()`
- L264 — variável: `[participantRows, assigneeRows]`
- L291 — variável: `participantsByMapping`
- L292 — variável: `participant`
- L293 — variável: `list`
- L302 — parâmetro: `assignee`
- L302 — retorno da função: `<anônima>()`
- L302 — variável: `assigneeById`
- L304 — parâmetro: `row`
- L304 — retorno da função: `<anônima>()`
- L321 — parâmetro: `row`
- L321 — retorno da função: `<anônima>()`
- L329 — variável: `rows`
- L333 — parâmetro: `row`
- L333 — retorno da função: `<anônima>()`
- L350 — parâmetro: `row`
- L350 — retorno da função: `<anônima>()`
- L367 — variável: `rows`
- L377 — variável: `row`

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
- L86 — variável: `payload`
- L124 — variável: `entries`
- L125 — variável: `page`
- L126 — variável: `oldest`
- L127 — variável: `nextCursor`
- L129 — parâmetro: `entry`
- L129 — retorno da função: `<anônima>()`
- L134 — variável: `parsed`
- L171 — variável: `numericId`
- L172 — variável: `statusName`
- L176 — variável: `userId`
- L177 — variável: `name`
- L181 — variável: `userId`
- L182 — variável: `name`
- L189 — variável: `name`
- L221 — variável: `date`
- L265 — parâmetro: `participant`
- L265 — retorno da função: `<anônima>()`
- L289 — variável: `userIds`
- L290 — variável: `professionalIds`
- L291 — variável: `statusIds`
- L293 — variável: `row`
- L295 — variável: `userId`
- L300 — variável: `statusId`
- L309 — variável: `[userNames, professionalNames, statusNames]`
- L315 — parâmetro: `row`
- L315 — retorno da função: `<anônima>()`
- L338 — variável: `requestId`
- L339 — variável: `cursor`
- L340 — variável: `pageLimit`
- L342 — variável: `readState`
- L344 — variável: `[noteRows, eventRows, unseenCount, triageRows, mappingRows]`
- L352 — variável: `events`
- L353 — variável: `notes`
- L354 — variável: `{ items, nextCursor }`
- L371 — variável: `requestId`
- L372 — variável: `internalNoteId`
- L377 — variável: `note`
- L391 — variável: `requestId`
- L392 — variável: `note`

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

- L23 — variável: `pendingFieldValueSchema`
- L26 — variável: `dbBigIntStringSchema`
- L28 — parâmetro: `value`
- L28 — retorno da função: `<anônima>()`
- L30 — variável: `dbTimestampSchema`
- L33 — variável: `pendingItemRowSchema`
- L56 — variável: `pendingAttachmentRowSchema`
- L62 — parâmetro: `value`
- L62 — retorno da função: `<anônima>()`
- L68 — variável: `parsed`
- L91 — variável: `conn`
- L92 — variável: `row`
- L124 — variável: `conn`
- L125 — variável: `row`
- L163 — variável: `row`
- L176 — variável: `conn`
- L177 — variável: `row`
- L188 — variável: `conn`
- L189 — variável: `rows`
- L200 — variável: `conn`
- L201 — variável: `row`
- L212 — variável: `grouped`
- L215 — variável: `conn`
- L216 — variável: `rows`
- L221 — variável: `row`
- L222 — variável: `attachment`
- L223 — variável: `list`
- L235 — variável: `conn`
- L236 — variável: `row`
- L249 — variável: `conn`
- L250 — variável: `rows`
- L256 — parâmetro: `r`
- L256 — retorno da função: `<anônima>()`
- L256 — variável: `map`
- L257 — variável: `requested`
- L258 — variável: `responded`
- L259 — variável: `validated`
- L272 — variável: `conn`
- L274 — variável: `rows`
- L284 — variável: `byBatch`
- L285 — variável: `row`
- L286 — variável: `entry`
- L287 — variável: `count`
- L294 — variável: `candidates`
- L295 — parâmetro: `[, s]`
- L295 — retorno da função: `<anônima>()`
- L299 — variável: `requiresAttachment`
- L303 — parâmetro: `[batchId]`
- L303 — retorno da função: `<anônima>()`
- L307 — parâmetro: `r`
- L307 — retorno da função: `<anônima>()`
- L307 — variável: `requiresSet`
- L309 — variável: `attachmentCounts`
- L311 — variável: `counts`
- L321 — variável: `c`
- L324 — variável: `[batchId, summary]`
- L335 — variável: `conn`
- L336 — variável: `row`
- L342 — variável: `count`
- L344 — variável: `lastUnreadAt`
- L349 — variável: `row`
- L399 — variável: `row`
- L454 — variável: `conn`
- L455 — variável: `rows`
- L473 — parâmetro: `row`
- L473 — retorno da função: `<anônima>()`
- L473 — variável: `toInsert`
- L489 — variável: `current`
- L490 — variável: `pendingStatusId`
- L525 — variável: `rows`
- L562 — variável: `row`
- L566 — variável: `currentItem`
- L579 — variável: `auditId`
- L590 — variável: `requestedCount`
- L594 — variável: `requestedRemaining`
- L596 — variável: `requiresAttachment`
- L599 — variável: `attachmentSatisfied`
- L603 — variável: `current`
- L604 — variável: `nextStatusName`
- L611 — variável: `statusId`
- L625 — variável: `updated`
- L638 — parâmetro: `trx`
- L638 — retorno da função: `<anônima>()`
- L687 — variável: `hasReopen`
- L689 — variável: `actionAuditIds`
- L690 — variável: `rememberFirstAudit`
- L694 — variável: `dec`
- L695 — variável: `row`
- L699 — variável: `currentStatus`
- L710 — variável: `validateAuditId`
- L733 — variável: `reopenAuditId`
- L747 — variável: `nextStatusName`
- L749 — variável: `statusId`
- L761 — variável: `rows`
- L764 — parâmetro: `d`
- L764 — retorno da função: `<anônima>()`
- L787 — variável: `col`
- L789 — variável: `v`
- L793 — variável: `requesterRow`
- L815 — variável: `col`
- L818 — variável: `category`
- L861 — variável: `col`
- L888 — variável: `entry`

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
- L284 — variável: `notifications`
- L293 — variável: `mapped`
- L303 — variável: `TRACKING_INVALID_IDENTITY`
- L320 — variável: `nameOk`
- L321 — variável: `emailOk`
- L338 — variável: `request`
- L341 — variável: `actor`
- L346 — variável: `canReadAssigned`
- L351 — variável: `canRespondOwn`
- L380 — variável: `request`
- L383 — variável: `actor`
- L405 — variável: `request`
- L406 — variável: `rows`
- L407 — variável: `items`
- L416 — variável: `openRow`
- L417 — parâmetro: `row`
- L417 — retorno da função: `<anônima>()`
- L419 — variável: `targetRow`
- L420 — variável: `batchId`
- L421 — variável: `requestAttachment`
- L423 — parâmetro: `row`
- L423 — retorno da função: `<anônima>()`
- L435 — variável: `{ request, actorEmail }`
- L441 — variável: `row`
- L449 — variável: `type`
- L467 — variável: `response`
- L480 — parâmetro: `trx`
- L480 — retorno da função: `<anônima>()`
- L480 — variável: `updated`
- L481 — variável: `result`
- L490 — parâmetro: `facts`
- L490 — retorno da função: `<anônima>()`
- L498 — variável: `actorUserId`
- L499 — variável: `audience`
- L505 — variável: `committedNotifications`
- L520 — variável: `list`
- L537 — variável: `{ request }`
- L543 — variável: `row`
- L559 — variável: `[saved]`
- L569 — variável: `err`
- L609 — variável: `date`
- L631 — variável: `nullableComplement`
- L661 — variável: `request`
- L671 — variável: `batchId`
- L672 — variável: `batchRows`
- L675 — parâmetro: `row`
- L675 — retorno da função: `<anônima>()`
- L675 — variável: `byId`
- L677 — variável: `decision`
- L678 — variável: `row`
- L680 — variável: `status`
- L692 — parâmetro: `decision`
- L692 — retorno da função: `<anônima>()`
- L696 — variável: `row`
- L697 — variável: `fieldKey`
- L706 — parâmetro: `trx`
- L706 — retorno da função: `<anônima>()`
- L706 — variável: `decidedRows`
- L707 — variável: `{ rows: reviewedRows, actionAuditIds }`
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

- L17 — variável: `row`
- L24 — variável: `row`
- L38 — variável: `scoreRounded`
- L57 — variável: `row`
- L72 — variável: `data`
- L82 — variável: `rows`
- L88 — variável: `row`

### [src/modules/prioritization/prioritization.router.ts](../src/modules/prioritization/prioritization.router.ts)

- L9 — variável: `prioritizationRoutes`

### [src/modules/prioritization/prioritization.schema.ts](../src/modules/prioritization/prioritization.schema.ts)

- L5 — variável: `noteSchema`
- L12 — variável: `criterionKeySchema`
- L24 — variável: `evaluateScoreSchema`
- L25 — parâmetro: `notes`
- L25 — retorno da função: `<anônima>()`

### [src/modules/prioritization/prioritization.service.ts](../src/modules/prioritization/prioritization.service.ts)

- L21 — variável: `rows`
- L22 — parâmetro: `row`
- L22 — retorno da função: `<anônima>()`
- L42 — variável: `exists`
- L47 — variável: `assigneeUserId`
- L52 — variável: `canEvaluate`
- L71 — variável: `criteria`
- L75 — variável: `score`
- L76 — variável: `classification`
- L84 — parâmetro: `trx`
- L84 — retorno da função: `<anônima>()`
- L84 — variável: `evaluation`
- L85 — variável: `previous`
- L94 — variável: `row`
- L141 — parâmetro: `row`
- L141 — retorno da função: `<anônima>()`
- L141 — variável: `validIds`
- L143 — parâmetro: `row`
- L143 — retorno da função: `<anônima>()`
- L143 — variável: `missing`
- L145 — parâmetro: `row`
- L145 — retorno da função: `<anônima>()`
- L145 — variável: `list`
- L149 — parâmetro: `key`
- L149 — retorno da função: `<anônima>()`
- L149 — variável: `unknown`
- L157 — variável: `shown`
- L163 — variável: `somaPonderada`
- L164 — parâmetro: `acc`
- L164 — parâmetro: `row`
- L164 — retorno da função: `<anônima>()`
- L167 — parâmetro: `acc`
- L167 — parâmetro: `row`
- L167 — retorno da função: `<anônima>()`
- L167 — variável: `somaPesos`
- L178 — variável: `range`

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

- L88 — variável: `findMappingRequestContext`
- L92 — variável: `row`
- L157 — variável: `resolveMappingTarget`
- L167 — retorno da função: `<anônima>()`
- L179 — variável: `findMappingAssigneeCandidate`
- L187 — variável: `row`
- L218 — variável: `findCurrentMapping`
- L222 — variável: `row`
- L232 — variável: `findLatestOpenMapping`
- L236 — variável: `row`
- L246 — variável: `findMappingById`
- L251 — variável: `row`
- L265 — variável: `findMappingParticipants`
- L287 — variável: `resolveParticipantUsers`
- L295 — variável: `rows`
- L306 — parâmetro: `id`
- L306 — retorno da função: `<anônima>()`
- L306 — variável: `invalid`
- L307 — parâmetro: `r`
- L307 — retorno da função: `<anônima>()`
- L307 — variável: `row`
- L316 — parâmetro: `row`
- L316 — retorno da função: `<anônima>()`
- L323 — variável: `insertMapping`
- L335 — variável: `[row]`
- L356 — variável: `updateMapping`
- L394 — variável: `clearRequestMappingAssignee`
- L407 — variável: `replaceMappingParticipants`
- L419 — parâmetro: `participant`
- L419 — retorno da função: `<anônima>()`

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

- L88 — variável: `date`
- L151 — parâmetro: `participant`
- L151 — retorno da função: `<anônima>()`
- L183 — parâmetro: `participant`
- L183 — retorno da função: `<anônima>()`
- L214 — variável: `textField`
- L215 — variável: `next`
- L216 — variável: `normalized`
- L263 — parâmetro: `participant`
- L263 — retorno da função: `<anônima>()`
- L263 — variável: `userIds`
- L267 — variável: `usersById`
- L269 — parâmetro: `participant`
- L269 — variável: `resolved`
- L274 — variável: `user`
- L281 — variável: `seenEmails`
- L282 — variável: `seenUserIds`
- L283 — variável: `participant`
- L284 — variável: `emailKey`
- L312 — variável: `getMappingService`
- L317 — variável: `context`
- L339 — variável: `mapping`
- L344 — variável: `[participants, assigneeCandidate]`
- L357 — variável: `upsertMappingService`
- L363 — variável: `{ response, committed }`
- L366 — parâmetro: `trx`
- L366 — retorno da função: `<anônima>()`
- L369 — variável: `context`
- L414 — variável: `mapping`
- L425 — variável: `previousProfessionalId`
- L432 — variável: `explicitDesignation`
- L433 — variável: `isNullOnCreate`
- L434 — variável: `designationAction`
- L438 — variável: `contentAction`
- L459 — variável: `candidate`
- L491 — variável: `currentValues`
- L492 — variável: `values`
- L494 — variável: `concluding`
- L504 — variável: `target`
- L535 — variável: `missing`
- L545 — variável: `resolvedParticipants`
- L552 — variável: `designationChanged`
- L587 — variável: `changeOrigin`
- L591 — variável: `previousAuditValues`
- L598 — variável: `nextAuditValues`
- L610 — variável: `mappingAuditId`
- L695 — parâmetro: `participant`
- L695 — retorno da função: `<anônima>()`
- L702 — variável: `assigneeCandidate`
- L712 — variável: `scheduledAt`
- L713 — variável: `committedNotifications`
- L727 — variável: `response`

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
- L78 — variável: `{ search, status, priority, assigneeId, unassigned, createdFrom, createdTo, department, scopedUserId, noteCustodianUserId, }`
- L92 — variável: `searchPattern`
- L94 — parâmetro: `builder`
- L94 — retorno da função: `<anônima>()`
- L104 — parâmetro: `notesQuery`
- L104 — retorno da função: `<anônima>()`
- L136 — parâmetro: `builder`
- L136 — retorno da função: `<anônima>()`
- L144 — parâmetro: `builder`
- L144 — retorno da função: `<anônima>()`
- L156 — parâmetro: `builder`
- L156 — retorno da função: `<anônima>()`

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
- L92 — variável: `id`
- L105 — variável: `patchInternalRequestByProtocol`
- L109 — variável: `protocol`
- L111 — variável: `parsed`
- L113 — variável: `{ message, fields }`
- L117 — variável: `updated`
- L127 — variável: `postRequest`
- L141 — variável: `parsed`
- L145 — variável: `multerFiles`
- L146 — variável: `attachments`
- L148 — variável: `savedAttachments`
- L150 — variável: `response`
- L159 — variável: `getRequestsByEmail`
- L167 — variável: `parsed`
- L173 — variável: `requests`
- L185 — variável: `parsed`
- L191 — variável: `requests`
- L196 — variável: `getAssignees`
- L200 — variável: `patchAssignee`
- L201 — variável: `protocol`
- L203 — variável: `parsed`
- L208 — variável: `response`
- L218 — variável: `patchInternalAssignee`
- L219 — variável: `protocol`
- L221 — variável: `parsed`
- L226 — variável: `response`
- L236 — variável: `patchRequestStatus`
- L237 — variável: `protocol`
- L239 — variável: `parsed`
- L244 — variável: `response`

### [src/modules/requests/requests.repository.ts](../src/modules/requests/requests.repository.ts)

- L42 — variável: `INITIAL_STATUS`
- L82 — variável: `email`
- L129 — variável: `row`
- L143 — variável: `requesterId`
- L166 — variável: `result`
- L170 — variável: `row`
- L187 — variável: `email`
- L188 — variável: `requestId`
- L190 — variável: `manualControls`
- L191 — variável: `processDocumentation`
- L192 — variável: `similarSolution`
- L193 — variável: `otherAreas`
- L194 — variável: `restrictedInfo`
- L196 — variável: `insertedRows`
- L255 — variável: `row`
- L274 — parâmetro: `scheduledFor`
- L274 — retorno da função: `<anônima>()`
- L293 — parâmetro: `attachment`
- L293 — retorno da função: `<anônima>()`
- L310 — parâmetro: `trx`
- L310 — retorno da função: `<anônima>()`
- L311 — variável: `categoryId`
- L317 — variável: `statusId`
- L318 — variável: `requesterId`
- L319 — variável: `saved`
- L328 — variável: `email`
- L343 — variável: `row`
- L358 — variável: `PUBLIC_STATUS_SUMMARY_SQL`
- L361 — retorno da função: `baseSummaryQuery()`
- L378 — parâmetro: `builder`
- L378 — retorno da função: `<anônima>()`
- L388 — variável: `countRows`
- L394 — variável: `total`
- L396 — variável: `rows`
- L411 — parâmetro: `row`
- L411 — retorno da função: `<anônima>()`
- L437 — variável: `response`
- L470 — variável: `meetingScheduledFor`
- L472 — variável: `meeting`
- L476 — variável: `openedAt`
- L518 — variável: `hasMapping`
- L520 — variável: `query`
- L548 — variável: `baseSelect`
- L615 — variável: `mappingSelect`
- L659 — variável: `row`
- L678 — variável: `profileIds`
- L704 — variável: `numericId`
- L755 — variável: `hasMapping`
- L774 — variável: `query`
- L786 — variável: `row`
- L830 — variável: `statusId`
- L872 — variável: `hasMappingColumn`
- L889 — variável: `query`
- L901 — variável: `row`
- L926 — retorno da função: `<anônima>()`
- L985 — variável: `manualControls`
- L986 — variável: `processDocumentation`
- L987 — variável: `similarSolution`
- L988 — variável: `otherAreas`
- L989 — variável: `restrictedInfo`

### [src/modules/requests/requests.router.ts](../src/modules/requests/requests.router.ts)

- L23 — variável: `requestsRoutes`

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
- L186 — variável: `analystIdSchema`
- L188 — variável: `assignAnalystSchema`
- L193 — parâmetro: `ctx`
- L193 — parâmetro: `data`
- L193 — retorno da função: `<anônima>()`
- L194 — variável: `hasAssignee`
- L195 — variável: `hasMapping`
- L214 — variável: `updateStatusSchema`

### [src/modules/requests/requests.service.ts](../src/modules/requests/requests.service.ts)

- L126 — variável: `user`
- L139 — variável: `normalizedProtocol`
- L141 — variável: `found`
- L151 — variável: `identity`
- L152 — variável: `isOwner`
- L168 — retorno da função: `registerRequest()`
- L176 — variável: `payload`
- L182 — variável: `err`
- L192 — variável: `identity`
- L209 — variável: `email`
- L218 — variável: `normalizedEmail`
- L254 — parâmetro: `value`
- L254 — retorno da função: `<anônima>()`
- L262 — variável: `request`
- L274 — parâmetro: `row`
- L274 — retorno da função: `<anônima>()`
- L284 — variável: `canReadInternalNotes`
- L289 — variável: `canReadPendingItems`
- L295 — variável: `requestId`
- L296 — variável: `[attachments, schedulePreferences, evaluation]`
- L305 — variável: `meeting`
- L315 — retorno da função: `<anônima>()`
- L315 — variável: `pendingSummary`
- L325 — variável: `summary`
- L326 — variável: `correctionAlert`
- L327 — variável: `unreadRaw`
- L366 — variável: `openedAt`
- L367 — variável: `lastUpdate`
- L369 — variável: `assigneeUserId`
- L370 — variável: `mappingUserId`
- L372 — variável: `assignee`
- L381 — variável: `mappingAssignee`
- L445 — parâmetro: `row`
- L445 — retorno da função: `<anônima>()`
- L449 — parâmetro: `attachment`
- L449 — retorno da função: `<anônima>()`
- L488 — variável: `trimmed`
- L495 — variável: `record`
- L499 — variável: `{ __triage: _triage, observations: _obs, ...rest }`
- L524 — variável: `TRACKING_INVALID_IDENTITY`
- L527 — variável: `scheduledFor`
- L593 — variável: `openedAt`
- L614 — variável: `requestId`
- L615 — variável: `[attachments, schedulePreferences]`
- L620 — variável: `meeting`
- L621 — variável: `complementary`
- L624 — variável: `{ impacts, ...base }`
- L646 — parâmetro: `preference`
- L646 — retorno da função: `<anônima>()`
- L651 — parâmetro: `attachment`
- L651 — retorno da função: `<anônima>()`
- L683 — variável: `row`
- L703 — variável: `mode`
- L714 — variável: `row`
- L719 — variável: `nameOk`
- L722 — variável: `emailOk`
- L744 — variável: `normalizedProtocol`
- L871 — variável: `request`
- L877 — parâmetro: `row`
- L877 — retorno da função: `<anônima>()`
- L881 — parâmetro: `trx`
- L881 — retorno da função: `<anônima>()`
- L900 — variável: `updatedRequest`
- L922 — variável: `RN010_ELIGIBLE_SCREENING`
- L959 — variável: `candidate`
- L960 — variável: `assignable`
- L974 — variável: `candidate`
- L975 — variável: `assignable`
- L992 — variável: `error`
- L1016 — variável: `request`
- L1022 — parâmetro: `row`
- L1022 — retorno da função: `<anônima>()`
- L1028 — variável: `assignee`
- L1031 — retorno da função: `<anônima>()`
- L1035 — variável: `previousId`
- L1036 — variável: `nextId`
- L1038 — variável: `auditNext`
- L1039 — variável: `auditPrev`
- L1042 — variável: `action`
- L1044 — variável: `shouldAdvanceStatus`
- L1052 — variável: `previousMapping`
- L1053 — variável: `auditPrevMapping`
- L1059 — parâmetro: `trx`
- L1059 — retorno da função: `<anônima>()`
- L1062 — variável: `auditId`
- L1140 — variável: `request`
- L1146 — parâmetro: `row`
- L1146 — retorno da função: `<anônima>()`
- L1152 — variável: `hasAssignee`
- L1153 — variável: `hasMapping`
- L1158 — variável: `raw`
- L1160 — variável: `previous`
- L1161 — variável: `auditPrev`
- L1164 — parâmetro: `trx`
- L1164 — retorno da função: `<anônima>()`
- L1181 — retorno da função: `<anônima>()`
- L1181 — variável: `resolved`
- L1184 — variável: `previous`
- L1185 — variável: `auditPrev`
- L1188 — variável: `previousMapping`
- L1189 — variável: `auditPrevMapping`
- L1192 — variável: `action`
- L1193 — variável: `shouldAdvance`
- L1196 — parâmetro: `trx`
- L1196 — retorno da função: `<anônima>()`
- L1203 — variável: `auditId`
- L1260 — variável: `raw`
- L1262 — variável: `previous`
- L1263 — variável: `auditPrev`
- L1266 — parâmetro: `trx`
- L1266 — retorno da função: `<anônima>()`
- L1283 — retorno da função: `<anônima>()`
- L1283 — variável: `resolved`
- L1286 — variável: `previous`
- L1287 — variável: `auditPrev`
- L1290 — variável: `previousAssignee`
- L1291 — variável: `auditPrevAssignee`
- L1294 — variável: `action`
- L1295 — parâmetro: `trx`
- L1295 — retorno da função: `<anônima>()`
- L1302 — variável: `auditId`
- L1350 — variável: `updatedRequest`
- L1425 — variável: `request`
- L1431 — parâmetro: `row`
- L1431 — retorno da função: `<anônima>()`
- L1435 — variável: `target`
- L1454 — variável: `requiresOverride`
- L1456 — variável: `hasStatusOverride`
- L1479 — variável: `changeOrigin`
- L1481 — parâmetro: `trx`
- L1481 — retorno da função: `<anônima>()`
- L1481 — variável: `{ lastUpdate, committed }`
- L1482 — variável: `persistedAt`
- L1494 — variável: `auditId`
- L1519 — variável: `committedNotifications`

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

- L73 — variável: `TRIAGE_COLUMNS`
- L126 — variável: `row`
- L160 — retorno da função: `<anônima>()`
- L182 — variável: `raw`
- L202 — variável: `{ protocol, categoryId, statusId, isStatusPublic, lastTechnicalMessage, expectedStatusId, updatedBy, trx, }`
- L212 — variável: `source`
- L239 — variável: `updatedRows`

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

- L69 — variável: `{ protocol, request, triage, categoryId, exitStatus, actor, ipAddress }`
- L71 — parâmetro: `trx`
- L71 — retorno da função: `<anônima>()`
- L84 — variável: `triageAuditId`
- L152 — variável: `request`
- L157 — variável: `canAccess`
- L174 — variável: `request`
- L197 — variável: `canAccess`
- L214 — variável: `exitStatus`
- L235 — variável: `categoryName`
- L237 — variável: `newCategory`
- L272 — variável: `committedNotifications`

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
- L101 — parâmetro: `action`
- L101 — retorno da função: `<anônima>()`

### [src/shared/audit/auditLogger.ts](../src/shared/audit/auditLogger.ts)

- L105 — variável: `actorProfile`
- L107 — variável: `rows`
- L125 — variável: `row`

### [src/shared/catalog/baseProfiles.ts](../src/shared/catalog/baseProfiles.ts)

- L33 — variável: `entry`
- L47 — parâmetro: `key`
- L47 — retorno da função: `<anônima>()`
- L52 — parâmetro: `entry`
- L52 — retorno da função: `<anônima>()`
- L149 — parâmetro: `profile`
- L149 — retorno da função: `<anônima>()`
- L149 — variável: `rootProfiles`
- L155 — variável: `seenNames`
- L157 — variável: `profile`
- L163 — variável: `seenKeys`
- L165 — variável: `grant`

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

- L92 — variável: `row`
- L125 — variável: `row`
- L177 — variável: `row`
- L349 — variável: `row`
- L399 — variável: `row`
- L596 — variável: `requiresAttachment`
- L793 — variável: `requesterRow`
- L818 — variável: `category`

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

- L17 — variável: `row`
- L24 — variável: `row`
- L57 — variável: `row`

### [src/modules/profiles/profiles.repository.ts](../src/modules/profiles/profiles.repository.ts)

- L89 — variável: `row`

### [src/modules/queue/mapping.repository.ts](../src/modules/queue/mapping.repository.ts)

- L92 — variável: `row`
- L187 — variável: `row`
- L222 — variável: `row`
- L236 — variável: `row`
- L251 — variável: `row`
- L307 — parâmetro: `r`
- L307 — variável: `row`
- L316 — parâmetro: `row`
- L335 — variável: `[row]`

### [src/modules/queue/queue.repository.ts](../src/modules/queue/queue.repository.ts)

- L42 — variável: `result`

### [src/modules/requests/requests.repository.ts](../src/modules/requests/requests.repository.ts)

- L129 — variável: `row`
- L343 — variável: `row`
- L437 — variável: `response`
- L659 — variável: `row`
- L786 — variável: `row`
- L901 — variável: `row`

### [src/modules/requests/requests.service.ts](../src/modules/requests/requests.service.ts)

- L254 — parâmetro: `value`

### [src/modules/requests/triage/triage.repository.ts](../src/modules/requests/triage/triage.repository.ts)

- L126 — variável: `row`

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
