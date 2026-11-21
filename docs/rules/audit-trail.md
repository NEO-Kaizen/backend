# Trilha de auditoria

`audit_history` é o registro imutável das ações administrativas e de negócio.
A timeline interna e as telas de auditoria derivam dela.

## Modelo

| Coluna                   | Papel                                                          |
| ------------------------ | -------------------------------------------------------------- |
| `audit_id`               | PK sequencial                                                  |
| `entity_type`            | entidade do catálogo (`user`, `request`, …)                    |
| `entity_id`              | identificador da entidade (protocolo, id, uuid)                |
| `action_type`            | `<entidade>.<ação>` — ex.: `request.status_change`             |
| `user_id`                | executor (`NULL` = sistema); FK com `ON DELETE RESTRICT`       |
| `previous_value`         | snapshot anterior (texto)                                      |
| `new_value`              | snapshot novo (texto)                                          |
| `note`                   | justificativa **interna** da transição                         |
| `last_technical_message` | snapshot do **retorno público** da transição                   |
| `ip_address`             | IP do ator                                                     |
| `change_origin`          | origem (`user`, `admin`, `system`, `requester`, `internal`, …) |
| `occurred_at`            | instante do evento                                             |

A tabela é **append-only** por triggers: não há `UPDATE`, `DELETE` nem
`TRUNCATE` de linhas. Linhas antigas com `user_id` nulo após `SET NULL` legado
são indistinguíveis de ações de sistema na leitura.

## Catálogo em código

`src/shared/audit/auditCatalog.ts` é a fonte única das entidades e ações:

| Entidade         | Ações                                                                                                           |
| ---------------- | --------------------------------------------------------------------------------------------------------------- |
| `user`           | `create`, `activate`, `deactivate`, `reset_password`, `change_password`, `update_profile`, `update`             |
| `prioritization` | `evaluate`                                                                                                      |
| `request`        | `assign`, `reassign`, `unassign`, `status_change`, `update`, `triage`, `override_status_admin`, `access_denied` |
| `mapping`        | `assign`, `save`, `complete`                                                                                    |
| `settings`       | `update`                                                                                                        |
| `pending_item`   | `create`, `respond`, `attach`, `validate`, `reopen`                                                             |

Duas listas precisam andar juntas:

1. o catálogo em código (tipos + guard de runtime);
2. o `CHECK chk_audit_history_entity_type` no banco.

Entidade nova = mudança no catálogo **e** migration ampliando o CHECK, no mesmo
PR.

## Origens (`change_origin`)

Valores escritos pelo código: `user`, `admin`, `system`, `requester`, `manual`,
`internal`, `self`. A leitura expõe `string` porque o banco pode conter valores
históricos.

Regras práticas:

- ação do próprio usuário no autoatendimento → `self`;
- ação de Administrador → `admin`;
- ação automática (RN-010, transição de pendência) → `system`;
- ação feita pelo Analista na operação interna → `internal` ou `admin`,
  conforme o serviço.

## O que sempre entra na mesma transação

Toda mudança relevante grava o evento junto da mudança de estado:

- criação/edição de usuário e senha;
- atribuição/desatribuição (triagem e mapeamento);
- troca de Status (inclusive o bypass do Administrador);
- triagem;
- criação/resposta/revisão de pendência;
- salvamento/conclusão de mapeamento;
- avaliação de priorização;
- configuração do portal.

Se a transação falhar, nem o estado nem a auditoria são gravados.

## Consulta

- `GET /audit-history` — Administrador/Gestor, paginado (`page`, `limit` 1..100,
  `entityType`), envelope `{ items, total, page, limit }`, ordenado por
  `occurred_at DESC`. `total` é a contagem antes da paginação; `page`/`limit`
  ecoam os valores aplicados. A query é estrita: parâmetro desconhecido →
  `400`.
- `GET /audit-history/{id}` — detalhe completo.
- `GET /audit-logs/{protocol}` — timeline da solicitação. Administrador/Gestor
  veem qualquer uma; Analista só as que lhe são atribuídas (triagem ou
  mapeamento). Respostas com `Cache-Control: private, no-store`.

## Privacidade

- Não grave senhas, tokens ou PII desnecessária em `previous_value`/`new_value`.
- Em `user.change_password` e `user.reset_password`, o hash nunca é registrado.
- O texto de erro devolvido ao cliente não revela existência de recurso de
  terceiros.
