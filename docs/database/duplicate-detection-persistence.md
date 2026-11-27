# Persistência da detecção de duplicidade (RF16)

Documenta a projeção pública e as colunas de configuração da detecção de
duplicidade (issues #209 e #210). As regras de negócio estão em
[`docs/rules/duplicate-detection.md`](../rules/duplicate-detection.md); as
decisões de arquitetura nos ADRs
[0004](../adr/0004-deteccao-de-duplicidade-lexical-in-process.md) e
[0005](../adr/0005-projecao-publica-para-deteccao-de-duplicidade.md).

## Issues relacionadas

- Issue #208 — especificação pai do RF16.
- Issue #209 — projeção de abertas, allowlists, flag, índice e `POST`.
- Issue #210 — concluídas com texto tarjado, janela configurável,
  `concluded_at` e backfill.
- Issues #211–#213 — Acompanhamento, administração e ativação.

## Tabela `request_public_projections`

Projeção curada, uma linha por Solicitação. É a **única** tabela lida pela busca
pública; o endpoint nunca consulta `requests`.

| Campo                  | Tipo                              | Obrigatório | Restrição / Default                        | Finalidade                                       |
| ---------------------- | --------------------------------- | ----------- | ------------------------------------------ | ------------------------------------------------ |
| `request_id`           | BIGINT                            | Sim         | PK; FK `requests.request_id` (CASCADE)     | Vínculo interno                                  |
| `public_id`            | UUID                              | Sim         | UK; gerado na aplicação com `randomUUID()` | Identificador público, independente do Protocolo |
| `public_title`         | VARCHAR(200)                      | Sim         | NOT NULL                                   | Título público (template ou tarjado)             |
| `public_summary`       | TEXT                              | Sim         | NOT NULL                                   | Resumo público (template ou tarjado)             |
| `public_category`      | VARCHAR(80)                       | Sim         | NOT NULL                                   | Snapshot do nome da Categoria                    |
| `public_status`        | VARCHAR(100)                      | Sim         | NOT NULL                                   | `Em andamento` ou `Concluída`                    |
| `public_period`        | VARCHAR(7)                        | Sim         | NOT NULL                                   | Trimestre `YYYY-Qn` em America/Sao_Paulo         |
| `publication_status`   | ENUM `request_publication_status` | Sim         | `published`/`suppressed`                   | Publicada ou suprimida                           |
| `is_publicly_listable` | BOOLEAN                           | Sim         | NOT NULL                                   | Snapshot da allowlist Categoria + Status         |
| `redaction_version`    | VARCHAR(30)                       | Sim         | NOT NULL                                   | `v1-open-template`, `v1-regex` ou `v1-template`  |
| `version`              | INTEGER                           | Sim         | DEFAULT 1; incrementa a cada upsert        | Versão da linha                                  |
| `public_concluded_at`  | TIMESTAMPTZ                       | Não         | NULL permitido                             | Conclusão usada na janela (interno, fora do DTO) |
| `published_at`         | TIMESTAMPTZ                       | Não         | NULL permitido                             | Primeira publicação                              |
| `suppressed_at`        | TIMESTAMPTZ                       | Não         | NULL permitido                             | Supressão vigente                                |
| `suppression_reason`   | VARCHAR(40)                       | Não         | NULL permitido                             | Motivo determinístico                            |
| `created_at`           | TIMESTAMPTZ                       | Sim         | DEFAULT `CURRENT_TIMESTAMP`                | Criação                                          |
| `updated_at`           | TIMESTAMPTZ                       | Sim         | DEFAULT `CURRENT_TIMESTAMP`                | Última atualização (cursor do poll)              |

### Restrições e índices

- PK em `request_id`; o `ON DELETE CASCADE` remove a projeção junto da
  Solicitação.
- `public_id` é `UNIQUE` e **não** tem default no banco: é sempre gerado pela
  aplicação, nunca derivado do Protocolo.
- Enum nativo `request_publication_status` (`published`/`suppressed`). O `down`
  remove a tabela e o tipo.
- `idx_request_public_projections_publication` em
  `(publication_status, is_publicly_listable)` — leitura do índice.
- `idx_request_public_projections_updated_at` — poll incremental.
- `idx_request_public_projections_published_concluded` parcial em
  `(publication_status, is_publicly_listable, public_concluded_at)`
  `WHERE publication_status = 'published' AND is_publicly_listable = TRUE` —
  listagem de publicadas e supressão de concluídas fora da janela.
- `idx_request_public_projections_suppressed_outside_window` parcial em
  `(public_concluded_at)`
  `WHERE publication_status = 'suppressed' AND suppression_reason = 'outside_window'`
  — reconciliação de linhas que voltaram para dentro da janela.
- `public_period` usa o formato `YYYY-Qn`; o trimestre é calculado pelo fuso
  `America/Sao_Paulo` no momento da publicação.
- `public_concluded_at` é cópia de `requests.concluded_at` no momento da
  publicação. Ele existe só para a janela e a varredura; o DTO expõe apenas as
  seis chaves públicas.

## Colunas de configuração

### `system_settings.duplicate_detection_enabled`

BOOLEAN `NOT NULL DEFAULT FALSE`. A flag nasce desligada; o seed de
desenvolvimento a liga. Flag desligada limpa o índice e faz a busca responder
vazio. A edição administrativa é escopo da issue #212.

### `system_settings.duplicate_completed_window_months`

INTEGER `NOT NULL DEFAULT 3`, CHECK 1..36. Define a janela das concluídas em
meses. A leitura tem fallback 3 quando o singleton está ausente ou o valor é
inválido, com aviso único por processo; o banco garante o intervalo pelo CHECK.
A comparação usa `now() - make_interval(months => ?)`. A edição administrativa é
escopo da issue #212.

### `categories.is_publicly_listable`

BOOLEAN `NOT NULL DEFAULT FALSE`. Categorias novas nascem desligadas; a
migration liga as categorias existentes. Ver
[`requests-persistence.md`](requests-persistence.md#tabela-categories).

### `statuses.is_duplicate_corpus_eligible`

BOOLEAN `NOT NULL DEFAULT TRUE`. A migration da #209 desliga os ids 10, 13, 16,
17 e 19 (quando existirem); a migration da #210 **religa apenas o 16**, que
passa a entrar no corpus de concluídas respeitando a janela. O `down` da
migration da #210 volta somente o 16 para `false`; não regrava os demais ids,
que pertencem ao baseline da #209/#212. O catálogo canônico atual vai até o id
17; o id 19 (`Duplicada`) será criado pela Marcação de duplicidade
(RF25)/administração (#212), e a allowlist já o cobre quando ele existir. Como
o default da coluna é `TRUE`, a migration que criar o 19 deve defini-lo com
`is_duplicate_corpus_eligible: false` explicitamente. Ver
[`requests-persistence.md`](requests-persistence.md#tabela-statuses).

## Ciclo de publicação

1. A criação ou alteração da Solicitação roda na transação existente.
2. `publishRequestProjection(trx, requestId)` lê Solicitação + Categoria +
   Status + janela, decide a supressão e faz upsert por `request_id`,
   preservando `public_id`.
3. Status diferente de 16 publica o template de aberta (`v1-open-template`),
   inclusive quando a linha está suprimida. Concluída (16) dentro da janela
   publica título/resumo com `v1-regex` depois do gate de PII; PII, título ou
   resumo vazio e qualquer supressão do 16 usam o template `v1-template`.
4. Publicada: `published_at` é mantido (ou preenchido na primeira vez),
   `suppressed_at` e `suppression_reason` ficam nulos.
5. Suprimida: `suppressed_at` é mantido (ou preenchido na transição),
   `published_at` é histórico e `suppression_reason` recebe o motivo.
6. `public_concluded_at` acompanha `requests.concluded_at` em todas as escritas.
7. `version` incrementa a cada escrita.

Os hooks ficam em criação, transição de Status (Motor e RN-010), conclusão de
mapeamento, triagem, pendências/revisão de campos e atualização dos blocos
internos.

### Varredura da janela

`sweepCompletedWindow()` roda antes de cada poll e de cada rebuild. Ela
reconcilia nos dois sentidos:

1. `suppressCompletedOutsideWindow(window)` atualiza somente projeções
   `published` e listáveis com
   `public_concluded_at < now() - make_interval(months => ?)`, gravando
   `publication_status = 'suppressed'`, `suppression_reason = 'outside_window'`,
   `suppressed_at = now()`, o template de concluída (`v1-template`) e
   `version + 1`.
2. `listSuppressedCompletedWithinWindow(window)` busca linhas
   `suppressed`/`outside_window` com
   `public_concluded_at >= now() - make_interval(months => ?)` e republica em
   lotes de até 50, com uma transação por lote e a janela passada para
   `publishRequestProjection`. A publicação relê `requests` e reavalia todas as
   regras, regenerando ou mantendo a supressão.

`listPublishedProjections` também filtra a janela, como proteção contra a
defasagem entre a mudança da configuração e a varredura.

### Backfill

`backfillConcludedAt` lê candidatos com `status_id = 16 AND concluded_at IS NULL`
e a Auditoria dos protocolos do lote em uma única consulta `whereIn`. Processa
em lotes de 100, com uma transação por lote e a janela lida uma vez. O update
usa a mesma condição, preserva `updated_at`/`updated_by` e republica a projeção
na mesma transação. O relatório tem `updated`, `withoutEvent` e `skipped`
(Status alterado entre a leitura e o update), fechando
`scanned = updated + withoutEvent + skipped`; as contagens de um lote só entram
no relatório depois do commit. O CLI (`npm run backfill:concluded-at`) aceita
`--dry-run` e imprime o relatório JSON. Concluídas sem evento de entrada vigente
não recebem data e não ganham projeção.

## Leitura e índice

- O repository da duplicidade lê apenas `request_public_projections` e
  `system_settings` na busca e no índice. A leitura de `requests` existe apenas
  em `findProjectionSource`, usada por `publishRequestProjection` para
  publicar/suprimir.
- O índice MiniSearch é derivado da projeção: no boot ele é reconstruído fora do
  caminho da requisição; o poll de 30 s executa a varredura da janela e lê
  mudanças desde o cursor da aplicação, com sobreposição de 5 min em
  `updated_at`.
- Linhas `suppressed`, com `is_publicly_listable = false` ou concluídas fora da
  janela são removidas do índice. O índice é sempre reconstruível a partir do
  banco.

## Testes

A suíte `db` restaura no `resetTestDb`: todas as categorias publicáveis, todos
os status elegíveis e, depois, os ids 10, 13, 17 e 19 inelegíveis. O 16 fica
elegível desde a #210. Os testes `db` sobem apenas `app.ts` e chamam
`rebuildDuplicateIndex()` explicitamente antes de consultar o endpoint.

## Fora do escopo

- Administração da flag/janela/allowlists e auditoria (issue #212).
- `GET /requests/:protocol/duplicates` (issue #211).
