# Persistência de Notificações (RF20)

Issues: #157, #158. Contrato HTTP: [`docs/notifications-contract.md`](../notifications-contract.md).

## Objetivo

A tabela `notifications` guarda a projeção por destinatário de cada Evento da
matriz de audiência. A gravação acontece na mesma transação do evento de
negócio, pela seam `emitNotification(trx, evento)`, no molde de
`recordAudit(trx, ...)`.

A Notificação é um ponteiro: o `payload` carrega apenas a Allowlist do Evento
e o detalhe da solicitação é carregado sob RBAC pelo endpoint próprio.

## Estrutura

| Campo               | Tipo         | Obrigatório | Restrição / Default                           | Finalidade                                                                                                   |
| ------------------- | ------------ | ----------- | --------------------------------------------- | ------------------------------------------------------------------------------------------------------------ |
| `notification_id`   | UUID         | Sim         | Primary Key, `gen_random_uuid()`              | Identificador exposto na API e no SSE                                                                        |
| `recipient_user_id` | INTEGER      | Sim         | FK `users.user_id`, `ON DELETE CASCADE`       | Destinatário da Notificação                                                                                  |
| `event_type`        | VARCHAR(50)  | Sim         | NOT NULL                                      | Tipo do Evento (`status_changed`, `pending_item_created`, `pending_item_reopened`, `pending_item_validated`) |
| `request_id`        | BIGINT       | Sim         | FK `requests.request_id`, `ON DELETE CASCADE` | Solicitação associada                                                                                        |
| `payload`           | JSONB        | Sim         | NOT NULL                                      | Allowlist do Evento                                                                                          |
| `dedup_key`         | VARCHAR(255) | Sim         | UNIQUE (`uk_notifications_dedup_key`)         | Idempotência por evento + destinatário                                                                       |
| `read_at`           | TIMESTAMPTZ  | Não         | NULL até a leitura                            | Registro da leitura                                                                                          |
| `created_at`        | TIMESTAMPTZ  | Sim         | DEFAULT `CURRENT_TIMESTAMP`                   | Data e hora da emissão                                                                                       |

## Índices

- `idx_notifications_recipient_created` em (`recipient_user_id`, `created_at`)
  — lista por cursor, mais recente primeiro.
- `idx_notifications_recipient_read` em (`recipient_user_id`, `read_at`) —
  contador de não lidas e marcação em massa.
- `uk_notifications_dedup_key` — garante uma Notificação por evento +
  destinatário mesmo em retry.

## Regras

- `dedup_key` = `<eventKey>:<recipient_user_id>`. O formato de `eventKey` por
  Evento está em `docs/notifications-contract.md`; a chave de negócio preserva
  eventos distintos ao longo do ciclo de vida. Nos Eventos de Pendência, o
  prefixo é `pending_item.create`, `pending_item.reopen` ou
  `pending_item.validate` seguido do `audit_id` da primeira transição da ação.
- O emissor valida o Evento com Zod antes do INSERT. Payload fora da Allowlist
  é erro de programação e aborta a transação.
- O ator é removido da lista de destinatários na emissão.
- `read_at` é o registro da leitura; não gera evento de auditoria.
- Não há poda automática na v1.
- A trilha de auditoria permanece intacta: a Notificação é uma projeção, não
  uma fonte de eventos.

## Seed

`seeds/requester_request/013_notifications.js` cria massa fictícia dos Eventos
`status_changed`, `pending_item_created`, `pending_item_reopened` e
`pending_item_validated` para os solicitantes dos seeds 004 e 006. O seed é
idempotente: apaga apenas os ids fixos que ele mesmo cria e os recria.

## Migration

`migrations/20261120120000_create_notifications.js` — `up` cria a tabela e os
índices; `down` remove a tabela.
