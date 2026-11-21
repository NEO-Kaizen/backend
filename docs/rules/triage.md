# Triagem

Cada solicitação tem **triagens sequenciais**: `POST /requests/:protocol/triage`
faz append de um registro novo; nunca há duas triagens simultâneas. A triagem
vigente é a última retornada por `GET /requests/:protocol/triage`. O histórico
completo aparece em `GET /requests/:protocol/internal-notes` em `triages[]`,
ordenado do mais antigo para o mais recente.

## Autorização

| Operação | Quem pode                                                                |
| -------- | ------------------------------------------------------------------------ |
| POST     | Administrador ou Analista responsável pela triagem                       |
| GET      | Administrador, Gestor (leitura) ou Analista **responsável pela triagem** |

Gestor é somente leitura. Solicitante nunca acessa rota interna. Sem sessão →
`401`; sem custódia → `403`.

## Campos e validação

- `adherentToScope` — `"Sim"` ou `"Não"` (obrigatório; `""` é rejeitado na
  criação).
- `adherentJustification` — obrigatório (1..1000) quando `adherentToScope =
"Não"`; limpo caso contrário.
- `changeCategory` — `"Sim"` ou `"Não"` (obrigatório).
- `newCategory` — obrigatório quando `changeCategory = "Sim"`; precisa ser o
  **nome** de uma categoria ativa (`categories.name`), máx. 40. Ignorado/limpo
  quando `"Não"`.
- `preliminaryComplexity` — obrigatório (1..4000) quando `adherentToScope =
"Sim"`.
- `perceivedRisks` — obrigatório (1..4000) quando `adherentToScope = "Sim"`.
- `suggestedResponsible` — opcional (máx. 150).
- `suggestedResponsibleJustification` — opcional (máx. 1000).
- `exitStatus` — `PortalStatus.id` numérico; literais antigos (nomes) são
  rejeitados.
- `result` — obrigatório (1..1000).
- `conclusionJustification` — obrigatório (1..4000).
- `lastTechnicalMessage` — obrigatório (1..4000) quando o Status de saída é
  público.

## Status de saída

O destino precisa ser, ao mesmo tempo:

1. `is_active = true`;
2. `is_restricted = false`;
3. `triage_mode = conclusion_only` (comportamento atual do código).

> ⚠ **Decisão pendente:** os documentos anteriores aceitavam
> `conclusion_only || free`. O código só aceita `conclusion_only`. Ver
> `requests-lifecycle.md`.
>
> `isRestricted` (Priorizado) bloqueia a **entrada** na triagem para não
> Administrador. O Administrador pode triar uma solicitação que já está em
> Status restrito, mas o **destino** continua não podendo ser restrito.

## Efeitos atômicos

Na mesma transação:

- persiste o registro da triagem;
- se `changeCategory = "Sim"`, substitui `requests.category` pelo nome ativo;
- resolve `exitStatus` para o nome do Status e atualiza o estado atual;
- atualiza o retrato público quando o destino é público;
- **libera o responsável de triagem** (`professional_id = NULL`), mantendo o
  snapshot do responsável em `triages.assignee_*`;
- grava **apenas** a auditoria `request.triage` (o status anterior/novo vai
  embutido no snapshot) e, quando há liberação, `request.unassign` com origem
  `system`. Não existe evento `request.status_change` separado nesta rota.

Falha em qualquer etapa desfaz tudo.

## Regras de apresentação

- O backend devolve o `TriageAssessment` completo, incluindo `assignee` e
  `lastTechnicalMessage`.
- A UI deriva as opções de saída de
  `portalConfig.statuses.filter(s => s.isActive && !s.isRestricted && ...)`,
  mas a validação efetiva é sempre do backend.
- Trocar a categoria **não** altera o registro de triagens passadas: cada linha
  guarda o `new_category` usado naquela versão. Demais blocos não são
  snapshotados.
