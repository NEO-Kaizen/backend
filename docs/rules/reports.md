# Relatórios, métricas e priorização

## Métricas da fila

- Total de solicitações visíveis ao ator.
- Sem responsável de triagem.
- Em andamento: hoje a métrica considera `Em triagem`, `Em mapeamento`,
  `Em análise de viabilidade`, `Em desenvolvimento` e `Em homologação` **por
  nome** (inclui Status não-core; dívida registrada no código).
- Atrasadas: prazo desejado anterior a hoje e Status não terminal. Vencer hoje
  ainda não é atraso.

O Analista vê somente as solicitações em que é responsável (triagem ou
mapeamento); Gestor e Administrador veem tudo.

## Dashboard

- `open` — Status não terminal.
- `closed` — Status terminal.
- `overdue` — aberta com prazo desejado vencido.
- `unassigned` — aberta sem responsável de triagem.
- Todos os agregados respeitam a mesma combinação de filtros; o intervalo de
  datas usa o fuso `America/Sao_Paulo` e a data final é inclusiva.

## Métricas de usuários

Ver [`users-and-profiles.md`](users-and-profiles.md).

## Exportação CSV

- Exporta **todas** as solicitações que casam com os filtros, sem paginação.
- A exigência de “sem responsável” não pode ser combinada com um responsável
  específico.
- Valores iniciados por `=`, `+`, `-` ou `@` são neutralizados para não virarem
  fórmula de planilha.
- O “Resultado da Triagem” lê o campo legado de texto; triagens novas não
  alimentam esse campo e a coluna fica vazia. Correção pendente.
- A “Data de Conclusão” usa a última transição auditada para o Status terminal
  atual, incluindo o bypass do Administrador.

## Priorização

- Notas por critério são inteiros de 1 a 5.
- Todos os critérios ativos precisam ser avaliados.
- O motor exige exatamente 10 critérios ativos; qualquer outro número é falha de
  configuração.
- O peso vem do cadastro de critérios, nunca do payload.
- A pontuação é a média ponderada normalizada para a escala 10..50, com uma casa
  decimal.
- A classificação (`Baixa`, `Média`, `Alta`, `Crítica`) vem das faixas de
  prioridade cadastradas, não de limites fixos no código.
- A avaliação substitui o estado atual e grava auditoria com o snapshot
  anterior/novo.
- Perfis: Administrador ou Analista responsável pela solicitação.
