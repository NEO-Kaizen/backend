# Busca de solicitações

- Escopo: fila interna e exportação CSV.
- Issue: #215 (RF04, atividade S3-03).

## Recorte por abertura

A data de referência é a abertura da Solicitação. O dia comercial é o fuso
adotado pelo portal (`America/Sao_Paulo`), não o fuso do servidor.

- O limite inicial inclui o começo do dia comercial.
- O limite final inclui o fim do dia comercial e é aplicado como intervalo
  semiaberto (`< limite final + 1 dia`), para que nenhum registro no último
  minuto escape.
- O limite inicial não pode ser posterior ao limite final.

A ausência de recorte preserva o comportamento anterior da listagem.

## Departamento do solicitante

O recorte por Departamento do Solicitante é por valor exato e case-insensitive.
Solicitações sem Departamento não correspondem. A comparação não é hierárquica
nem por similaridade.

Os mesmos recortes valem para a paginação, a contagem total e a exportação. A
visibilidade por responsável (issue #102) e a custódia de notas internas (issue
#204) continuam aplicadas depois dos filtros — nenhum recorte amplia o acesso do
Analista.

## Ordenação

A ordenação vale somente para a fila paginada; a exportação não é ordenável pelo
cliente.

- Status obedece à ordem do ciclo de vida, não à ordem alfabética do nome.
- Prioridade obedece à gravidade da faixa, não à ordem alfabética do rótulo.
- Ausência de Prioridade ou de Responsável aparece por último em qualquer
  direção.
- O desempate é por Protocolo em ordem ascendente, exceto quando o Protocolo é o
  próprio campo ordenado.

O cliente nunca envia SQL: a borda limita as escolhas e a persistência traduz
cada uma para a coluna correspondente.
