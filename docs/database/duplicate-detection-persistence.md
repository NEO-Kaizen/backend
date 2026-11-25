# Persistência da detecção de duplicidade (RF16)

Documenta a projeção pública e as colunas de configuração da detecção de
duplicidade (issue #209). As regras de negócio estão em
[`docs/rules/duplicate-detection.md`](../rules/duplicate-detection.md); as
decisões de arquitetura nos ADRs
[0004](../adr/0004-deteccao-de-duplicidade-lexical-in-process.md) e
[0005](../adr/0005-projecao-publica-para-deteccao-de-duplicidade.md).

## Issues relacionadas

- Issue #208 — especificação pai do RF16.
- Issue #209 — projeção de abertas, allowlists, flag, índice e `POST`.
- Issues #210–#213 — concluídas, Acompanhamento, administração e ativação.

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
| `public_status`        | VARCHAR(100)                      | Sim         | NOT NULL                                   | `Em andamento` nesta fatia                       |
| `public_period`        | VARCHAR(7)                        | Sim         | NOT NULL                                   | Trimestre `YYYY-Qn` em America/Sao_Paulo         |
| `publication_status`   | ENUM `request_publication_status` | Sim         | `published`/`suppressed`                   | Publicada ou suprimida                           |
| `is_publicly_listable` | BOOLEAN                           | Sim         | NOT NULL                                   | Snapshot da allowlist Categoria + Status         |
| `redaction_version`    | VARCHAR(30)                       | Sim         | NOT NULL                                   | Versão da política de texto                      |
| `version`              | INTEGER                           | Sim         | DEFAULT 1; incrementa a cada upsert        | Versão da linha                                  |
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
- `public_period` usa o formato `YYYY-Qn`; o trimestre é calculado pelo fuso
  `America/Sao_Paulo` no momento da publicação.

## Colunas de configuração

### `system_settings.duplicate_detection_enabled`

BOOLEAN `NOT NULL DEFAULT FALSE`. A flag nasce desligada; o seed de
desenvolvimento a liga. Flag desligada limpa o índice e faz a busca responder
vazio. A edição administrativa é escopo da issue #212.

### `categories.is_publicly_listable`

BOOLEAN `NOT NULL DEFAULT FALSE`. Categorias novas nascem desligadas; a
migration liga as categorias existentes. Ver
[`requests-persistence.md`](requests-persistence.md#tabela-categories).

### `statuses.is_duplicate_corpus_eligible`

BOOLEAN `NOT NULL DEFAULT TRUE`. A migration desliga os ids 10, 13, 16, 17 e 19
(quando existirem). O catálogo canônico atual vai até o id 17; o id 19
(`Duplicada`) será criado pela Marcação de duplicidade (RF25)/administração
(#212), e a allowlist já o cobre. Ver
[`requests-persistence.md`](requests-persistence.md#tabela-statuses).

## Ciclo de publicação

1. A criação ou alteração da Solicitação roda na transação existente.
2. `publishRequestProjection(trx, requestId)` lê Solicitação + Categoria +
   Status, monta o template e faz upsert por `request_id`, preservando
   `public_id`.
3. Publicada: `published_at` é mantido (ou preenchido na primeira vez),
   `suppressed_at` e `suppression_reason` ficam nulos.
4. Suprimida: `suppressed_at` é mantido (ou preenchido na transição),
   `published_at` é histórico e `suppression_reason` recebe o motivo.
5. `version` incrementa a cada escrita.

Os hooks ficam em criação, transição de Status (Motor e RN-010), conclusão de
mapeamento, triagem, pendências/revisão de campos e atualização dos blocos
internos.

## Leitura e índice

- O repository da duplicidade lê apenas `request_public_projections` e
  `system_settings`.
- O índice MiniSearch é derivado da projeção: no boot ele é reconstruído fora do
  caminho da requisição; o poll de 30 s lê mudanças desde o cursor com
  sobreposição de 5 min em `updated_at`.
- Linhas `suppressed` ou com `is_publicly_listable = false` são removidas do
  índice. O índice é sempre reconstruível a partir do banco.

## Testes

A suíte `db` restaura no `resetTestDb`: todas as categorias publicáveis, todos
os status elegíveis e, depois, os ids 10, 13, 16, 17 e 19 inelegíveis. Os testes
`db` sobem apenas `app.ts` e chamam `rebuildDuplicateIndex()` explicitamente
antes de consultar o endpoint.

## Fora do escopo

- `requests.concluded_at`, texto tarjado e janela de concluídas (issue #210).
- Administração da flag/janela/allowlists e auditoria (issue #212).
- Backfill de Solicitações antigas (issues #212/#213).
