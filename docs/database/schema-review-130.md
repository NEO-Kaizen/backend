# Revisão do banco de dados — issue #130

## Objetivo

Registrar a revisão das entidades e relacionamentos do banco, os achados e as
melhorias aplicadas. A issue #130 pede a revisão das entidades, dos
relacionamentos e a implementação das melhorias.

A fonte de verdade continua sendo o diretório `migrations/`; este documento é o
inventário consolidado e o registro das decisões.

## Escopo aplicado

- **Migration** `20260927000000_database_review_improvements.js`: índices de FK,
  invariantes de integridade e correção de timezone.
- **Migration** `20260928000000_database_review_schema_cleanup.js`: unicidade
  case-insensitive de e-mails, CHECK de conclusão de mapeamento, índice de
  timeline de auditoria e remoção das colunas legadas inventariadas abaixo.
- **Migration** `20260929000000_database_review_integrity_tuning.js`: defaults,
  largura de colunas de auditoria, índices redundantes/ausentes, CHECKs de
  domínio e FK de participante interno.
- **Documentação**: este inventário + correção de documentos desatualizados
  (`requests-persistence.md`, `authentication-persistence.md` e
  `identifier-patterns.md`).

## Inventário atual

### Autenticação e configuração

| Tabela                       | PK                                  | FKs                                                                      | Índices / constraints principais                                                                                                                            |
| ---------------------------- | ----------------------------------- | ------------------------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `profiles`                   | `profile_id` (serial)               | —                                                                        | PK, UK `name`                                                                                                                                               |
| `users`                      | `user_id` (serial)                  | `profile_id` → `profiles` (RESTRICT)                                     | PK, UK `email`, UK `uk_users_email_ci` (novo), `idx_users_profile` (novo)                                                                                   |
| `system_themes`              | `theme_id` (smallint, singleton)    | —                                                                        | PK + CHECK `theme_id = 1`                                                                                                                                   |
| `system_settings`            | `settings_id` (smallint, singleton) | `theme_id` → `system_themes` (SET NULL); `updated_by` → `users`          | PK + CHECK `settings_id = 1`                                                                                                                                |
| `audit_history`              | `audit_id` (bigserial)              | `user_id` → `users` (RESTRICT)                                           | `idx_audit_history_entity`, `_action_type`, `_occurred_at`, `_user`, `_request_timeline` (novo); CHECK `ck_audit_history_change_origin` (novo); append-only |
| `prioritization_evaluations` | `protocol` (varchar)                | `protocol` → `requests` (RESTRICT); `calculated_by` → `users` (RESTRICT) | PK, `idx_prioritization_evaluations_calculated_by` (novo)                                                                                                   |

### Domínio de solicitações

| Tabela                              | PK                                    | FKs                                                                                                                                                   | Índices / constraints principais                                                                                                                                                                                                          |
| ----------------------------------- | ------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `requesters`                        | `requester_id` (uuid)                 | `user_id` → `users` (SET NULL)                                                                                                                        | PK, UK `corporate_email`, UK `user_id`, UK `uk_requesters_email_ci` (novo), `idx_requesters_area`                                                                                                                                         |
| `categories`                        | `category_id` (serial)                | —                                                                                                                                                     | PK, UK `name`, UK `lower(name)`, `idx_categories_status`                                                                                                                                                                                  |
| `priorities`                        | `priority_id` (serial)                | —                                                                                                                                                     | PK, UK `level`                                                                                                                                                                                                                            |
| `statuses`                          | `status_id` (serial)                  | —                                                                                                                                                     | PK, UK `name`, UK `order_number` (DEFERRABLE); `is_active` DEFAULT `true` (novo)                                                                                                                                                          |
| `details_professional`              | `professional_id` (uuid)              | `user_id` → `users` (RESTRICT)                                                                                                                        | PK, UK `user_id`, `idx_details_professional_status`                                                                                                                                                                                       |
| `requests`                          | `request_id` (bigint, sequence)       | `requester_id`, `category_id`, `status_id`, `priority_id`, `professional_id`, `requester_user_id`, `mapping_professional_id`, `last_public_status_id` | `idx_requests_created_at`, `_status`, `_category`, `_priority`, `_professional`, `_requester`, `_requester_user`, `_mapping_professional`, `_last_public_status`, `_desired_deadline` (novo); CHECK `ck_requests_screening_result` (novo) |
| `pending_items`                     | `pending_item_id` (uuid)              | `request_id` → `requests` (CASCADE)                                                                                                                   | `idx_pending_items_status`, `_request_status`, `_batch`                                                                                                                                                                                   |
| `attachments`                       | `attachment_id` (uuid)                | `request_id` → `requests` (CASCADE); `pending_item_id` → `pending_items` (SET NULL)                                                                   | `_pending_item`, `_uploaded_at`, `_request_uploaded` (novo)                                                                                                                                                                               |
| `request_time_preferences`          | `request_time_preference_id` (serial) | `request_id` → `requests` (CASCADE)                                                                                                                   | PK, UK (`request_id`, `scheduled_for`)                                                                                                                                                                                                    |
| `mappings`                          | `mapping_id` (uuid)                   | `request_id` → `requests` (CASCADE); `professional_id` → `details_professional` (SET NULL); `target_status_id` → `statuses` (RESTRICT)                | `idx_mappings_request_concluded`, `_professional` (novo), `_target_status` (novo), `_request_created` (novo), UK parcial `uk_mappings_one_open_per_request` (novo), CHECK `ck_mappings_concluded_at` (novo)                               |
| `mapping_participants`              | `participant_id` (uuid)               | `mapping_id` → `mappings` (CASCADE); `user_id` → `users` (RESTRICT)                                                                                   | UK (`mapping_id`, `user_id`), UK (`mapping_id`, `lower(email)`), `_user` (novo), CHECK `ck_mapping_participants_internal_or_external` (novo)                                                                                              |
| `triages`                           | `triage_id` (uuid)                    | `request_id` → `requests` (CASCADE); `exit_status` → `statuses` (RESTRICT); `assignee_user_id` → `users` (SET NULL)                                   | `idx_triages_request_triage`, `_exit_status` (novo), `_assignee_user` (novo)                                                                                                                                                              |
| `request_internal_notes`            | `internal_note_id` (bigserial)        | `request_id` → `requests` (RESTRICT); `author_user_id` → `users` (RESTRICT)                                                                           | UK (`request_id`, `internal_note_id`), `idx_request_internal_notes_timeline`, `_author`                                                                                                                                                   |
| `request_internal_note_read_states` | (`request_id`, `user_id`)             | `user_id` → `users` (RESTRICT); (`request_id`, `last_read_note_id`) → `request_internal_notes`                                                        | PK composta, `idx_internal_note_read_states_last_note`, `_user` (novo)                                                                                                                                                                    |

## Achados

### 1. Colunas sem uso pela aplicação — resolvido

Todas as colunas abaixo foram removidas por
`20260928000000_database_review_schema_cleanup.js`, junto dos seeds que as
preenchiam. Os campos que as substituem (`triages.*`, `pending_items.comment` e
os campos do contrato 03) permanecem.

| Tabela          | Colunas                                                                                                           | Situação                                                                                       |
| --------------- | ----------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------- |
| `requests`      | `preliminary_complexity`, `screening_justification`, `identified_risks`                                           | Substituídas por `triages.*`; sem referências em `src/`.                                       |
| `pending_items` | `requested_fields`, `requires_attachment`, `expected_attachment_type`, `resolution`, `resolved_by`, `resolved_at` | Legado anterior ao contrato 03; sem referências em `src/`.                                     |
| `attachments`   | `is_restricted`                                                                                                   | A aplicação gravava apenas `false`, nunca lia/filtrava; as gravações foram removidas neste PR. |

Observações:

- `requests.screening_result` **não** é legado: continua sendo lido/escrito.
- `pending_items.description` **não** é legado: é fallback de `comment`.
- `attachments.is_restricted` era populado nos seeds e em dois repositórios
  (`requests.repository.ts` e `pendingItems.repository.ts`), mas nunca era lido
  ou filtrado. Seeds e gravações foram ajustados neste PR.

### 2. FKs sem índice

O PostgreSQL não cria índice automático para FK. As FKs abaixo não tinham
índice de apoio (nem coluna líder em índice composto):

- `users.profile_id`
- `prioritization_evaluations.calculated_by`
- `request_internal_note_read_states.user_id` (o PK composto começa por
  `request_id`, então não atende consultas por usuário)
- `requests.last_public_status_id`
- `mappings.professional_id`
- `mappings.target_status_id`
- `mapping_participants.user_id`
- `triages.exit_status`
- `triages.assignee_user_id`

### 3. Invariantes garantidas apenas na aplicação

- **Um mapeamento aberto por solicitação**: a regra estava apenas no comentário
  de `20260918000000_create_mappings.js`; não havia índice parcial no banco.
- **Participante interno ou externo**: a aplicação grava `user_id` para
  internos e `name`/`email` para externos, mas o banco aceitava uma linha sem
  nenhum dos dois.
- **Domínio de `audit_history.change_origin`**: os valores gravados pela
  aplicação são `user`, `admin`, `system`, `requester`, `manual`, `internal` e
  `self` (`src/shared/audit/auditCatalog.ts`), sem CHECK no banco.
- **Domínio de `requests.screening_result`**: `elegivel` e `nao_elegivel` (ou
  `NULL`), sem CHECK no banco. Um typo virava "não elegível" silenciosamente. O
  CHECK criado é defensivo: o fluxo atual apenas lê a coluna.

### 4. Timezone

- `audit_history.occurred_at` era `timestamp` sem timezone, enquanto o service
  serializa com `toISOString()` (`auditHistory.service.ts`). Dependendo da
  timezone do processo, o instante podia deslocar.
- `request_time_preferences.scheduled_for` continua `timestamp` sem timezone por
  decisão explícita (`src/shared/utils/date.ts`); a troca exige mudança
  coordenada no helper.
- `users` e `profiles` usam `timestamp` sem timezone em `created_at`/`updated_at`.
  Baixo impacto, mas fora do padrão `timestamptz` do restante do schema.

### 5. Unicidade case-insensitive — resolvido

- `categories.name` tem `uk_categories_name_ci` (`lower(name)`).
- `users.email` e `requesters.corporate_email` passaram a ter
  `uk_users_email_ci` e `uk_requesters_email_ci` (`lower(...)`). A aplicação já
  normalizava para lowercase; agora o banco também garante a regra.
- `mapping_participants` já tem `UK (mapping_id, lower(email))`.

### 6. Índices ociosos e redundantes — resolvido

- `idx_attachments_restricted` foi removido junto da coluna
  `attachments.is_restricted`, que a aplicação nunca filtrava nem lia; as duas
  inserções que ainda gravavam `false` também foram removidas neste PR.
- `idx_mappings_request`, `idx_pending_items_request`,
  `idx_mapping_participants_mapping` e `idx_attachments_request` foram
  removidos: seus prefixos já são atendidos, respectivamente, por
  `idx_mappings_request_concluded`, `idx_pending_items_request_status`, pelas
  duas UKs de `mapping_participants` e por `idx_attachments_request_uploaded`.

### 7. Defaults divergentes da aplicação — resolvido

- `users.must_change_password` nascia `false`, embora a criação pela API sempre
  grave `true`. Inserções diretas (seed, script, integração) conseguiam login
  sem troca obrigatória de senha.
- `statuses.is_active` nascia `false`, embora a aplicação só exiba status ativos.
  Já houve correção reativa (`20260920000001_activate_triage_exit_statuses.js`);
  o default continua sendo a origem do problema.
- Os seeds de desenvolvimento agora informam `must_change_password`
  explicitamente: `false` para os usuários de teste e `true` apenas nos três
  cenários de troca pendente, para não depender do novo default.

### 8. Colunas de auditoria curtas — resolvido

`mappings.created_by`/`updated_by` e `pending_items.created_by` eram
`varchar(100)`, mas recebem e-mail e o validador aceita até 254 caracteres. Um
e-mail válido de 101–254 caracteres gerava `22001 value too long` (500). Todas
as colunas que recebem e-mail agora são `varchar(254)`.

### 9. Índices para padrões de consulta — resolvido

- `requests.desired_deadline` — cálculo de atraso no dashboard/fila.
- `mappings (request_id, created_at DESC, updated_at DESC)` — busca do
  mapeamento mais recente.
- `attachments (request_id, uploaded_at)` — listagem de anexos do detalhe.

### 10. Proveniência de participante interno — resolvido

`mapping_participants.user_id` usava `ON DELETE SET NULL`. Como participantes
internos também gravam `name`/`email`, o CHECK
`ck_mapping_participants_internal_or_external` continuava válido após a remoção
do usuário, escondendo a perda de proveniência. A FK passou a `ON DELETE RESTRICT`.

## Melhorias aplicadas

Migration `20260927000000_database_review_improvements.js`:

1. Cria os índices de FK listados em "Achados > 2".
2. Cria `uk_mappings_one_open_per_request`:
   ```sql
   CREATE UNIQUE INDEX uk_mappings_one_open_per_request
   ON mappings (request_id) WHERE is_concluded = false;
   ```
3. Cria `ck_mapping_participants_internal_or_external`:
   ```sql
   CHECK (user_id IS NOT NULL OR (name IS NOT NULL AND email IS NOT NULL))
   ```
4. Converte `audit_history.occurred_at` para `timestamptz`, reinterpretando o
   valor na timezone da sessão (`USING occurred_at AT TIME ZONE current_setting('TimeZone')`).

O `down` reverte todos os itens acima. A constraint
`ck_mapping_participants_internal_or_external` é criada com `NOT VALID` e
confirmada com `VALIDATE CONSTRAINT`, para não manter `ACCESS EXCLUSIVE`
durante a varredura das linhas antigas.

Migration `20260928000000_database_review_schema_cleanup.js`:

1. Cria `uk_users_email_ci` e `uk_requesters_email_ci` — a própria criação
   aborta se houver duplicatas que divergem apenas em caixa.
2. Cria `ck_mappings_concluded_at`:
   ```sql
   CHECK ((is_concluded AND concluded_at IS NOT NULL)
       OR (NOT is_concluded AND concluded_at IS NULL))
   ```
   Também com `NOT VALID` + `VALIDATE`.
3. Cria `idx_audit_history_request_timeline (entity_type, entity_id,
occurred_at DESC, audit_id DESC)`, usado pela timeline de auditoria de uma
   solicitação (`auditHistory.repository.ts`).
4. Remove as colunas legadas do inventário (item 1) e o índice ocioso (item 6).

O `down` recria as colunas com os tipos/defaults originais e o índice removido.

Migration `20260929000000_database_review_integrity_tuning.js`:

1. Ajusta os defaults de `users.must_change_password` e `statuses.is_active`
   para `true`.
2. Alarga para `varchar(254)` as colunas de e-mail que ainda eram `varchar(100)`
   (`mappings.created_by`/`updated_by` e `pending_items.created_by`).
3. Remove os quatro índices redundantes (`idx_mappings_request`,
   `idx_pending_items_request`, `idx_mapping_participants_mapping` e
   `idx_attachments_request`) e cria os três índices de consulta do item 9.
4. Cria `ck_audit_history_change_origin` com o domínio completo de `ChangeOrigin`
   (`user`, `admin`, `system`, `requester`, `manual`, `internal`, `self`) e
   `ck_requests_screening_result`, ambos com `NOT VALID` + `VALIDATE`. Uma
   consulta de preflight aborta a migration com mensagem acionável se houver
   valor histórico fora do domínio. `screening_result` é constraint defensiva:
   o aplicativo apenas lê a coluna.
5. Recria a FK `mapping_participants_user_id_foreign` com `ON DELETE RESTRICT`.

O `down` restaura defaults, larguras, índices, CHECKs e a FK originais. Se um
e-mail de 101–254 caracteres tiver sido gravado após o `up`, o estreitamento
para `varchar(100)` no `down` falha — limitação conhecida do rollback.

## Validação

Executada contra PostgreSQL 18 em Docker:

- `npm run migrate:latest` — 58 migrations no total;
- `npm run seed:run` — 11 seeds;
- rollback e reaplicação das três migrations da revisão (com seeds aplicados);
- conferência via `psql` dos índices, das CHECKs, da ausência das colunas
  legadas, dos defaults e do tipo `timestamp with time zone` em
  `audit_history.occurred_at`;
- smoke test dos fluxos que a validação anterior não cobria: insert de anexo de
  solicitação e de pendência sem `is_restricted`, inserts em `audit_history` com
  os sete valores reais de `change_origin` (`user`, `admin`, `system`,
  `requester`, `manual`, `internal`, `self`) e verificação de que os usuários de
  seed têm `must_change_password` explícito (`false` nos de teste, `true` nos
  três cenários de troca pendente);
- testes negativos: e-mail duplicado em caixa diferente, `concluded_at`
  divergente de `is_concluded`, participante sem `user_id`/nome/e-mail, segundo
  mapeamento aberto, `change_origin` fora do domínio, `screening_result`
  inválido e remoção de usuário referenciado por participante — todos
  rejeitados; teste positivo: e-mail de 150 caracteres em `mappings.created_by`;
- `npm run typecheck`, `npm run lint` e Prettier nos arquivos alterados.

## Recomendações (fora deste escopo)

1. **Padronizar timezone** de `request_time_preferences.scheduled_for` e de
   `users`/`profiles.created_at`/`updated_at` para `timestamptz`, com ajuste
   coordenado do código que lê os valores (`src/shared/utils/date.ts`).

## Referências

- `docs/database/requests-persistence.md` — modelo do domínio de solicitações.
- `docs/database/identifier-patterns.md` — convenção de identificadores.
- `docs/database/authentication-persistence.md` — autenticação.
- `docs/database/system-settings-persistence.md` — configuração do portal.
