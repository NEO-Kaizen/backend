# Alerta de duplicidade (RF16)

O Alerta de duplicidade informa ao Solicitante, ao concluir a aba de Demanda,
que existem Solicitações com características em comum. Ele **não vincula
registros nem altera Status**: a Marcação de duplicidade continua sendo o ato
formal do RF25.

A implementação cobre o corpus de Solicitações **abertas** (issue #209) e
**concluídas com texto tarjado dentro da janela** (issue #210), o índice lexical
e o `POST /requests/duplicates/check`. O Acompanhamento pertence à #211; a
administração da flag/janela/allowlists à #212; canário, calibração e carga à
#213.

## Corpus público

A busca lê **somente** `request_public_projections` e `system_settings`; ela
nunca consulta `requests`. A projeção é a fronteira de privacidade (RN04).

### Abertas

Uma Solicitação **aberta** entra no corpus quando:

- o Status é ativo (`statuses.is_active`), não terminal (`is_terminal`) e não
  restrito (`is_restricted`);
- a Categoria tem `categories.is_publicly_listable = true`;
- o Status tem `statuses.is_duplicate_corpus_eligible = true`;
- a Solicitação não declarou `handles_restricted_info = true`.

Não há janela de tempo para abertas: todas as elegíveis entram. A janela de 3
meses existe apenas para concluídas.

### Concluídas

Uma Solicitação **concluída** (Status 16) entra no corpus quando:

- `requests.concluded_at` não é nulo;
- `concluded_at` está dentro da janela configurável (padrão 3 meses, 1..36);
- a Categoria e o Status 16 estão nas allowlists;
- a Solicitação não declarou `handles_restricted_info = true` e o Status não é
  restrito.

O Status 16 é terminal, mas **não** é suprimido por `terminal_status`: ele tem
uma regra própria de janela. Os desfechos 10, 13, 17 e 19 continuam fora da
allowlist. Duplicada, nesta fatia, é o Status `19` (`Duplicada`) com
`is_duplicate_corpus_eligible = false`; o vínculo com a Solicitação principal do
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

### Texto tarjado de concluída

Dentro da janela, a concluída entra com:

- `title`: `requests.title`;
- `summary`: `requests.need_description` + `"\n\n"` + `requests.problem_opportunity`;
- `status`: `Concluída`;
- `period`: trimestre de `created_at` no fuso `America/Sao_Paulo`;
- `redaction_version`: `v1-regex`.

Antes de publicar, o título e o resumo passam pelo **gate de PII**: CPF, CNPJ,
e-mail, telefone, RG, CEP, placa antiga/Mercosul e sequências de 7+ dígitos. É um
gate, não mascaramento parcial: **qualquer match em qualquer um dos dois campos
derruba os dois** para o template:

- `title`: `Solicitação de <categoria> concluída`
- `summary`: `Solicitação concluída da categoria <categoria>, registrada no período <YYYY-Qn>.`

Nomes sem contexto podem passar; por isso a flag nasce desligada e o canário de
RN04 é obrigatório. Uma linha suprimida por **qualquer** motivo (inativa,
terminal não-16, restrição, Status restrito, `missing_concluded_at`,
`outside_window`, Categoria/Status inelegível) também guarda o template, nunca
texto livre. A republicação futura relê `requests` e regenera o snapshot.

A projeção guarda `public_concluded_at` (TIMESTAMPTZ) apenas para uso interno da
janela e da varredura; ele **não** entra no DTO.

### Janela de conclusão

`system_settings.duplicate_completed_window_months` define a janela em meses
(INTEGER, padrão 3, CHECK 1..36). A comparação usa o relógio do banco:
`concluded_at >= now() - make_interval(months => ?)`.

A expiração não depende só da publicação:

- o **poll de 30 s** executa a varredura antes de ler mudanças;
- o **rebuild** do índice executa a varredura antes de listar a projeção;
- `listPublishedProjections` ainda filtra concluídas fora da janela, cobrindo a
  defasagem entre a mudança da configuração e o próximo ciclo.

A varredura marca `publication_status = 'suppressed'`,
`suppression_reason = 'outside_window'`, `suppressed_at = now()`, substitui o
texto pelo template e incrementa `version`/`updated_at`. Aumentar a janela não
republica sozinho: isso é responsabilidade da #212, que deve considerar o Status
16 ligado e regenerar as concluídas suprimidas.

### Backfill de `concluded_at`

Solicitações concluídas antes da coluna existir têm `concluded_at` nulo. O
backfill lê a Auditoria (`request.status_change`, `request.override_status_admin`
e `request.triage`) em ordem de `occurred_at`/`audit_id` e reproduz a sequência:
entrada no 16 grava o `occurred_at`; saída limpa. Eventos de triagem usam
`exitStatus` do JSON; os eventos do Motor usam o nome do Status.

- `--dry-run` não escreve nada e relata o que faria;
- só atualiza `status_id = 16 AND concluded_at IS NULL`, sem tocar
  `updated_at`/`updated_by`;
- republica a projeção na mesma transação do update;
- é idempotente;
- concluídas sem evento de entrada vigente são apenas relatadas, sem data
  inventada e sem criação de projeção;
- `updated_at` e `last_external_update_at` **nunca** são fallback.

### Supressão

Toda Solicitação gera uma linha de projeção, publicada ou suprimida. O motivo é
determinístico e segue esta precedência:

1. `inactive_status` — Status inativo;
2. `terminal_status` — Status terminal que não é o 16;
3. `restricted_request` — `handles_restricted_info = true`;
4. `restricted_status` — Status restrito;
5. `missing_concluded_at` — Status 16 sem `concluded_at`;
6. `outside_window` — Status 16 com conclusão fora da janela;
7. `ineligible_category` — Categoria fora da allowlist;
8. `ineligible_status` — Status fora da allowlist.

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
- `statuses.is_duplicate_corpus_eligible` nasce `true`; os desfechos 10, 13, 17
  e 19 são desligados. O 16 foi **ligado** pela migration da issue #210; a #212
  deve preservar essa escolha ao editar a allowlist.

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
  `updated_at` para cobrir commits atrasados. Antes de ler, ele executa a
  varredura de expiração da janela. Falha de build/poll/varredura não derruba o
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
- O texto de concluída passa pelo gate de PII; qualquer suspeita cai para o
  template, sem mascaramento parcial.
- O canário de RN04 (issue #213) deve provar que termo raro, chave proibida e
  PII não aparecem no DTO, no índice ou no log.

## Fora do escopo desta fatia

- `GET /requests/:protocol/duplicates` (issue #211).
- `PATCH /portal-config/duplicates`, `/categories` e `/statuses` (issue #212),
  incluindo a republicação ao aumentar a janela.
- Marcação de duplicidade do RF25.
- Canário, calibração e carga (issue #213).
