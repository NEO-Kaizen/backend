# Revisão do banco de dados — issue #130

## Objetivo

Registrar a revisão das entidades e relacionamentos do banco, os achados e as
melhorias aplicadas. A issue #130 pede a revisão das entidades, dos
relacionamentos e a implementação das melhorias.

A fonte de verdade continua sendo o diretório `migrations/`; este documento é o
inventário consolidado e o registro das decisões.

## Escopo aplicado

- **Migration não destrutiva** `20260927000000_database_review_improvements.js`:
  índices de FK, invariantes de integridade e correção de timezone. Nenhuma
  coluna foi removida.
- **Documentação**: este inventário + correção de documentos desatualizados
  (`requests-persistence.md` e `identifier-patterns.md`).

A limpeza de colunas legadas ficou fora deste escopo (ver "Recomendações").

## Inventário atual

### Autenticação e configuração

| Tabela                       | PK                                  | FKs                                                                      | Índices principais                                                               |
| ---------------------------- | ----------------------------------- | ------------------------------------------------------------------------ | -------------------------------------------------------------------------------- |
| `profiles`                   | `profile_id` (serial)               | —                                                                        | PK, UK `name`                                                                    |
| `users`                      | `user_id` (serial)                  | `profile_id` → `profiles` (RESTRICT)                                     | PK, UK `email`, `idx_users_profile` (novo)                                       |
| `system_themes`              | `theme_id` (smallint, singleton)    | —                                                                        | PK + CHECK `theme_id = 1`                                                        |
| `system_settings`            | `settings_id` (smallint, singleton) | `theme_id` → `system_themes` (SET NULL); `updated_by` → `users`          | PK + CHECK `settings_id = 1`                                                     |
| `audit_history`              | `audit_id` (bigserial)              | `user_id` → `users` (SET NULL)                                           | `idx_audit_history_entity`, `_action_type`, `_occurred_at`, `_user`; append-only |
| `prioritization_evaluations` | `protocol` (varchar)                | `protocol` → `requests` (RESTRICT); `calculated_by` → `users` (RESTRICT) | PK, `idx_prioritization_evaluations_calculated_by` (novo)                        |

### Domínio de solicitações

| Tabela                              | PK                                    | FKs                                                                                                                                                   | Índices principais                                                                                                                                                               |
| ----------------------------------- | ------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `requesters`                        | `requester_id` (uuid)                 | `user_id` → `users` (SET NULL)                                                                                                                        | PK, UK `corporate_email`, UK `user_id`, `idx_requesters_area`                                                                                                                    |
| `categories`                        | `category_id` (serial)                | —                                                                                                                                                     | PK, UK `name`, UK `lower(name)`, `idx_categories_status`                                                                                                                         |
| `priorities`                        | `priority_id` (serial)                | —                                                                                                                                                     | PK, UK `level`                                                                                                                                                                   |
| `statuses`                          | `status_id` (serial)                  | —                                                                                                                                                     | PK, UK `name`, UK `order_number` (DEFERRABLE)                                                                                                                                    |
| `details_professional`              | `professional_id` (uuid)              | `user_id` → `users` (RESTRICT)                                                                                                                        | PK, UK `user_id`, `idx_details_professional_status`                                                                                                                              |
| `requests`                          | `request_id` (bigint, sequence)       | `requester_id`, `category_id`, `status_id`, `priority_id`, `professional_id`, `requester_user_id`, `mapping_professional_id`, `last_public_status_id` | `idx_requests_created_at`, `_status`, `_category`, `_priority`, `_professional`, `_requester`, `_requester_user`, `_mapping_professional`, `_last_public_status` (novo)          |
| `pending_items`                     | `pending_item_id` (uuid)              | `request_id` → `requests` (CASCADE)                                                                                                                   | `idx_pending_items_request`, `_status`, `_request_status`, `_batch`                                                                                                              |
| `attachments`                       | `attachment_id` (uuid)                | `request_id` → `requests` (CASCADE); `pending_item_id` → `pending_items` (SET NULL)                                                                   | `idx_attachments_request`, `_pending_item`, `_restricted`, `_uploaded_at`                                                                                                        |
| `request_time_preferences`          | `request_time_preference_id` (serial) | `request_id` → `requests` (CASCADE)                                                                                                                   | PK, UK (`request_id`, `scheduled_for`)                                                                                                                                           |
| `mappings`                          | `mapping_id` (uuid)                   | `request_id` → `requests` (CASCADE); `professional_id` → `details_professional` (SET NULL); `target_status_id` → `statuses` (RESTRICT)                | `idx_mappings_request`, `_request_concluded`, `_professional` (novo), `_target_status` (novo), UK parcial `uk_mappings_one_open_per_request` (novo)                              |
| `mapping_participants`              | `participant_id` (uuid)               | `mapping_id` → `mappings` (CASCADE); `user_id` → `users` (SET NULL)                                                                                   | UK (`mapping_id`, `user_id`), UK (`mapping_id`, `lower(email)`), `idx_mapping_participants_mapping`, `_user` (novo), CHECK `ck_mapping_participants_internal_or_external` (novo) |
| `triages`                           | `triage_id` (uuid)                    | `request_id` → `requests` (CASCADE); `exit_status` → `statuses` (RESTRICT); `assignee_user_id` → `users` (SET NULL)                                   | `idx_triages_request_triage`, `_exit_status` (novo), `_assignee_user` (novo)                                                                                                     |
| `request_internal_notes`            | `internal_note_id` (bigserial)        | `request_id` → `requests` (RESTRICT); `author_user_id` → `users` (RESTRICT)                                                                           | UK (`request_id`, `internal_note_id`), `idx_request_internal_notes_timeline`, `_author`                                                                                          |
| `request_internal_note_read_states` | (`request_id`, `user_id`)             | `user_id` → `users` (RESTRICT); (`request_id`, `last_read_note_id`) → `request_internal_notes`                                                        | PK composta, `idx_internal_note_read_states_last_note`, `_user` (novo)                                                                                                           |

## Achados

### 1. Colunas sem uso pela aplicação

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

### 5. Unicidade case-insensitive

- `categories.name` tem `uk_categories_name_ci` (`lower(name)`).
- `users.email` e `requesters.corporate_email` têm apenas unicidade
  case-sensitive. A aplicação normaliza para lowercase antes de gravar/consultar,
  mas o banco não garante a regra.
- `mapping_participants` já tem `UK (mapping_id, lower(email))`.

### 6. Índice ocioso

- `idx_attachments_restricted` indexa `attachments.is_restricted`, coluna que a
  aplicação não filtra. O índice foi mantido para não ampliar o escopo.

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

O `down` reverte todos os itens acima.

## Validação

Executada contra PostgreSQL 18 em Docker:

- `npm run migrate:latest` — 56 migrations no batch 1;
- `npm run seed:run` — 11 seeds;
- `npx knex migrate:down 20260927000000_database_review_improvements.js` —
  rollback da migration nova;
- `npx knex migrate:up 20260927000000_database_review_improvements.js` —
  reaplicação;
- conferência via `psql` dos 10 índices, da CHECK e do tipo
  `timestamp with time zone` em `audit_history.occurred_at`;
- `npm run check` (typecheck + lint + Prettier).

## Recomendações (fora deste escopo)

1. **Remover colunas legadas** de `requests`, `pending_items` e
   `attachments.is_restricted`, junto com o índice `idx_attachments_restricted`.
   Requer atualizar os seeds que ainda preenchem essas colunas (ex.: seeds de
   solicitações em lote da branch de testes) e um período de compatibilidade.
2. **Unicidade case-insensitive** em `users.email` e
   `requesters.corporate_email` (`CREATE UNIQUE INDEX ... ON (lower(email))`).
   Antes, rodar uma consulta de duplicados; a migration deve falhar/abortar se
   houver conflito.
3. **Padronizar timezone** de `request_time_preferences.scheduled_for` e de
   `users`/`profiles.created_at`/`updated_at` para `timestamptz`, com ajuste
   coordenado do código que lê os valores.
4. **Remover `idx_attachments_restricted`** se a coluna não voltar a ser
   consultada.

## Referências

- `docs/database/requests-persistence.md` — modelo do domínio de solicitações.
- `docs/database/identifier-patterns.md` — convenção de identificadores.
- `docs/database/authentication-persistence.md` — autenticação.
- `docs/database/system-settings-persistence.md` — configuração do portal.
