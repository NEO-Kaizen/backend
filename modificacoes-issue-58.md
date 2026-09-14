# Modificações — Issue #58 (seeds diversificados)

Branch: `feat/75-expanded-requester-request-seeds`

## Decisões

- **20 `requests` em vez de 15**: o critério "todos os 17 status aparecem"
  é impossível com 15 registros (1 status por solicitação). Com 20, os 17
  status são cobertos e a fila da issue #46 ganha itens extras em
  "Solicitação enviada", "Aguardando triagem" e "Em triagem".
- **10 `prioritization_evaluations`**: só faz sentido para solicitações
  elegíveis/priorizadas/em fluxo posterior; as demais 10 solicitações
  (status iniciais, não elegíveis, canceladas/direcionadas) ficam sem
  avaliação por consistência com a RN-007.
- **Seed `users` como fonte da verdade determinística**: IDs fixos
  101–115 com `onConflict("user_id").ignore()`. No banco local foram
  removidos os resíduos de testes anteriores (users 104/105/106) para o
  ambiente ficar idêntico a um banco recém-seedado.
- **Senha padrão de desenvolvimento**: `steste123` (mantida), gerada com
  `hashPassword`; perfil resolvido por nome (padrão da issue #57).
- **Anexos apenas metadados**: sem arquivos binários reais, coerentes com a
  constraint de `content_type` e `size_bytes <= 10485760`.

## Modificações por arquivo

| Arquivo | Mudança |
| --- | --- |
| `001_requesters.js` | `prioritization_evaluations` adicionada à lista de `TRUNCATE` (FK `RESTRICT` para `requests`); 15 `requesters` com áreas/departamentos/gestores variados |
| `003_priorities.js` | apenas formatação (prettier); dados de referência inalterados |
| `005_professionals.js` | 15 `professionals` (papéis variados, 2 `inactive`, cobrem as categorias 1–10) |
| `006_requests.js` | 20 `requests` cobrindo os 17 status, as 10 categorias e as 4 prioridades; enums nativos variados; `screening_result`/`preliminary_complexity` variados |
| `007_pending_items.js` | 15 `pending_items` (tipos `field_edit`, `attachment_upload`, `information`, `action`; status `open`, `overdue`, `resolved`) |
| `008_attachments.js` | 15 `attachments` (metadados; 5 `content_type` permitidos; `is_restricted` variado) |
| `009_request_time_preferences.js` | 15 preferências (unique `request_id`+`scheduled_for` respeitado) |
| `010_users.js` | 15 `users` (101–115): 4 perfis, 2 inativos (105, 113), 3 com `must_change_password=true` (109, 111, 115) |
| `011_prioritization_evaluations.js` | **novo** — 10 avaliações com `notes` (10 critérios, notas 1–5), `score` 10–50, `classification` coerente com a faixa RN-008 e `calculated_by` apontando para `users` válidos |

## Validações

- `npm run seed:run` executado 3× (idempotente — sem duplicação).
- Contagens pós-seed: requesters 15, professionals 15, requests 20, users
  15 (14 ativos / 2 inativos / 3 com troca obrigatória), pending_items 15,
  attachments 15, request_time_preferences 15, prioritization_evaluations 10.
- 17 status distintos e 1+ solicitação por status; 10 categorias; 4
  prioridades; protocolos/e-mails únicos.
- Todas as `prioritization_evaluations` com `score` dentro da faixa da
  `classification` (Baixa 10–20 / Média 20.1–30 / Alta 30.1–40 / Crítica
  40.1–50) validada por SQL.
- `npm run lint`, `npm run typecheck` e `prettier --check` passando.

## Evidências de API (Docker, porta 3001)

- Login de perfis ativos (Analista, Solicitante) → 200 sem segredos; usuários
  inativos (105, 113) → 401 "Credenciais inválidas".
- `must_change_password` (109): login 200 `mustChangePassword: true`,
  `GET /auth/me` 200, rota protegida 403.
- `GET /queue?page=1&pageSize=5` → 200 com itens novos; `GET /queue` com
  Solicitante → 403; `GET /queue/metrics` → `totalRequests: 20`.
- `GET /prioritization/criteria` → 10 critérios; `GET /requests/MAAT-4H6S-7E9W/internal`
  → `prioritization.score: 46`, `label: "Crítica"` (seed de avaliação).

## Observações

- `issue-58.md` e `padrao-issues.md` permanecem sem commit (textos de issue).
- Para reproduzir do zero: `npm run docker:db:setup` (ou `migrate:latest` +
  `seed:run`).