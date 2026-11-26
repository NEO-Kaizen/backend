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

Os nomes das entidades e os valores de ação vigentes estão definidos na
[OpenAPI](../openapi.json).

Entidade nova exige atualização do catálogo em código **e** do `CHECK` do banco
no mesmo PR.

## Transições de Status

- Toda mudança de Status e seu evento de auditoria são gravados na mesma
  transação. Uma tentativa negada não altera o Status.
- Uma constraint trigger exige, no commit, exatamente um evento de auditoria
  correspondente a cada mudança real de `requests.status_id` na mesma
  transação.
- Transições automáticas usam origem de sistema; ações humanas usam o ator da
  sessão.

## Origens

- `self` — ação do próprio usuário no autoatendimento.
- `admin` — ação de Administrador.
- `system` — ação automática (RN-010, transição de pendência, liberação de
  responsável).
- `requester`, `manual`, `internal` — conforme o fluxo que originou a ação.

## Reconstrução de tempo por Status

A reconstrução falha se a trilha for inválida ou não terminar no Status atual
persistido. As regras de domínio estão em
[`status-time.md`](status-time.md); o formato e o acesso estão na
[OpenAPI](../openapi.json).

## Privacidade

- Não grave senhas, tokens ou PII desnecessária nos valores anterior/novo.
- Em troca/redefinição de senha, o hash nunca é registrado.
- Mensagens de erro não revelam existência de recurso de terceiros.
