# Motor de Status v4: catálogo de status e transições

**Status:** aceito — 21/11/2026

O Status da solicitação deixa de ser um enum fechado com significados
implícitos e passa a ser um **catálogo administrável** (`statuses`) com flags e
modos explícitos. O código nunca decide pelo **nome** de um Status não-core:
usa `is_core`, `is_public`, `is_terminal`, `is_restricted`, `triage_mode` e
`mapping_mode`. Os sete Status core têm ids fixos (`1, 3, 4, 6, 7, 16, 17`) e
são imutáveis.

## Modelo

- `isPublic` — o nome pode ser mostrado ao solicitante. O último Status público
  fica em `requests.last_public_status_id`.
- `isTerminal` — encerra a solicitação (`Concluído`, `Cancelado`).
- `isRestricted` — só Administrador define (`Priorizado`).
- `triageMode` / `mappingMode` — `none`, `free` ou `conclusion_only`: em que
  fase o Status pode ser alvo.
- A ordem de exibição é a posição no array do `PATCH`, não um campo `order`.

## Transições

- Triagem e mapeamento concluem para Status ativo, não restrito e com modo de
  conclusão.
- Toda troca via `PATCH /status` exige justificativa interna
  (`justification`). Triagem usa `conclusionJustification`; mapeamento para
  `Mapeamento agendado` (id 6) dispensa justificativa.
- Todo destino público exige `lastTechnicalMessage` (snapshot do retorno ao
  solicitante), inclusive no bypass do Administrador.
- Mapeamento para `Mapeamento agendado` (id 6) exige reunião completa e dispensa
  justificativa; os demais destinos exigem justificativa e limpam a reunião.
- O Administrador tem bypass de perfil/restrição, mas não de campos
  obrigatórios. O evento do bypass é `request.override_status_admin`,
  normalizado para `request.status_change` na timeline interna.
- Gestor é somente leitura no ciclo.

## Alternativas consideradas

- **Enum fechado em código:** simples, mas não permitia administrar nomes/ordem
  pelo portal e exigia deploy para qualquer ajuste de catálogo.
- **Status por nome (como antes):** acoplava regra de negócio a texto editável;
  renomear um Status quebrava o fluxo.
- **Booleans separados para cada fase:** explodiria em colunas; os modos
  `none/free/conclusion_only` expressam a mesma intenção com menos estados.

## Consequências

- Regras usam flags/ids, nunca nomes não-core. Onde é inevitável (RN-010), o
  nome está centralizado em constante.
- `PATCH /portal-config/statuses` é atômico e retorna `409` com código estável
  para violações de core; flags e modos dos core também são imutáveis.
- `triageMode`/`mappingMode` são a única fonte para elegibilidade de destino.
  Hoje o código aceita apenas `conclusion_only` na conclusão das fases; aceitar
  `free` é uma decisão pendente registrada em `docs/rules/README.md`.
- Renomear/desativar Status não-core é permitido, mas o histórico mantém o
  snapshot textual na auditoria.
