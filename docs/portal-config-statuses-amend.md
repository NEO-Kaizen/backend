# Contrato de API — Configuração do Portal (PortalConfig) — Delta `statuses` v4 + Ciclo

> **Delta sobre `backend/docs/portal-config-api-0_4.md` + `frontend/contratos/portal-config-api-0_4.md`.** Altera **apenas** `PortalConfig.statuses` e unifica ciclo em **3 endpoints** (`POST triage`, `PUT mapping`, `PATCH /status` com bypass Admin). Todo `status change` exige `justification` (`1..4000`) — `override` difere só por `ADMIN pode ir para qualquer isActive` (bypass `triageMode/mappingMode/isRestricted`). `access, identity, theme, assets, categories, prioritization-weights` idênticos à 0_4.

- Fonte: `product-response v4 §1.2` (17-row truth), `contract-triage_04.md` §4, `solicitations-api-requests-0_4.md`.
- Referências: `shared/types/portalConfig.ts`, `portalConfig.schema.ts:140-186`, `portalConfig.service.ts:261-270`, `triage.service.ts:46`, `mapping.service.ts:300-364`, `requests.service.ts:206`.
- Autenticação: `GET /portal-config` **público**; `PATCH /portal-config/statuses` e os 3 endpoints de ciclo exigem `session_id` (`Administrador` ou `ANALYST_ASSIGNEE`).

---

## Changelog (0_4 → delta v4)

- `PortalStatus` 6→9 campos: `isCore, isPublic, isTerminal, triageMode, mappingMode, isRestricted` (normaliza `Acessível+Apenas → triageMode/mappingMode`, `allowedRoles → isRestricted`, `closesRequest → isTerminal`, 6 core). Ordem de exibição = ordem do array (sem `order` explícito).
- `PATCH /portal-config/statuses` valida novos enums + `isCore`/`isRestricted` e seed 17 → Anexo A (Priorizado `none/none&true`, terminais só `16,17`).
- `POST triage` / `PUT mapping` validam `triageMode/mappingMode + isRestricted` em vez de `isTriageExit`.
- **Todo** `status change` exige `justification` (`1..4000`); `PATCH /requests/:protocol/status` único: `ADMIN` bypassa `triageMode/mappingMode/isRestricted` (qualquer `isActive`), analista só `free` (`isRestricted=false`). Sem rota `.../status/override` separada.

---

## Tipos compartilhados — alteração

> Trecho substitui `portal-config-api-0_4.md` §Tipos `PortalStatus` e `StatusVisibility`/`closesRequest`/`isTriageExit`.

```ts
// Tom visual — allowlist semântica (mantido 0_4)
export const STATUS_TONES = ["error", "success", "info", "warning", "neutral"] as const;
export type StatusTone = (typeof STATUS_TONES)[number];

// Modo por fase (normaliza Acessível triage/mapping + Apenas triage/mapping)
export type StatusMode = "none" | "free" | "conclusion_only";

// Status do ciclo de vida — fonte única do PortalConfig.
// `isCore` substitui PROTECTED_STATUS_NAMES (service.ts:261 8→6 core).
// `isTerminal` unifica closesRequest/is_final/closes_request (só 16,17).
// `isRestricted` substitui allowedRoles (só 11 Priorizado).
export interface PortalStatus {
  id: number; // 1..50, estável (max+1 aceito)
  name: string; // 1..40 trim, único ci
  isCore: boolean; // 6 vitais não apagam/renomeiam/desativam
  isPublic: boolean; // true = solicitante vê esse nome; false = interno só equipe, solicitante vê último status público
  isTerminal: boolean; // encerra solicitação (qualquer status pode ser terminal; por padrão só Concluído/Cancelado)
  triageMode: StatusMode; // none|free(via PATCH /status)|conclusion_only(via POST triage)
  mappingMode: StatusMode; // none|free|conclusion_only(via PUT mapping)
  isRestricted: boolean; // false=assignee|Admin, true=Admin-only via override
  tone: StatusTone;
  isActive: boolean;
}
```

---

## 1. GET /portal-config — alteração (statuses item)

Público. Mesmos headers de `portal-config-api-0_4.md` §1 — só o item `statuses` muda.

```json
// antes (0_4)
{
  "id": 4,
  "name": "Pendente de informações",
  "visibility": "PUBLIC",
  "closesRequest": false,
  "isTriageExit": true,
  "tone": "warning",
  "isActive": true
}

// depois (delta v4)
{
  "id": 4,
  "name": "Pendente de informações",
  "isCore": true,
  "isPublic": true,
  "isTerminal": false,
  "triageMode": "free",
  "mappingMode": "free",
  "isRestricted": false,
  "isActive": true,
  "tone": "warning"
}
```

**Response 200** — `PortalConfig` com `statuses` no novo shape (exemplo completo em `portal-config-api-0_4.md` §1 com este item substituído).

**Compat:** durante rollout aceitar leitura `visibility/isTriageExit/closesRequest` como alias (`isPublic`, `triageMode`, `isTerminal`) se cliente antigo enviar.

---

## 2. PATCH /portal-config/statuses — Status (Card 6) — alteração

> Substitui `portal-config-api-0_4.md` §7 na íntegra para a seção `statuses`.

Admin. **Lista atômica**: envia a lista completa; a ordem de exibição é a ordem do array.

**Body:**

```ts
export interface UpdateStatusesRequest {
  statuses: PortalStatus[];
}
```

**Validações:**

- `1..50` itens; `id` pos int; `name` 1..40 trim, único ci; `isCore/isPublic/isTerminal/isRestricted/isActive: bool`; `triageMode/mappingMode: enum none|free|conclusion_only`; `tone: STATUS_TONES`; ao menos um `isActive=true`.
- `isCore && !isActive` → `400` (core não desativa).
- `isRestricted && (triageMode!=="none" || mappingMode!=="none")` → `400` (Priorizado `none/none` only via override).
- `PROTECTED_STATUS_NAMES` (service.ts:261 8 nomes) → `isCore` (6 fixos `id` 1,3,4,7,16,17).
- Seed após: `product-response v4 §1.2` 17 linhas (`5 conclusion_only/none`, `6 none/conclusion_only`, `11 none/none&true`, `16,17 isTerminal true`).

**Response 200** — `StatusesSection` (lista consolidada).

**Erros:** `400` (vazia, >50, item inválido, nome repetido, `isCore`/`isRestricted` violado, nenhum ativo), `401`, `403`, `409` (tentativa de renomear/remover core — id fixo), `500`.

---

## 3. Endpoints de ciclo — amend/create (impacto de `PortalStatus`)

> Erros no envelope `{ "status": "error", "statusCode": number, "message": string }` e `422` com `fields`. **Toda** mudança de status exige `justification` (`1..4000`) — `PATCH /status` único com `ADMIN bypass` (qualquer `isActive`). Guards `isAdminOrAssignee` (`triage.service.ts:46`, `mapping.service.ts:300-364`, `requests.service.ts:206`) inline — sem novo middleware.

### 3.1 POST /requests/:protocol/triage — amend (`contract-triage_04.md` §1)

Não idempotente — cada chamada gera `id` uuid novo; última triagem é vigente (`contract-triage_04.md:139-143`). Validação de `exitStatus` passa de `isTriageExit:bool` para `triageMode`.

| Endpoint                          | Autenticação            | Permissão                                                                                                                                                                                                 |
| --------------------------------- | ----------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `POST /requests/:protocol/triage` | `session_id` (HttpOnly) | `Administrador` ou `ANALYST_ASSIGNEE` (`user.id == assigneeId`) → `403` caso contrário (`Gestor` read-only). `isRestricted==true` (Priorizado) bloqueia mesmo assignee → via `PATCH /status` ADMIN bypass |

**Request:**

```http
POST /requests/MAAT-8K3P-9X2M/triage HTTP/1.1
Content-Type: application/json
Cookie: session_id=<sessão>

{
  "adherentToScope": "Sim",
  "adherentJustification": "",
  "changeCategory": "Não",
  "newCategory": "",
  "preliminaryComplexity": "Média — integração com sistema de ponto",
  "perceivedRisks": "Divergência em marcações manuais",
  "suggestedResponsible": "Ana Souza",
  "suggestedResponsibleJustification": "Experiência prévia",
  "exitStatus": 9,
  "result": "Encaminhado para mapeamento",
  "conclusionJustification": "Demanda aderente ao escopo"
}
```

**Body:**

```ts
export type CreateTriagePayload = Omit<TriageAssessment, "id">;
// exitStatus é PortalStatus.id (number) — frontend envia id filtrado por triageMode
```

**Validações 422 (espelha `contract-triage_04.md:299-318` + delta v4):**

| Campo                               | Regra                                                                                         | Limite |
| ----------------------------------- | --------------------------------------------------------------------------------------------- | ------ |
| `adherentToScope`                   | obrigatório `Sim\|Não`                                                                        | —      |
| `adherentJustification`             | obrigatório se `Não`, trim não-vazio                                                          | 1000   |
| `changeCategory`                    | obrigatório `Sim\|Não`                                                                        | —      |
| `newCategory`                       | se `Sim`, `RequestCategory` ativo (`categories` com `isActive`)                               | 40     |
| `preliminaryComplexity`             | obrigatório se `Sim`                                                                          | 4000   |
| `perceivedRisks`                    | obrigatório se `Sim`                                                                          | 4000   |
| `suggestedResponsible`              | opcional                                                                                      | 150    |
| `suggestedResponsibleJustification` | opcional                                                                                      | 1000   |
| `exitStatus`                        | obrigatório, id pos int, `isActive && isRestricted===false && (triageMode==="conclusion_only" |        | triageMode==="free")` | —   |
| `result`                            | obrigatório trim não-vazio                                                                    | 1000   |
| `conclusionJustification`           | obrigatório trim não-vazio                                                                    | 4000   |

**Response 201 — `TriageAssessment`:**

```ts
export interface TriageAssessment {
  id: string; /* ...CreateTriagePayload */
}
```

```json
HTTP/1.1 201 Created

{
  "id": "660e8400-e29b-41d4-a716-446655440100",
  "adherentToScope": "Sim",
  "adherentJustification": "",
  "changeCategory": "Não",
  "newCategory": "",
  "preliminaryComplexity": "Média — integração com sistema de ponto",
  "perceivedRisks": "Divergência em marcações manuais",
  "suggestedResponsible": "Ana Souza",
  "suggestedResponsibleJustification": "Experiência prévia",
  "exitStatus": 9,
  "result": "Encaminhado para mapeamento",
  "conclusionJustification": "Demanda aderente ao escopo"
}
```

**Efeitos colaterais (transação atômica):**

```ts
if (changeCategory === "Sim") demand.category = newCategory;
status = portalConfig.statuses.find((s) => s.id === exitStatus)!.name;
lastUpdate = now().toISOString();
```

**Exemplo real — com troca de categoria:**

```http
POST /requests/MAAT-7C4F-1NXR/triage HTTP/1.1
Content-Type: application/json
Cookie: session_id=abc

{
  "adherentToScope": "Não",
  "adherentJustification": "Fora do escopo — apoio pontual",
  "changeCategory": "Sim",
  "newCategory": "Apoio técnico",
  "preliminaryComplexity": "Baixa",
  "perceivedRisks": "Nenhum",
  "suggestedResponsible": "",
  "suggestedResponsibleJustification": "",
  "exitStatus": 13,
  "result": "Direcionada para apoio",
  "conclusionJustification": "Não aderente, mas elegível para apoio"
}
```

**Exemplo de erro — `exitStatus` restrito/inativo:**

```json
HTTP/1.1 422 Unprocessable Entity

{
  "status": "error",
  "statusCode": 422,
  "message": "Validação falhou",
  "fields": {
    "exitStatus": "Status de saída deve ser um status ativo com triageMode free ou conclusion_only e isRestricted=false"
  }
}
```

**Exemplo de erro — sem custódia (403 com code):**

```json
HTTP/1.1 403 Forbidden

{
  "status": "error",
  "statusCode": 403,
  "message": "Ação restrita ao Administrador ou ao Analista responsável pela demanda.",
  "code": "INSUFFICIENT_ROLE_PERMISSIONS"
}
```

**Erros:**

| Status | Quando                                                                              |
| ------ | ----------------------------------------------------------------------------------- |
| 401    | Sem `session_id` / sessão inválida/expirada                                         |
| 403    | Não é `Administrador` nem `ANALYST_ASSIGNEE`; ou `isRestricted===true` (Priorizado) |
| 404    | Protocolo inexistente                                                               |
| 422    | Body fora das validações acima (`fields` por campo)                                 |
| 500    | Erro genérico                                                                       |

**curl:**

```bash
curl -s -X POST http://localhost:3000/requests/MAAT-8K3P-9X2M/triage \
  -H "Content-Type: application/json" \
  -b "session_id=$SESSION_ID" \
  -d '{
    "adherentToScope": "Sim",
    "adherentJustification": "",
    "changeCategory": "Não",
    "newCategory": "",
    "preliminaryComplexity": "Média — integração",
    "perceivedRisks": "Divergência manual",
    "suggestedResponsible": "Ana Souza",
    "suggestedResponsibleJustification": "Experiência prévia",
    "exitStatus": 9,
    "result": "Encaminhado para mapeamento",
    "conclusionJustification": "Demanda aderente ao escopo"
  }' | jq .
```

### 3.2 PUT /queue/requests/:protocol/mapping — amend (`queue.router.ts:35-40`, `mapping.service.ts:300-468`)

Lista de espera interna — reutiliza duplo guard `canDesignate/canEditContent` existente.

| Endpoint                                | Autenticação | Permissão                                                                                            |
| --------------------------------------- | ------------ | ---------------------------------------------------------------------------------------------------- |
| `PUT /queue/requests/:protocol/mapping` | `session_id` | `Administrador` ou assignee triagem/mapeamento + `isRestricted===false` (Priorizado só via override) |

**Request:**

```http
PUT /queue/requests/MAAT-8K3P-9X2M/mapping HTTP/1.1
Content-Type: application/json
Cookie: session_id=<sessão>

{
  "mappingAssigneeId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
  "scheduledFor": "2026-10-15T10:30:00.000Z",
  "durationMinutes": 60,
  "modality": "REMOTE",
  "meetingLink": "https://meet.example/abc",
  "notes": "Mapeamento com área de negócio",
  "completeMapping": true,
  "targetStatus": 6
}
```

**Body:**

```ts
export interface PutMappingPayload {
  mappingAssigneeId?: string | null; // uuid do maapeador
  scheduledFor?: string | null; // ISO datetime
  durationMinutes?: number | null; // 15..480
  modality?: "REMOTE" | "IN_PERSON" | null;
  meetingLink?: string | null;
  location?: string | null;
  notes?: string | null;
  participants?: string[]; // ids de usuário, max 20, sem duplicado
  completeMapping: boolean; // true = conclui e avança status
  targetStatus?: number; // id de PortalStatus, obrigatório se completeMapping:true
}
```

**Validações:**

| Campo                    | Regra                                                                                       | Limite  |
| ------------------------ | ------------------------------------------------------------------------------------------- | ------- |
| `mappingAssigneeId`      | se presente, uuid ativo `ASSIGNABLE_PROFILES`                                               | —       |
| `scheduledFor`           | se `completeMapping`, obrigatório ISO                                                       | —       |
| `durationMinutes`        | se `completeMapping`, obrigatório `15..480`                                                 | 480     |
| `modality`               | se `completeMapping`, obrigatório                                                           | —       |
| `meetingLink`/`location` | obrigatório conforme `modality`                                                             | 500/200 |
| `targetStatus`           | se `completeMapping`, `isActive && isRestricted===false && (mappingMode==="conclusion_only" |         | mappingMode==="free")` | —   |

**Response 200 — `MappingDetail`:**

```json
HTTP/1.1 200 OK

{
  "protocol": "MAAT-8K3P-9X2M",
  "status": "Mapeamento agendado",
  "mappingAssigneeId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
  "scheduledFor": "2026-10-15T10:30:00.000Z",
  "durationMinutes": 60,
  "modality": "REMOTE",
  "meetingLink": "https://meet.example/abc"
}
```

**Exemplo de erro — `targetStatus` inválido:**

```json
HTTP/1.1 422 Unprocessable Entity

{
  "status": "error",
  "statusCode": 422,
  "message": "Validação falhou",
  "fields": {
    "targetStatus": "Status deve ter mappingMode free ou conclusion_only e isRestricted=false"
  }
}
```

**Erros:**

| Status | Quando                                                                                                    |
| ------ | --------------------------------------------------------------------------------------------------------- |
| 401    | Sem sessão                                                                                                |
| 403    | `403 {code:INSUFFICIENT_ROLE_PERMISSIONS}` — não é assignee/designado ou `isRestricted===true`            |
| 404    | Protocolo inexistente                                                                                     |
| 422    | Solicitação já `isTerminal`/`is_concluded`, campos de `completeMapping` faltando, `targetStatus` inválido |

**curl:**

```bash
curl -s -X PUT http://localhost:3000/queue/requests/MAAT-8K3P-9X2M/mapping \
  -H "Content-Type: application/json" \
  -b "session_id=$SESSION_ID" \
  -d '{
    "completeMapping": true,
    "targetStatus": 6,
    "scheduledFor": "2026-10-15T10:30:00.000Z",
    "durationMinutes": 60,
    "modality": "REMOTE",
    "meetingLink": "https://meet.example/abc"
  }' | jq .
```

### 3.3 PATCH /requests/:protocol/status — create (único, free + admin bypass)

Substitui `3.3` + `3.4` anteriores — rota única. `ADMIN` faz bypass (qualquer `isActive`); analista só `free` (`isRestricted=false`).

| Endpoint                           | Autenticação | Permissão                                                                                                                         |
| ---------------------------------- | ------------ | --------------------------------------------------------------------------------------------------------------------------------- |
| `PATCH /requests/:protocol/status` | `session_id` | `Administrador` (bypass `triageMode/mappingMode/isRestricted`, qualquer `isActive`) ou `ANALYST_ASSIGNEE` (`user.id == assigneeId |     | mappingAssigneeId`, `Gestor`ADMIN-like) limitado a`free` (`isRestricted===false`) |

**Request — analista (free):**

```http
PATCH /requests/MAAT-8K3P-9X2M/status HTTP/1.1
Content-Type: application/json
Cookie: session_id=<sessão>

{
  "targetStatus": 4,
  "justification": "Solicitante precisa anexar layout de entrada"
}
```

**Request — admin (bypass para Priorizado):**

```http
PATCH /requests/MAAT-8K3P-9X2M/status HTTP/1.1
Content-Type: application/json
Cookie: session_id=<admin>

{
  "targetStatus": 11,
  "justification": "Priorização extraordinária autorizada pela gerência"
}
```

**Body:**

```ts
export interface UpdateStatusRequest {
  targetStatus: number; // PortalStatus.id 1..50
  justification: string; // 1..4000 obrigatório trim não-vazio — toda mudança exige justificativa
}
```

**Validações:**

| Campo           | Regra                                                                                                                                              | Limite |
| --------------- | -------------------------------------------------------------------------------------------------------------------------------------------------- | ------ |
| `targetStatus`  | obrigatório, id pos int. Se `ADMIN` → `isActive===true` (inativo → `409`); se analista → `isActive && isRestricted===false && (triageMode==="free" |        | mappingMode==="free")` para fase atual | —   |
| `justification` | obrigatório trim não-vazio                                                                                                                         | 4000   |

**Response 200:**

```ts
export interface UpdateStatusResponse {
  protocol: string;
  status: string;
  previous: string;
  next: string;
  lastUpdate: string;
}
```

```json
HTTP/1.1 200 OK

{
  "protocol": "MAAT-8K3P-9X2M",
  "status": "Pendente de informações",
  "previous": "Em triagem",
  "next": "Pendente de informações",
  "lastUpdate": "2026-09-23T10:00:00.000Z"
}
```

**Exemplo de erro — status restrito para analista:**

```json
HTTP/1.1 403 Forbidden

{
  "status": "error",
  "statusCode": 403,
  "message": "Status Priorizado só pode ser definido por Administrador.",
  "code": "INSUFFICIENT_ROLE_PERMISSIONS"
}
```

**Exemplos de erro — justification / inativo:**

```json
HTTP/1.1 400 Bad Request

{
  "status": "error",
  "statusCode": 400,
  "message": "Campos inválidos: justification — Campo obrigatório."
}
```

```json
HTTP/1.1 409 Conflict

{
  "status": "error",
  "statusCode": 409,
  "message": "Status inativo não pode ser alvo."
}
```

**Erros:**

| Status | Quando                                                                                                                                                                                                    |
| ------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 401    | Sem sessão                                                                                                                                                                                                |
| 403    | Sem custódia ou `isRestricted===true` sem ser `ADMIN` ou `triageMode/mappingMode !== free` sem bypass → `code:INSUFFICIENT_ROLE_PERMISSIONS` + audit `ACCESS_DENIED`; analista tentando `Priorizado` etc. |
| 400    | `justification` ausente/vazia                                                                                                                                                                             |
| 404    | Protocolo ou `targetStatus` inexistente                                                                                                                                                                   |
| 422    | `targetStatus` já é o atual                                                                                                                                                                               |
| 409    | `targetStatus` inativo (`isActive===false`)                                                                                                                                                               |
| 500    | Erro genérico                                                                                                                                                                                             |

**Audit:** `ADMIN` bypass → `OVERRIDE_STATUS_ADMIN`; normal → `request.status_change`.

**curl:**

```bash
# analista free
curl -s -X PATCH http://localhost:3000/requests/MAAT-8K3P-9X2M/status \
  -H "Content-Type: application/json" \
  -b "session_id=$SESSION_ID" \
  -d '{"targetStatus": 4, "justification": "Solicitante precisa anexar layout"}' | jq .

# admin bypass (Priorizado none/none)
curl -s -X PATCH http://localhost:3000/requests/MAAT-8K3P-9X2M/status \
  -H "Content-Type: application/json" \
  -b "session_id=$ADMIN_SESSION" \
  -d '{"targetStatus": 11, "justification": "Priorização extraordinária autorizada pela gerência"}' | jq .
```

---

## Observações / divergências (delta)

- `isPublic` ← `visibility`, `isTerminal` ← `closesRequest/is_final`, `triageMode/mappingMode` ← `is_triage_exit + Acessível/Apenas`, `isRestricted` ← `allowedRoles`, `isCore` ← `PROTECTED_STATUS_NAMES` (8→6 core), ordem de exibição = ordem do array (sem `order` explícito).
- `auditCatalog.ts:13` add `override_status_admin, access_denied` (reusa `atribuicao_responsavel`).

---

## Anexo A — Defaults para seed (amend of `portal-config-api-0_4.md` Anexo A)

19→17 base (`18 Fora do escopo, 19 Duplicada` são saídas `isTriageExit` de `contract-triage_04.md` — não entram aqui; Priorizado agora `none/none&true`).

| id  | name                        | isCore | isPublic | isTerminal | triageMode      | mappingMode     | isRestricted | tone    | isActive |
| --- | --------------------------- | ------ | -------- | ---------- | --------------- | --------------- | ------------ | ------- | -------- |
| 1   | Solicitação enviada         | true   | true     | false      | none            | none            | false        | neutral | true     |
| 2   | Aguardando triagem          | false  | true     | false      | none            | none            | false        | info    | true     |
| 3   | Em triagem                  | true   | true     | false      | free            | none            | false        | info    | true     |
| 4   | Pendente de informações     | true   | true     | false      | free            | free            | false        | warning | true     |
| 5   | Aguardando mapeamento       | false  | true     | false      | conclusion_only | none            | false        | info    | true     |
| 6   | Mapeamento agendado         | false  | false    | false      | none            | conclusion_only | false        | info    | true     |
| 7   | Em mapeamento               | true   | true     | false      | none            | free            | false        | info    | true     |
| 8   | Em análise de viabilidade   | false  | false    | false      | free            | free            | false        | info    | true     |
| 9   | Elegível                    | false  | false    | false      | conclusion_only | conclusion_only | false        | success | true     |
| 10  | Não elegível                | false  | false    | false      | conclusion_only | conclusion_only | false        | error   | true     |
| 11  | Priorizado                  | false  | false    | false      | none            | none            | true         | warning | true     |
| 12  | Backlog                     | false  | false    | false      | conclusion_only | conclusion_only | false        | neutral | true     |
| 13  | Direcionado para outra área | false  | false    | false      | conclusion_only | conclusion_only | false        | neutral | true     |
| 14  | Em desenvolvimento          | false  | false    | false      | free            | none            | false        | info    | true     |
| 15  | Em homologação              | false  | false    | false      | free            | none            | false        | info    | true     |
| 16  | Concluído                   | true   | true     | true       | conclusion_only | conclusion_only | false        | success | true     |
| 17  | Cancelado                   | true   | true     | true       | conclusion_only | conclusion_only | false        | error   | true     |
