# Modificações — Issue #46 (`GET /queue`)

Documento que registra as modificações aplicadas na branch
`feat/46-centralized-queue-endpoint` após a revisão (`revisao-issue-46.md`) e o
motivo de cada uma. Nenhuma mudança de comportamento foi feita fora do escopo
revisado; todas as alterações foram validadas com `typecheck`, `lint` e testes
manuais via Docker.

---

## Decisões que exigiram definição

| Tema | Decisão tomada |
| --- | --- |
| Validação da query | Migrar para **Zod** (padrão dos demais módulos) em vez de validação manual |
| Página fora da faixa (`page > totalPages`) | **Clamp** para a última página válida (e `page: 1` quando não há resultados) + documentação no README |
| Restrição de acesso | **`requireRole('Analista','Gestor','Administrador')`**, mesma regra das rotas internas da issue #48 |
| Métricas | Manter a **lista explícita** de status "em andamento" (movida para constante compartilhada) e corrigir a comparação de prazo para **`CURRENT_DATE`** |
| `GET /queue/metrics` | **Manter** como escopo adicional da PR (atende a tela Home), registrado no README |
| Testes automatizados | **Não adicionar** nesta PR — o repositório não possui infraestrutura de testes (vitest/supertest ausentes) |

---

## Modificações por arquivo

### `src/shared/types/requests.ts`
**Motivo:** eliminar a duplicação das unions `RequestStatus`/`RequestPriority`
com as listas de validação do módulo queue e as strings mágicas das métricas.

- `REQUEST_STATUSES` e `REQUEST_PRIORITIES` passam a ser a **fonte única**
  (arrays `as const`) que derivam as unions `RequestStatus`/`RequestPriority`.
- Novas constantes `IN_PROGRESS_STATUSES` (status "em andamento" das métricas)
  e `TERMINAL_STATUSES` (excluídos das métricas de atraso).

### `src/modules/queue/queue.schemas.ts` (reescrito com Zod)
**Motivo:** a validação manual, introduzida no commit `fa100b6`, deixava bordas
inseguras e divergia do padrão Zod de todos os outros módulos.

- `page`/`pageSize`: obrigatórios, **inteiros** (`z.coerce.number().int()`) — rejeita
  `1.5`, `Infinity`, `1e999` que antes geravam erro 500 no PostgreSQL.
- `unassigned`: estrito (`true`/`false`/`1`/`0`); valor inválido => 400 (antes
  qualquer valor virava `false` silenciosamente).
- `assigneeId`: aceita **UUID** ou o literal `unassigned`; números são rejeitados
  (antes eram aceitos e nunca casavam, pois `professional_id` é UUID).
- `refine`: rejeita `unassigned=true` combinado com `assigneeId=<uuid>` (antes o
  conflito era silencioso).
- `status`/`priority`: passam a usar as constantes compartilhadas.

### `src/modules/queue/queue.controller.ts`
**Motivo:** padronizar o contrato de erro com o restante da API e do projeto.

- 400 agora usa o envelope padrão `{ status, statusCode, message }` via
  `AppError` + `formatZodIssues` (antes era `{ error, details }` à parte).
- Segue o padrão dos demais controllers: sem `try/catch` redundante, sem cast
  `as QueueQuery` (o Zod já tipa a saída).

### `src/modules/queue/queue.service.ts`
**Motivo:** corrigir serialização de data e a regra de paginação.

- `createdAt` agora é serializado em **ISO** (`toIso()`); antes `String(Date)`
  produzia formato dependente de locale.
- Clamp de página consistente: `totalPages = 0` => `page: 1`; caso contrário
  `Math.min(page, totalPages)` (comportamento documentado no README).

### `src/modules/queue/queue.repository.ts`
**Motivo:** corrigir semântica das métricas e a listagem de responsáveis.

- Métricas passam a usar `IN_PROGRESS_STATUSES`/`TERMINAL_STATUSES`
  compartilhados.
- `overdueRequests` compara `desired_deadline < CURRENT_DATE` (era `NOW()`);
  prazo que vence hoje **não** conta como atrasado (correção validada em teste manual).
- `fetchAllAssignees` filtra `status = 'active'` e tem tipagem corrigida para
  `id: string` (UUID) — antes tipava `number` e listava inativos.

### `src/modules/queue/queue.router.ts` e `src/router.ts`
**Motivo:** garantir que a fila (dados internos/sensíveis) siga o mesmo controle
de acesso das outras rotas internas.

- Adicionado `requireRole('Analista','Gestor','Administrador')` em
  `GET /queue` e `GET /queue/metrics`.
- `src/router.ts` apenas com formatação corrigida (registro da rota já existia).

### `src/modules/DTOs/queue/queue.dto.ts`
**Motivo:** remover tipo órfão. `GetQueueQuery` não era usado em lugar nenhum;
mantido apenas `FindQueueParams` (agora reutilizando `RequestStatus`/
`RequestPriority`).

### `src/shared/types/queue.types.ts`
**Motivo:** eliminar duplicação de tipos sobre a mesma forma de query.

- Removidos `PaginationQuery` e `QueueFilterQuery` (só eram usados para compor
  `QueueQuery`, que agora declara os campos diretamente).
- `QueueQuery` também passa a ser "validado por" `queueQuerySchema`
  (`satisfies z.ZodType<QueueQuery>`), fechando o loop schema ↔ tipo.

### `README.md`
**Motivo:** alinhar a documentação do contrato.

- Exemplos de `assigneeId`/`assignees` corrigidos para **UUID** (antes numéricos;
  impossíveis de acontecerem).
- Documentada a restrição de perfil, os valores válidos de `unassigned`, o
  comportamento de página fora da faixa e a lista de `assignees` só com ativos.
- `GET /queue/metrics` registrado como escopo adicional à issue #46.

### `revisao-issue-46.md` e `modificacoes-issue-46.md` (este arquivo)
**Motivo:** manter o registro de revisão e o histórico das alterações aplicadas.

---

## Impactos técnicos

- **Zero mudança de schema**: nenhuma migration nova; `professional_id` é e
  continua incorporando UUID.
- Envelope de erro de validação mudou de `{ error, details }` para
  `{ status, statusCode, message }` — ajuste necessário no frontend.
- `assigneeId` numérico (`?assigneeId=12`) deixou de ser aceito (400).
- Fora esses dois pontos, o contrato da resposta (`data/page/pageSize/total/totalPages/assignees`)
  não mudou.

## Validações executadas

- `npm run typecheck` — passou.
- `npm run lint` — passou.
- `npx prettier --check` nos arquivos da branch — passou.
- Testes manuais com Docker (`curl`): autenticação (401/403/200), busca parcial
  (protocolo/e-mail/nome), filtros combinados, paginação e clamp, 400 descritivo
  para parâmetros inválidos, conflito `unassigned`+`assigneeId`, métricas
  (`total/unassigned/inProgress/overdue`) e regra `CURRENT_DATE` — todos OK.