# Atribuição e responsabilidade

A solicitação tem **duas responsabilidades**:

- **Responsável de triagem** (`requests.professional_id`);
- **Designado do mapeamento** (`requests.mapping_professional_id`).

Ambas referenciam `details_professional.professional_id` (UUID) no banco. Nome
e e-mail vêm sempre de `users`; o profissional guarda rotação, capacidade, cargo
e especialidades.

## Elegibilidade

Um profissional é **elegível** quando, ao mesmo tempo:

1. `details_professional.status = 'active'` (está na rotação);
2. `users.is_active = true` (conta ativa);
3. o perfil é `analista` (`ASSIGNABLE_PROFILES`).

Solicitações antigas mantêm o vínculo se o profissional for desativado;
`ON DELETE SET NULL` só age em **exclusão física** do profissional.

> ⚠ **Decisão pendente:** o contrato antigo de responsável técnico incluía
> `gestor` como atribuível; o código atual só aceita `analista`. O Gestor
> continua lendo/filtrando a fila, mas não pode ser designado.

### Duas listas, filtros diferentes

| Lista                     | Quem entra                                                                 | `id` devolvido    |
| ------------------------- | -------------------------------------------------------------------------- | ----------------- |
| `GET /requests/assignees` | exige `details_professional` e não checa `profiles.is_active`              | `professional_id` |
| `GET /users/analysts`     | analistas ativos, **mesmo sem** `details_professional`; exige perfil ativo | `user_id`         |

O modal de atribuição usa `/users/analysts` (mais permissiva); a fila usa a
lista de elegíveis.

## Endpoints e identificadores

- `PATCH /requests/:protocol/internal/assignee` — `assigneeId` e
  `mappingAssigneeId` são **`users.user_id` numérico em string** (ex.: `"20"`).
  `null` remove a responsabilidade correspondente.
- `PUT /queue/requests/:protocol/mapping` — `mappingAssigneeId` é **UUID de
  `details_professional.professional_id`** e grava **`mappings.professional_id`**
  (executor do mapeamento), **não** `requests.mapping_professional_id`. Só a
  rota de atribuição interna altera a custódia do mapeamento.
- `PATCH /requests/:protocol/assignee` — rota legada; `professionalId` é UUID
  de `professional_id`. Marcada como `deprecated` na OpenAPI.
- `GET /requests/assignees` — `AssigneeSummary.id` é `professional_id`.
- `GET /users/analysts` — `Analyst.id` é `user_id` (string).
- `GET /queue` — `QueueItem.assigneeId` e `QueueAssignee.id` são `user_id`
  (string). O filtro `assigneeId` da fila aceita UUID, `user_id` numérico ou
  `unassigned`.

> ⚠ **Decisão pendente:** unificar o identificador público do responsável.
> Hoje o mesmo conceito é exposto como `professional_id` em uma rota e
> `user_id` em outra. A recomendação é `professional_id`, por ser o recurso de
> domínio.

## Autorização

- `PATCH .../internal/assignee`: Administrador **ou** o Analista que já é
  responsável (triagem ou mapeamento). Gestor **não** atribui — é barrado no
  `requireRole`, sem o `code` de custódia. Analista sem custódia recebe `403`
  com `code: "INSUFFICIENT_ROLE_PERMISSIONS"`.
- `PUT .../mapping`: editar o conteúdo exige Administrador ou o responsável da
  solicitação; **designar o executor** (`mappingAssigneeId`) também é permitido
  ao designado atual do mapeamento. Gestor é somente leitura.
- O executor definido pelo `PUT mapping` **não** ganha custódia na fila nem em
  `PATCH /status`; essas checagens leem `requests.mapping_professional_id`,
  alterado apenas pela rota de atribuição interna.

Erros de atribuição:

- `400` — `analystId`/`professionalId` vazio, profissional inexistente, inativo
  ou com perfil não atribuível;
- `404` — protocolo inexistente (e, no legado, o zod já rejeita UUID inválido
  com `400`).

## RN-010 — avanço automático de status

Ao atribuir o responsável de triagem, se **simultaneamente**:

- o Status atual é `Em triagem` (id 3);
- `requests.screening_result = 'elegivel'`;
- a atribuição resultou em um responsável (não é remoção);

então o Status avança para `Aguardando mapeamento` (id 5) na mesma transação,
com auditoria `request.status_change` e origem `system`.

> ⚠ **Limitação atual:** nenhum fluxo da aplicação escreve
> `requests.screening_result` — nem `POST /requests/:protocol/triage`. A coluna
> só é populada por seeds/legado. Em uma base criada do zero, a RN-010 **não
> dispara**. A condição acima descreve o código, não o comportamento desejado;
> a correção é registrar o resultado da triagem nessa coluna ou trocar a fonte
> da condição.

## Liberação automática na conclusão

- **Triagem:** concluir a triagem sempre zera `requests.professional_id` na
  mesma transação. O snapshot do responsável permanece em `triages.assignee_*`.
  A auditoria `request.triage` registra a conclusão.
- **Mapeamento:** concluir para destino **diferente de `Mapeamento agendado`**
  (id 6) zera `requests.mapping_professional_id` e grava `mapping.assign` com
  `newValue: null`, origem `system`. Agendar (id 6) **mantém** o designado.
- Depois da liberação a solicitação fica sem responsável. Como
  `canAssignRequest` exige custódia, **só o Administrador** consegue reatribuir
  até que alguém volte a ser designado.

## Exclusividade × remoção

O código atual trata as duas responsabilidades como **mutuamente exclusivas na
atribuição**:

- atribuir triagem limpa o designado do mapeamento;
- atribuir mapeamento limpa o responsável de triagem;
- ambas as limpezas geram auditoria `request.unassign`.

**Remover** (`assigneeId: null` ou `mappingAssigneeId: null`) limpa somente o
eixo informado e **não** afeta o outro.

> ⚠ **Decisão pendente:** a documentação anterior descrevia as duas
> responsabilidades como independentes. Hoje não é possível mantê-las ao mesmo
> tempo por atribuição. Enquanto a decisão não fecha, este é o comportamento
> observável.

## Auditoria

Cada alteração grava `request.assign`, `request.reassign` ou
`request.unassign`, com o `user_id` anterior/novo (não o UUID) em
`previous_value`/`new_value`.
