# Revisão — Issue #57: Papéis por relacionamento na autenticação

> Revisão feita sobre a branch `feat/57-user-roles-refactor` em `origin/main`.
> Nenhuma alteração foi aplicada — este documento apenas aponta o que deve ser
> ajustado e as decisões pendentes antes de aplicar.

## Resumo executivo

A branch já implementa **a maior parte do escopo**: `Solicitante` voltou a
autenticar, o papel é resolvido por `JOIN` com `profiles` + nome do perfil
(`resolveRole`), login de usuário/perfil inativo responde `401` genérico com
timing equalizado (hash bcrypt dummy), não há logs de usuário/senha,
`POST /auth/login` e `GET /auth/me` retornam DTOs tipados (id, name, email,
role, mustChangePassword) e a troca obrigatória de senha gera cookie com
escopo dedicado.

Validações já executadas nesta revisão: `typecheck` ✅, `lint` ✅ e
`prettier --check` nos 20 arquivos tocados pela branch ✅.

Restam **2 pontos de ajuste** (ambos dependentes de decisão de contrato) e a
**validação HTTP manual** (critério de aceite), que será feita no próximo passo
com docker. Aprovação sugerida: **aprovar a base, ajustar P1 e P2 antes do merge**.

---

## Critérios de aceite

| Critério                                                                | Status     | Observação                                                                                                                     |
| ----------------------------------------------------------------------- | ---------- | ------------------------------------------------------------------------------------------------------------------------------ |
| Os quatro perfis autenticam quando ativos                               | ⏳ Validar | Testar manualmente `Administrador`, `Gestor`, `Analista` e `Solicitante` com docker                                            |
| Nenhum ID de perfil é interpretado por posição fixa                     | ✅ OK      | `ROLES_MAP` (IDs 1–4) removido; todos os pontos usam `resolveRole(profile_name)` vindo de `JOIN profiles`                      |
| Usuário inativo recebe resposta genérica de credenciais inválidas       | ✅ OK      | `!is_active \|\| !profile_is_active` → compare com hash dummy + `"Credenciais inválidas"` (anti-enumeração)                    |
| Senha/hash nunca aparece em resposta ou log                             | ✅ OK      | `password_hash` é selecionado apenas para `comparePassword` e nunca serializado; nenhum `console.log` de usuário/senha no auth |
| `/auth/me` rejeita sessão inválida e retorna usuário válido sem segredo | ⚠️ Parcial | Revalida usuário+perfil no banco e não expõe hash ✅; porém responde `403` para quem está com senha pendente de troca — **P1** |
| Typecheck, lint, format check e validação HTTP passam                   | ⚠️ Parcial | typecheck/lint/prettier ✅; validação HTTP ainda não executada                                                                 |

---

## Escopo incluído — status

| Item                                                   | Status     | Como está                                                                                                                                     |
| ------------------------------------------------------ | ---------- | --------------------------------------------------------------------------------------------------------------------------------------------- |
| Reincluir `Solicitante` no tipo de papel               | ✅ OK      | `ROLES` em `src/shared/types/role.ts` contém os 4 perfis (não foi removido); `isRole` valida token                                            |
| Consultar nome do perfil por `JOIN`, sem mapa por ID   | ✅ OK      | `authUserQuery()`, `findUserById`, `listUsers` e middleware usam `JOIN profiles` e `p.name as profile_name`                                   |
| Impedir login de usuário/perfil inativo                | ✅ OK      | `auth.service.authenticate` e middleware (`getAuthState`) checam `is_active` e `profile_is_active`                                            |
| Remover logs de usuário e `password_hash`              | ✅ OK      | Não há `console.log` no auth (só `console.error` genérico no `errorHandler`, sem corpo/segredos)                                              |
| Padronizar o DTO de login com o Frontend               | ✅ OK      | `LoginResponseDTO`/`MeResponseDTO` documentados no README e `funcionalidades-especificacao.md`                                                |
| Disponibilizar `GET /auth/me` validando JWT no Backend | ✅ OK      | `authRoutes.get("/me", authMiddleware, me)` + releitura no banco (`getSessionUser`)                                                           |
| Preparar indicador de troca obrigatória de senha       | ⚠️ Parcial | Login emite `mustChangePassword` e cookie `change_password`; porém `/auth/me` não retorna a sessão enquanto a troca estiver pendente — **P1** |

---

## Pontos a ajustar

### P1 — `GET /auth/me` bloqueado para quem está com senha pendente (decisão de contrato)

**Onde:** `src/shared/middleware/auth.ts` (linhas 49–58, `isPasswordChangeRoute`).

**Problema:** o middleware só libera `/auth/change-password` quando
`must_change_password` é `true`. Logo `GET /auth/me` responde `403 "Troca de
senha obrigatória antes de continuar"` e o frontend **não consegue restaurar a
sessão** (recarregar página / voltar ao app) para descobrir o `mustChangePassword`
e exibir a tela de troca — o indicador fica inacessível via `/me`, ao contrário
do que sugere a issue ("preparar indicador de troca obrigatória de senha" +
"`/auth/me` retorna usuário válido sem segredo").

**Proposta:** permitir `GET /auth/me` para o escopo `change_password` /
`must_change_password` (retorna `200` com `mustChangePassword: true`, mesmos
dados sem segredo), mantendo o bloqueio para **todas** as demais rotas.

**Alternativa (manter como está):** o frontend dependeria apenas da resposta do
`POST /auth/login` para saber que precisa trocar a senha; `/auth/me` fica morto
durante o estado pendente. ⚠️ Decisão necessária.

### P2 — `PUT /auth/change-password` expõe `passwordChangedAt` e não tem DTO tipado

**Onde:** `src/modules/auth/auth.controller.ts` (linha 120, `res.status(200).json(updated)`).

**Problema:** `updated` é `SessionUserResult` (retorno cru do service) e serializa
`passwordChangedAt` (época em ms) — campo interno fora do contrato. Não viola a
regra de "sem hash", mas o shape não é tipado com DTO, contrariando o padrão de
`LoginResponseDTO`/`MeResponseDTO` e o critério "sem expor dados sensíveis".

**Proposta:** criar `ChangePasswordResponseDTO` (`id`, `name`, `email`, `role`,
`mustChangePassword: false`) e retornar somente esses campos.

---

## Observações (sem ação nesta PR)

- **Case-sensitive na entrada de perfil do módulo `users`:** `findProfileIdByName`
  e o filtro `GET /users?profile=` fazem `match exato` contra o banco (lowercase
  `solicitante`, `analista`...); o frontend enviando `"Analista"` (capitalizado)
  passaria com `400 "Perfil inválido."` na criação — comportamento **pré-existente**
  e fora do escopo desta issue (#57 é autenticação). Registrar para issue/melhoria
  futura.
- **`resolveRole` lança `500 "Perfil inválido"` para `profile_name` fora do mapa
  canônico** (`src/shared/utils/roleUtils.ts`). Perfis são controlados por
  migration — erro explícito de configuração é preferível a `401` genérico
  (esconderia bug de deploy). Manter como está.
- **`errorHandler` usa `console.error` genérico** (método, URL, erro) — sem corpo
  de requisição, sem usuário, sem segredos. Seguro (a issue pede só remover log
  de usuário/`password_hash`).
- **Mudanças de formatação fora da issue:** `src/database/conection.ts`,
  `src/shared/middleware/upload.ts` foram reformatados pelo prettier e
  `eslint.config.js` ganhou ignore de `dist/` — mantidos porque fazem a
  `format:check` passar na branch.

---

## Validações

| Validação                                                                                 | Status           |
| ----------------------------------------------------------------------------------------- | ---------------- |
| `npm run typecheck`                                                                       | ✅               |
| `npm run lint`                                                                            | ✅               |
| `prettier --check` (20 arquivos da branch)                                                | ✅               |
| Validação HTTP (`curl` + docker) — 4 perfis, inativo, `/auth/me`, sem segredo em resposta | ⏳ próximo passo |

---

## Status da revisão — correções aplicadas

Depois da aprovação das decisões, foram aplicadas as correções P1 e P2:

### P1 — `GET /auth/me` liberado no estado de senha pendente ✅

**Arquivo:** `src/shared/middleware/auth.ts`.

O middleware passou a permitir **duas** rotas quando `must_change_password` é
`true`: `PUT /auth/change-password` e `GET /auth/me` (compiladas em
`isPendingChangeAllowedRoute`). O `/auth/me` retorna `200` com
`mustChangePassword: true`, permitindo o frontend restaurar a sessão e exibir
a tela de troca; todas as demais rotas continuam bloqueadas com `403`.

**Validado com docker:** login pendente → `200` com `mustChangePassword:true`;
`/auth/me` → `200` com os mesmos dados; `GET /users` → `403 "Troca de senha
obrigatória antes de continuar"`.

### P2 — `PUT /auth/change-password` com DTO tipado, sem `passwordChangedAt` ✅

**Arquivos:** `src/modules/DTOs/auth/ChangePasswordResponse.dto.ts` (novo),
`src/modules/auth/auth.controller.ts`.

A resposta deixou de serializar o `SessionUserResult` cru (que expunha
`passwordChangedAt`, época em ms) e passou a retornar `ChangePasswordResponseDTO`
(`id`, `name`, `email`, `role`, `mustChangePassword: false`).

**Validado com docker:** resposta sem `passwordChangedAt`; após a troca, o
cookie antigo é revogado (`401 "Sua sessão foi revogada"`) e o novo login usa a
senha alterada.

### Documentação atualizada ✅

**Arquivos:** `README.md`, `funcionalidades-especificacao.md` — nota de que
`GET /auth/me` responde `200` com `mustChangePassword: true` quando a troca
está pendente (única rota liberada nesse estado, junto de change-password).

### Validações após as correções

| Validação                                                                                              | Status |
| ------------------------------------------------------------------------------------------------------ | ------ |
| `npm run typecheck`                                                                                    | ✅     |
| `npm run lint`                                                                                         | ✅     |
| `prettier --check` (arquivos da branch + novos)                                                        | ✅     |
| Validação HTTP (docker) — 4 perfis ativos, inativo, `/auth/me` válido/ausente/inválido, fluxo de troca | ✅     |

Detalhamento por arquivo: `modificacoes-issue-57.md`.
