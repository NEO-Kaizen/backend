# Contrato de API — Configuração do Portal (PortalConfig) — Delta `statuses` v4 + Ciclo

> **Delta sobre `backend/docs/portal-config-api-0_4.md` + `frontend/contratos/portal-config-api-0_4.md`.** Altera **apenas** `PortalConfig.statuses` e unifica ciclo em **3 endpoints** (`POST triage`, `PUT mapping`, `PATCH /status` com bypass Admin). Todo `status change` exige `justification` interna (`1..4000` após trim); **toda transição para um status público (`isPublic===true`) exige também `lastTechnicalMessage`** (`1..4000` após trim), independentemente do ator, e somente esse texto é retornado ao solicitante em `RequestDetail.lastTechnicalMessage`. A justificativa interna não substitui a mensagem pública. No `PUT mapping`, a reunião só é exigida quando `targetStatus === 6` (`Mapeamento agendado`, agora **core**); qualquer outro alvo exige `justification` + (se público) `lastTechnicalMessage`. O bypass do Admin difere somente nos gates de transição para qualquer `isActive`; não dispensa campos obrigatórios. `access, identity, theme, assets, categories, prioritization-weights` idênticos à 0_4.

- Fonte: `product-response v4 §1.2` (17-row truth), `contract-triage.md` §4, `solicitations-api-requests-0_4.md`.
- Referências: `shared/types/portalConfig.ts`, `portalConfig.schema.ts:140-186`, `portalConfig.service.ts:261-270`, `triage.service.ts:46`, `mapping.service.ts:300-364`, `requests.service.ts:206`.
- Autenticação: `GET /portal-config` é **público**; `PATCH /portal-config/statuses` exige `session_id` de `Administrador`; os 3 endpoints de ciclo exigem `session_id` de `Administrador` ou `ANALYST_ASSIGNEE`. `Gestor` é read-only no ciclo e não pode executar nenhum desses writes.

---

## Changelog (0_4 → delta v4)

- `PortalStatus` 6→9 campos: `isCore, isPublic, isTerminal, triageMode, mappingMode, isRestricted` (normaliza `Acessível+Apenas → triageMode/mappingMode`, `allowedRoles → isRestricted`, `closesRequest → isTerminal`, **7 core** — inclui `Mapeamento agendado` id 6). Ordem de exibição = ordem do array (sem `order` explícito).
- `PATCH /portal-config/statuses` valida novos enums + `isCore`/`isRestricted` e seed 17 → Anexo A (Priorizado `none/none&true`, terminais só `16,17`).
- `POST triage` / `PUT mapping` validam `triageMode/mappingMode + isRestricted` em vez de `isTriageExit`.
- **Todo** `status change` exige `justification` (`1..4000`); **toda transição para status público exige `lastTechnicalMessage`** (`1..4000`, retorno ao solicitante). `PATCH /requests/:protocol/status` único: `ADMIN` bypassa `triageMode/mappingMode/isRestricted` para qualquer status ativo; analista responsável só `free`, ativo e não restrito; `Gestor` permanece read-only. Sem rota `.../status/override` separada.
- **`PUT mapping` com lock de agendamento:** `targetStatus === 6` (`Mapeamento agendado`) exige reunião e dispensa `justification`/`lastTechnicalMessage`; `targetStatus !== 6` trava a reunião e exige `justification`, mais `lastTechnicalMessage` se o alvo for público.
- **`Mapeamento agendado` (id 6) passa a core** — não renomeia/remove/desativa; conjunto core 6→7 (`1,3,4,6,7,16,17`).

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
// `isCore` substitui PROTECTED_STATUS_NAMES (service.ts:261 8→7 core).
// `isTerminal` unifica closesRequest/is_final/closes_request (só 16,17).
// `isRestricted` substitui allowedRoles (só 11 Priorizado).
export interface PortalStatus {
  id: number; // 1..50, estável (max+1 aceito)
  name: string; // 1..40 trim, único ci
  isCore: boolean; // 7 vitais não apagam/renomeiam/desativam (1,3,4,6,7,16,17)
  isPublic: boolean; // true = solicitante vê esse nome; false = interno só equipe, solicitante vê último status público
  isTerminal: boolean; // encerra solicitação (qualquer status pode ser terminal; por padrão só Concluído/Cancelado)
  triageMode: StatusMode; // none|free(via PATCH /status)|conclusion_only(via POST triage)
  mappingMode: StatusMode; // none|free(via PATCH /status)|conclusion_only(via PUT mapping)
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
- `PROTECTED_STATUS_NAMES` (service.ts:261 8 nomes) → `isCore` (7 fixos `id` 1,3,4,6,7,16,17 — `Mapeamento agendado` incluído).
- Seed após: `product-response v4 §1.2` 17 linhas (`5 conclusion_only/none`, `6 none/conclusion_only`, `11 none/none&true`, `16,17 isTerminal true`).

**Response 200** — `StatusesSection` (lista consolidada).

**Erros:** `400` (vazia, >50, item inválido, nome repetido, `isCore`/`isRestricted` violado, nenhum ativo), `401`, `403`, `409` (tentativa de renomear/remover core — id fixo), `500`.

---

## 3. Endpoints de ciclo — amend/create (impacto de `PortalStatus`)

> Erros no envelope `{ "status": "error", "statusCode": number, "message": string }` e `422` com `fields`. **Toda** mudança de status exige `justification` (`1..4000`); **toda transição para status público exige também `lastTechnicalMessage`** (`1..4000`, texto exibido ao solicitante em `GET /requests/:protocol`). `PATCH /status` é único: `ADMIN` faz bypass apenas dos modos para qualquer status ativo; `ANALYST_ASSIGNEE` fica restrito a `free`, ativo e não restrito; `Gestor` não pode PATCH. Guards `isAdminOrAssignee` (`triage.service.ts:46`, `mapping.service.ts:300-364`, `requests.service.ts:206`) inline — sem novo middleware.

### 3.1 POST /requests/:protocol/triage — amend (`contract-triage.md` §1)

Não idempotente — cada chamada gera `id` uuid novo; última triagem é vigente (`contract-triage.md §1`). A validação de `exitStatus` usa o Status v4 e `triageMode`.

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

**Body:** `CreateTriagePayload` canônico definido em `contract-triage.md §Tipos
compartilhados` (`Omit<TriageAssessment, 'id' | 'assignee'>`). O cliente não redefine
o tipo nem envia `id`/`assignee`. `lastTechnicalMessage` é obrigatório, com 1..4000
caracteres após trim, quando o destino tiver `isPublic === true`; é o texto retornado
ao solicitante. `conclusionJustification` permanece obrigatória e interna. `exitStatus`
é `PortalStatus.id` (number), escolhido entre os destinos ativos, não restritos e com
`triageMode === "conclusion_only"`.

**Validações 422 (espelha `contract-triage.md §1` + delta v4):**

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
| `exitStatus`                        | obrigatório, id pos int, `isActive && isRestricted===false && triageMode==="conclusion_only"` | —      |
| `result`                            | obrigatório trim não-vazio                                                                    | 1000   |
| `conclusionJustification`           | obrigatório trim não-vazio                                                                    | 4000   |
| `lastTechnicalMessage`              | obrigatório se `exitStatus.isPublic`, trim não-vazio                                          | 4000   |

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
const exit = portalConfig.statuses.find((s) => s.id === exitStatus)!;
status = exit.name;
// Retorno ao solicitante — só quando o status de saída é público.
if (exit.isPublic) request.lastTechnicalMessage = payload.lastTechnicalMessage.trim();
// Liberação automática do responsável de triagem (custódia encerra aqui):
// requests.professional_id = null + audit `request.unassign` (changeOrigin system);
// o snapshot do autor permanece em `triages.assignee_*`.
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

**Exemplo — saída para status público (exige `lastTechnicalMessage`):**

```http
POST /requests/MAAT-8K3P-9X2M/triage HTTP/1.1
Content-Type: application/json
Cookie: session_id=abc

{
  "adherentToScope": "Sim",
  "adherentJustification": "",
  "changeCategory": "Não",
  "newCategory": "",
  "preliminaryComplexity": "Alta",
  "perceivedRisks": "Dados incompletos",
  "suggestedResponsible": "",
  "suggestedResponsibleJustification": "",
  "exitStatus": 5,
  "result": "Aguardando mapeamento",
  "lastTechnicalMessage": "Precisamos que você detalhe o volume mensal para prosseguirmos com a análise.",
  "conclusionJustification": "Volume mensal não informado na solicitação."
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
    "exitStatus": "Status de saída deve ser um status ativo com triageMode conclusion_only e isRestricted=false"
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
}
```

### 3.2 PUT /queue/requests/:protocol/mapping — amend (`queue.router.ts:35-40`, `mapping.service.ts:300-468`)

Lista de espera interna — reutiliza duplo guard `canDesignate/canEditContent` existente.

| Endpoint                                | Autenticação | Permissão                                                                                                                                        |
| --------------------------------------- | ------------ | ------------------------------------------------------------------------------------------------------------------------------------------------ |
| `PUT /queue/requests/:protocol/mapping` | `session_id` | `Administrador` ou `ANALYST_ASSIGNEE` responsável pela triagem/mapeamento, para alvo ativo com `isRestricted===false` (Priorizado só via bypass) |

**Request — agendamento (`targetStatus: 6`, exige reunião):**

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

**Request — encerramento sem agendamento (`targetStatus !== 6`, exige justificativa + retorno se público):**

```http
PUT /queue/requests/MAAT-8K3P-9X2M/mapping HTTP/1.1
Content-Type: application/json
Cookie: session_id=<sessão>

{
  "completeMapping": true,
  "targetStatus": 10,
  "justification": "Demanda não elegível após mapeamento técnico.",
  "lastTechnicalMessage": "Após o mapeamento, a demanda não atende aos critérios de elegibilidade."
}
```

**Body:**

```ts
export interface PutMappingPayload {
  mappingAssigneeId?: string | null; // uuid do mapeador
  // Reunião — obrigatória SOMENTE quando targetStatus === 6 (Mapeamento agendado):
  scheduledFor?: string | null; // ISO datetime — obrigatório se targetStatus === 6
  durationMinutes?: number | null; // 15..480 — obrigatório se targetStatus === 6
  modality?: "REMOTE" | "IN_PERSON" | null; // obrigatório se targetStatus === 6
  meetingLink?: string | null; // obrigatório se REMOTE (e targetStatus === 6)
  location?: string | null; // obrigatório se IN_PERSON (e targetStatus === 6)
  notes?: string | null; // observação da reunião — só quando targetStatus === 6
  participants?: string[]; // convocados — só quando targetStatus === 6 (ids, max 20, sem duplicado)
  completeMapping: boolean; // true = conclui e avança status
  targetStatus: number; // id de PortalStatus (id 6 = Mapeamento agendado)
  // Justificativa interna — obrigatória quando targetStatus !== 6:
  justification?: string | null; // 1..4000
  // Retorno ao solicitante — obrigatório quando targetStatus.isPublic:
  lastTechnicalMessage?: string | null; // 1..4000
}
```

**Validações:**

| Campo                                           | Regra                                                                                                    | Limite  |
| ----------------------------------------------- | -------------------------------------------------------------------------------------------------------- | ------- |
| `mappingAssigneeId`                             | se presente, uuid ativo `ASSIGNABLE_PROFILES`                                                            | —       |
| `targetStatus`                                  | se `completeMapping`, obrigatório: `isActive && isRestricted===false && mappingMode==="conclusion_only"` | —       |
| `scheduledFor` / `durationMinutes` / `modality` | **obrigatórios se `targetStatus === 6`** (agendamento)                                                   | 480     |
| `meetingLink` / `location`                      | obrigatório conforme `modality` — **somente quando `targetStatus === 6`**                                | 500/200 |
| `notes` / `participants`                        | lado reunião — só quando `targetStatus === 6` (caso contrário `null`/`[]`)                               | 2000/20 |
| `justification`                                 | obrigatório se `targetStatus !== 6`, trim não-vazio                                                      | 4000    |
| `lastTechnicalMessage`                          | obrigatório se `targetStatus.isPublic`, trim não-vazio                                                   | 4000    |

**Response 200 — `MappingDetail`:**

```json
HTTP/1.1 200 OK

{
  "protocol": "MAAT-8K3P-9X2M",
  "status": "Mapeamento agendado",
  "targetStatus": 6,
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
    "targetStatus": "Status deve ter mappingMode conclusion_only e isRestricted=false"
  }
}
```

**Erros:**

| Status | Quando                                                                                                                                                                                                            |
| ------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 401    | Sem sessão                                                                                                                                                                                                        |
| 403    | `403 {code:INSUFFICIENT_ROLE_PERMISSIONS}` — não é assignee/designado ou `isRestricted===true`                                                                                                                    |
| 404    | Protocolo inexistente                                                                                                                                                                                             |
| 422    | Solicitação já terminal, `targetStatus` inválido, reunião ausente quando `targetStatus === 6`, `justification` ausente quando `targetStatus !== 6`, `lastTechnicalMessage` ausente quando `targetStatus.isPublic` |

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

> **Notas de implementação (mapping).**
>
> - `justification` deixa de ser divergência: passa a ser **obrigatória quando `targetStatus !== 6`** (ver Body/validações).
> - `lastTechnicalMessage` (retorno ao solicitante) é obrigatório e gravado em `requests.last_technical_message` somente quando o destino é público; `justification` permanece interna. O texto é lido no `GET /requests/:protocol` público (`RequestDetail.lastTechnicalMessage`).
> - **Implementação pendente:** a UI do mapeamento (`MappingSection.svelte`) ainda não renderiza `targetStatus`/`justification`/`lastTechnicalMessage`; `mappingConclusionOptions` (`utils/status.ts:89`) segue sem uso; a validação é chamada sem `statuses` (`:146`/`:236`); `saveMappingMock` ignora `targetStatus`. Backend ainda no modelo 0_4 (detalhes em `plans/mapeamento-retorno-usuario.md`).
> - `MappingDetail` permanece ecoando `targetStatus`; `justification`/`lastTechnicalMessage` são write-only (não retornam no GET).
> - **Liberação automática:** quando `completeMapping:true` e `targetStatus !== 6`, o designado é removido (`requests.mapping_professional_id = null`) e grava-se `mapping.assign` com `newValue:null` (`changeOrigin: system`); a solicitação volta a ficar órfã. Agendar (`targetStatus === 6`) **mantém** o designado. O snapshot do designado permanece em `mappings.professional_id`.

### 3.3 PATCH /requests/:protocol/status — create (único, free + admin bypass)

Substitui `3.3` + `3.4` anteriores — rota única. A autorização é fechada:

- `Administrador` pode definir qualquer status com `isActive === true`, inclusive
  `conclusion_only` ou `isRestricted === true`.
- `ANALYST_ASSIGNEE` só pode definir um status `free`, com `isActive === true` e
  `isRestricted === false`, quando `user.id === assigneeId || user.id === mappingAssigneeId`.
- `Gestor` é read-only: não pode executar `PATCH /status`; uma tentative retorna
  `403 INSUFFICIENT_ROLE_PERMISSIONS`.
- O bypass do `Administrador` cobre somente `triageMode`, `mappingMode` e
  `isRestricted`; ele não dispensa `justification` nem `lastTechnicalMessage`.

| Endpoint                           | Autenticação | Permissão                                                                                                                                     |
| ---------------------------------- | ------------ | --------------------------------------------------------------------------------------------------------------------------------------------- |
| `PATCH /requests/:protocol/status` | `session_id` | `Administrador` para qualquer alvo ativo ou `ANALYST_ASSIGNEE` da solicitação para alvo `free`, ativo e não restrito; `Gestor` não autorizado |

**Request — analista (free):**

```http
PATCH /requests/MAAT-8K3P-9X2M/status HTTP/1.1
Content-Type: application/json
Cookie: session_id=<sessão>

{
  "targetStatus": 4,
  "justification": "Solicitante precisa anexar layout de entrada",
  "lastTechnicalMessage": "Precisamos do layout de entrada para continuar a análise."
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
  justification: string; // 1..4000 após trim — justificativa interna, obrigatória em toda mudança
  lastTechnicalMessage?: string; // 1..4000 após trim — obrigatória quando targetStatus.isPublic
}
```

`justification` é sempre interna e obrigatória, inclusive para o Admin. Se o
`targetStatus` tiver `isPublic === true`, `lastTechnicalMessage` também é obrigatória,
com 1..4000 caracteres após trim, para qualquer ator; quando o destino é interno, ela
não é exigida e não altera a mensagem pública anterior. A justificativa interna nunca
substitui `lastTechnicalMessage`.

**Validações:**

| Campo                  | Regra                                                                                                                                                                                                                           | Limite |
| ---------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------ |
| `targetStatus`         | obrigatório, id pos int. Para `ADMIN`, `isActive === true` e qualquer `triageMode`/`mappingMode`/`isRestricted`; para `ANALYST_ASSIGNEE`, `isActive && isRestricted===false && (triageMode==="free" \|\| mappingMode==="free")` | —      |
| `justification`        | obrigatório, trim não-vazio, uso interno                                                                                                                                                                                        | 4000   |
| `lastTechnicalMessage` | obrigatório, trim não-vazio, se `targetStatus.isPublic`; não substitui `justification`                                                                                                                                          | 4000   |

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

| Status | Quando                                                                                                                                                                                            |
| ------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 401    | Sem sessão                                                                                                                                                                                        |
| 403    | `Gestor`, usuário sem custódia, ou `ANALYST_ASSIGNEE` tentando alvo `isRestricted===true` ou sem `triageMode`/`mappingMode` `free` → `code:INSUFFICIENT_ROLE_PERMISSIONS` + audit `ACCESS_DENIED` |
| 400    | `justification` ausente/vazia ou fora de 1..4000 após trim; ou `lastTechnicalMessage` ausente/vazia ou fora de 1..4000 quando `targetStatus.isPublic`                                             |
| 404    | Protocolo ou `targetStatus` inexistente                                                                                                                                                           |
| 422    | `targetStatus` já é o atual                                                                                                                                                                       |
| 409    | `targetStatus` inativo (`isActive===false`)                                                                                                                                                       |
| 500    | Erro genérico                                                                                                                                                                                     |

**Audit:** `ADMIN` bypass → `OVERRIDE_STATUS_ADMIN`; normal → `request.status_change`.

**curl:**

```bash
# analista free
curl -s -X PATCH http://localhost:3000/requests/MAAT-8K3P-9X2M/status \
  -H "Content-Type: application/json" \
  -b "session_id=$SESSION_ID" \
  -d '{"targetStatus": 4, "justification": "Solicitante precisa anexar layout", "lastTechnicalMessage": "Precisamos do layout de entrada para continuar."}' | jq .

# admin bypass (Priorizado none/none)
curl -s -X PATCH http://localhost:3000/requests/MAAT-8K3P-9X2M/status \
  -H "Content-Type: application/json" \
  -b "session_id=$ADMIN_SESSION" \
  -d '{"targetStatus": 11, "justification": "Priorização extraordinária autorizada pela gerência"}' | jq .
```

---

## Observações / divergências (delta)

- `isPublic` ← `visibility`, `isTerminal` ← `closesRequest/is_final`, `triageMode/mappingMode` ← `is_triage_exit + Acessível/Apenas`, `isRestricted` ← `allowedRoles`, `isCore` ← `PROTECTED_STATUS_NAMES` (8→7 core), ordem de exibição = ordem do array (sem `order` explícito).
- `lastTechnicalMessage` (retorno ao solicitante) é o campo público `RequestDetail.lastTechnicalMessage` (`solicitations-api-requests-0_5.md`), escrito por triagem, mapeamento e `PATCH /status` quando o status de destino é público; persiste em `requests.last_technical_message`. `justification` continua interno.
- `Mapeamento agendado` (id 6) é o alvo de agendamento no `PUT mapping` (reunião obrigatória); por isso passa a `isCore` (estabilidade de id/nome/presença).
- `auditCatalog.ts:13` add `override_status_admin, access_denied` (reusa `atribuicao_responsavel`).

---

## Anexo A — Defaults para seed (amend of `portal-config-api-0_4.md` Anexo A)

Seed canônico do delta v4: 17 linhas; não há seed adicional fora desta tabela.

| id  | name                        | isCore | isPublic | isTerminal | triageMode      | mappingMode     | isRestricted | tone    | isActive |
| --- | --------------------------- | ------ | -------- | ---------- | --------------- | --------------- | ------------ | ------- | -------- |
| 1   | Solicitação enviada         | true   | true     | false      | none            | none            | false        | neutral | true     |
| 2   | Aguardando triagem          | false  | true     | false      | none            | none            | false        | info    | true     |
| 3   | Em triagem                  | true   | true     | false      | free            | none            | false        | info    | true     |
| 4   | Pendente de informações     | true   | true     | false      | free            | free            | false        | warning | true     |
| 5   | Aguardando mapeamento       | false  | true     | false      | conclusion_only | none            | false        | info    | true     |
| 6   | Mapeamento agendado         | true   | false    | false      | none            | conclusion_only | false        | info    | true     |
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
