# Detecção de duplicidade lexical in-process

**Status:** aceito — 24/11/2026

O RF16 detecta solicitações que descrevem a mesma necessidade. A especificação
original propunha um microserviço Python com Sentence-BERT e `pgvector`; o
protótipo local e a pesquisa técnica mostraram que a busca lexical tem mais
qualidade e menos operação para este corpus, e o banco de produção pode mudar.
Decidimos usar **MiniSearch in-process sobre uma projeção pública DB-agnóstica**,
atrás da interface `SimilarityIndex`, sem serviço Python, worker ou `pgvector`.

## Contexto

- O corpus é institucional, com título, descrição, problema e resultado esperado;
  o protótipo mediu P@5 0,915 para o lexical contra 0,685 do híbrido com
  reranker, com p95 de 5 ms contra 2,16 s.
- A imagem `postgres:18-alpine` atual não traz `pgvector`; o repositório não tem
  runtime Python nem worker.
- O banco de produção pode mudar; a busca não deve depender de `tsvector`,
  `pg_trgm` ou `pgvector`.
- O RF16 virou uma consulta única após a aba de Demanda, não busca a cada tecla;
  isso torna viável um índice in-process.

## Decisão

- O índice é um `SimilarityIndex` com `search`, `upsert`, `remove` e `rebuild`;
  a implementação inicial é `MiniSearchIndex`.
- O índice é derivado de `request_public_projections` e reconstruível; a fonte de
  verdade continua no banco.
- A consulta tem cap de 8–12 termos, top 20 para ranquear e top 5 no DTO; fuzzy
  fica desligado na v1.
- A decisão de exibir o alerta usa piso calibrado + margem relativa, não um
  limiar absoluto de 0,80.
- Se houver múltiplas réplicas ou exigência de frescor imediato, o adaptador
  troca para Meilisearch sem mudar o contrato.

## Alternativas consideradas

- **Sentence-BERT + FastAPI + `pgvector`**, como na especificação: maior custo
  operacional e de memória, dependência de PostgreSQL, e a evidência local não
  mostrou ganho de qualidade.
- **Meilisearch/Typesense**: DB-agnósticos e com typo/frescor, mas adicionam um
  serviço e sincronização; ficam como escape.
- **FTS nativo do PostgreSQL**: boa qualidade, mas acopla a busca ao banco, que
  pode mudar.
- **Orama**: stemmer PT e typo prontos, mas ranking não validado no corpus do
  MAAT.

## Consequências

- ~0,5–0,8 GB de memória por instância com 50 mil documentos e consistência
  eventual de 30–60 s; a interface permite trocar o adaptador.
- O rebuild no boot (~11 s em 50 mil documentos sintéticos) não bloqueia o
  servidor; o endpoint degrada para vazio até o índice estar pronto.
- A calibração do piso é obrigatória; sem ela, a faixa é provisória e a flag
  permanece desligada.
- A divergência em relação à especificação do RF16 é deliberada e precisa ser
  registrada na issue de produto.
