# Contrato Backend — Diretório de Responsáveis

Frontend `feat/82-2-assign-analyst` (QuickActions → Atribuir analista). O que o backend precisa entregar.

> Base: `PUBLIC_API_URL` + `credentials: include` (cookie). Em `dev` o frontend usa mocks (`MOCK_DOMAINS.users` e `MOCK_DOMAINS.request`).

---

## Endpoints

### GET /users/analysts (rota legada)

Lista Responsáveis atribuíveis para o modal. Sem paginação; filtra pela etapa informada.

```http
GET /users/analysts?stage=triage -> 200 AssignableProfessional[]
GET /users/analysts?stage=mapping -> 200 AssignableProfessional[]
```

Exige sessão e `assignee_directory:read`. Retorna apenas contas ativas, com extensão profissional ativa, cujo Perfil ativo tem a flag de Atribuibilidade e todas as chaves de trabalho da etapa. A regra não depende do nome do Perfil.

**Query:** `stage` aceita `triage` ou `mapping`; ausente equivale a `triage` para compatibilidade. O backend filtra pelos perfis ativos cuja flag e chaves de Atribuibilidade atendem à etapa solicitada. `search` (nome/especialidade) e `category` continuam filtrados 100% no frontend (`AssignAction.svelte` com `normalize`).

**Resposta 200:**

```ts
AssignableProfessional[] // lista direta de profissionais atribuíveis à etapa, sem envelope paginado
```

> `listUsers` (admin) continua `GET /users?profile=&search=&category=&page=&pageSize=` paginado `PaginatedResponse<UserSummary>`; `listAssignableProfessionals` (assignment.service) usa `GET /users/analysts?stage=...` (ou omite a etapa para Triagem).

```ts
interface AssignableProfessional {
  id: string;
  fullName: string;
  email: string;
  specialty: string; // "" permitido → frontend oculta linha
  categories: RequestCategory[]; // [] permitido → sem chips
  notes: string | null; // null/vazio → sem bloco NOTAS
  requestLoad: number; // zero quando não há solicitações atribuídas
}
type RequestCategory =
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

**Erros:** `400` para `stage` inválido, `401` sem sessão, `403` sem `assignee_directory:read`, `500` → `{status:'error', statusCode, message}`.

**Exemplo (assignment — lista direta):**

```json
[
  {
    "id": "20",
    "fullName": "Rafael Alves",
    "email": "rafael.alves@maat.com.br",
    "specialty": "Eletricista residencial",
    "categories": ["Apoio técnico", "Automação"],
    "notes": "Atende à tarde; já atuou nesta região.",
    "requestLoad": 6
  }
]
```

---

### PATCH /requests/{protocol}/internal/assignee

Atribui responsável. Idempotente (sobrescreve). Mesma rota para as duas responsabilidades — **o corpo define qual campo**:

```http
PATCH /requests/{protocol}/internal/assignee
Content-Type: application/json
Cookie: <sessão>

Body (triagem):     { "assigneeId": "20" }
Body (mapeamento):  { "mappingAssigneeId": "22" }

-> 200 InternalRequestDetail (completo, atualizado)
```

**Regras backend:**

- Se `assigneeId` → `detail.assignee = {id, name, email}` do Responsável atribuível encontrado, `detail.lastUpdate = now`, refletir em `GET /queue` (`assigneeId`/`assignee`)
- Se `mappingAssigneeId` → `detail.mappingAssignee = {id, name, email}`, `detail.lastUpdate = now` (não altera `GET /queue` triagem)
- Revalidar extensão ativa, conta e Perfil ativos, flag da etapa e predicado de chaves de trabalho a cada designação e reatribuição
- `protocol` é `encodeURIComponent(protocol)` (ex.: `MAAT-8K3P-9X2M`)

**Resposta 200:** `InternalRequestDetail` com campo atualizado:

```ts
interface InternalRequestDetail {
  protocol: string;
  status: RequestStatus;
  priority: RequestPriority | null;
  prioritization: PrioritizationResult;
  assignee: { id: string | null; name: string | null; email?: string | null } | null;
  mappingAssignee?: { id: string | null; name: string | null; email?: string | null } | null; // novo
  // ... blocos requester/demand/operational/complementary, mappingDate/meeting, attachments, etc.
  lastUpdate: string;
  triage?: TriageAssessment | null;
}
```

**Erros:**

- `400` — body inválido ou alvo inválido (`assignee_not_assignable`)
- `401` — sem sessão ou sessão inválida
- `403` — ator sem `request:assign`
- `404` — `protocol` não encontrado ou fora da Custódia
- `500` — genérico
- Formato erro: `{status:'error', statusCode, message}` (e `code` quando presente)

**Exemplo triagem:**

```http
PATCH /requests/MAAT-8K3P-9X2M/internal/assignee
{ "assigneeId": "20" }
-> 200 { protocol:"MAAT-8K3P-9X2M", assignee:{id:"20", name:"Rafael Alves", email:"rafael.alves@maat.com.br"}, mappingAssignee:null, lastUpdate:"2026-09-18T10:30:00.000Z", ... }
```

**Exemplo mapeamento:**

```http
PATCH /requests/MAAT-8K3P-9X2M/internal/assignee
{ "mappingAssigneeId": "22" }
-> 200 { protocol:"MAAT-8K3P-9X2M", assignee:{id:"20", ...}, mappingAssignee:{id:"22", name:"Mariana Costa", email:"mariana.costa@maat.com.br"}, ... }
```

---

## GET /requests/{protocol}/internal (parte atribuição)

Campos novos retornados:

```ts
assignee: {id, name, email} | null
mappingAssignee?: {id, name, email} | null
```

Frontend exibe `Responsável` (triagem) no header (`SolicitationSpecs`) e usa `mappingAssignee` apenas via patch; lista do modal filtra só `isActive=true`.

---

## Tipos compartilhados

```ts
type AnalystResponsibility = "triagem" | "mapeamento";
```

Frontend envia `assigneeId` quando `responsibility === "triagem"`, `mappingAssigneeId` quando `"mapeamento"`. Sem efeito visual diferente no modal — só o body muda.

---

## Auth

Cookie obrigatório. `GET /users/analysts` exige `assignee_directory:read`; `PATCH .../assignee` exige `request:assign` e Custódia da solicitação. O nome do Perfil não participa da autorização.

---

## Mocks (DEV)

- `src/lib/mocks/users.mock.ts` — `mockUsers` com 6 ativos + `listUsersMock` paginado (admin) e lista de profissionais atribuíveis por etapa (`AssignableProfessional[]` direto); filtros `search`/`category` são 100% no front (`AssignAction`)
- `src/lib/api/user.api.ts` — `listUsers` (`GET /users?...` paginado) e `listAnalysts` (`GET /users/analysts?stage=...`; Triagem é o padrão compatível)
- `src/lib/mocks/requests.mock.ts` — `mockInternalRequestDetails` com `assignee` e `mappingAssignee: null`, `assignAnalystMock(protocol, analystId, responsibility)` atualiza campo correto e `mockRequests` para `triagem`
- `MOCK_DOMAINS.users` / `MOCK_DOMAINS.request` controlam mocks; em prod `dev===false` elimina branches (DCE)

---

## Pendências

1. Confirmar nome exato do campo mapeamento no backend: `mappingAssigneeId` vs `mapping_assignee_id`
2. Confirmar se `GET /queue` deve refletir `mappingAssignee` ou só `assignee` (triagem) — hoje só `assignee`
