# Configuração do portal

A leitura é pública. A edição é por seção, restrita a Administrador e atômica —
cada seção é salva ou descartada por inteiro.

## Acesso

O modo `PUBLIC`/`AUTHENTICATED` vale imediatamente para as rotas do fluxo do
solicitante, sem cache ou restart.

## Aparência e identidade

- A Aparência é sempre o objeto completo (`light` + `dark`), sem merge parcial.
- Valores nulos na Aparência caem para o default da leitura.
- A identidade da plataforma é nome + máscara de protocolo.

## Assets

- Binário vence o JSON para a mesma chave; chaves ausentes mantêm o valor atual.
- A flag de cor do logo é apresentação, não URL.
- URLs aceitam caminho relativo ou `http(s)`; esquemas executáveis são
  rejeitados.
- O upload pode conter apenas binários, sem a parte JSON.

## Categorias

- Nomes são únicos ignorando maiúsculas/minúsculas.
- Ao menos uma categoria precisa ficar ativa.
- `id` é estável; a ordem do array é a ordem de exibição.
- Categoria inativa permanece registrada e não entra em novos fluxos; uma
  Categoria omitida do PATCH é desligada da allowlist do corpus.
- `isPubliclyListable` é obrigatório no PATCH (não há default): a omissão é
  rejeitada para que uma allowlist não mude em silêncio. Categoria nova nasce
  desligada no banco; no PATCH o valor atual deve ser informado explicitamente.

## Status

- Status core (`1, 3, 4, 6, 7, 16, 17`) não podem faltar, ser removidos,
  renomeados, rebaixados, desativados nem ter flags/modos alterados. A
  elegibilidade para o corpus do 16 (ligado) e do 17 (desligado) também é fixa;
  os demais Status, inclusive os desfechos 10 e 13, têm allowlist administrável.
- `isDuplicateCorpusEligible` é obrigatório no PATCH (não há default).
- Status restrito exige ambos os modos como `none`.
- Ao menos um Status precisa ficar ativo.
- A leitura inclui Status inativos; eles permanecem registrados e não entram em
  novos fluxos.
- A ordem do array é a ordem de exibição.

As regras de transição estão em
[`requests-lifecycle.md`](requests-lifecycle.md).

## Detecção de duplicidade

`PATCH /portal-config/duplicates` altera, em uma transação auditada, `enabled` e
`completedWindowMonths` (inteiro de 1 a 36). A janela é aplicada pelo par de
varreduras descrito em [`duplicate-detection.md`](duplicate-detection.md). Com a
flag desligada, `POST /requests/duplicates/check` responde vazio e o índice não
é construído; o `GET /requests/:protocol/duplicates` pertence à issue #211.

As allowlists de Categorias (`isPubliclyListable`) e Status
(`isDuplicateCorpusEligible`) são editadas nos PATCHes das seções respectivas.
Como `request_public_projections.is_publicly_listable` é um snapshot, toda
alternância reavalia — na mesma transação do PATCH e em lotes de até 50 — as
projeções das Solicitações afetadas: desligar suprime e religar republica o que
for elegível, com a precedência de supressão e o gate de PII já usados nos
eventos da Solicitação. A reavaliação também ocorre quando mudam o nome da
Categoria ou `isActive`/`isTerminal`/`isRestricted` de um Status não-core. O
Status 16 permanece elegível e o 17 desligado; 10 e 13 nascem desligados, mas
são administráveis.

## Pesos de priorização

O objeto é completo: todos os critérios ativos precisam de peso. O peso é
inteiro e alimenta diretamente o cálculo de priorização.

## Persistência

Ver
[`docs/database/system-settings-persistence.md`](../database/system-settings-persistence.md).
