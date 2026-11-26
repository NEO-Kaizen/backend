# Padrões de Identificadores (Primary Keys)

## Objetivo

Definir quando usar cada tipo de identificador nas tabelas do NEO, de modo que
novas tabelas sigam uma regra única em vez de decisão ad-hoc por issue. O
banco hoje convive com `serial`, `bigint`, `uuid` e chaves naturais — todos
defensáveis isoladamente, mas sem convenção escrita o custo aparece em FKs que
precisam casar tipo exato, em comparações que exigem conversão e em colunas de
auditoria "coringa".

## Regras

1. **Identificador exposto na API/URL ou no payload** → **`uuid`**
   (`gen_random_uuid()`).
   - Não enumera nem expõe sequência; seguro para criação externa, merge e
     distribuição.
   - Exemplos: `requesters.requester_id`, `details_professional.professional_id`,
     `pending_items.pending_item_id`, `attachments.attachment_id`,
     `mappings.mapping_id`, `mapping_participants.participant_id` e
     `triages.triage_id`.

2. **Identificador estritamente interno** (só FK/JOIN, nunca no contrato) →
   **`serial`/`bigserial`** (`int`/`bigint`).
   - Compacto e rápido de indexar; sem semântica global necessária.
   - Exemplos: `profiles.profile_id`, `users.user_id`,
     `categories.category_id`, `statuses.status_id`, `priorities.priority_id`,
     `request_time_preferences.request_time_preference_id`,
     `audit_history.audit_id`, `request_internal_notes.internal_note_id`.

3. **Chave natural de negócio** (legível/relevante fora do banco, até em URL) →
   coluna `varchar` com `unique`; o PK da tabela continua surrogate (regra 1 ou 2).
   - Exemplo: `requests.protocol` (`varchar(25)` unique) — o PK permanece
     `request_id`.
   - Exceção legítima: tabela de seed/referência cujo slug é a própria chave,
     ex.: `criteria.criterion_id` (`varchar(50)` PK).

4. **Tabelas singleton/config** → PK fixa **`smallint`** com CHECK (`= 1`).
   - Exemplos: `system_themes.theme_id`, `system_settings.settings_id`.

5. **Agregados de alta cardinalidade** → surrogate (regra 2), mas **nunca**
   serial exposto: se o id do agregado vier a ser exposto, é regra 1 (uuid).
   `requests.request_id` (`bigint`, sequência manual `requests_request_seq`) é
   histórico aceito; ids novos seguem as regras acima.

## Regras derivadas

- **FKs casam o tipo exato do PK referenciado.** Uma FK criada com tipo
  divergente quebra a migration.
- **`audit_history.entity_id` é `varchar(100)`** por aceitar os diversos
  formatos — a trilha guarda o id serializado; não alterar o formato de um id
  já auditado sem migração de compatibilidade.
- **Comparações entre formatos diferentes exigem conversão explícita.** Ex.:
  `professional_id` (uuid) ≠ `user_id` (int) → o vínculo é uma coluna própria
  (`details_professional.user_id`), nunca coincidência de tipo.
- **Não misturar chave natural com surrogate em rotas:** URL usa `protocol`;
  FKs internas usam `request_id`.

## Estado atual (mapeado das migrations)

| Tabela                              | PK                           | Tipo                 | Gerador                | Regra                   |
| ----------------------------------- | ---------------------------- | -------------------- | ---------------------- | ----------------------- |
| `profiles`                          | `profile_id`                 | `serial` (int)       | `increments()`         | 2                       |
| `users`                             | `user_id`                    | `serial` (int)       | `increments()`         | 2                       |
| `audit_history`                     | `audit_id`                   | `bigserial` (bigint) | `bigIncrements()`      | 2                       |
| `prioritization_evaluations`        | `protocol`                   | `varchar(25)`        | natural key            | 3                       |
| `system_themes`                     | `theme_id`                   | `smallint`           | singleton              | 4                       |
| `system_settings`                   | `settings_id`                | `smallint`           | singleton              | 4                       |
| `requesters`                        | `requester_id`               | `uuid`               | `gen_random_uuid()`    | 1                       |
| `categories`                        | `category_id`                | `serial` (int)       | `increments()`         | 2                       |
| `priorities`                        | `priority_id`                | `serial` (int)       | `increments()`         | 2                       |
| `statuses`                          | `status_id`                  | `serial` (int)       | `increments()`         | 2                       |
| `details_professional`              | `professional_id`            | `uuid`               | `gen_random_uuid()`    | 1                       |
| `requests`                          | `request_id`                 | `bigint`             | `requests_request_seq` | 5 (proxy `protocol` 3)  |
| `pending_items`                     | `pending_item_id`            | `uuid`               | `gen_random_uuid()`    | 1                       |
| `attachments`                       | `attachment_id`              | `uuid`               | `gen_random_uuid()`    | 1                       |
| `request_time_preferences`          | `request_time_preference_id` | `serial` (int)       | `increments()`         | 2                       |
| `criteria`                          | `criterion_id`               | `varchar(50)`        | slug                   | 3 (exceção de seed)     |
| `mappings`                          | `mapping_id`                 | `uuid`               | `gen_random_uuid()`    | 1                       |
| `mapping_participants`              | `participant_id`             | `uuid`               | `gen_random_uuid()`    | 1                       |
| `triages`                           | `triage_id`                  | `uuid`               | aplicação              | 1                       |
| `request_internal_notes`            | `internal_note_id`           | `bigserial` (bigint) | `bigIncrements()`      | 2                       |
| `request_internal_note_read_states` | (`request_id`, `user_id`)    | `bigint` + `int`     | chave composta         | 2 (agregado interno)    |
| `notifications`                     | `notification_id`            | `uuid`               | `gen_random_uuid()`    | 1                       |
| `request_public_projections`        | `request_id`                 | `bigint`             | FK → `requests`        | 2 (proxy `public_id` 1) |

- **Projeção pública (RF16):** o PK é o `request_id` interno (mesmo tipo da FK
  de `requests`), e o identificador exposto na API é `public_id`, um `uuid`
  gerado na aplicação com `randomUUID()` e `UNIQUE` — nunca derivado do
  Protocolo. Ver
  [`duplicate-detection-persistence.md`](duplicate-detection-persistence.md).

## Decisão aplicada: `mappings`

- `mappings.mapping_id` → **`uuid`** (`gen_random_uuid()`) — exposto no
  `GET`/`PUT /queue/requests/:protocol/mapping`, regra 1.
- `mappings.request_id` → **`bigint`** — FK interna para `requests.request_id`,
  regra 2/5.

> `professionals` foi renomeada para `details_professional` pela migration
> `20260917013250_rename_professionals_to_details_professional.js`; o PK
> `professional_id` foi preservado.

Referência: [`docs/database/requests-persistence.md`](requests-persistence.md).
