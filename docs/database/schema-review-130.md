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
- **Documentação**: este inventário + correção de documentos desatualizados
  (`requests-persistence.md`, `authentication-persistence.md` e
  `identifier-patterns.md`).

## Inventário atual

### Autenticação e configuração

| Tabela                       | PK                                  | FKs                                                                      | Índices principais                                                                                           |
| ---------------------------- | ----------------------------------- | ------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------ |
| `profiles`                   | `profile_id` (serial)               | —                                                                        | PK, UK `name`                                                                                                |
| `users`                      | `user_id` (serial)                  | `profile_id` → `profiles` (RESTRICT)                                     | PK, UK `email`, UK `uk_users_email_ci` (novo), `idx_users_profile` (novo)                                    |
| `system_themes`              | `theme_id` (smallint, singleton)    | —                                                                        | PK + CHECK `theme_id = 1`                                                                                    |
| `system_settings`            | `settings_id` (smallint, singleton) | `theme_id` → `system_themes` (SET NULL); `updated_by` → `users`          | PK + CHECK `settings_id = 1`                                                                                 |
| `audit_history`              | `audit_id` (bigserial)              | `user_id` → `users` (RESTRICT)                                           | `idx_audit_history_entity`, `_action_type`, `_occurred_at`, `_user`, `_request_timeline` (novo); append-only |
| `prioritization_evaluations` | `protocol` (varchar)                | `protocol` → `requests` (RESTRICT); `calculated_by` → `users` (RESTRICT) | PK, `idx_prioritization_evaluations_calculated_by` (novo)                                                    |

### Domínio de solicitações

| Tabela                              | PK                                    | FKs                                                                                                                                                   | Índices principais                                                                                                                                                                           |
| ----------------------------------- | ------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `requesters`                        | `requester_id` (uuid)                 | `user_id` → `users` (SET NULL)                                                                                                                        | PK, UK `corporate_email`, UK `user_id`, UK `uk_requesters_email_ci` (novo), `idx_requesters_area`                                                                                            |
| `categories`                        | `category_id` (serial)                | —                                                                                                                                                     | PK, UK `name`, UK `lower(name)`, `idx_categories_status`                                                                                                                                     |
| `priorities`                        | `priority_id` (serial)                | —                                                                                                                                                     | PK, UK `level`                                                                                                                                                                               |
| `statuses`                          | `status_id` (serial)                  | —                                                                                                                                                     | PK, UK `name`, UK `order_number` (DEFERRABLE)                                                                                                                                                |
| `details_professional`              | `professional_id` (uuid)              | `user_id` → `users` (RESTRICT)                                                                                                                        | PK, UK `user_id`, `idx_details_professional_status`                                                                                                                                          |
| `requests`                          | `request_id` (bigint, sequence)       | `requester_id`, `category_id`, `status_id`, `priority_id`, `professional_id`, `requester_user_id`, `mapping_professional_id`, `last_public_status_id` | `idx_requests_created_at`, `_status`, `_category`, `_priority`, `_professional`, `_requester`, `_requester_user`, `_mapping_professional`, `_last_public_status` (novo)                      |
| `pending_items`                     | `pending_item_id` (uuid)              | `request_id` → `requests` (CASCADE)                                                                                                                   | `idx_pending_items_request`, `_status`, `_request_status`, `_batch`                                                                                                                          |
| `attachments`                       | `attachment_id` (uuid)                | `request_id` → `requests` (CASCADE); `pending_item_id` → `pending_items` (SET NULL)                                                                   | `idx_attachments_request`, `_pending_item`, `_uploaded_at`                                                                                                                                   |
| `request_time_preferences`          | `request_time_preference_id` (serial) | `request_id` → `requests` (CASCADE)                                                                                                                   | PK, UK (`request_id`, `scheduled_for`)                                                                                                                                                       |
| `mappings`                          | `mapping_id` (uuid)                   | `request_id` → `requests` (CASCADE); `professional_id` → `details_professional` (SET NULL); `target_status_id` → `statuses` (RESTRICT)                | `idx_mappings_request`, `_request_concluded`, `_professional` (novo), `_target_status` (novo), UK parcial `uk_mappings_one_open_per_request` (novo), CHECK `ck_mappings_concluded_at` (novo) |
| `mapping_participants`              | `participant_id` (uuid)               | `mapping_id` → `mappings` (CASCADE); `user_id` → `users` (SET NULL)                                                                                   | UK (`mapping_id`, `user_id`), UK (`mapping_id`, `lower(email)`), `idx_mapping_participants_mapping`, `_user` (novo), CHECK `ck_mapping_participants_internal_or_external` (novo)             |
| `triages`                           | `triage_id` (uuid)                    | `request_id` → `requests` (CASCADE); `exit_status` → `statuses` (RESTRICT); `assignee_user_id` → `users` (SET NULL)                                   | `idx_triages_request_triage`, `_exit_status` (novo), `_assignee_user` (novo)                                                                                                                 |
| `request_internal_notes`            | `internal_note_id` (bigserial)        | `request_id` → `requests` (RESTRICT); `author_user_id` → `users` (RESTRICT)                                                                           | UK (`request_id`, `internal_note_id`), `idx_request_internal_notes_timeline`, `_author`                                                                                                      |
| `request_internal_note_read_states` | (`request_id`, `user_id`)             | `user_id` → `users` (RESTRICT); (`request_id`, `last_read_note_id`) → `request_internal_notes`                                                        | PK composta, `idx_internal_note_read_states_last_note`, `_user` (novo)                                                                                                                       |

## Achados

### 1. Colunas sem uso pela aplicação — resolvido

Todas as colunas abaixo foram removidas por
`20260928000000_database_review_schema_cleanup.js`, junto dos seeds que as
preenchiam. Os campos que as substituem (`triages.*`, `pending_items.comment` e
os campos do contrato 03) permanecem.

| Tabela          | Colunas                                                                                                           | Situação                                                   |
| --------------- | ----------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------- |
| `requests`      | `preliminary_complexity`, `screening_justification`, `identified_risks`                                           | Substituídas por `triages.*`; sem referências em `src/`.   |
| `pending_items` | `requested_fields`, `requires_attachment`, `expected_attachment_type`, `resolution`, `resolved_by`, `resolved_at` | Legado anterior ao contrato 03; sem referências em `src/`. |
| `attachments`   | `is_restricted`                                                                                                   | A aplicação grava apenas `false` e nunca lê/filtra.        |

Observações:

- `requests.screening_result` **não** é legado: continua sendo lido/escrito.
- `pending_items.description` **não** é legado: é fallback de `comment`.
- `attachments.is_restricted` é populado nos seeds com `true`/`false`, mas a
  aplicação não consome o valor.

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

### 6. Índice ocioso — resolvido

- `idx_attachments_restricted` foi removido junto da coluna
  `attachments.is_restricted`, que a aplicação nunca filtra nem lê.

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

## Validação

Executada contra PostgreSQL 18 em Docker:

- `npm run migrate:latest` — 57 migrations no batch 1;
- `npm run seed:run` — 11 seeds;
- rollback e reaplicação das duas migrations da revisão;
- conferência via `psql` dos índices, das CHECKs, da ausência das colunas
  legadas e do tipo `timestamp with time zone` em
  `audit_history.occurred_at`;
- testes negativos: e-mail duplicado em caixa diferente, `concluded_at`
  divergente de `is_concluded`, participante sem `user_id`/nome/e-mail e
  segundo mapeamento aberto — todos rejeitados;
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
