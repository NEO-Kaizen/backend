# Ciclo de vida da solicitação

A solicitação percorre um catálogo de **Status** administrável. Nenhuma regra
pode depender do **nome** de um Status não-core: use as flags. Os ids core são
fixos (`src/shared/types/status.ts`); os valores semeados de referência estão em
[`docs/database/requests-persistence.md`](../database/requests-persistence.md).

## Núcleo do catálogo

**Core** = ids `1, 3, 4, 6, 7, 16, 17`. Não podem ser removidos, renomeados,
rebaixados, desativados nem ter flags/modos alterados. A ordem de exibição é a
posição do array na configuração, não um campo `order`.

- `isPublic` — o nome pode ser mostrado ao solicitante. Transições para Status
  interno mantêm o último Status público como retrato externo.
- `isTerminal` — encerra a solicitação.
- `isRestricted` — só o Administrador pode definir como destino.
- `triageMode` / `mappingMode` — em que fase o Status pode ser **alvo**:
  - `none`: nunca é alvo daquela fase;
  - `free`: alvo livre pelo agente da fase;
  - `conclusion_only`: alvo apenas na conclusão da fase.

## Criação

Toda solicitação nasce em `Solicitação enviada` (id 1), que também é o primeiro
retrato público. O protocolo é gerado na criação e não é reutilizado.

## Triagem

- Cada triagem é um registro novo; nunca há duas simultâneas. A vigente é a
  última.
- O destino precisa ser ativo, não restrito e ter modo de conclusão. Hoje o
  código aceita apenas `conclusion_only`.
- `changeCategory: "Sim"` troca a categoria da solicitação pelo nome ativo
  informado.
- Status de destino público exige retorno ao solicitante.

> O catálogo marca alguns Status como `free`. Aceitá-los na conclusão é uma
> decisão pendente; ver [`README.md`](README.md).

## Mapeamento

- Rascunho mantém o Status atual. A validação de modalidade vale também para
  rascunho: remoto exige link, presencial exige local.
- Mapeamento já concluído é imutável.
- Concluir exige destino ativo, não restrito e com modo de mapeamento de
  conclusão. Destino restrito é bloqueado para todos, inclusive Administrador.
- Destino **Mapeamento agendado** (id 6): exige reunião completa (modalidade,
  data, duração e link/local). Justificativa e retorno público são ignorados
  nesse destino; a reunião é mantida.
- Qualquer outro destino: exige justificativa interna e, se público, retorno ao
  solicitante. Reunião, participantes e designado são limpos.
- Ao criar sem executor, o mapeamento herda o responsável de triagem.
- Concluir sempre atualiza a data de atualização externa, inclusive no destino
  interno 6.

## Troca direta de status

- Exige status de destino e justificativa interna.
- Destino igual ao atual é inválido; destino inativo também.
- Administrador tem bypass de perfil/restrição. Os demais precisam ser o
  Analista responsável (triagem **ou** mapeamento) e só podem ir para Status com
  `triageMode = free` **ou** `mappingMode = free`, nunca restrito.
- Gestor é somente leitura.
- Status público exige retorno ao solicitante para qualquer ator; o bypass do
  Administrador **não** dispensa campos obrigatórios.
- A auditoria do Administrador usa `request.override_status_admin`; na Linha do
  tempo interna o evento é normalizado para `request.status_change`.

## Data de conclusão

`requests.concluded_at` acompanha o Status 16 (Concluído):

- entrar no 16 grava `now()`; sair limpa a coluna;
- a regra vale para todas as vias que mudam Status — troca direta, conclusão de
  mapeamento, desfecho da Triagem, pendências, RN-010 e `updateStatusById`;
- a escrita roda na mesma transação da mudança de Status, antes da publicação
  da projeção pública de duplicidade;
- reabrir uma solicitação concluída limpa a data e o corpus volta ao template de
  aberta;
- a varredura da janela pode republicar uma concluída que voltou para dentro da
  janela, mas sempre relê a Solicitação e reavalia todas as regras;
- `updated_at` e `last_external_update_at` não substituem essa data. O backfill
  da issue #210 reconstrói a sequência pela Auditoria e relata concluídas sem
  evento, sem inventar data.

`requests.concluded_at` é distinto de `mappings.concluded_at`, que registra a
conclusão de um esforço de mapeamento.

## Restrição e status terminal

- `isRestricted` (hoje `Priorizado`): a triagem bloqueia Analista e permite
  Administrador; o mapeamento bloqueia todos; a troca direta bloqueia
  não-Administrador como **destino**, mas não impede um responsável de **sair**
  de um Status restrito para um destino `free`.
- Status terminal não recebe novas pendências nem mapeamentos. A checagem de
  pendência ainda usa os nomes `Concluído`/`Cancelado`, não a flag; um Status
  terminal customizado escaparia da regra.
- A troca direta **não** bloqueia a saída de um Status terminal hoje. Reabrir
  solicitações encerradas está previsto na issue #148; ao sair do 16, a data de
  conclusão é limpa e a projeção de duplicidade volta ao template de aberta.

## Regras transversais

- As três entradas do Motor (triagem, mapeamento e troca direta) rodam em
  transação com auditoria.
- A notificação do solicitante só é emitida na troca direta de status, quando o
  destino é público e não restrito. Triagem e mapeamento não notificam.
- Mudanças diretas de status fora do Motor (RN-010, pendências) atualizam apenas
  o estado atual, sem notificação e sem atualizar o retrato público.
- O retorno ao solicitante é **snapshot da transição**: fica na auditoria e
  nunca é concatenado à justificativa interna.
- O estado atual e o retrato público são conceitos distintos; o solicitante só
  vê o último Status público atualizado pelo Motor.
