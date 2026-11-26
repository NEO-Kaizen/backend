# Busca de solicitações

- Escopo: fila interna (`GET /queue`) e exportação CSV (`GET /reports/requests.csv`).
- Issue: #215 (RF04, atividade S3-03).

## Filtros compartilhados

Todos os filtros são opcionais e combinados com `AND`. A ausência de filtros preserva o comportamento anterior da listagem.

| Parâmetro    | Regra                                                                                                         |
| ------------ | ------------------------------------------------------------------------------------------------------------- |
| `dateFrom`   | `AAAA-MM-DD`. Inclui solicitações abertas a partir do início desse dia no fuso comercial `America/Sao_Paulo`. |
| `dateTo`     | `AAAA-MM-DD`. Inclui solicitações abertas até o fim desse dia no mesmo fuso.                                  |
| `department` | Departamento do solicitante em `requesters.department`. Comparação exata e case-insensitive; `NULL` não casa. |

O campo de referência da data é `requests.created_at` (abertura). `dateTo` é implementado como `< dateTo + 1 dia`, então não há perda de registros no limite do dia. `dateFrom` não pode ser posterior a `dateTo`.

Datas e departamento usam os mesmos filtros na paginação e na contagem: `total` e `data` refletem exatamente o mesmo recorte. A visibilidade por responsável (issue #102) e a custódia de notas internas (issue #204) continuam aplicadas depois dos filtros — nenhum filtro amplia o acesso do Analista.

## Ordenação

`sortBy` e `sortOrder` valem somente para `GET /queue`; a exportação CSV não aceita ordenação.

- `sortBy`: `createdAt` (padrão), `protocol`, `requesterName`, `status`, `priority` ou `assignee`.
- `sortOrder`: `asc` ou `desc` (padrão `desc`).
- Desempate: `protocol` em `asc` para manter a paginação determinística quando os valores ordenados iguais.

O valor do cliente nunca é interpolado em SQL: o schema Zod limita `sortBy` ao allowlist acima e o repositório traduz o valor para a coluna correspondente. Parâmetros inválidos de data, departamento ou ordenação respondem `400` com mensagem de validação em português.

Nenhuma mudança de schema foi necessária; já existe índice em `requests.created_at`.
