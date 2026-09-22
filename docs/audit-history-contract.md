# Contrato de API — Histórico de Auditoria (Audit History)

Contrato de comunicação Frontend ↔ Backend para a tela administrativa de logs:
listagem paginada de eventos de auditoria e detalhe de um evento
(`GET /audit-history`, `GET /audit-history/:id`).

- Fonte de verdade: `docs/issues/audit-logs-endpoint.md` (issue) e
  `docs/issues/plano-audit-logs-endpoint.md` (plano de execução)
- Catálogo de entidades/ações: `src/shared/audit/auditCatalog.ts` — os valores
  de `entity_type`/`action_type` trafegados neste contrato nascem desse catálogo
- Tabela: `audit_history` (migration `202609100009_create_audit_history.js`)
- Erros sempre no envelope: `{ "status": "error", "statusCode": number, "message": string }`

---

## Tipos compartilhados

```ts
// Entidades auditáveis — chaves do auditCatalog
// (src/shared/audit/auditCatalog.ts). Novos valores chegam como string
// validada contra o catálogo; o backend rejeita fora dele com 400.
export type AuditEntityType =
  "user" | "prioritization" | "request" | "mapping" | "settings" | "pending_item";

// Rótulo PT-BR de exibição derivado no servidor a partir do auditCatalog
// (ex.: "user" → "Usuários", "settings" → "Configuração do portal").
// O frontend NÃO precisa manter mapa próprio de tradução.
export interface AuditHistoryQuery {
  page?: number; // default 1 — inteiro >= 1
  limit?: number; // default 20 — inteiro 1..100 (teto rígido do backend)
  entityType?: AuditEntityType; // filtro por tipo de log
}

// Item da tabela de logs (colunas: ID, Tipo, Ação, Usuário, Data)
export interface AuditHistorySummary {
  audit_id: number;
  entity_type: string; // valor do catálogo (ex.: "settings")
  entity_type_label: string; // rótulo PT-BR (ex.: "Configuração do portal")
  action_type: string; // ação composta "<entidade>.<ação>" (ex.: "settings.update")
  user_id: number | null; // null → ação de sistema (sem ator)
  occurred_at: string; // ISO datetime
}

// Envelope da listagem — sem totalPages: o frontend deriva
// Math.ceil(total / limit) quando precisar do total de páginas
export interface AuditHistoryListResponse {
  items: AuditHistorySummary[];
  total: number; // total de registros ANTES da paginação (respeita o filtro)
  page: number; // ecoa a página solicitada (ou o default)
  limit: number; // ecoa o limite aplicado (ou o default)
}

// Detalhe completo do evento — alimenta o painel aberto ao clicar no log
export interface AuditHistoryDetail {
  audit_id: number;
  entity_type: string;
  entity_id: string; // identificador da entidade afetada
  action_type: string;
  user_id: number | null;
  previous_value: string | null; // valor anterior (texto livre)
  new_value: string | null; // valor novo (texto livre)
  note: string | null;
  change_origin: string | null;
  occurred_at: string; // ISO datetime
}
```

---

## 0. Autenticação e autorização (transversal a este contrato)

Os dois endpoints deste contrato exigem sessão JWT (cookie `session_id`,
`HttpOnly`) **e** perfil `Administrador` — guardas `authMiddleware` +
`requireRole("Administrador")` (`src/shared/middleware/`), aplicados antes de
qualquer processamento:

| Situação                          | Resposta                                          |
| --------------------------------- | ------------------------------------------------- |
| Sem cookie `session_id`           | `401` `"Token não fornecido"`                     |
| Sessão inválida/expirada/revogada | `401` no envelope padrão                          |
| Perfil diferente de Administrador | `403` `"Acesso restrito ao perfil Administrador"` |

- O papel é resolvido do banco a cada request (`profiles.name` → `Role`);
  troca de perfil passa a valer imediatamente, mesmo com cookie antigo.
- Usuário com `must_change_password` pendente só acessa `PUT
/auth/change-password` e `GET /auth/me` — qualquer outra rota responde `403`.

---

## 1. GET /audit-history — Listar logs (tabela administrativa)

Alimenta a tabela da tela de logs. Paginação server-side, ordenação fixa por
`occurred_at DESC` (mais recentes primeiro). Consulta sem resultados retorna
`200` com `items: []` (estado vazio da tabela).

**Query params** — `AuditHistoryQuery`:

```text
GET /audit-history?page=1&limit=20&entityType=user
```

**Response 200** — `AuditHistoryListResponse`.

**Exemplo real** — primeira página (`page=1`, `limit=5`):

```http
GET /audit-history?page=1&limit=5 HTTP/1.1
Cookie: session_id=<jwt do administrador>
```

**Response** — `200 OK`:

```json
HTTP/1.1 200 OK

{
  "items": [
    {
      "audit_id": 9,
      "entity_type": "settings",
      "entity_type_label": "Configuração do portal",
      "action_type": "settings.update",
      "user_id": 102,
      "occurred_at": "2026-09-21T04:15:49.041Z"
    },
    {
      "audit_id": 8,
      "entity_type": "user",
      "entity_type_label": "Usuários",
      "action_type": "user.create",
      "user_id": 102,
      "occurred_at": "2026-09-21T04:15:46.164Z"
    }
  ],
  "total": 9,
  "page": 1,
  "limit": 5
}
```

**Exemplo real** — filtro por tipo (`entityType=user`, `limit=3`):

```http
GET /audit-history?entityType=user&limit=3 HTTP/1.1
Cookie: session_id=<jwt do administrador>
```

**Response** — `200 OK`:

```json
HTTP/1.1 200 OK

{
  "items": [
    {
      "audit_id": 8,
      "entity_type": "user",
      "entity_type_label": "Usuários",
      "action_type": "user.create",
      "user_id": 102,
      "occurred_at": "2026-09-21T04:15:46.164Z"
    },
    {
      "audit_id": 3,
      "entity_type": "user",
      "entity_type_label": "Usuários",
      "action_type": "user.change_password",
      "user_id": 117,
      "occurred_at": "2026-09-21T04:07:14.180Z"
    },
    {
      "audit_id": 2,
      "entity_type": "user",
      "entity_type_label": "Usuários",
      "action_type": "user.create",
      "user_id": 102,
      "occurred_at": "2026-09-21T04:07:13.775Z"
    }
  ],
  "total": 4,
  "page": 1,
  "limit": 3
}
```

Consulta sem resultado (`items: []`):

```json
HTTP/1.1 200 OK

{
  "items": [],
  "total": 0,
  "page": 1,
  "limit": 20
}
```

**Exemplo de erro** — filtro fora do catálogo:

```http
GET /audit-history?entityType=invalido HTTP/1.1
```

```json
HTTP/1.1 400 Bad Request

{
  "status": "error",
  "statusCode": 400,
  "message": "Campos inválidos: entityType — Invalid option: expected one of \"user\"|\"prioritization\"|\"request\"|\"mapping\"|\"settings\"|\"pending_item\""
}
```

**Erros:**

| Status | Quando                                                              |
| ------ | ------------------------------------------------------------------- |
| 400    | `page`/`limit` não numéricos, fora da faixa ou `limit` > 100        |
| 400    | `entityType` fora do catálogo (a mensagem lista os valores válidos) |
| 400    | Query param desconhecido (schema `.strict()` — ex.: `?foo=1`)       |
| 401    | Sem sessão válida (seção 0)                                         |
| 403    | Perfil diferente de Administrador (seção 0)                         |

---

## 2. GET /audit-history/:id — Detalhe do log

Alimenta o painel/modal aberto ao clicar num log da tabela. Retorna o evento
completo, incluindo `previous_value`, `new_value`, `note` e `change_origin`.
Endpoint sem query params — `:id` é o `audit_id` numérico.

**Response 200** — `AuditHistoryDetail`.

**Exemplo real:**

```http
GET /audit-history/9 HTTP/1.1
Cookie: session_id=<jwt do administrador>
```

**Response** — `200 OK`:

```json
HTTP/1.1 200 OK

{
  "audit_id": 9,
  "entity_type": "settings",
  "entity_id": "settings",
  "action_type": "settings.update",
  "user_id": 102,
  "previous_value": "{\"solicitationMode\":\"PUBLIC\"}",
  "new_value": "{\"solicitationMode\":\"PUBLIC\"}",
  "note": null,
  "change_origin": null,
  "occurred_at": "2026-09-21T04:15:49.041Z"
}
```

**Exemplo de erro** — id inexistente:

```json
HTTP/1.1 404 Not Found

{
  "status": "error",
  "statusCode": 404,
  "message": "Log não encontrado"
}
```

**Erros:**

| Status | Quando                                          |
| ------ | ----------------------------------------------- |
| 400    | `:id` não numérico ou < 1 (`"ID inválido"`)     |
| 401    | Sem sessão válida (seção 0)                     |
| 403    | Perfil diferente de Administrador (seção 0)     |
| 404    | `audit_id` inexistente (`"Log não encontrado"`) |

---

## Observações do contrato

- Valores de `entity_type`/`action_type` são o vocabulário do `auditCatalog`;
  `entity_type_label` existe para a UI não precisar traduzir — chaves/estruturas
  em inglês, textos de exibição em PT-BR.
- `previous_value`/`new_value` são texto livre (podem conter JSON serializado,
  como no exemplo da seção 2) — parse é decisão do frontend; `null` significa
  "não registrado para este evento", não string vazia.
- `user_id: null` indica ação de sistema (sem ator humano); a UI deve renderizar
  como "Sistema" em vez de buscar usuário.
- `audit_history` é imutável por modelagem (`is_immutable` default `true`) —
  este contrato é somente leitura; não há POST/PUT/DELETE.
- Fora de escopo deste contrato (issue futura, se necessário): filtro por
  período/data, busca textual, exportação e paginação por cursor.
