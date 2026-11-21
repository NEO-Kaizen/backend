# Pendências por campo

O analista pede complementos ao solicitante em um **lote** (`batchId`). O lote
pode conter:

- **só observação** (`observation`);
- **só campos marcados** (`items[]`);
- **misto** (1 observação + N campos).

Cada item responde **um por vez**; a revisão do analista é **parcial e
repetível**. Não existe chat livre: o solicitante só responde a um item
`requested`.

## Estados

```
item:  requested ──PATCH :id──▶ responded ──review validate──▶ validated
                                        └─review reopen────▶ requested
lote:  requested ──nenhum item "requested" restante──▶ responded ──▶ validated
```

- `requested` — aguardando o solicitante.
- `responded` — respondido; aguarda revisão.
- `validated` — aceito pelo analista.
- `reopen` sobrescreve `comment`, limpa `correctedValue`/`responseText`, as
  datas de resposta/validação e **reinicia `createdAt`** (o item volta para o
  fim da ordem cronológica). Anexos da resposta são preservados.
- Transição impossível → `409`.

## Criação

- Autorização: **Administrador** ou o **Analista responsável pela triagem**
  (`requests.professional_id`). O designado do mapeamento **não** pode
  criar/revisar. Gestor é somente leitura.
- Pelo menos um de `observation` (1..2000 após trim) ou `items` (≥ 1).
- `requestAttachment` é flag do **lote**, nunca por campo.
- `fieldKey` precisa estar no catálogo de campos marcáveis
  (`src/shared/catalog/fieldCatalog.ts`, 33 chaves) e respeitar o tipo/enum da
  chave. `requester.fullName` e `requester.corporateEmail` só podem ser pedidos
  em solicitação pública (sem `requester_user_id`).
- Na mesma transação, a solicitação passa para **Pendente de informações**.
- Solicitação terminal ou lote já aberto → `409`. Hoje o terminal é
  detectado pelos nomes `Concluído`/`Cancelado`, não pela flag `is_terminal`;
  um Status terminal customizado ainda aceitaria pendência (dívida).

## Resposta do solicitante

- Dual-auth: cookie **ou** identidade pública verificada
  (`X-Requester-Identity`). Com sessão de `Solicitante`, nome **e** e-mail da
  conta precisam coincidir com a solicitação; perfis internos passam sem
  checagem de custódia nesta rota.
- `field_edit` recebe `correctedValue`; `observation` recebe `response`.
  Enviar o campo do outro tipo ou os dois → `400`.
- O valor de `correctedValue` **não é validado contra o tipo do campo nesta
  etapa**; a validação/conversão (número, boolean, data, vocabulário) acontece
  na revisão.
- Item só aceita resposta em `requested`; caso contrário `409`.
- Quando **não resta nenhum item `requested`** (itens `responded`/`validated`) e
  a exigência de anexo está satisfeita, a solicitação volta para
  **Em triagem** (se ainda não estiver). A validação total **não** altera o
  Status.

## Exigência de anexo

`requestAttachment: true` no lote só é satisfeito quando **há pelo menos um
anexo em qualquer item do lote**. O upload isolado não muda o status nem o
estado do item; o retorno para `Em triagem` só ocorre na resposta que fecha o
último item `requested`.

## Revisão

- Autorização: Administrador ou o Analista responsável pela triagem.
- `validate` aceita item `responded`; `reopen` aceita `responded` e exige
  `comment`.
- `validate` em `field_edit` **aplica o `correctedValue` na solicitação**, com
  conversão/validação contra o tipo e o vocabulário do campo. Valor inválido
  falha na revisão (não na resposta).
- `review` pode reenviar `requestAttachment` para (re)definir a flag do lote na
  próxima rodada.
- Se houver pelo menos um `reopen`, a solicitação volta para **Pendente de
  informações**; se tudo for validado, o Status não muda.
- Itens já no estado desejado são ignorados (idempotência por item).

## Anexos

- Upload separado por item (`multipart/form-data`, campo `file`).
- PDF, DOCX, XLSX, PNG ou JPG; até 10 MB por arquivo.
- O lote pode exigir anexo (`requestAttachment: true`), mas a exigência não é
  por campo.

## Leitura interna (`GET /requests/:protocol/internal`)

Estende o detalhe com:

- `pendingSummary` — `{ total, requested, responded, validated }`;
- `unread` — `{ count, hasUnread, lastUnreadAt }`, **somente na rota interna**.
  Conta itens `responded` (respostas do solicitante a aprovar) e usa
  `lastUnreadAt = max(respondedAt)`. O solicitante **não** tem contador análogo
  no `/tracking`;
- `correctionAlert` — `{ count, batchId }` quando **todos os itens do lote**
  estão `responded` (`requested = 0`) e, se o lote exigir anexo, há ≥ 1 anexo no
  lote. É o badge de “Resposta a aprovar”.

> **Nota histórica:** o contrato antigo `requests-internal-query-contract.md`
> previa `correctionAlert` como `{ count, message }`; o código sempre devolveu
> `{ count, batchId }`.

## Listagem do solicitante (`GET /requests/:protocol/pending-items`)

Devolve **todas as pendências da solicitação**, em ordem cronológica de
`createdAt` — não apenas o lote aberto. O envelope traz `batchId` (lote aberto
ou o mais recente), `requestAttachment` (flag desse lote) e `items` (todos os
itens de todos os lotes). A lista é curta e sem paginação.

## Fora de escopo

- `OverdueView` (`requested` com `deadline < hoje`) é apresentação; hoje os
  writes não preenchem `deadline` (sempre `null`).
- Edição/exclusão de item validado.
- Anexos no modo público: `downloadUrl` fica nulo e `canDownload` falso.
