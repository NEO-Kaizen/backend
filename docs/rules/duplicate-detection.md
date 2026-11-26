# Alerta de duplicidade (RF16)

O Alerta de duplicidade informa ao Solicitante, ao concluir a aba de Demanda,
que existem Solicitações com características em comum. Ele **não vincula
registros nem altera Status**: a Marcação de duplicidade continua sendo o ato
formal do RF25.

A implementação desta fatia (issue #209) cobre o corpus de Solicitações
**abertas**, o índice lexical e o `POST /requests/duplicates/check`. Concluídas
com texto tarjado e janela de 3 meses pertencem à issue #210; o Acompanhamento à
#211; a administração da flag/janela/allowlists à #212; canário, calibração e
carga à #213.

## Corpus público

A busca lê **somente** `request_public_projections` e `system_settings`; ela
nunca consulta `requests`. A projeção é a fronteira de privacidade (RN04).

Uma Solicitação **aberta** entra no corpus quando:

- o Status é ativo (`statuses.is_active`), não terminal (`is_terminal`) e não
  restrito (`is_restricted`);
- a Categoria tem `categories.is_publicly_listable = true`;
- o Status tem `statuses.is_duplicate_corpus_eligible = true`;
- a Solicitação não declarou `handles_restricted_info = true`.

Não há janela de tempo para abertas: todas as elegíveis entram. A janela de 3
meses existe apenas para concluídas (issue #210).

Duplicada, nesta fatia, é o Status `19` (`Duplicada`) com
`is_duplicate_corpus_eligible = false`. O vínculo com a Solicitação principal do
RF25 ainda não existe.

> **Nota de catálogo:** a migration canônica atual mantém os Status 1–17; o id
> 19 ainda não existe no banco desta fatia. A allowlist já o desliga quando ele
> existir, e o teste `db` simula a linha para provar a regra. Criar o Status
> `Duplicada` no catálogo é trabalho das fatias de Marcação de duplicidade
> (RF25) e de administração (#212).

### Template de aberta

Aberta entra **sem texto livre** — título, descrição, problema, resultado e
justificativa nunca são copiados. O snapshot é materializado com:

- `title`: `Solicitação de <categoria> em andamento`
- `summary`: `Solicitação em andamento da categoria <categoria>, registrada no período <YYYY-Qn>.`
- `status`: `Em andamento`
- `period`: trimestre de `created_at` no fuso `America/Sao_Paulo`
- `redaction_version`: `v1-open-template`

O trimestre é calculado pela data local de São Paulo, não por UTC.

### Supressão

Toda Solicitação gera uma linha de projeção, publicada ou suprimida. O motivo é
determinístico e segue esta precedência:

1. `inactive_status` — Status inativo;
2. `terminal_status` — Status terminal;
3. `restricted_request` — `handles_restricted_info = true`;
4. `restricted_status` — Status restrito;
5. `ineligible_category` — Categoria fora da allowlist;
6. `ineligible_status` — Status fora da allowlist.

A linha suprimida não entra no índice. O `public_id` é um UUID aleatório gerado
na aplicação, independente do Protocolo; ele permanece o mesmo entre
publicação, supressão e republicação.

A publicação roda na mesma transação da criação, edição, transição de Status,
desfecho da Triagem, pendências/RN-010 e revisão de campos. A atualização do
índice é best-effort: o poll reconcilia a defasagem de 30–60 s.

## Flag e allowlists

- `system_settings.duplicate_detection_enabled` nasce `false`. O seed de
  desenvolvimento (`seeds/requester_request/014_duplicate_detection.js`) liga a
  flag para demonstração. Produção permanece desligada até o canário de RN04 e
  a calibração (issue #213).
- `categories.is_publicly_listable` nasce `false` para cadastros novos; a
  migration liga as categorias existentes.
- `statuses.is_duplicate_corpus_eligible` nasce `true`; os desfechos 10, 13, 16,
  17 e 19 são desligados.

Alterar allowlists, janela e flag pelo Administrador é escopo da issue #212.

## Índice e defasagem

O motor inicial é o **MiniSearch in-process**, atrás da interface
`SimilarityIndex` (`search`, `upsert`, `remove`, `rebuild`). A decisão está no
[ADR 0004](../adr/0004-deteccao-de-duplicidade-lexical-in-process.md); a
projeção está no
[ADR 0005](../adr/0005-projecao-publica-para-deteccao-de-duplicidade.md).

- Campos indexados: título (boost 3), resumo (1,2), Categoria (0,15) e período
  (0,15). O Status é apenas armazenado para o DTO.
- Fuzzy e prefix ficam desligados na v1; a combinação é `OR`.
- A consulta usa título, Categoria, processo, descrição, problema, resultado
  esperado e justificativa; stopwords saem, plurais são reduzidos, sinônimos
  são canonicalizados, os termos são deduplicados por stem e limitados a 12,
  priorizando título/Categoria/processo.
- O índice é reconstruído a partir da projeção no boot, **fora do caminho da
  requisição**. Enquanto não estiver pronto, a busca degrada para vazio.
- Um poll de 30 s lê somente a projeção, com sobreposição de 5 min em
  `updated_at` para cobrir commits atrasados. Falha de build/poll não derruba o
  servidor e não loga texto de consulta.
- Flag desligada limpa o índice e não o constrói.

## Regra de confiança

A similaridade bruta do motor é normalizada para `score / (score + 1)` e a faixa
sai do topo do ranking:

```text
alta    = topo >= piso && topo >= margem * segundo
média   = topo >= piso
nenhuma = resto
```

Com um único candidato, a margem é satisfeita (segundo = 0) e o piso decide. A
configuração provisória desta fatia é `piso = 0,34`, `margem = 1,15`, versão
`provisional-v1`; a calibração com conjunto rotulado é pré-requisito para ligar
a flag (issue #213). Não existe limiar absoluto universal de 0,80.

- **Alta:** "Possível duplicidade", até **3** itens.
- **Média:** "Características em comum", até **5** itens.
- **Nenhuma:** sem itens.

## Contrato

`POST /requests/duplicates/check`:

- é público no modo `PUBLIC` e exige sessão no modo `AUTHENTICATED`
  (`requireAccessMode`);
- recebe `{ demand: DemandBlock }` estrito; chave desconhecida ou campo
  ausente responde `422` com `fields`;
- responde `200 { confidence, items }` com `Cache-Control: no-store`;
- item tem exatamente `publicId`, `title`, `summary`, `category`, `status` e
  `period`;
- rate limit em memória: 30 requisições/10 s **e** 120/min por IP, com `429`
  genérico;
- flag desligada, índice indisponível ou falha de busca degradam para `200` com
  `confidence: "none"` e `items: []`.

O texto da consulta não é ecoado, auditado nem logado. O endpoint nunca devolve
Protocolo, score, total, contagem, Notas internas, Triagem, Prioridade,
Responsável, Anexos ou PII de terceiros.

## Privacidade

- A busca só lê a projeção pública; a base interna fica fora do caminho.
- O `public_id` não é derivado do Protocolo.
- O template de aberta não copia texto livre.
- O canário de RN04 (issue #213) deve provar que termo raro, chave proibida e
  PII não aparecem no DTO, no índice ou no log.

## Fora do escopo desta fatia

- `requests.concluded_at`, texto tarjado, gate de PII e janela de concluídas
  (issue #210).
- `GET /requests/:protocol/duplicates` (issue #211).
- `PATCH /portal-config/duplicates`, `/categories` e `/statuses` (issue #212).
- Marcação de duplicidade do RF25.
- Backfill de Solicitações antigas (issues #212/#213).
