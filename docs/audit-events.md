# Auditoria de ações administrativas

Documentação interna do serviço de registro de eventos (issue #52).

## Modelo

- Tabela `audit_history`: `entity_type`, `entity_id`, `action_type` (`<entidade>.<ação>`), `user_id` (executor), `previous_value`, `new_value`, `note`, `change_origin`, `created_at`.
- Fonte de verdade em duas camadas:
  - Código: `src/shared/audit/auditCatalog.ts` (tipos + guards de runtime).
  - Banco: `CHECK chk_audit_history_entity_type` (rejeita entidade fora da lista).
- **As duas listas precisam andar juntas**: ao adicionar uma entidade no catálogo, criar migration ampliando o CHECK (ver `20260917120000_..._request.js`).

## Entidades e ações

| Entidade         | Ações                                                                   | Origem                                        |
| ---------------- | ----------------------------------------------------------------------- | --------------------------------------------- |
| `user`           | `create`, `activate`, `deactivate`, `reset_password`, `change_password` | gestão de contas                              |
| `prioritization` | `evaluate` (avaliação e reavaliação)                                    | `PUT /prioritization/:protocol/score`         |
| `request`        | `assign`, `reassign`, `unassign`, `status_change`                       | `PATCH /requests/:protocol/assignee` + RN-010 |
| `settings`       | `update`                                                                | portal-config                                 |

## Padrão obrigatório

Toda mutação auditável segue este padrão:

```ts
await db.transaction(async (trx) => {
  await repository.updateAlgo(trx, ...); // 1. alteração principal
  await recordAudit(trx, {
    // 2. evento na MESMA transação
    entityType: "request",
    entityId: protocol,
    actionType: "request.assign",
    userId: atorDaSessao, // req.user.id — nunca do body
    previousValue: anterior, // null quando não havia valor
    newValue: novo,
    changeOrigin: "admin", // ou "system" para gatilhos como RN-010
  });
});
```

Regras:

1. Evento **dentro da mesma transação** da alteração — se o INSERT falhar, a alteração é desfeita (rollback).
2. Executor sempre da **sessão autenticada** (`req.user.id`).
3. `previous_value`/`new_value` sempre preenchidos (texto canônico; `null` só quando não havia anterior).
4. `audit_history` é **só INSERT** — não existe endpoint nem repository de edição/exclusão.
5. Tipos fora do catálogo são erro de compilação; valores dinâmicos são rejeitados pelo guard antes do INSERT.

## Como validar

```bash
npm run docker:db:setup
# exercer as 3 ações por HTTP e conferir:
docker compose exec postgres psql -U neo_dev -d neo_dev \
  -c "SELECT entity_id, action_type, user_id, previous_value, new_value FROM audit_history ORDER BY audit_id;"
# rollback: BEGIN; <alteração>; INSERT com entity_type inválido; COMMIT
# → erro de CHECK e alteração desfeita
```
