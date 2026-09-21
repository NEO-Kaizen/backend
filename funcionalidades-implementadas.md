# Funcionalidades Implementadas — Backend NEO Kaizen

> Inventário de **tudo o que já existe no código hoje**, com descrição curta de cada item.
> Requisitos ainda não implementados estão em [`funcionalidades-especificacao.md`](funcionalidades-especificacao.md).

## Sumário

- [1. Visão geral](#1-visão-geral)
- [2. Funcionalidades transversais](#2-funcionalidades-transversais)
- [3. Endpoints por módulo](#3-endpoints-por-módulo)
- [4. Modelo de dados](#4-modelo-de-dados)
- [5. Regras de negócio](#5-regras-de-negócio)
- [6. Segurança](#6-segurança)
- [7. Operação e desenvolvimento](#7-operação-e-desenvolvimento)
- [8. Previsto na especificação, ainda não implementado](#8-previsto-na-especificação-ainda-não-implementado)

---

## 1. Visão geral

| Item | Valor |
| --- | --- |
| Runtime | Node.js 24+ (`engines.node >= 24`), ESM (`"type": "module"`) |
| Linguagem | TypeScript estrito (`tsc`) |
| Framework HTTP | Express 5 |
| Banco | PostgreSQL |
| Acesso a dados | Knex (migrations/seeds + query builder) |
| Sessão | JWT em cookie HttpOnly |
| Validação | Zod 4 |
| Upload | Multer (memoryStorage) + gravação em disco |

Padrão arquitetural: por **módulo de domínio** (`src/modules/<modulo>`), com
`router → controller → service → repository`, schema Zod (`.schema.ts`) e DTOs
(`src/modules/DTOs`). Código compartilhado em `src/shared`.

Fluxo de boot: `src/server.ts` → `src/app.ts` (Express) → `src/router.ts`
(monta todas as rotas).

---

## 2. Funcionalidades transversais

### 2.1 Infraestrutura HTTP (`src/app.ts`)

- **CORS** com origens via `CORS_ORIGINS` e `credentials: true`.
- **`x-powered-by` desabilitado** (não expõe o framework).
- **`cookie-parser`**: leitura do cookie de sessão.
- **Serviço estático `GET /uploads/*`**: serve os assets do portal, público.
- **`express.json()`**: parser de corpo JSON.
- **`errorHandler` global** ao final da cadeia.
- Porta via `PORT` (padrão 3000).

### 2.2 Erros (`src/shared/errors`, `errorHandler`)

- **`AppError`**: erro operacional com `statusCode`.
- **`ValidationError`**: estende `AppError`, carrega `fields` (HTTP `422`).
- **Envelope**: `{ status: "error", statusCode, message }`; com `fields` quando há erros por campo.
- **Não tratados**: log no servidor; `5xx` respondem mensagem genérica (sem vazar detalhes).

### 2.3 Autenticação e autorização (middlewares)

- **`authMiddleware`**: valida o JWT do cookie e **revalida usuário/perfil no banco a cada request**:
  - token ausente/inválido/expirado → `401` genérico;
  - usuário ou perfil inativo → `401`;
  - **revogação**: compara `password_changed_at` do token com o do banco (troca/redefinição invalida tokens antigos);
  - **escopo de troca de senha**: `must_change_password` só acessa `PUT /auth/change-password` e `GET /auth/me`; demais rotas → `403`;
  - **papel lido do banco** (nunca do JWT) — troca de perfil vale imediatamente;
  - popula `req.user` e `req.authScope`.
- **`requireRole(...roles)`**: autorização por perfil; exige escopo de sessão; `403` se não autorizado.

### 2.4 Modo de abertura do portal (`requireAccessMode`)

- Lê `system_settings.solicitation_mode` a cada request e popula `req.accessMode`.
- **`PUBLIC`**: libera a rota sem autenticação.
- **`AUTHENTICATED`**: delega ao `authMiddleware` (exige sessão).
- Aplicado a `POST /requests`, `GET /requests` e `GET /requests/:protocol`.

### 2.5 Validação (Zod)

- **Schemas por módulo**, com mensagens em pt-BR.
- **Helpers** (`fieldSchemas.ts`): `requiredString`, `optionalString`, `emailSchema`, `passwordSchema` (mín. 8 / máx. 72 bytes).
- **Formatação** (`zodErrors.ts`): separa campos ausentes × inválidos, traduz tipos, limita o path ecoado e aplica mapa de chave da UI (ex.: `operational.hasManualControls` → `operational.hasManualControlsDetail`).

### 2.6 Auditoria (`src/shared/audit`)

- **Catálogo tipado** (`auditCatalog`): entidades `user`, `prioritization`, `request`, `mapping`, `settings`.
- **`recordAudit(trx, ...)`**: grava em `audit_history` **na mesma transação** da operação (rollback conjunto); valida entidade/ação.
- **`canonicalJson`**: snapshots com chaves ordenadas (diffs determinísticos).
- Registra autor, valor anterior, valor novo, observação/IP e origem (`admin`, `internal`, `system`, `manual`, `user`).

### 2.7 Geração de protocolo (`generateProtocol`)

- Protocolo **não enumerável** a partir do `request_id` via **FPE/Feistel (HMAC-SHA256)** com `PROTOCOL_FPE_KEY`.
- Formato `MAAT-XXXX-XXXX`, alfabeto sem caracteres ambíguos.
- Bijeção sobre o domínio: IDs consecutivos geram códigos sem relação aparente e sem colisão.
- Chave obrigatória em produção (erro no boot se ausente).

### 2.8 Upload e armazenamento (`upload`, `uploadAssets`, `fileStorage`, `ensureDefaultAssets`)

- **Anexos de solicitação**: multipart com parte `payload` (JSON texto) + até **5 anexos**; PDF/DOCX/XLSX/PNG/JPG; **10MB por arquivo**; erros do Multer mapeados para `400`.
- **Assets do portal**: upload por chave (`logo*`, `avatar*`, `favicon*`, `loginImage*`); valida MIME **e** extensão por chave (`415`) e tamanho por chave (`413`); JSON `assets` (URLs) em paralelo ao binário, com binário prevalecendo.
- **`saveFiles`**: nome `{prefixo}-{uuid}.{ext}`; em falha, remove o que já gravou.
- **`removeFiles`**: limpeza de arquivos gravados.
- **`ensureDefaultAssets`** (boot): copia assets padrão para `uploads/portal/` sem sobrescrever uploads.

### 2.9 Utilitários

- **Datas** (`date.ts`): ISO-UTC, `yyyy-mm-dd`, fuso `America/Sao_Paulo`, `toDateOnly`/`toDateTimeMinutes` (sem deslocar o dia).
- **JWT** (`jwtUtil.ts`): gera/valida token tipado (`id`, `name`, `email`, `role`, `password_changed_at`, `scope`).
- **Senhas** (`passwordHandler.ts`): bcrypt (hash/compare) + senha temporária via CSPRNG.
- **Papéis** (`roleUtils.ts`): mapeia `profiles.name` → `Role`.
- **Paginação** (`pagination.ts`): envelope `{ data, page, pageSize, total, totalPages }`.

---

## 3. Endpoints por módulo

Legenda de acesso: **Público** (sem sessão) · **Sessão** (JWT) · **Perfil** (JWT + perfil exigido).

### 3.1 Autenticação — `/auth`

| Método | Rota | Acesso | Funcionalidade |
| --- | --- | --- | --- |
| POST | `/auth/login` | Público | Autentica por e-mail/senha; define cookie de sessão (escopo de troca se senha pendente). |
| POST | `/auth/logout` | Público | Remove o cookie; idempotente. |
| GET | `/auth/me` | Sessão | Retorna a sessão atual (sem dados sensíveis); revalida no banco. |
| PUT | `/auth/change-password` | Sessão | Troca a senha (atual + nova + confirmação); reemite cookie de sessão. |

Regras: erro de login **genérico** ("Credenciais inválidas") para usuário/senha/inativo;
**equalização de tempo** com hash dummy (anti-timing/enumeração); nova senha ≠ atual;
toda troca grava auditoria e revoga tokens antigos.

### 3.2 Usuários — `/users`

| Método | Rota | Acesso | Funcionalidade |
| --- | --- | --- | --- |
| GET | `/users/analysts` | Sessão | Lista profissionais atribuíveis (modal de triagem). |
| GET | `/users/metrics` | Sessão + Admin | Métricas dos usuários (total/ativos/pendentes/admins). |
| GET | `/users` | Sessão + Admin | Lista usuários com filtro por perfil, busca e paginação. |
| POST | `/users` | Sessão + Admin | Cria usuário; gera **senha temporária** (retornada 1x) e exige troca no 1º acesso. |
| PATCH | `/users/:id/status` | Sessão + Admin | Ativa/desativa usuário. |
| POST | `/users/:id/reset-password` | Sessão + Admin | Redefine a senha para temporária e força troca. |

Regras: ninguém gerencia contas de **Administrador** (anti-escalonamento); admin não
modifica a própria conta; e-mail único (`409`); perfil validado contra o banco.

### 3.3 Solicitações — `/requests`

| Método | Rota | Acesso | Funcionalidade |
| --- | --- | --- | --- |
| POST | `/requests` | Público/Sessão (conforme modo) | Cria solicitação (protocolo + blocos + horários + anexos). |
| GET | `/requests` | Público/Sessão (conforme modo) | Lista por e-mail (público) ou da sessão (autenticado). |
| GET | `/requests/:protocol` | Público/Sessão (conforme modo) | Consulta pública por protocolo (acompanhamento). |
| GET | `/requests/:protocol/internal` | Sessão + Analista/Gestor/Admin | Consulta **interna** completa. |
| PATCH | `/requests/:protocol/internal` | Sessão + Analista/Gestor/Admin | Edita os blocos editáveis (substituição completa). |
| GET | `/requests/assignees` | Sessão + Analista/Gestor/Admin | Lista responsáveis ativos. |
| PATCH | `/requests/:protocol/internal/assignee` | Sessão + Admin | Atribui/remove analista de triagem e/ou mapeamento (XOR). |
| PATCH | `/requests/:protocol/assignee` | Sessão + Admin | **Legado** — atribui/remove responsável por `professionalId`. |

- **Criação**: multipart com `payload` (JSON) + `attachments`; valida os blocos; gera
  protocolo; status inicial **"Solicitação enviada"**; normaliza/upserta o solicitante por
  e-mail; grava preferências de horário (1–3, sem duplicatas) e anexos. Em `AUTHENTICATED`,
  a identidade vem do cadastro (anti-spoofing) e grava `requester_user_id`.
- **Consulta pública**: em `AUTHENTICATED` é **owner-only**, retornando `404` para
  protocolo de terceiros (anti-enumeração).
- **Consulta interna**: 4 blocos completos, priorização (`score`/`maxScore=50`/`label`),
  responsável de triagem e mapeamento, anexos, horários, reunião, `internalObservations`.
- **Edição interna**: substituição completa (chave ausente limpa); `fullName`/`corporateEmail`
  **ignorados**; `desiredDeadline` deve ser hoje/futuro; **Admin/Gestor** editam qualquer,
  **Analista** só as próprias; auditoria `request.update`.
- **Atribuição**: `{ assigneeId }` **XOR** `{ mappingAssigneeId }` (`user_id` string; `null`
  remove); **exclusividade** (atribuir triagem desatribui mapeamento e vice-versa);
  elegibilidade: profissional ativo de perfil `analista`.

### 3.4 Observações internas — `/requests/:protocol/internal-notes`

| Método | Rota | Acesso | Funcionalidade |
| --- | --- | --- | --- |
| GET | `/` | Sessão + Analista/Gestor/Admin | Lista observações + contador de não lidas. |
| POST | `/` | Sessão + Analista/Gestor/Admin | Cria observação (máx. 4000 chars). |
| PUT | `/read` | Sessão + Analista/Gestor/Admin | Marca até uma observação como lida (checkpoint por usuário). |

Regra: `Solicitante` recebe `403`; a observação marcada como lida precisa pertencer à
solicitação (`400` caso contrário).

### 3.5 Fila — `/queue`

| Método | Rota | Acesso | Funcionalidade |
| --- | --- | --- | --- |
| GET | `/queue/metrics` | Sessão + Analista/Gestor/Admin | Métricas: total, sem responsável, em andamento, atrasadas. |
| GET | `/queue` | Sessão + Analista/Gestor/Admin | Lista centralizada com busca, filtros, ordenação e paginação. |
| GET | `/queue/requests/:protocol/mapping` | Sessão + Analista/Gestor/Admin | Consulta o mapeamento mais recente (ou estado vazio). |
| PUT | `/queue/requests/:protocol/mapping` | Sessão + Analista/Gestor/Admin | Cria, atualiza ou conclui o mapeamento. |

- **Filtros de `/queue`**: `page`/`pageSize` (obrigatórios, `1..100`), `search`
  (protocolo/e-mail/nome), `status`, `priority`, `assigneeId` (UUID ou `unassigned`),
  `unassigned` (incompatível com `assigneeId`). Ordenação por `created_at` desc; a
  resposta inclui a lista de `assignees` ativos; página além do limite é ajustada para a última válida.
- **Conceitos**: "em andamento" = status em `IN_PROGRESS_STATUSES`; "atrasada" =
  `desired_deadline < hoje` e status não terminal (`Concluído`/`Cancelado`).

### 3.6 Mapeamento — `/queue/requests/:protocol/mapping`

- **`GET`**: mapeamento mais recente (inclusive concluído); sem mapeamento, retorna estado
  vazio (`id`/campos `null`, `participants: []`).
- **`PUT`**: alvo = `id` informado (precisa estar aberto; concluído → `422`) ou o
  mapeamento aberto mais recente; sem aberto, **cria**.
- **Semântica**: campo ausente mantém; `null`/vazio limpa; `participants` presente substitui a lista.
- **Campos**: `scheduledFor` (ISO com offset), `durationMinutes` (15–480), `modality`
  (`REMOTE`/`IN_PERSON`), `location`, `link`, `notes`, `participants` (nome/e-mail), `complete`.
- **Validações**: concluir exige reunião preenchida (data, modalidade e, conforme o caso,
  local/link) e ao menos um participante; `scheduledFor` obrigatório se `durationMinutes`
  presente; conflito de agenda do responsável → `409`.
- **Auditoria**: `mapping.assign`, `mapping.save`, `mapping.complete`.

### 3.7 Priorização — `/prioritization`

| Método | Rota | Acesso | Funcionalidade |
| --- | --- | --- | --- |
| GET | `/prioritization/criteria` | Sessão + Analista/Gestor | Lista os critérios de priorização (10). |
| PUT | `/prioritization/:protocol/score` | Sessão + Analista/Gestor | Registra a avaliação de prioridade (score por critério). |

- **Critérios** (10, `CRITERION_KEY_TO_ID`): `impacto_operacional`, `risco_operacional`,
  `urgencia`, `volumetria`, `esforco_manual`, `impacto_cliente`, `prazo_regulatorio`,
  `areas_impactadas`, `alinhamento_estrategico`, `complexidade_estimada`.
- **Cálculo**: score = Σ (nota × peso) em escala `1..5`; `maxScore = 50`.
- **Faixas** (`REQUEST_PRIORITIES`): Baixa `10–20`, Média `20.1–30`, Alta `30.1–40`,
  Crítica `40.1–50` (derivadas do score).
- **Auditoria**: `prioritization.evaluate`.

### 3.8 Configuração do portal — `/portal-config`

| Método | Rota | Acesso | Funcionalidade |
| --- | --- | --- | --- |
| GET | `/portal-config` | Público | Retorna identidade, tema, assets, categorias/status e pesos. |
| PATCH | `/portal-config/access` | Sessão + Admin | Define o modo de abertura (`PUBLIC`/`AUTHENTICATED`). |
| PATCH | `/portal-config/identity` | Sessão + Admin | Atualiza textos de identidade (título/subtítulo/descrição). |
| PATCH | `/portal-config/theme` | Sessão + Admin | Atualiza cores/tema do portal. |
| PATCH | `/portal-config/assets` | Sessão + Admin | Upload/troca de assets (multipart) ou URLs via JSON. |
| PATCH | `/portal-config/categories` | Sessão + Admin | Cria/edita/ativa-desativa categorias. |
| PATCH | `/portal-config/statuses` | Sessão + Admin | Cria/edita/ativa-desativa status. |
| PATCH | `/portal-config/prioritization-weights` | Sessão + Admin | Ajusta os pesos dos critérios de priorização. |

- **`GET`** mescla defaults, `system_settings`/`system_themes` e o diretório de assets
  (URLs resolvidas para `/uploads/...`), no mesmo formato usado pelos PATCH.
- **Assets**: 8 chaves em pares light/dark — `logoLightUrl`, `logoDarkUrl`, `avatarLightUrl`,
  `avatarDarkUrl`, `faviconLightUrl`, `faviconDarkUrl`, `loginImageLightUrl`, `loginImageDarkUrl`.
- **Categorias/status**: não é possível remover categorias/status em uso (referenciados por
  solicitações); alterações afetam opções dos formulários.
- **Auditoria**: `settings.update`.

---

## 4. Modelo de dados

Migrations Knex (`knexfile.js`), com `migrations/requester_request` para o domínio de
solicitações. Tabelas existentes:

| Grupo | Tabelas |
| --- | --- |
| Acesso | `profiles`, `users` |
| Auditoria | `audit_history` |
| Configuração | `system_settings`, `system_themes` |
| Catálogos | `categories`, `statuses`, `priorities`, `criteria` |
| Solicitante | `requesters`, `professionals` |
| Solicitação | `requests`, `pending_items`, `attachments`, `request_time_preferences`, `prioritization_evaluations` |
| Atribuição | `mappings`, `mapping_participants` |
| Observações | `request_internal_notes`, `request_internal_note_read_states` |

- **Sequence** `requests_request_seq` gera o `request_id` usado pelo protocolo FPE.
- **Migrações** (`npm run migrate:*`): `migrate:latest`, `migrate:rollback`, `migrate:make`, `db:setup`.
- **Seeds** (`npm run seed:run`, em `seeds/requester_request`): perfis, 10 critérios de
  priorização (com pesos), categorias/status, `system_settings` e usuários de desenvolvimento
  (analista, administrador, gestor, solicitante).

---

## 5. Regras de negócio

- **Status**: 17 valores de `REQUEST_STATUSES`; `INITIAL_STATUS = "Solicitação enviada"`;
  `TERMINAL_STATUSES` = `Concluído`/`Cancelado`; `IN_PROGRESS_STATUSES` = em andamento.
  O status do responsável de mapeamento é derivado (`Concluído`/`Cancelado` quando terminal).
- **Papéis**: `Solicitante`, `Analista`, `Gestor`, `Administrador`. Ações internas exigem
  papel interno; `Solicitante` nunca acessa dados internos.
- **Atribuição exclusiva**: uma solicitação tem no máximo um responsável de triagem **ou**
  um de mapeamento; atribuir um desatribui o outro.
- **Edição interna por atribuição**: Analista edita apenas solicitações atribuídas a ele;
  Gestor/Admin editam qualquer.
- **Prioridade**: 4 rótulos derivados do score (ver 3.7).
- **Categorias/status em uso** não podem ser removidos.
- **Prazo** (`desiredDeadline`) não pode ser no passado na edição.
- **Anexos**: até 5 por solicitação (no envio), 10MB cada, formatos controlados.
- **Observações internas**: lista legível pelos papéis internos, com controle de leitura
  individual (não lida/lida).

---

## 6. Segurança

- **Senhas**: bcrypt, nunca em texto puro; comparação mesmo quando o usuário não existe
  (anti enumeração/timing).
- **Sessão**: JWT em cookie HttpOnly; `SameSite`/`Secure` conforme ambiente; escopo e
  `password_changed_at` permitem **revogação imediata**.
- **Autorização**: sempre reavaliada no banco a cada request (papel e status de perfil),
  nunca confiando no conteúdo do token.
- **Anti-escalonamento**: contas de Administrador não podem ser gerenciadas por outros.
- **Anti-spoofing**: em modo `AUTHENTICATED`, a identidade do solicitante vem do cadastro,
  não do payload.
- **Anti-enumeração**: protocolos não sequenciais (FPE) e consulta pública owner-only.
- **Erros internos** não são expostos ao cliente.

---

## 7. Operação e desenvolvimento

- **Scripts npm**: `start`, `dev`, `build`, `start:prod`, `typecheck`, `check` (typecheck +
  lint), `test`, `lint`, `format`, `migrate:*`, `seed:run`, `db:setup`, `docker:*`.
- **Docker/Compose**: serviços da API e do PostgreSQL para desenvolvimento local.
- **Variáveis de ambiente** (README): `PORT`, `JWT_SECRET`, `JWT_EXPIRES_IN` (1d),
  `NODE_ENV`, `CORS_ORIGINS` (padrão `localhost:5173`), `COOKIE_NAME` (`session_id`),
  `PROTOCOL_FPE_KEY`, `UPLOAD_DIR`.
- **Assets padrão**: garantidos no boot por `ensureDefaultAssets`.

---

## 8. Previsto na especificação, ainda não implementado

Constam em `funcionalidades-especificacao.md`, mas **não existem no código** hoje
(não há rota/implementação correspondente):

- Triagem automática (`/requests/:protocol/triage`) e motor de priorização automática.
- Relatórios e dashboards (`/reports`, `/audit/:protocol`).
- Endpoints genéricos de `/settings` (hoje a configuração passa por `/portal-config`).
- Integrações externas (e-mail/notificações) e exportações.

> Este documento reflete o código na branch atual; deve ser atualizado quando novas
> funcionalidades forem implementadas.



