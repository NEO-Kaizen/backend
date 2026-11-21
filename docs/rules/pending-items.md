# Pendências por campo

O analista pede complementos ao solicitante em um **lote**. O lote pode conter
só observação, só campos marcados ou misto. Cada item responde **um por vez**; a
revisão do analista é **parcial e repetível**. Não existe chat livre: o
solicitante só responde a um item pendente.

## Estados

```
item:  requested ──resposta──▶ responded ──validate──▶ validated
                                      └──reopen────▶ requested
lote:  nenhum item "requested" restante ──▶ responded ──▶ validated
```

- `requested` — aguardando o solicitante.
- `responded` — respondido; aguarda revisão.
- `validated` — aceito pelo analista.
- `reopen` sobrescreve o comentário, limpa resposta/datas e **reinicia a data de
  criação** (o item volta para o fim da ordem cronológica). Anexos são
  preservados.
- Transição impossível é recusada.

## Criação

- Autorização: Administrador ou o Analista responsável pela **triagem**. O
  designado do mapeamento não cria/revisa; Gestor é somente leitura.
- Pelo menos uma observação ou um campo marcado é obrigatório.
- A exigência de anexo é do **lote**, nunca de um campo.
- O campo precisa estar no catálogo de campos marcáveis
  (`src/shared/catalog/fieldCatalog.ts`) e respeitar o tipo/enum da chave.
  Identidade do solicitante só pode ser pedida em solicitação pública.
- Na mesma transação, a solicitação passa para `Pendente de informações`.
- Solicitação terminal ou lote já aberto é recusado. Hoje o terminal é detectado
  pelos nomes `Concluído`/`Cancelado`, não pela flag; um Status terminal
  customizado escaparia da regra.

## Resposta do solicitante

- Com sessão de `Solicitante`, nome **e** e-mail da conta precisam coincidir com
  a solicitação; perfis internos passam sem checagem de custódia nesta rota.
- `field_edit` recebe o valor corrigido; `observation` recebe a resposta
  discursiva. Enviar o tipo errado ou os dois é inválido.
- O valor corrigido **não é validado contra o tipo do campo nesta etapa**; a
  validação/conversão acontece na revisão.
- Item só aceita resposta enquanto está pendente.
- Quando **não resta nenhum item pendente** e a exigência de anexo está
  satisfeita, a solicitação volta para `Em triagem` (se ainda não estiver). A
  validação total não altera o Status.

## Exigência de anexo

A flag do lote só é satisfeita quando há **pelo menos um anexo em qualquer item
do lote**. O upload isolado não muda o estado do item nem o Status; o retorno
para `Em triagem` só ocorre na resposta que fecha o último item pendente.

## Revisão

- Autorização: Administrador ou o Analista responsável pela triagem.
- `validate` aceita item respondido; `reopen` exige comentário.
- `validate` de campo **aplica o valor corrigido na solicitação**, com
  conversão/validação contra o tipo e o vocabulário do campo. Valor inválido
  falha na revisão, não na resposta.
- A revisão pode redefinir a exigência de anexo para a próxima rodada.
- Se houver pelo menos um `reopen`, a solicitação volta para `Pendente de
informações`; se tudo for validado, o Status não muda.
- Itens já no estado desejado são ignorados (idempotência por item).

## Leitura interna

- `pendingSummary` conta o total e por estado.
- `unread` existe **somente na rota interna** e conta respostas do solicitante a
  aprovar; o solicitante não tem contador análogo no acompanhamento.
- `correctionAlert` existe quando **todos os itens do lote** estão respondidos e,
  se o lote exigir anexo, há pelo menos um anexo. É o badge de “Resposta a
  aprovar”.

## Listagem do solicitante

Devolve **todas as pendências da solicitação**, em ordem cronológica de criação —
não apenas o lote aberto. A lista é curta e não é paginada.

## Fora de escopo

- `OverdueView` (`requested` com prazo vencido) é apresentação; os writes atuais
  não preenchem prazo.
- Edição/exclusão de item validado.
- Anexos no modo público: download permanece indisponível.
