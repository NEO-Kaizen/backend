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

## Origens

- `self` — ação do próprio usuário no autoatendimento.
- `admin` — ação de Administrador.
- `system` — ação automática (RN-010, transição de pendência, liberação de
  responsável).
- `requester`, `manual`, `internal` — conforme o fluxo que originou a ação.

## Consulta

- A listagem administrativa exige `audit:read`; a Linha do tempo de uma
  solicitação exige `request:read` + Custódia do Responsável da triagem **ou**
  do Designado do mapeamento corrente.
- A listagem é ordenada do evento mais recente para o mais antigo.
- Respostas administrativas não devem ser armazenadas por navegador ou
  intermediários.

## Privacidade

- Não grave senhas, tokens ou PII desnecessária nos valores anterior/novo.
- Em troca/redefinição de senha, o hash nunca é registrado.
- Mensagens de erro não revelam existência de recurso de terceiros.
