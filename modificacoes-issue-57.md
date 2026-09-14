# Modificações — Issue #57 (Papéis por relacionamento na autenticação)

Documento de modificações aplicadas na branch
`feat/57-user-roles-refactor` após a revisão (`revisao-issue-57.md`), que já
havia implementado a maior parte do escopo. Este `.md` registra as duas
correções aplicadas nesta rodada (P1 e P2) e as decisões aprovadas.

---

## Decisões aprovadas

| Decisão                                           | Escolha                                                                                                    |
| ------------------------------------------------- | ---------------------------------------------------------------------------------------------------------- |
| `GET /auth/me` quando `must_change_password=true` | **Permitir** — retorna `200` com `mustChangePassword: true` (única rota liberada junto de change-password) |
| Resposta de `PUT /auth/change-password`           | **DTO tipado** sem `passwordChangedAt` (campo interno fora do contrato)                                    |
| Perfil desconhecido no `resolveRole`              | Manter `500 "Perfil inválido"` (erro explícito de configuração não vira `401` genérico)                    |
| Case-sensitive de perfil no módulo `users`        | Sem ação (pré-existente, fora do escopo da issue #57)                                                      |
| Testes                                            | Manuais com docker (vitest não configurado — `"No tests configured yet"`)                                  |

---

## Modificações

### `src/shared/middleware/auth.ts`

**P1 — Liberar `GET /auth/me` durante a troca obrigatória de senha.**

- O middleware anterior bloqueava qualquer rota exceto
  `/auth/change-password` quando `users.must_change_password` era
  `true` — o que deixava `GET /auth/me` respondendo `403` e impedia o
  frontend de restaurar a sessão (recarregar página) para descobrir o
  estado de troca e exibir a tela correspondente.
- Agora `isPendingChangeAllowedRoute` considera também
  `/auth/me`: o endpoint retorna `200` com `mustChangePassword: true`
  (sem segredos), enquanto todas as demais rotas — inclusive
  administrativas/`requireRole` — seguem bloqueadas com
  `403 "Troca de senha obrigatória antes de continuar"`.

**Motivo:** a issue pede "preparar indicador de troca obrigatória de senha" e
"`/auth/me` rejeita sessão inválida e retorna usuário válido sem segredo" — o
indicador só é acessível pelo frontend se `/auth/me` funcionar no estado
pendente.

### `src/modules/DTOs/auth/ChangePasswordResponse.dto.ts` (novo)

**P2 — DTO tipado da resposta de troca de senha.**

```ts
export interface ChangePasswordResponseDTO {
  id: string;
  name: string;
  email: string;
  role: Role;
  mustChangePassword: boolean; // sempre false após a troca
}
```

**Motivo:** padronizar o shape com `LoginResponseDTO`/`MeResponseDTO` e evitar
serializar o `SessionUserResult` cru do service (continha `passwordChangedAt`,
época em ms — campo interno fora do contrato).

### `src/modules/auth/auth.controller.ts`

- Import do `ChangePasswordResponseDTO`.
- `changePassword` passou a montar `ChangePasswordResponseDTO` e retornar
  `res.status(200).json(response)` em vez de `json(updated)`.

**Motivo:** P2 — string determinística do shape de resposta; `passwordChangedAt`
continua usado apenas no payload do novo JWT de sessão, nunca exposto.

### `README.md` e `funcionalidades-especificacao.md`

- Nota documentada em `GET /auth/me`: responde `200` com
  `mustChangePassword: true` quando a troca está pendente — única rota
  liberada nesse estado, junto de `PUT /auth/change-password`.

**Motivo:** manutenção do contrato documentado (critério "o contrato está
documentado" e referência para o frontend no fluxo de troca).

---

## Validações

| Validação                               | Resultado                                                                                                                                                                                            |
| --------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `npm run typecheck`                     | ✅                                                                                                                                                                                                   |
| `npm run lint`                          | ✅                                                                                                                                                                                                   |
| `prettier --check` (arquivos da branch) | ✅                                                                                                                                                                                                   |
| HTTP — 4 perfis ativos logam (`200`)    | ✅ `Analista`, `Administrador`, `Gestor`, `Solicitante`                                                                                                                                              |
| HTTP — perfil inativo                   | ✅ `401 "Credenciais inválidas"` (idêntico a e-mail inexistente/senha errada)                                                                                                                        |
| HTTP — `GET /auth/me`                   | ✅ `200` com sessão válida; `401` sem cookie (`Token não fornecido`); `401` com token inválido; revogado após troca                                                                                  |
| HTTP — fluxo de troca (P1/P2)           | ✅ login pendente → `/auth/me` `200 mustChangePassword:true` → change-password `200` sem `passwordChangedAt` → login com nova senha; rotas protegidas bloqueadas com `403` durante o estado pendente |

Registros de teste usados foram removidos ao final (`user_id` 107/108) e o
container do app Docker foi derrubado — sem alteração residual no banco.
