# Atribuição e responsabilidade

A solicitação tem **duas responsabilidades**:

- **Responsável de triagem** (`requests.professional_id`);
- **Designado do mapeamento** (`requests.mapping_professional_id`).

Ambas referenciam `details_professional.professional_id`. Nome e e-mail vêm de
`users`; o profissional guarda rotação, capacidade, cargo e especialidades.

## Atribuibilidade

Um profissional é atribuível quando, ao mesmo tempo:

1. `details_professional.status = 'active'`;
2. `users.is_active = true`;
3. o Perfil está ativo, tem a flag da etapa (`is_assignable_triage` ou
   `is_assignable_mapping`) e o predicado de chaves exigido.

Solicitações antigas mantêm o vínculo se o profissional for desativado;
`ON DELETE SET NULL` só age em exclusão física.

## Designação e custódia

Designar o mapeamento desatribui a triagem (`requests.professional_id = null`).
A ação precisa alinhar com o vínculo existente na solicitação:

- **Só triagem:** `triage:*`, `pending_item:*` e `prioritization:write`.
  `pending_item:*` e `prioritization:write` repetem o comportamento anterior
  ao RBAC e **dependem de confirmação do Produto** — não são decisão fechada.
- **Só mapeamento:** `mapping:*` — leitura, escrita de conteúdo e designação.
  A triagem não edita nem designa o mapeamento; a primeira designação é feita
  por Admin/Root.
- **Qualquer um dos dois:** `request:read`, `request:write`,
  `request:status_change`, `internal_note:*`, `audit:read` e `queue:*`.

O histórico completo (notas, eventos, triagens e mapeamentos) é lido por
`internal_note:read` + custódia de triagem **ou** mapeamento.

O Status não depende do vínculo: o alvo precisa ser ativo e ter `triageMode` ou
`mappingMode` `free`; restrito ou fora do modo exige `request:status_override`
global.

Quem lê a visão interna sem `internal_note:read` recebe
`internalObservations: null`; sem `pending_item:read` — como o Designado do
mapeamento — os blocos de Pendência saem zerados.

> Incluir `gestor` como atribuível é uma decisão pendente; ver
> [`README.md`](README.md).

### Duas listas com filtros diferentes

- A lista de Responsáveis atribuíveis exige extensão profissional e **não** checa
  se o Perfil está ativo.
- A lista de analistas inclui analistas **sem** extensão profissional, mas exige
  Perfil ativo.

O modal de atribuição usa a lista mais permissiva; a fila usa a de atribuíveis.

## Custódia × executor do mapeamento

- A custódia do mapeamento é `requests.mapping_professional_id` e só muda pela
  rota de atribuição interna.
- O executor do mapeamento é `mappings.professional_id` e pode ser definido na
  edição do mapeamento. Ele **não** ganha custódia na fila nem na troca de
  Status.

## Autorização

- Atribuir exige `request:assign`; no perfil base, só Administrador e Admin
  Root têm a chave. O Analista não atribui.
- Editar o mapeamento exige `mapping:write` + custódia da solicitação ou do
  mapeamento corrente; designar o executor também é permitido ao designado
  atual.
- Analista sem custódia é recusado com código de permissão insuficiente.

## RN-010 — avanço automático de status

Ao atribuir o responsável de triagem, se **simultaneamente**:

- o Status atual é `Em triagem`;
- `requests.screening_result = 'elegivel'`;
- a atribuição resultou em um responsável (não é remoção);

então o Status avança para `Aguardando mapeamento`, na mesma transação, com
auditoria de mudança de Status e origem `system`.

> **Limitação atual:** nenhum fluxo da aplicação escreve
> `requests.screening_result`, nem a triagem. A coluna só é populada por
> seeds/legado; em base nova a RN-010 não dispara. A condição acima descreve o
> código, não o comportamento desejado.

## Liberação automática na conclusão

- Concluir a triagem sempre libera o responsável de triagem. O snapshot do
  responsável permanece no registro da triagem.
- Concluir o mapeamento para destino diferente de `Mapeamento agendado` libera o
  designado e registra a remoção; agendar mantém o designado.
- Depois da liberação a solicitação fica sem responsável e só o Administrador
  consegue reatribuir até que alguém volte a ser designado.

## Exclusividade × remoção

Atribuir uma responsabilidade limpa a outra; ambas as limpezas geram auditoria
de desatribuição.

**Remover** uma responsabilidade limpa somente aquele eixo e não afeta o outro.

> Manter as duas responsabilidades ao mesmo tempo é uma decisão pendente; ver
> [`README.md`](README.md).

## Auditoria

Cada alteração grava atribuição, reatribuição ou desatribuição, com o `user_id`
anterior/novo (não o UUID do profissional).
