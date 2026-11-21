# Ciclo de vida da solicitação

A solicitação percorre um catálogo de **Status** administrável
(`statuses`), exposto em `GET /portal-config` e editável em
`PATCH /portal-config/statuses`. Nenhuma regra de negócio pode depender do
**nome** de um Status não-core: use as flags da tabela. Os ids core são fixos
(`src/shared/types/status.ts`).

## Catálogo base (17 Status)

| id  | Nome                        | Core | Público | Terminal | triageMode      | mappingMode     | Restrito |
| --- | --------------------------- | ---- | ------- | -------- | --------------- | --------------- | -------- |
| 1   | Solicitação enviada         | sim  | sim     | não      | none            | none            | não      |
| 2   | Aguardando triagem          | não  | sim     | não      | none            | none            | não      |
| 3   | Em triagem                  | sim  | sim     | não      | free            | none            | não      |
| 4   | Pendente de informações     | sim  | sim     | não      | free            | free            | não      |
| 5   | Aguardando mapeamento       | não  | sim     | não      | conclusion_only | none            | não      |
| 6   | Mapeamento agendado         | sim  | não     | não      | none            | conclusion_only | não      |
| 7   | Em mapeamento               | sim  | sim     | não      | none            | free            | não      |
| 8   | Em análise de viabilidade   | não  | não     | não      | free            | free            | não      |
| 9   | Elegível                    | não  | não     | não      | conclusion_only | conclusion_only | não      |
| 10  | Não elegível                | não  | não     | não      | conclusion_only | conclusion_only | não      |
| 11  | Priorizado                  | não  | não     | não      | none            | none            | sim      |
| 12  | Backlog                     | não  | não     | não      | conclusion_only | conclusion_only | não      |
| 13  | Direcionado para outra área | não  | não     | não      | conclusion_only | conclusion_only | não      |
| 14  | Em desenvolvimento          | não  | não     | não      | free            | none            | não      |
| 15  | Em homologação              | não  | não     | não      | free            | none            | não      |
| 16  | Concluído                   | sim  | sim     | sim      | conclusion_only | conclusion_only | não      |
| 17  | Cancelado                   | sim  | sim     | sim      | conclusion_only | conclusion_only | não      |

**Core** = ids `1, 3, 4, 6, 7, 16, 17`. Não podem ser removidos, renomeados,
rebaixados, desativados nem ter flags/modos alterados. A ordem de exibição é a
posição do array no PATCH, não um campo `order`.

## Significado das flags

- `isPublic` — o nome do Status pode ser mostrado ao solicitante. Transições
  para Status interno mantêm o último Status público como retrato externo.
- `isTerminal` — encerra a solicitação (`Concluído`/`Cancelado`).
- `isRestricted` — só o Administrador pode definir (hoje: `Priorizado`).
- `triageMode` / `mappingMode` — em que fase o Status pode ser **alvo**:
  - `none`: nunca é alvo daquela fase;
  - `free`: alvo livre pelo agente da fase;
  - `conclusion_only`: alvo apenas na conclusão da fase.
- `tone` — tom visual (`error`, `success`, `info`, `warning`, `neutral`).

## Criação

Toda solicitação nasce em `Solicitação enviada` (id 1), que também é o primeiro
retrato público. O protocolo é gerado na criação e não é reutilizado.

## Transições

### Triagem (`POST /requests/:protocol/triage`)

- Grava a triagem e aplica `exitStatus` como novo Status na mesma transação.
- O destino precisa ser **ativo**, **não restrito** e ter modo de triagem de
  conclusão. Hoje o código aceita apenas `triage_mode = conclusion_only`
  (`src/modules/requests/triage/triage.repository.ts`).
- `changeCategory: "Sim"` troca a categoria da solicitação pelo nome ativo
  informado.
- Status de destino público exige `lastTechnicalMessage`.

> ⚠ **Decisão pendente:** o catálogo marca `Em triagem`, `Pendente de
informações`, `Em análise de viabilidade`, `Em desenvolvimento` e `Em
homologação` como `free`. Os contratos antigos divergiam sobre aceitar `free`
> na conclusão. O código atual **não** aceita. Até a decisão, trate
> `conclusion_only` como a regra efetiva.

### Mapeamento (`PUT /queue/requests/:protocol/mapping`)

- Salvar rascunho (`completeMapping: false`) mantém o Status atual. A validação
  de modalidade (REMOTE exige `meetingLink`, IN_PERSON exige `location`) vale
  também para rascunho.
- Mapeamento já concluído é imutável → `422`; payload vazio → `400`.
- Concluir (`completeMapping: true`) exige `targetStatus` ativo, não restrito e
  com `mapping_mode = conclusion_only`; destino **restrito** é bloqueado para
  todos (inclusive Administrador).
- Destino **6 — Mapeamento agendado**: exige reunião completa (modalidade,
  data, duração e link remoto ou local presencial). `justification` e
  `lastTechnicalMessage` são ignorados nesse destino; a reunião é mantida.
- Qualquer outro destino: exige `justification` (1..4000); se público, exige
  também `lastTechnicalMessage`. Reunião, participantes e designado são
  limpos.
- Ao criar um mapeamento sem `mappingAssigneeId`, o executor herda o
  responsável de triagem.
- Concluir sempre atualiza `last_external_update_at`, inclusive no destino
  interno 6.

### Troca direta (`PATCH /requests/:protocol/status`)

- Exige `targetStatus` + `justification` (1..4000).
- Destino igual ao atual → `422`; destino inativo → `409`.
- Administrador tem bypass de perfil/restrição; os demais precisam ser o
  Analista responsável (triagem **ou** mapeamento) e só podem ir para Status com
  `triageMode = free` **ou** `mappingMode = free`, nunca restrito.
- Gestor é somente leitura → `403`.
- Status público exige `lastTechnicalMessage` (1..4000) para qualquer ator; o
  bypass do Administrador **não** dispensa campos obrigatórios.
- O evento de auditoria do Administrador é `request.override_status_admin`; na
  timeline interna ele é normalizado para `request.status_change`.

## Restrição e status terminal

- `isRestricted` (hoje `Priorizado`): triagem bloqueia Analista e permite
  Administrador; mapeamento bloqueia **todos**, inclusive Administrador;
  `PATCH /status` bloqueia não-Administrador como **destino**, mas não impede um
  responsável de **sair** de um Status restrito para um destino `free`. O
  `current_is_restricted` é carregado e não usado.
- Status terminal (`is_terminal = true`) não recebe novas pendências nem
  mapeamentos (triagem e mapeamento bloqueiam a origem). A checagem de
  pendência ainda usa os nomes `Concluído`/`Cancelado`, não a flag; um Status
  terminal customizado escaparia da regra. O `PATCH /status`
  **não** bloqueia a saída de terminal hoje, embora o comentário do serviço
  diga o contrário; reabrir está previsto na issue #148.
- A mesma linha do tempo acima vale para as três entradas (triagem, mapeamento
  e troca direta); a checagem de `current_is_terminal` é uma pendência de
  código.

## Regras transversais

- As transições do Motor v4 (triagem, mapeamento e `PATCH /status`) rodam em
  transação com auditoria.
- A **Notificação** do solicitante só é emitida no `PATCH /status`, quando o
  destino é público e não restrito. Triagem e mapeamento **não** notificam.
- Mudanças diretas de `status_id` fora do Motor (RN-010, pendências) atualizam
  apenas o estado atual, sem notificação e sem atualizar o retrato público.
- `lastTechnicalMessage` é **snapshot da transição**: fica em
  `audit_history.last_technical_message` e nunca é concatenado à justificativa
  interna.
- `requests.status_id` é o estado atual; `last_public_status_id` é o retrato
  externo. O solicitante só vê o último Status público atualizado pelo Motor.
- Status core não podem ter flags/modos alterados (ver `portal-config.md`).
