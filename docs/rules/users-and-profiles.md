# Usuários, perfis e autoatendimento

## Extensões 1:1

- **`requester`** — todo usuário criado pela API nasce com a extensão de
  solicitante (`area`, `department`, `manager`, `additionalContact`). O bloco é
  obrigatório no `POST /users` e é reutilizado/absorvido quando há linha
  anônima do mesmo e-mail.
- **`professional`** — apenas o perfil `analista` nasce com
  `details_professional`. `capacity`, `status`, especialidades e cargo são
  persistidos nessa linha, mas a API expõe apenas
  `jobTitle`, `specialties`, `attendedCategoryIds` e `notes`. Para os demais
  perfis o bloco é proibido.

## Perfis

Os únicos nomes aceitos por `resolveRole` hoje são `solicitante`, `analista`,
`gestor` e `administrador` (minúsculos). Um nome de perfil existente no banco
fora dessa lista faz o serviço lançar `500` — o modelo de perfis customizados
ainda não está implementado no código.

## Criação (`POST /users`)

- Exige `fullName`, `email`, `role` e `requester`.
- `professional` é obrigatório para `analista` e proibido nos demais.
- Não é permitido criar conta de `Administrador` por esta rota → `403`.
- E-mail duplicado → `409`.
- A senha temporária nasce aleatória, é retornada **uma única vez** e marca
  `mustChangePassword = true`.
- Usuário, extensões e auditoria são gravados na mesma transação.

## Edição administrativa (`PUT /users/{id}`)

- Merge parcial apenas no nível do payload: `fullName`, `email`, `role`,
  `requester` e `professional` são aceitos; `requester` faz merge campo a
  campo.
- `professional` é **substituição integral**: exige `jobTitle`,
  `specialties` (≥ 1) e `attendedCategoryIds` (≥ 1); `notes` ausente vira
  `null`.
- Trocar para `analista` exige `professional` (quando o alvo ainda não for
  analista); `professional` em perfil não-analista → `400`.
- Rebaixar um analista para outro perfil **remove** a linha
  `details_professional`.
- Contas de `Administrador` só podem ter o bloco `requester` alterado → `403`.
- Promover qualquer usuário a `Administrador` também é bloqueado → `403`.
- O próprio ator não pode editar a própria conta por esta rota → `400`.
- E-mail duplicado → `409`.

## Autoatendimento (`GET/PUT /users/me`)

`GET` devolve o perfil completo (dados básicos + `requester` + `professional` +
avatar).

- `requester` pode ser `null` em cadastros legados.
- Analista legado sem linha em `details_professional` recebe um bloco
  `professional` sintético (`jobTitle: null`, arrays vazios, `notes: null`), não
  `null`.
- Usuário do token que não existe mais → `404`.

`PUT` é multipart (`payload` JSON + `avatar` opcional) e aceita:

- `fullName` (1..150) — sincroniza também `requesters.full_name` e
  `requesters.corporate_email`;
- `requester.additionalContact` (até 100; `""`/`null` limpam);
- `requester.area`, `department`, `manager` **somente quando o próprio usuário
  é Administrador**;
- `removeAvatar: true`.

Não aceita `email`, `role` nem `professional` (→ `400`). Enviar `avatar` e
`removeAvatar: true` na mesma chamada → `400`.

O bloco `requester` sofre **UPSERT**: se a linha não existir, ela é criada.

Avatar: JPEG/PNG até 2 MB. `removeAvatar` não pode coexistir com upload. MIME
ou extensão inválida → `415`; tamanho → `413`; campo de arquivo inesperado ou
limite de quantidade de campos/arquivos → `400`.

> ⚠ **Decisão pendente:** a issue #125 descrevia um escopo mais amplo de
> autoatendimento (área/departamento/gestor para qualquer usuário e edição do
> bloco profissional). O código atual restringe esses campos ao Administrador.
> A regra efetiva é a desta seção.

## Status da conta

- `PATCH /users/{id}/status` ativa/desativa (`isActive`).
- Alterar a própria conta → `400`.
- Contas de Administrador são protegidas → `403`.
- Conta com troca de senha pendente fica bloqueada até concluir
  `PUT /auth/change-password`.
- `POST /users/{id}/reset-password` gera nova senha temporária e marca a troca
  como obrigatória; a própria conta → `400`; Administrador → `403`.
- Desativar não apaga dados; solicitações e auditoria permanecem.

## Métricas

`GET /users/metrics` (Administrador) retorna:

- `total` — todos os usuários;
- `active` — `is_active = true`;
- `pending` — `must_change_password = true`, **independente** de `is_active`;
- `admins` — perfil com nome exatamente `administrador` (comparação
  case-sensitive, sem `LOWER()`).

## Listagem

`GET /users` é paginado (`page`, `pageSize` até 50), com filtro por `profile`
(nome em `profiles.name`) e `search`. Administrador only.

`GET /users/analysts` é a lista **sem paginação** usada no modal de atribuição:
analistas ativos com `specialty`, `categories`, `notes` e `requestLoad`. A rota
hoje só exige sessão — **qualquer perfil autenticado** (inclusive Solicitante)
consegue lê-la, e a resposta inclui `notes` internas.

> ⚠ **Dívida de acesso:** restringir `/users/analysts` aos perfis internos (ou
> remover `notes` da resposta) é uma correção pendente; a OpenAPI documenta o
> comportamento atual.
