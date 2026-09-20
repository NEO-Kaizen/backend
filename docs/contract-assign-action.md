# Contrato Backend — Atribuição de Analista

Frontend `feat/82-2-assign-analyst` (QuickActions → Atribuir analista). O que o backend precisa entregar.

> Base: `PUBLIC_API_URL` + `credentials: include` (cookie). Em `dev` o frontend usa mocks (`MOCK_DOMAINS.users` e `MOCK_DOMAINS.request`).

---

## Endpoints

### GET /users/analysts

Lista analistas para o modal. **Endpoint definitivo, sem query, sem paginação** — retorna todos os analistas (filtros só no front).

```http
GET /users/analysts -> 200 Analyst[]
```

**Query:** nenhuma — backend retorna `Analyst[]` completo (todos com `profile === "Analista"`). `search` (nome/especialidade) e `category` são filtrados 100% no frontend (`AssignAction.svelte` com `normalize`).

**Resposta 200:**

```ts
Analyst[] // lista direta de todos os analistas, sem envelope paginado e sem query string
```

> `listUsers` (admin) continua `GET /users?profile=&search=&category=&page=&pageSize=` paginado `PaginatedResponse<UserSummary>`; `listAnalysts` (assignment.service) usa `GET /users/analysts` sem parâmetros.

```ts
interface Analyst extends UserSummary {
  id: string;
  fullName: string;
  email: string;
  profile: "Analista";
  isActive: boolean;
  mustChangePassword: boolean;
  createdAt: string; // ISO
  specialty: string; // "" permitido → frontend oculta linha
  categories: RequestCategory[]; // [] permitido → sem chips
  notes: string | null; // null/vazio → sem bloco NOTAS
  requestLoad: number | null; // null → sem coluna demandas
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

**Erros:** `401/403/500` → `{status:'error', statusCode, message}`.

**Exemplo (assignment — lista direta):**

```json
[
  {
    "id": "20",
    "fullName": "Rafael Alves",
    "email": "rafael.alves@maat.com.br",
    "profile": "Analista",
    "isActive": true,
    "specialty": "Eletricista residencial",
    "categories": ["Apoio técnico", "Automação"],
    "notes": "Disponível à tarde; já atuou nesta região.",
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

- Se `assigneeId` → `detail.assignee = {id, name, email}` do usuário `Analista` encontrado, `detail.lastUpdate = now`, refletir em `GET /queue` (`assigneeId`/`assignee`)
- Se `mappingAssigneeId` → `detail.mappingAssignee = {id, name, email}`, `detail.lastUpdate = now` (não altera `GET /queue` triagem)
- Validar `analystId` existe e `profile === "Analista"` e `isActive === true`
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

- `400` — `analystId` vazio
- `403` — sem permissão (só `Administrador` ou `assignee` atual — espelha `SpecTabs` `canTriage`)
- `404` — `protocol` ou `analystId` não encontrado
- `500` — genérico
- Formato erro: `{status:'error', statusCode, message}`

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

Cookie obrigatório. `GET /users/analysts` e `PATCH .../assignee` exigem sessão válida. Atribuição idealmente restrita a `Administrador` ou responsável atual (mesma regra de `canTriage`).

---

## Mocks (DEV)

- `src/lib/mocks/users.mock.ts` — `mockUsers` com 6 ativos + `listUsersMock` paginado (admin) e `listAnalystsMock` **sem paginação e sem filtros** (`Analyst[]` direto, só `profile === "Analista"`) para `assignment.service`; filtros `search`/`category` são 100% no front (`AssignAction`)
- `src/lib/api/user.api.ts` — `listUsers` (`GET /users?...` paginado) e `listAnalysts` (`GET /users/analysts` sem query) — `assignment.service` usa `listAnalysts()` sem argumentos
- `src/lib/mocks/requests.mock.ts` — `mockInternalRequestDetails` com `assignee` e `mappingAssignee: null`, `assignAnalystMock(protocol, analystId, responsibility)` atualiza campo correto e `mockRequests` para `triagem`
- `MOCK_DOMAINS.users` / `MOCK_DOMAINS.request` controlam mocks; em prod `dev===false` elimina branches (DCE)

---

## Pendências

1. Confirmar nome exato do campo mapeamento no backend: `mappingAssigneeId` vs `mapping_assignee_id`
2. Confirmar se `GET /queue` deve refletir `mappingAssignee` ou só `assignee` (triagem) — hoje só `assignee`
