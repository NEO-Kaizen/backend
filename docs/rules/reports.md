# Relatórios, métricas e priorização

## Métricas da fila (`GET /queue/metrics`)

- `totalRequests` — todas as solicitações visíveis ao ator.
- `unassignedRequests` — sem `professional_id` (responsável de triagem).
- `inProgressRequests` — Status em `Em triagem`, `Em mapeamento`,
  `Em análise de viabilidade`, `Em desenvolvimento` ou `Em homologação`.
  **Hoje a métrica compara por nome** (inclui Status não-core); a dívida está
  registrada no código e deve migrar para flags.
- `overdueRequests` — `desired_deadline` anterior a hoje e Status **não
  terminal**. Vencer hoje ainda não é atraso.

**Escopo:** Analista vê somente as solicitações em que é responsável (triagem
**ou** mapeamento); Gestor e Administrador veem tudo.

## Dashboard (`GET /reports/dashboard`)

- `open` — Status com `is_terminal = false`.
- `closed` — Status com `is_terminal = true`.
- `overdue` — aberta e `desired_deadline` anterior ao dia atual.
- `unassigned` — aberta e sem `professional_id`.
- Filtros: `from`/`to` (data de abertura, `to` inclusivo), `situation`,
  `statusId`, `categoryId`, `priorityId` (id ou `unassigned`).
- Todos os agregados respeitam a mesma combinação de filtros.
- `byStatus[].closesRequest` é o nome legado de `is_terminal`; o valor é o mesmo.
- Fuso de negócio: `America/Sao_Paulo`.
- Perfis: Gestor e Administrador.

## Métricas de usuários

Ver [`users-and-profiles.md`](users-and-profiles.md): `total`, `active`,
`pending`, `admins`.

## Exportação CSV (`GET /reports/requests.csv`)

- Perfis: Gestor e Administrador.
- Exporta **todas** as solicitações que casam com os filtros da fila; `page` e
  `pageSize` não fazem parte do contrato.
- Filtros: `search`, `status`, `priority`, `assigneeId`, `unassigned`.
- `unassigned=true` não pode ser combinado com `assigneeId` diferente de
  `unassigned`.
- Formato: `text/csv; charset=utf-8`, UTF-8 com BOM, separador `;`, CRLF,
  campos com aspas quando necessário, `Content-Disposition: attachment`,
  `Cache-Control: no-store`, `X-Content-Type-Options: nosniff`.
- `status` é o nome exato do Status; `priority=nenhum` filtra prioridade nula;
  `assigneeId` aceita UUID, `user_id` numérico ou `unassigned`.
- Colunas: Protocolo; Data de Abertura; Área; Processo; Categoria; Status;
  Prioridade; Responsável; Data de Mapeamento; Data da Última Atualização;
  Resultado da Triagem; Data de Conclusão.
- Valores começando com `=`, `+`, `-` ou `@` recebem `'` para neutralizar
  fórmulas de planilha.
- **Resultado da Triagem** lê o legado `requests.internal_notes.__triage.result`.
  Triagens v2 (tabela `triages`) não alimentam esse campo, então a coluna fica
  vazia para solicitações triadas após a migration v2. ⚠ correção pendente.
- **Data de Conclusão** usa a última transição auditada para o Status terminal
  atual, incluindo `request.status_change` e `request.override_status_admin`.
- Datas no fuso `America/Sao_Paulo`; nome do arquivo
  `solicitacoes-AAAA-MM-DD.csv`.

## Priorização (RN-007/RN-008)

- Notas por critério: inteiro **1..5**.
- Todos os critérios ativos precisam ser avaliados.
- O número de critérios ativos precisa ser exatamente **10**; qualquer outro
  valor falha com `500` (invariante do motor de priorização).
- Peso vem de `criteria.weight`, nunca do payload.
- `score = (Σ nota × peso / Σ pesos) × 10`, com uma casa decimal; escala
  10..50 (o campo é `number`, não inteiro).
- A classificação (`Baixa`, `Média`, `Alta`, `Crítica`) vem das faixas da
  tabela `priorities`, não de limites fixos no código.
- A avaliação substitui o estado atual e grava `prioritization.evaluate` com o
  snapshot anterior/novo.
- Perfis: Administrador ou Analista responsável pela solicitação.

## Observações

- Nenhum relatório usa dados de triagem/notas internas além do “Resultado da
  Triagem” já persistido para o CSV.
- Números são inteiros; percentuais e médias não fazem parte destes endpoints.
