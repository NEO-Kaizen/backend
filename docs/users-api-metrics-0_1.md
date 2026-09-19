# Contrato de API — Métricas de Usuários

Contrato de comunicação Frontend ↔ Backend para as métricas consolidadas da
base de usuários exibidas no painel administrativo (`/metricas`).

- Fonte de verdade: Issue #77 (`issue-metricas-usuarios.md`) define as regras
  de contagem das quatro métricas; a Issue #96 alinha os nomes das propriedades
  ao modelo consumido pelo frontend.
- Referências: `src/shared/types/user.ts` (`UserMetricsResponse`),
  `src/modules/users/*` (router/service/repository/controller),
  `src/shared/types/queue.types.ts` (padrão `QueueMetricsResponse`),
  `src/shared/middleware/requireRole.ts` e `src/shared/middleware/auth.ts`
- Erros sempre no envelope: `{ "status": "error", "statusCode": number, "message": string }`

---

## Tipos compartilhados

```ts
// Métricas consolidadas da base de usuários — retorno único (objeto com as 4
// contagens, sem paginação e sem lista). Contagem derivada de `users` e do
// JOIN com `profiles` em uma única query.
export interface UserMetricsResponse {
  total: number; // total de usuários cadastrados (todos, ativos ou não)
  active: number; // usuários com conta ativa (`is_active = true`)
  pending: number; // usuários com troca de senha pendente
  // (`must_change_password = true` — senha temporária / primeiro acesso)
  admins: number; // usuários vinculados ao perfil `administrador`
  // (`profiles.name = 'administrador'`)
}
```

---

## 1. GET /users/metrics — Métricas de usuários (painel administrativo)

Protegido por autenticação e restrito ao perfil `Administrador` — as rotas do
módulo `users` aplicam `authMiddleware` + `requireRole("Administrador")` no
nível do router, portanto todas as rotas, inclusive esta, exigem cookie de
sessão JWT válido e perfil de administrador.

Endpoint sem query params e sem body. As contagens são derivadas em uma única
consulta com `COUNT` condicionais sobre a tabela `users` (JOIN em `profiles`
para `admins`); o resultado é um objeto simples, no formato de contrato
direto (sem envelope) — mesmo padrão de `GET /queue/metrics`.

**Response 200** — `UserMetricsResponse`:

```ts
{
  total: 15,   // number
  active: 13,  // number
  pending: 3,  // number
  admins: 3,   // number
}
```

**Exemplo real** — consulta autenticada como Administrador em ambiente com o
seed de desenvolvimento (users 101–115):

```http
GET /users/metrics HTTP/1.1
Cookie: session_id=<jwt>
```

**Response** — `200 OK`:

```json
HTTP/1.1 200 OK

{
  "total": 15,
  "active": 13,
  "pending": 3,
  "admins": 3
}
```

**Exemplo de erro** — sem cookie de sessão:

```json
HTTP/1.1 401 Unauthorized

{
  "status": "error",
  "statusCode": 401,
  "message": "Token não fornecido"
}
```

**Exemplo de erro** — perfil sem permissão (ex.: Analista):

```json
HTTP/1.1 403 Forbidden

{
  "status": "error",
  "statusCode": 403,
  "message": "Acesso restrito ao perfil Administrador"
}
```

**Exemplo de erro** — conta com troca de senha pendente:

```json
HTTP/1.1 403 Forbidden

{
  "status": "error",
  "statusCode": 403,
  "message": "Troca de senha obrigatória antes de continuar"
}
```

**Erros:**

| Status | Quando                                                                                                                                                                          |
| ------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 401    | Sem cookie de sessão — `Token não fornecido`                                                                                                                                    |
| 401    | Token inválido ou expirado; usuário ou perfil desativado; sessão revogada após troca de senha (`Token inválido ou expirado` / `Sua sessão foi revogada. Faça login novamente.`) |
| 403    | Sessão com `must_change_password = true` (bloqueada até concluir a troca) — `Troca de senha obrigatória antes de continuar`                                                     |
| 403    | Perfil diferente de `Administrador` — `Acesso restrito ao perfil Administrador`                                                                                                 |

---

## Observações do contrato

- Valores de `total`/`active`/`pending`/`admins` são
  inteiros positivos; chaves em inglês/camelCase e dados de domínio em
  português (`administrador` como nome do perfil), conforme convenção do
  projeto.
- `pending` conta `must_change_password = true` **independentemente de
  `is_active`** — um usuário inativo com senha temporária continua pendente.
  Contar "pendentes apenas entre ativos" seria outra regra de negócio,
  registrada como decisão separada na Issue #77.
- `active` representa "contas ativas" (`is_active`), **não** usuários
  online em tempo real: o projeto não rastreia sessões abertas no banco. Se o
  produto exigir "online neste momento", é necessária uma modelagem própria
  (ex.: tabela de sessões/tokens) — fora deste contrato.
- O filtro de `admins` usa o nome de perfil em minúsculas
  (`profiles.name = 'administrador'`), consistente com o seed de perfis
  (`solicitante`, `analista`, `administrador`, `gestor`). Perfis futuros com
  outra caixa exigiriam normalização `LOWER()` — fora do escopo atual.
- O exemplo dos critérios de aceite da Issue #77 indica `admins: 1`
  (ilustrativo); o valor real pós-seed é **3** (users 102, 109 e 115). O
  contrato e as evidências usam os valores reais de banco como fonte da verdade.
- Comportamento consistente com as demais rotas administrativas: um
  administrador com senha pendente (`must_change_password = true`) também é
  bloqueado neste endpoint até concluir a troca (`403`) — sem regressão.
- Contagens em banco com o seed de desenvolvimento (users 101–115):
  `total = 15`, `active = 13`, `pending = 3`, `admins = 3`.
- Endpoint de leitura: sem escrita, sem auditoria e sem migration — nenhuma
  dependência de schema. A evolução (ex.: agrupamentos por perfil, gráficos)
  será contrato próprio.
