# Observações internas (timeline unificada)

A aba **Observações Internas** expõe uma timeline privada da solicitação,
combinando três fontes:

1. **Notas escritas** — texto livre, multi-autor, imutável.
2. **Eventos leves de auditoria** — atribuição, troca de Status e designação de
   mapeamento, com texto já renderizado no backend.
3. **Históricos completos** — todas as triagens e todos os mapeamentos da
   solicitação, em listas de topo.

## Autorização

Cookie de sessão com perfil `Analista`, `Gestor` ou `Administrador`.
`Solicitante` recebe `403`. O gate é o da rota: a timeline não reaplica a
checagem de custódia do Analista (dívida registrada na issue #152).

## Ordenação e paginação

- `items` vem em ordem **mais recente primeiro**.
- Keyset cursor opaco (base64url de `{ t, type, id }`); `nextCursor: null` no
  fim.
- `limit` 1..50, default 20. Cursor/limite inválido → `400`.
- A página é o merge de notas + eventos; nunca a timeline inteira.

## Contagem de não vistas

- `unseenCount` conta **somente notas** de outros autores após o checkpoint do
  usuário (sem checkpoint, todas as notas de outros autores contam).
- Eventos nunca alteram o checkpoint nem o badge.
- `PUT /requests/:protocol/internal-notes/read` grava
  `{ lastReadNoteId }`; a nota precisa pertencer à solicitação. Resposta `204`.

## Eventos que entram na timeline

Apenas estas ações de `audit_history`:

- `request.assign`
- `request.reassign`
- `request.unassign`
- `request.status_change`
- `mapping.assign`

`request.override_status_admin` (bypass do Administrador) é filtrado e
**normalizado na leitura** para `request.status_change`; a ação bruta nunca sai
na API.

Ficam de fora: `request.update`, `pending_item.*`, `user.*`, `settings.*`,
`prioritization.*`, `request.triage`, `mapping.save`, `mapping.complete`. A
informação de triagem/mapeamento vive nos históricos abaixo.

## Históricos

- `triages[]` — snapshot completo de cada triagem + `occurredAt` do evento
  `request.triage` que a gerou.
- `mappings[]` — snapshot completo de cada mapeamento + `occurredAt` do evento
  `mapping.*` que o gerou.
- Ambos são **completos**, ordenados `oldest → newest`, **idênticos em todas as
  páginas** e independentes do cursor. Vazios → `[]`.

## Notas

- `content` 1..4000 (trim), imutável.
- `id` é o `internal_note_id` numérico em string.
- A nota carrega autor (`id`, `name`, `role` interno) e `createdAt`.
- Não há edição nem exclusão no MVP.

## Eventos

- `id` é `audit:<audit_id>`.
- `text` é a frase pronta em pt-BR (nunca JSON bruto).
- `actor` pode ser `null` (sistema/usuário removido).
- `changeOrigin` ∈ `admin | system | internal | null`.
- `justification` é a justificativa **interna** da transição;
  `lastTechnicalMessage` é o snapshot do **retorno público** daquela transição.
  Os dois nunca se misturam.

## Detalhes observáveis

- **Checkpoint nunca regride:** o `PUT /read` grava o maior id já visto
  (`GREATEST`); marcar uma nota antiga não reduz o checkpoint.
- **Ler não marca como visto:** o `GET` não altera o checkpoint nem o badge;
  somente o `PUT /read` faz isso.
- **Desempate de ordenação:** em timestamps iguais, a nota vem antes do evento
  na ordem ascendente — logo, o evento aparece antes na lista mais recente
  primeiro.
- **Ator:** `actor.role` é o perfil **atual** do usuário, não o papel histórico
  no momento do evento.
- **Eventos automáticos:** liberações de responsável na conclusão de
  triagem/mapeamento aparecem como `request.unassign` / `mapping.assign` com
  `newValue: null` e `changeOrigin: "system"`.
- **Texto:** o backend compõe uma frase completa em pt-BR para cada evento;
  `text` nunca é `null` nem JSON bruto.
- **Justificativa/retorno:** `justification` e `lastTechnicalMessage` só são
  preenchidos em `request.status_change` (e no bypass normalizado); nos demais
  eventos ficam ausentes/nulos.

## Regra de consistência

A timeline é derivada de `audit_history`; não existe tabela própria de eventos.
Se um evento de negócio precisa aparecer na timeline, ele precisa existir no
catálogo de auditoria e ser gravado na mesma transação da mudança.
