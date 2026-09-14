# Contrato de API — Fila Centralizada (Painel Administrativo)

Contrato dos endpoints `GET /queue` e `GET /queue/metrics`, autenticados, que
alimentam as telas **Fila Centralizada** e **Home** do painel administrativo
(analistas, gestores e administradores). Issue #46.

- Fonte de verdade da issue: `issue-46.md` — campos mínimos de saída e critérios
  de aceite (cookie/JWT válido, busca parcial, filtros combináveis, paginação
  com total, `unassigned=true`, 400 descritivo, contrato documentado).
- Referência de produto: `funcionalidades-especificacao.md` §"Listar fila
  centralizada".
- Implementação: `src/modules/queue/` (`queue.schemas.ts` com validação Zod,
  `queue.controller.ts`, `queue.service.ts`, `queue.repository.ts`,
  `queue.router.ts`). Fonte única dos enums: `src/shared/types/requests.ts`.
- Erros sempre no envelope: `{ "status": "error", "statusCode": number, "message": string }`

---

## Tipos compartilhados

Matriz de status e prioridades é a **mesma do domínio** (fonte única em
`src/shared/types/requests.ts`; alinhada à tabela `statuses` / `priorities`):

```ts
// 17 valores — vocabulário público da solicitacao (mesma matriz do contrato
// publico, docs/solicitations-api-requests-0_4.md)
export type RequestStatus =
  | "Solicitação enviada"
  | "Aguardando triagem"
  | "Em triagem"
  | "Pendente de informações"
  | "Aguardando mapeamento"
  | "Mapeamento agendado"
  | "Em mapeamento"
  | "Em análise de viabilidade"
  | "Elegível"
  | "Não elegível"
  | "Priorizado"
  | "Backlog"
  | "Direcionado para outra área"
  | "Em desenvolvimento"
  | "Em homologação"
  | "Concluído"
  | "Cancelado";

export type RequestPriority = "Baixa" | "Média" | "Alta" | "Crítica";

// Item da fila — extends o request summary publico com e-mail e id do responsavel
export interface QueueItem {
  protocol: string; // "MAAT-8K3P-9X2M" — protocolo de rastreio (FPE/Feistel)
  createdAt: string; // ISO datetime — data de entrada (coluna "Data")
  processName: string; // coluna "Processo"
  priority: RequestPriority | null; // null ate a triagem priorizar
  status: RequestStatus;
  assignee: string | null; // nome do responsavel — null quando nao atribuido
  requesterName: string; // coluna "Solicitante"
  requesterEmail: string; // e-mail corporativo do solicitante (internos apenas)
  assigneeId: string | null; // UUID de professionals.professional_id
}

// Consulta aceita por GET /queue — validada por queueQuerySchema (Zod)
export interface QueueQuery {
  search?: string; // match parcial no protocolo, e-mail ou nome do solicitante
  status?: RequestStatus; // match exato
  priority?: RequestPriority; // match exato
  assigneeId?: string | "unassigned"; // UUID do profissional ou literal "unassigned"
  unassigned?: boolean; // true/1 lista apenas sem responsavel
  page: number; // obrigatorio — inteiro >= 1
  pageSize: number; // obrigatorio — inteiro entre 1 e 100
}

// Lista de responsaveis para o <select> de filtro (profissionais ativos)
export interface QueueAssignee {
  id: string; // professionals.professional_id (UUID)
  name: string; // professionals.full_name
}

// Envelope de resposta de GET /queue
export interface QueueResponse {
  data: QueueItem[];
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
  assignees: QueueAssignee[]; // filtro "Responsável" — sempre presente
}

// Resposta de GET /queue/metrics
export interface QueueMetricsResponse {
  totalRequests: number;
  unassignedRequests: number;
  inProgressRequests: number;
  overdueRequests: number;
}
```

---

## 1. GET /queue — Listar fila centralizada

**Autenticação:** obrigatória — cookie de sessão (`session_id`, HttpOnly)
válido, enviado automaticamente após `POST /auth/login`. Sem cookie ou com
token inválido/expirado → `401`. **Perfis:** `Analista`, `Gestor` e
`Administrador` (mesma restrição de `GET /requests/:protocol/internal`, issue
#48); perfil `Solicitante` autenticado → `403`.

Lista as solicitações com paginação server-side, busca e filtros combináveis,
sempre ordenadas por `created_at` **descendente** (mais recentes primeiro).

### Query params

```text
GET /queue?page=1&pageSize=20&search=&status=&priority=&assigneeId=&unassigned=
```

| Parâmetro    | Obrigatório | Regras                                                                                                                 |
| ------------ | ----------- | ---------------------------------------------------------------------------------------------------------------------- |
| `page`       | **sim**     | Inteiro >= 1 — `z.coerce.number().int().min(1)`; ausente, decimal ou `Infinity` → 400                                  |
| `pageSize`   | **sim**     | Inteiro entre 1 e 100 — `z.coerce.number().int().min(1).max(100)`; fora da faixa → 400                                 |
| `search`     | não         | Texto (trim, máx. 254); **match parcial** (ilike) no `protocol`, na `corporate_email` ou no `full_name` do solicitante |
| `status`     | não         | Valor **exato** de um dos 17 status (`z.enum`); fora da matriz → 400                                                   |
| `priority`   | não         | Valor **exato** de uma das 4 prioridades (`z.enum`); fora da matriz → 400                                              |
| `assigneeId` | não         | **UUID** de `professionals.professional_id` ou o literal `unassigned`; numérico/outro formato → 400                    |
| `unassigned` | não         | Apenas `true`/`false`/`1`/`0` (qualquer outro valor → 400); `true`/`1` filtra só solicitações sem responsável          |

**Combinação de filtros:** `search`, `status`, `priority` e o par
responsável/unassigned são combináveis (AND).

**Conflito rejeitado (400):** `unassigned=true` **não pode** ser combinado com
`assigneeId=<uuid>`; é permitido com o literal `assigneeId=unassigned` (mesma
semântica: "sem responsável").

**Paginação (clamp):** página além do limite é **ajustada para a última página
válida** (`totalPages`) e, sem resultados (`total=0`), a página retornada é
`1`. O contrato público de `GET /requests` (D-07) não é reutilizado — esta
rota é exclusiva dos perfis internos.

### Response 200 — `QueueResponse`

```json
HTTP/1.1 200 OK

{
  "data": [
    {
      "protocol": "MAAT-8K3P-9X2M",
      "createdAt": "2026-08-25T14:03:11.000Z",
      "processName": "Conciliação bancária mensal",
      "priority": "Alta",
      "status": "Em triagem",
      "assignee": "Fernando Alves",
      "requesterName": "Maria Oliveira",
      "requesterEmail": "maria.oliveira@instituicao.gov.br",
      "assigneeId": "650e8400-e29b-41d4-a716-446655440001"
    },
    {
      "protocol": "MAAT-6N2W-8VBM",
      "createdAt": "2026-08-10T09:41:20.000Z",
      "processName": "Fechamento mensal de ponto",
      "priority": null,
      "status": "Aguardando triagem",
      "assignee": null,
      "requesterName": "José Santos",
      "requesterEmail": "jose.santos@instituicao.gov.br",
      "assigneeId": null
    }
  ],
  "page": 1,
  "pageSize": 10,
  "total": 42,
  "totalPages": 5,
  "assignees": [
    { "id": "650e8400-e29b-41d4-a716-446655440001", "name": "Fernando Alves" },
    { "id": "650e8400-e29b-41d4-a716-446655440003", "name": "Patrícia Gomes" }
  ]
}
```

**Exemplos de requisição:**

```text
GET /queue?page=1&pageSize=20
GET /queue?page=2&pageSize=10&status=Em%20triagem&priority=Alta
GET /queue?page=1&pageSize=20&search=maat-8k3p-9x2m
GET /queue?page=1&pageSize=20&search=diarias
GET /queue?page=1&pageSize=20&assigneeId=650e8400-e29b-41d4-a716-446655440001
GET /queue?page=1&pageSize=20&assigneeId=unassigned
GET /queue?page=1&pageSize=20&unassigned=true
GET /queue?page=1&pageSize=20&unassigned=1&status=Em%20triagem
```

**Clamp — página além do limite (`page=99`, `pageSize=10`, `total=42`):**

```json
HTTP/1.1 200 OK

{
  "data": [],
  "page": 5,
  "pageSize": 10,
  "total": 42,
  "totalPages": 5,
  "assignees": [ { "id": "650e8400-e29b-41d4-a716-446655440001", "name": "Fernando Alves" } ]
}
```

**Sem resultados (`total=0`):**

```json
HTTP/1.1 200 OK

{
  "data": [],
  "page": 1,
  "pageSize": 10,
  "total": 0,
  "totalPages": 0,
  "assignees": []
}
```

### Erros

| Status | Quando                                                                                                          |
| ------ | --------------------------------------------------------------------------------------------------------------- |
| 400    | `page`/`pageSize` ausentes (obrigatórios) → "Campos obrigatórios ausentes: page, pageSize"                      |
| 400    | `page`/`pageSize` decimal, `Infinity` ou fora da faixa → "Campos inválidos: page — Deve ser um número inteiro." |
| 400    | `status`/`priority` fora da matriz → "Status inválido." / "Prioridade inválida."                                |
| 400    | `assigneeId` que não é UUID nem `unassigned` (ex.: `123`, `abc`) → "Identificador do responsável inválido."     |
| 400    | `unassigned` com valor fora de `true`/`false`/`1`/`0` → "Valor inválido para \"unassigned\"."                   |
| 400    | Conflito `unassigned=true` + `assigneeId=<uuid>` → "\"unassigned\" e \"assigneeId\" não podem ser combinados."  |
| 400    | `search` com mais de 254 caracteres → "Máximo de 254 caracteres."                                               |
| 401    | Sem cookie de sessão, ou token inválido/expirado (ver exemplos abaixo)                                          |
| 403    | Autenticado sem perfil interno (Solicitante) — acesso restrito a Analista/Gestor/Administrador                  |
| 403    | Usuário com senha pendente de troca (`must_change_password`)                                                    |

**Exemplos de erro:**

```http
GET /queue?page=1.5&pageSize=10 HTTP/1.1
Cookie: session_id=<jwt>
```

```json
HTTP/1.1 400 Bad Request

{
  "status": "error",
  "statusCode": 400,
  "message": "Campos inválidos: page — Deve ser um número inteiro."
}
```

```http
GET /queue?page=1&pageSize=10&unassigned=abc HTTP/1.1
Cookie: session_id=<jwt>
```

```json
HTTP/1.1 400 Bad Request

{
  "status": "error",
  "statusCode": 400,
  "message": "Campos inválidos: unassigned — Valor inválido para \"unassigned\"."
}
```

```http
GET /queue HTTP/1.1
Cookie: session_id=<jwt>
```

```json
HTTP/1.1 400 Bad Request

{
  "status": "error",
  "statusCode": 400,
  "message": "Campos obrigatórios ausentes: page, pageSize"
}
```

Sem autenticação:

```http
GET /queue?page=1&pageSize=10 HTTP/1.1
```

```json
HTTP/1.1 401 Unauthorized

{ "status": "error", "statusCode": 401, "message": "Token não fornecido" }
```

Sessão inválida/expirada: `{ "status": "error", "statusCode": 401, "message": "Token inválido ou expirado" }`

Perfil sem acesso:

```json
HTTP/1.1 403 Forbidden

{ "status": "error", "statusCode": 403, "message": "Acesso restrito ao perfil Analista ou Gestor ou Administrador" }
```

---

## 2. GET /queue/metrics — Métricas da fila (escopo adicional)

> **Escopo adicional à issue #46** (decisão registrada na PR): o endpoint atende
> a tela Home. Fora dele, a issue especifica somente `GET /queue`.

**Autenticação:** obrigatória (mesma regra da seção 1) — cookie `session_id`
válido + perfil `Analista`/`Gestor`/`Administrador`. Sem query params.

Resumo consolidado da fila, calculado sobre a tabela `requests`:

- `totalRequests` — todas as solicitações do sistema;
- `unassignedRequests` — solicitações **sem responsável** (`professional_id IS NULL`);
- `inProgressRequests` — solicitações em status de **andamento** (`Em triagem`,
  `Em mapeamento`, `Em análise de viabilidade`, `Em desenvolvimento`,
  `Em homologação`);
- `overdueRequests` — solicitações **atrasadas**: `desired_deadline`
  **estritamente menor que a data corrente** (`CURRENT_DATE`) e status **não
  terminal** (diferente de `Concluído`/`Cancelado`). Prazo **vence hoje** ainda
  não é atraso.

### Response 200 — `QueueMetricsResponse`

```json
HTTP/1.1 200 OK

{
  "totalRequests": 128,
  "unassignedRequests": 31,
  "inProgressRequests": 54,
  "overdueRequests": 9
}
```

### Erros

| Status | Quando                                                                  |
| ------ | ----------------------------------------------------------------------- |
| 401    | Sem cookie de sessão, ou token inválido/expirado                        |
| 403    | Autenticado sem perfil interno (Solicitante) ou senha pendente de troca |

---

## Observações do contrato

- **Valores PT-BR, chaves em inglês** (padrão dos demais contratos): `status`,
  `priority` são strings do domínio de produto; a estrutura da resposta é em
  inglês (CONTRIBUTING, seção 1).
- **Dados sensíveis para internos:** `requesterEmail` e `assigneeId` são
  retornados apenas nesta rota autenticada — o contrato público
  (`GET /requests`, `docs/solicitations-api-requests-0_4.md`) não os expõe
  (RN-005). Por isso a rota exige `authMiddleware + requireRole(...)`, idêntico
  à consulta interna da issue #48.
- **Página fora da faixa:** a API **não** responde 400 — ela ajusta para a
  última página válida (`page = min(page, totalPages)`); com `total=0` retorna
  `page: 1`. Decisão documentada: o frontend pode navegar livremente sem
  tratar estouro de paginação.
- **`unassigned` vs `assigneeId`:** são mutuamente exclusivos no contrato
  (`unassigned=true` + `assigneeId=<uuid>` → 400) para evitar filtros
  contraditórios; a combinação com `assigneeId=unassigned` é redundante, porém
  válida (mesma semântica).
- **Lista `assignees`:** retornada em toda resposta, contém exclusivamente
  profissionais **ativos** (`professionals.status = 'active'`) ordenados por
  nome — insumo direto do `<select>` de filtro por responsável.
- **Ordenação:** por `created_at` descendente, fixa — sem parâmetro de
  ordenação neste contrato (a issue não prevê; `funcionalidades` cita
  "ordenação" futuramente, pendente de decisão).
- **Datas:** `createdAt` é serializado como ISO 8601 UTC.
- **`search`:** busca parcial (`ilike`, case-insensitive) em três campos
  (protocolo, e-mail corporativo e nome do solicitante) — a busca por protocolo
  aqui é parcial, ao contrário da consulta direta da especificação.
- **Limite de `pageSize`:** teto de 100 (decisão de implementação); o contrato
  público de listagem não fixa teto.
- **Exportação da fila (Excel/CSV)** citada em `funcionalidades-especificacao.md`
  não faz parte deste contrato — endpoint em issue futura.
