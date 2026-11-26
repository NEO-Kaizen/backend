# Tempo por Status

A duração por Status é reconstruída cronologicamente a partir das transições
auditadas da solicitação. O cálculo mede tempo corrido; não aplica políticas de
SLA.

## Duração e classificação

- Um intervalo começa na abertura da solicitação ou na transição que o colocou
  no Status. Para Status não terminal, termina na próxima transição; o Status
  atual não terminal continua aberto até o instante do cálculo.
- O tempo em Status pausado não conta como ativo. A classificação de pausa usa
  o `status_id` registrado na transição, não o nome atual do Status.
- Todo intervalo em Status terminal tem duração ativa e pausada igual a zero,
  inclusive quando a solicitação é reaberta posteriormente. Seu instante de
  saída é o instante de entrada (`exitedAt = enteredAt`), como no Status
  terminal atual.
- Como consequência, a timeline não representa o horário real de reabertura
  como saída do intervalo terminal; a duração entre a conclusão e a reabertura
  não integra os totais.

## Integridade da trilha

- O Status inicial é o valor anterior à transição auditada mais antiga; sem
  transições, é `Solicitação enviada`.
- A reconstrução falha se a trilha for inválida ou não terminar no Status atual
  persistido. Não se cria um intervalo sintético para corrigir divergências.

O formato da resposta, as rotas e os erros estão definidos exclusivamente na
[OpenAPI](../openapi.json), cuja fonte é `src/docs/`.
