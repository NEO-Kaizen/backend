# Triagem

Cada solicitação tem **triagens sequenciais**: cada criação faz append de um
registro novo; nunca há duas triagens simultâneas. A triagem vigente é a última
criada. O registro completo aparece na Linha do tempo interna, ordenado do mais
antigo para o mais recente.

## Autorização

Criar exige `triage:write` + Custódia da solicitação; ler exige `triage:read`

- Custódia. A escrita é exclusiva do Responsável da triagem: o Designado do
  mapeamento não registra triagem. A leitura vale para o Responsável da
  triagem **ou** do mapeamento corrente. Solicitante nunca acessa rota interna.
  Sem sessão ou sem custódia, a operação é recusada.

## Priorização

`prioritization:write` é exclusiva do Responsável da triagem, repetindo o
comportamento anterior ao RBAC. A ampliação para o Designado do mapeamento
depende de confirmação do Produto.

## Regras condicionais

- `adherentJustification` só existe quando a solicitação não é aderente ao escopo;
  fora desse caso é limpo.
- `newCategory` só é aplicado quando há troca de categoria e precisa ser o nome
  de uma categoria ativa; fora desse caso é limpo.
- `preliminaryComplexity` e `perceivedRisks` só são exigidos quando a solicitação é
  aderente ao escopo.
- `lastTechnicalMessage` é exigido quando o Status de saída é público.
- Os demais campos são declarativos e não alteram regra de domínio.

## Status de saída

O destino precisa ser, ao mesmo tempo:

1. ativo;
2. não restrito;
3. com modo de triagem de conclusão (`conclusion_only` no código atual).

> Aceitar `free` na conclusão é uma decisão pendente; ver
> [`README.md`](README.md). O Administrador pode triar uma solicitação que já
> está em Status restrito, mas o destino continua não podendo ser restrito.

## Efeitos atômicos

Na mesma transação:

- persiste o registro da triagem;
- se houver troca de categoria, substitui a categoria da solicitação pelo nome
  ativo;
- resolve o Status de saída e atualiza o estado atual;
- atualiza o retrato público quando o destino é público;
- **libera o responsável de triagem**, mantendo o snapshot do responsável no
  registro da triagem;
- grava **apenas** a auditoria da triagem e, quando há liberação,
  `request.unassign` com origem `system`. Não existe evento de mudança de Status
  separado nesta rota.

Falha em qualquer etapa desfaz tudo.

## Registros anteriores

Trocar a categoria não altera registros de triagem passados: cada linha guarda o
`new_category` usado naquela versão. Os demais blocos não são snapshotados.
