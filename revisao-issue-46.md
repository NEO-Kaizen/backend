# Revisão — Issue #46: `GET /queue` (Fila internada/paginada)

> Revisão feita sobre a branch `feat/46-centralized-queue-endpoint` em `origin/main`.
> Nenhuma alteração foi aplicada — este documento apenas aponta o que deve ser ajustado e como.

## Resumo executivo

A funcionalidade principal está implementada e funcionando (rota autenticada, busca parcial, filtros combináveis, paginação com `total`/`totalPages`, contrato documentado no README). Porém, **o critério de aceite "format check passa" está quebrado** e existem **inconsistências de contrato** (formato de erro 400, serialização de data) e **erros latentes** em bordas de validação e tipagem que podem gerar 500 ou resultados incorretos em produção.

Aprovação sugerida: **não aprovar como está** — resolver os itens P1 abaixo antes do merge.

---

## Critérios de aceite

| Critério | Status | Observação |
| --- | --- | --- |
| Rota exige cookie/JWT válido | ✅ OK | `authMiddleware` aplicado |
| Pesquisa parcial por protocolo ou e-mail | ✅ OK | também busca por nome do solicitante (bônus) |
| Filtros podem ser combinados | ⚠️ Parcial | combinações `unassigned` + `assigneeId` conflitam silenciosamente |
| Paginação retorna total e total de páginas | ✅ OK | |
| `unassigned=true` retorna somente sem responsável | ✅ OK | |
| Parâmetros inválidos/inexistentes retornam 400 descritivo | ⚠️ Parcial | `unassigned=abc` e `page=1.5`/`pageSize=1.5` não são rejeitados; envelope do 400 é fora do padrão |
| Contrato documentado | ✅ OK | README § "Fila de atendimento" |
| Typecheck, lint e format check passam | ❌ **Falha** | `format:check` falha em 7 arquivos do módulo queue + `README.md` + `src/router.ts` |

---

## Pontos a ajustar

### P1 — Correções obrigatórias

#### 1. Validação de `page`/`pageSize` aceita valores não inteiros e `Infinity`

**Onde:** `src/modules/queue/queue.schemas.ts` (linhas 51–56).

**Problema:** `Number(q.page)` só valida presença/NaN/mínimo. `page=1.5` e `page=Infinity` passam pela validação e estouram em:
- `page=1.5` → `offset = 0.5 * pageSize` (offset fracionário no SQL);
- `page=Infinity` → `offset = Infinity` → **erro 500 no PostgreSQL**.

O teste `!page` também trata `pageSize=100`/`page=1` corretamente, mas não cobre inteiros.

**Como ajustar:**
```ts
const page = q.page !== undefined ? Number(q.page) : undefined;
const pageSize = q.pageSize !== undefined ? Number(q.pageSize) : undefined;

if (page === undefined || !Number.isInteger(page) || page < 1) {
  errors.push('Invalid or missing "page" (must be integer >= 1)');
}
if (pageSize === undefined || !Number.isInteger(pageSize) || pageSize < 1 || pageSize > 100) {
  errors.push('Invalid or missing "pageSize" (must be integer 1..100)');
}
```

> Alternativa preferível (ver P2 #8): migrar para Zod como nos demais módulos, que resolve esta e outras bordas.

#### 2. `assigneeId` numérico é aceito, mas nunca casa com `professional_id` (UUID)

**Onde:** `src/modules/queue/queue.schemas.ts` (linhas 68–81) e README (linhas 289, 313, 319–322).

**Problema:** `professional_id` na migration `202609100005_create_professionals.js` é `uuid` (gen_random_uuid + seeds com UUID). O validador aceita `assigneeId` numérico (`numericRegex`), que **nunca** corresponde a nenhum registro — o filtro retorna lista vazia silenciosamente. O README documenta exemplos com id numérico (`"45"`, `"12"`), reforçando o erro.

**Como ajustar:**
- Aceitar apenas UUID no `assigneeId` (remover `numericRegex`):
```ts
if (uuidRegex.test(s)) {
  assigneeId = s;
} else {
  errors.push('Invalid "assigneeId" (expected UUID ou "unassigned")');
}
```
- Corrigir os exemplos do README para UUIDs reais (use os seeds: `650e8400-e29b-41d4-a716-446655440001` etc.).

#### 3. `unassigned` com valor inválido é aceito como `false`

**Onde:** `src/modules/queue/queue.schemas.ts` (linha 83).

**Problema:** `unassigned=abc` vira silenciosamente `false`, violando o critério "parâmetros inválidos retornam 400".

**Como ajustar:**
```ts
let unassigned: boolean | undefined;
if (q.unassigned !== undefined && q.unassigned !== null) {
  const s = String(q.unassigned);
  if (s === 'true' || s === '1') unassigned = true;
  else if (s === 'false' || s === '0') unassigned = false;
  else errors.push('Invalid "unassigned" (expected true/false)');
}
```

#### 4. Conflito silencioso entre `unassigned` e `assigneeId`

**Onde:** `src/modules/queue/queue.service.ts` (linhas 12–13) e `queue.repository.ts` (linhas 59–63).

**Problema:** se o cliente enviar `unassigned=true&assigneeId=<uuid>`, o `assigneeId` é silenciosamente ignorado (o `if (unassigned)` vence). Idem para `assigneeId=unassigned&assigneeId=<uuid>` (não dá para mandar duas vezes, mas `assigneeId=unassigned&unassigned=true` é redundante/ambíguo).

**Como ajustar:** rejeitar combinações conflitantes na validação com erro descritivo:
```ts
if (unassigned && assigneeId && assigneeId !== 'unassigned') {
  errors.push('"unassigned" and "assigneeId" cannot be combined');
}
```

---

### P2 — Contrato e consistência com o restante da API

#### 5. Envelope de erro 400 fora do padrão do projeto

**Onde:** `src/modules/queue/queue.controller.ts` (linha 19).

**Problema:** o 400 de validação retorna `{ error, details }`, enquanto todas as outras rotas (e o `errorHandler`) usam `{ status: "error", statusCode, message }`. O frontend terá que tratar dois formatos diferentes.

**Como ajustar:** lançar `AppError(..., 400)` e deixar o `errorHandler` montar o envelope; e usar `formatZodIssues` (se migrar para Zod, item P2 #8):
```ts
if (!parseResult.success) {
  return next(new AppError(`Parâmetros inválidos: ${parseResult.errors.join('; ')}`, 400));
}
```
Isso também remove o `try/catch` duplicado e o `return res.status(...)` à mão, uniformizando o controller com `requests.controller.ts`/`prioritization.controller.ts`.

#### 6. `createdAt` serializado com formato não-ISO

**Onde:** `src/modules/queue/queue.service.ts` (linha 32, `String(item.createdAt)`).

**Problema:** `node-postgres` devolve `timestamptz` como `Date`; `String(Date)` produz `"Mon Sep 14 2026 14:03:11 GMT-0300 (...)"`, dependente de locale. O restante da API usa `toISOString()` (ver `requests.repository.ts` linhas 254/314).

**Como ajustar:**
```ts
createdAt: item.createdAt instanceof Date ? item.createdAt.toISOString() : String(item.createdAt),
```
Ou, melhor, já serializar na camada do repositório.

#### 7. Comportamento de "paginação fora da faixa" não documentado e inconsistente

**Onde:** `src/modules/queue/queue.service.ts` (linhas 28, 42).

**Problema:** a página é "acionada" para `totalPages` quando extrapola (comportamento não documentado), mas quando `total=0` → `totalPages=0` e a página solicitada é preservada (ex.: `page=3` retorna `page: 3`). Além disso, o `offset` é calculado antes do clamp, então a query consulta o offset extrapolado (desperdício).

**Como ajustar:** decidir e documentar o comportamento — recomendo: se `page > totalPages && total > 0`, retornar `400`/clamp com mensagem; se `total === 0`, retornar `page: 1`. Documentar no README.

#### 8. Rota interna sem restrição de perfil (divergência com o padrão da issue #48)

**Onde:** `src/modules/queue/queue.router.ts` (linhas 8–10).

**Problema:** a consulta interna de solicitações (`GET /requests/:protocol/internal`) usa `authMiddleware + requireRole("Analista","Gestor","Administrador")`. A fila, que é um endpoint interno com dados sensíveis (e-mail do solicitante), usa apenas `authMiddleware`. Sem `requireRole`, qualquer usuário autenticado (todos os perfis atuais são internos, mas o contrato não garante o futuro) acessa a fila.

**Como ajustar:** adicionar a mesma proteção da rota interna:
```ts
queueRoutes.get('/', authMiddleware, requireRole('Analista', 'Gestor', 'Administrador'), centralizedQueue);
```

#### 9. `fetchAllAssignees` lista profissionais inativos e roda sempre

**Onde:** `src/modules/queue/queue.repository.ts` (linhas 89–95).

**Problema:** a tabela `professionals` tem `status` (`active`/`inactive`); listar inativos polui o filtro de responsável.

**Como ajustar:**
```ts
export const fetchAllAssignees = async (): Promise<{ id: string; name: string }[]> => {
  const rows = await db('professionals')
    .where('status', 'active')
    .select('professional_id as id', 'full_name as name')
    .orderBy('full_name', 'asc');
  return rows;
};
```
> A tipagem atual `{ id: number }[]` está errada — `professional_id` é UUID (string). Ver item P1 #2.

---

### P3 — Arquitetura e qualidade (recomendado)

#### 10. Volta para validação manual, abandonando o Zod (padrão do repositório)

**Onde:** `src/modules/queue/queue.schemas.ts`.

**Problema:** o commit `e7abdbb` ("adds Zod schemas") foi substituído por validação manual no `fa100b6`. Todos os outros módulos validam com Zod + `formatZodIssues` (`requests`, `prioritization`, `users`, `auth`). A validação manual reimplementa à mão várias bordas que o Zod resolve (inteiros, enums, erros descritivos) e resultou nos bugs P1 #1/#3.

**Como ajustar (recomendado):**
```ts
import { z } from 'zod';
// em queue.schemas.ts
export const queueQuerySchema = z.object({
  search: z.string().trim().max(254).optional(),
  status: z.enum(statusValues).optional(),
  priority: z.enum(priorityValues).optional(),
  assigneeId: z.union([z.string().uuid(), z.literal('unassigned')]).optional(),
  unassigned: z.enum(['true', 'false', '1', '0']).transform((v) => v === 'true' || v === '1').optional(),
  page: z.coerce.number().int().min(1),
  pageSize: z.coerce.number().int().min(1).max(100),
}).refine((data) => !(data.unassigned && data.assigneeId && data.assigneeId !== 'unassigned'), {
  message: '"unassigned" and "assigneeId" cannot be combined',
});
```
E no controller usar `formatZodIssues` (item P2 #5), eliminando o cast `as QueueQuery`.

#### 11. Tipos duplicados/órfãos sobre a mesma forma de query

**Onde:** infraestrutura de tipos do módulo.

**Problema:** existem 4 definições sobrepostas da query da fila:
- `GetQueueQuery` (`src/modules/DTOs/queue/queue.dto.ts`) — **não usado em lugar nenhum**;
- `QueueQuerySchema` (`queue.schemas.ts`) — só usado como retorno do validador;
- `QueueQuery`/`QueueFilterQuery`/`PaginationQuery` (`src/shared/types/queue.types.ts`);
- `FindQueueParams` (`queue.dto.ts`) que repete os campos de filtro.

Além disso, `statusValues`/`priorityValues` duplicam as unions `RequestStatus`/`RequestPriority` de `shared/types/requests.ts` (risco de divergência quando um status novo for criado).

**Como ajustar:**
- Remover `GetQueueQuery` (e `QueueFilterQuery`/`PaginationQuery` se ficarem sem uso);
- Extrair os status/prioridade para constantes compartilhadas em `shared/types/requests.ts` (derivando a union a partir das constantes) e usá-las no Zod (`z.enum(...)`);
- Manter um único tipo de entrada (`QueueQuery`) consumido por schema, service e repository.

#### 12. Strings mágicas no repositório de métricas

**Onde:** `src/modules/queue/queue.repository.ts` (linhas 5–11, 25).

**Problema:** `IN_PROGRESS_STATUSES` e `NOT IN ('Concluído','Cancelado')` duplicam valores que já existem no banco (`statuses.is_final`) e em `shared/types`. Se um status novo for adicionado, as métricas quebram silenciosamente.

**Como ajustar:**
```ts
// "em andamento": qualquer status não-final
db.raw(`COUNT(CASE WHEN s.is_final = false THEN 1 END)::int as "inProgressRequests"`),
// atrasado: prazo expirado e não-final
db.raw(`COUNT(CASE WHEN requests.desired_deadline < CURRENT_DATE AND s.is_final = false THEN 1 END)::int as "overdueRequests"`),
```
Observação: `desired_deadline` é `date` — comparar com `NOW()` marca como "atrasada" uma solicitação cujo prazo vence **hoje**; `CURRENT_DATE` corrige a regra.

#### 13. Escopo extra não previsto na issue

**Onde:** `GET /queue/metrics` (router/controller/service).

**Problema:** a issue #46 especifica somente `GET /queue`. O endpoint de métricas foi adicionado no meio da branch (justificável pelas telas de "Home", mas não estava no contrato). 

**Como ajustar:** manter, mas registrar explicitamente na issue/PR como escopo adicional — ou extrair para uma issue própria, para que o contrato da #46 seja revisado pelo frontend com foco correto.

#### 14. Descoberta de testes

**Onde:** todo o repositório.

**Problema:** `npm test` apenas ecoa "No tests configured yet". Não há teste unitário/integração para `validateQueueQuery`, `findQueueRequests` nem para o controller.

**Como ajustar (recomendação, não bloqueante para esta issue):** criar ao menos testes de validação (bordas dos P1 #1/#3) e de integração da rota (200 com filtros, 400, 401) com Vitest + Supertest. Os bugs das bordas listados no P1 teriam sido pegos por testes.

---

## Checklist de correção — arquivos afetados

| Arquivo | Ação |
| --- | --- |
| `src/modules/queue/queue.schemas.ts` | Validar inteiros/Infinity, assinar `assigneeId` só UUID, validar `unassigned`, rejeitar conflito `unassigned`+`assigneeId`; ou migrar para Zod |
| `src/modules/queue/queue.controller.ts` | Trocar envelope manual por `AppError`/`errorHandler`; remover cast `as QueueQuery`; remover try/catch duplicado |
| `src/modules/queue/queue.service.ts` | Serializar `createdAt` em ISO; decidir/clamp de página consistente (inclusive `total=0`) |
| `src/modules/queue/queue.repository.ts` | Corrigir tipagem de `fetchAllAssignees` (`id: string`), filtrar `status='active'`, usar `is_final`/`CURRENT_DATE` nas métricas |
| `src/modules/queue/queue.router.ts` | `requireRole('Analista','Gestor','Administrador')` |
| `src/modules/DTOs/queue/queue.dto.ts` | Remover `GetQueueQuery` não usado; manter apenas `FindQueueParams` (ou unificar) |
| `src/shared/types/queue.types.ts` | Remover duplicatas; centralizar enums em `shared/types/requests.ts` |
| `README.md` | Corrigir exemplos de `assigneeId` para UUID; documentar comportamento de página fora da faixa |
| `src/router.ts` + arquivos do módulo | Rodar `npm run format` (format:check falhando) |

## Evidências (comandos executados nesta revisão)

- `npm run typecheck` → ✅ sem erros
- `npm run lint` → ✅ sem erros
- `npm run format:check` → ❌ falha em: `README.md`, `seeds/requester_request/003_priorities.js`, `src/database/conection.ts`, `src/modules/DTOs/prioritization/{PrioritizationRequests,PrioritizationResponse}.dto.ts`, `src/modules/DTOs/queue/queue.dto.ts`, `src/modules/prioritization/prioritization.router.ts`, `src/modules/queue/*` (5 arquivos), `src/modules/users/{users.controller,users.router}.ts`, `src/router.ts`, `src/shared/middleware/{auth,requireRole,upload}.ts`, `src/shared/types/queue.types.ts`

> Dos arquivos acima, **9 foram alterados por esta branch** (`README.md`, `src/router.ts`, `src/modules/queue/*`, `src/shared/types/queue.types.ts`, `src/modules/DTOs/queue/queue.dto.ts`) — logo, a falha de format é introduzida pela PR.

---

## Status da revisão — correções aplicadas

Todas as modificações apontadas foram aplicadas (nenhuma decisão pendente; ver respostas às perguntas fechadas):

1. **Migração para Zod** em `queue.schemas.ts` → `queueQuerySchema` resolve P1 #1, #3, #4, P2 #5 e P3 #10 de uma vez (`z.coerce.number().int()` rejeita floats/`Infinity`, `unassigned` estrito `true/false/1/0`, `assigneeId` só UUID ou `unassigned`, `refine` rejeita combinação `unassigned` + `assigneeId`).
2. **Controller** no padrão dos demais módulos: `AppError` + `formatZodIssues(..., "query")`, sem `try/catch` nem cast (envelope `400` agora é o padrão da API).
3. **createdAt em ISO** via helper `toIso()` (aceita `Date` do pg ou string).
4. **Paginação**: `totalPages = 0` → `page: 1`; senão `Math.min(page, totalPages)` — comportamento documentado no README (decisão: clamp + documentar).
5. **Métricas**: `IN_PROGRESS_STATUSES` e status terminais movidos para `shared/types/requests.ts`; `overdueRequests` agora usa `CURRENT_DATE` (prazo que vence hoje não é atraso).
6. **`fetchAllAssignees`**: filtra `status = 'active'` e tipagem corrigida para `id: string`.
7. **`requireRole('Analista', 'Gestor', 'Administrador')`** nas duas rotas (`/` e `/metrics`).
8. **Limpeza de tipos**: `GetQueueQuery` removido; `PaginationQuery`/`QueueFilterQuery` eliminados; enums centralizados em `shared/types/requests.ts` (derivam `RequestStatus`/`RequestPriority`).
9. **README**: exemplos corrigidos para UUID, restrição de perfil, valores de `unassigned`, clamp de página, `assignees` ativos e escopo adicional de `/queue/metrics` registrado.
10. **Format**: Prettier aplicado aos arquivos da branch (format:check ✅ nesses arquivos).

Decisões tomadas pelo autor nas perguntas fechadas:
- Migrar para Zod ✅
- Página fora da faixa → clamp + documentar ✅
- Restringir por perfil com `requireRole` ✅
- Métricas: lista explícita + `CURRENT_DATE` ✅
- Manter `/queue/metrics` e documentar como escopo extra ✅
- Não adicionar testes nesta PR (repositório sem infraestrutura de testes) ✅

Validação final (executada após as correções, **sem** testes automatizados):
- `npm run typecheck` → ✅
- `npm run lint` → ✅
- `prettier --check` nos 10 arquivos da branch → ✅