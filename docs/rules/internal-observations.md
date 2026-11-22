# Notas internas (Linha do tempo unificada)

A Linha do tempo privada combina três fontes:

1. **Notas escritas** — texto livre, multi-autor, imutável.
2. **Eventos de auditoria** — atribuição, troca de Status e designação de
   mapeamento, com texto já renderizado no backend.
3. **Registros completos** — todas as triagens e todos os mapeamentos da
   solicitação.

## Acesso

Perfis internos (Analista, Gestor, Administrador). O gate é o da rota; a
Linha do tempo não reaplica a custódia do Analista.

## Página e ordenação

- A página é o merge de notas + eventos, em ordem mais recente primeiro; nunca a
  Linha do tempo inteira.
- A paginação é incremental, trazendo itens mais antigos sob demanda.
- Em timestamps iguais, a nota vem antes do evento na ordem ascendente — logo, o
  evento aparece antes na lista mais recente primeiro.

## Contagem de não vistas

- Conta **somente notas** de outros autores após o checkpoint do usuário.
- Eventos nunca alteram o checkpoint nem o badge.
- O checkpoint nunca regride: marcar uma nota antiga não reduz o já lido.
- Ler a Linha do tempo não marca como visto; apenas o checkpoint explícito faz isso.

## Eventos que entram na Linha do tempo

Apenas:

- `request.assign`, `request.reassign`, `request.unassign`,
  `request.status_change` e `mapping.assign`.

`request.override_status_admin` (bypass do Administrador) é normalizado na
leitura para `request.status_change`; a ação bruta nunca sai na API.

Ficam de fora `request.update`, `pending_item.*`, `user.*`, `settings.*`,
`prioritization.*`, `request.triage`, `mapping.save` e `mapping.complete`. A
informação de triagem/mapeamento vive nos registros anteriores.

## Registros anteriores

- Cada entrada traz o snapshot completo daquela versão e o instante do evento
  que a gerou.
- As listas são completas, ordenadas do mais antigo para o mais recente,
  idênticas em todas as páginas e independentes do cursor.

## Notas e eventos

- Notas são imutáveis; não há edição nem exclusão.
- O backend compõe uma frase completa em pt-BR para cada evento; o texto nunca é
  nulo nem JSON bruto.
- O ator pode ser nulo (sistema/usuário removido) e seu Perfil é o **atual**,
  não o anterior.
- A justificativa interna e o retorno público são campos distintos e nunca se
  misturam.
- Liberações automáticas na conclusão de triagem/mapeamento aparecem como
  desatribuição com origem `system`.

## Regra de consistência

A Linha do tempo é derivada da auditoria; não existe tabela própria de eventos. Se um
evento precisa aparecer na Linha do tempo, ele precisa existir no catálogo de auditoria
e ser gravado na mesma transação da mudança.
