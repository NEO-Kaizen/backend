# Trilha de auditoria

A auditoria registra as ações administrativas e de negócio. A Linha do tempo interna e
as telas de auditoria derivam dela.

## Invariantes

- A tabela é **append-only**: não há `UPDATE`, `DELETE` nem `TRUNCATE`.
- Cada evento é gravado na **mesma transação** da mudança de estado; se a
  transação falhar, nem o estado nem o evento existem.
- `note` é a justificativa **interna**; o retorno ao solicitante é um snapshot
  separado e nunca é concatenado à nota.
- Linhas antigas sem ator após `SET NULL` legado são indistinguíveis de ações de
  sistema na leitura.

## Catálogo

| Entidade         | Ações                                                                                                           |
| ---------------- | --------------------------------------------------------------------------------------------------------------- |
| `user`           | `create`, `activate`, `deactivate`, `reset_password`, `change_password`, `update_profile`, `update`             |
| `prioritization` | `evaluate`                                                                                                      |
| `request`        | `assign`, `reassign`, `unassign`, `status_change`, `update`, `triage`, `override_status_admin`, `access_denied` |
| `mapping`        | `assign`, `save`, `complete`                                                                                    |
| `settings`       | `update`                                                                                                        |
| `pending_item`   | `create`, `respond`, `attach`, `validate`, `reopen`                                                             |

Entidade nova exige atualização do catálogo em código **e** do `CHECK` do banco
no mesmo PR.

## Transições de Status

- Alterações manuais registram `request.status_change` ou
  `request.override_status_admin`; a conclusão da triagem registra
  `request.triage`.
- Transições automáticas de atribuição, pendência e mapeamento registram
  `request.status_change`. Tentativas negadas registram
  `request.access_denied` sem alterar o Status.
- Uma constraint trigger exige, no commit, exatamente um evento de auditoria
  correspondente a cada mudança real de `requests.status_id` na mesma
  transação. `request.access_denied` não satisfaz essa exigência.
- Transições automáticas usam `change_origin = "system"`; ações humanas usam o
  ator da sessão.

## Origens

- `self` — ação do próprio usuário no autoatendimento.
- `admin` — ação de Administrador.
- `system` — ação automática (RN-010, transição de pendência, liberação de
  responsável).
- `requester`, `manual`, `internal` — conforme o fluxo que originou a ação.

## Consulta

- Administrador e Gestor leem a listagem administrativa; Analista lê a Linha do tempo
  de uma solicitação apenas se for responsável (triagem ou mapeamento).
- A listagem é ordenada do evento mais recente para o mais antigo.
- Respostas administrativas não devem ser armazenadas por navegador ou
  intermediários.
- `GET /audit-logs/{protocol}/status-times` reconstrói intervalos e totais por
  Status a partir da trilha. A consulta responde `409 STATUS_HISTORY_DIVERGENCE`
  se o histórico não puder ser reconstruído ou não terminar no Status atual;
  regras em [`status-time.md`](status-time.md) e contrato na
  [OpenAPI](../openapi.json).

## Privacidade

- Não grave senhas, tokens ou PII desnecessária nos valores anterior/novo.
- Em troca/redefinição de senha, o hash nunca é registrado.
- Mensagens de erro não revelam existência de recurso de terceiros.
