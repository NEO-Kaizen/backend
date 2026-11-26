# Busca de solicitações

- Escopo: fila interna e exportação CSV.
- Issues: #215 (RF04, atividade S3-03) e #223 (contrato do front).

## Recorte por abertura

A data de referência é a abertura da Solicitação. Na fila e na exportação,
`createdFrom`/`createdTo` comparam `created_at` em **UTC**, conforme o contrato
RF04; o dashboard continua usando o dia comercial `America/Sao_Paulo` e não é
afetado por esse recorte.

- O limite inicial inclui o começo do dia UTC.
- O limite final inclui o fim do dia UTC e é aplicado como intervalo
  semiaberto (`< limite final + 1 dia`), para que nenhum registro no último
  minuto escape.
- O limite inicial não pode ser posterior ao limite final, mesmo que o front já
  corrija o intervalo antes de enviar.

A ausência de recorte preserva o comportamento anterior da listagem.

## Busca textual

`search` cobre protocolo, título da Solicitação, nome do processo, descrição,
problema, resultado esperado, notas internas e nome e e-mail do solicitante,
todos com comparação parcial e case-insensitive. Na fila, a correspondência em
notas internas continua restrita pela custódia de `internal_note:read`.

## Departamento do solicitante

O recorte por Departamento do Solicitante é por valor exato e case-insensitive,
com trim do valor recebido. Solicitações sem Departamento não correspondem. A
comparação não é hierárquica nem por similaridade.

O envelope da fila também devolve `departments`: departamentos distintos e
globais, deduplicados sem diferenciar maiúsculas e ordenados. A lista não depende
dos filtros nem da paginação.

Os mesmos recortes valem para a paginação, a contagem total e a exportação. A
visibilidade por responsável (issue #102) e a custódia de notas internas (issue
#204) continuam aplicadas depois dos filtros — nenhum recorte amplia o acesso do
Analista.

## Ordenação

A ordenação é aplicada depois dos filtros e antes da paginação, e vale tanto para
a fila paginada quanto para a exportação CSV. Os campos aceitos são `createdAt`,
`protocol`, `status` e `priority`; a direção é `asc` ou `desc`.

- `status` obedece a `statuses.order_number` (ordem configurada no portal), não à
  ordem alfabética do nome.
- Prioridade obedece à faixa configurada, não à ordem alfabética do rótulo.
- Ausência de Prioridade aparece por último em qualquer direção; nos demais
  campos, valores nulos também ficam no fim.
- `protocol` é comparado sem diferenciar maiúsculas.
- O desempate é por Protocolo em ordem ascendente, exceto quando o Protocolo é o
  próprio campo ordenado.

O cliente nunca envia SQL: a borda limita as escolhas e a persistência traduz
cada uma para a coluna correspondente.
