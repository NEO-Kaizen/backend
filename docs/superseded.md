# Documentos substituídos

Este índice registra os documentos que deixaram de ser contrato. Nada aqui é
normativo. O contrato HTTP vigente é a especificação OpenAPI em `src/docs/`
(materializada em [`openapi.json`](openapi.json)); as regras de negócio vivem em
[`rules/`](rules/); as decisões em [`adr/`](adr/).

A remoção faz parte da issue #181 (limpeza dos contratos e extração de regras).
O conteúdo original permanece no histórico do Git.

| Documento removido                    | Conteúdo migrado para                                                                                                                                  |
| ------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `audit-events.md`                     | [`rules/audit-trail.md`](rules/audit-trail.md)                                                                                                         |
| `audit-history-contract.md`           | OpenAPI (`/audit-history`, `/audit-logs/{protocol}`) + [`rules/audit-trail.md`](rules/audit-trail.md)                                                  |
| `contract-assign-action.md`           | OpenAPI (atribuição) + [`rules/assignment.md`](rules/assignment.md)                                                                                    |
| `contract-pendencias_03.md`           | OpenAPI (pendências) + [`rules/pending-items.md`](rules/pending-items.md) + [`rules/public-tracking.md`](rules/public-tracking.md)                     |
| `contract-triage_04.md`               | OpenAPI (triagem) + [`rules/triage.md`](rules/triage.md)                                                                                               |
| `dashboard-metrics-contract.md`       | OpenAPI (`/reports/dashboard`) + [`rules/reports.md`](rules/reports.md)                                                                                |
| `internal-notes-contract.md`          | Superseded pelo contrato v2; regras em [`rules/internal-observations.md`](rules/internal-observations.md)                                              |
| `internal-observations.md`            | OpenAPI (timeline) + [`rules/internal-observations.md`](rules/internal-observations.md)                                                                |
| `notifications-contract.md`           | OpenAPI (`/notifications`) + [`rules/notifications.md`](rules/notifications.md)                                                                        |
| `portal-config-api-0_4.md`            | OpenAPI (`/portal-config`) + [`rules/portal-config.md`](rules/portal-config.md)                                                                        |
| `portal-config-endpoints.md`          | OpenAPI (`/portal-config` e subrotas `access`, `identity`, `theme`, `assets`, `categories`, `statuses`, `prioritization-weights`)                      |
| `portal-config-statuses-amend.md`     | OpenAPI + [`ADR-0002`](adr/0002-motor-de-status-v4.md) + [`rules/requests-lifecycle.md`](rules/requests-lifecycle.md)                                  |
| `queue-csv-export-contract.md`        | OpenAPI (`/reports/requests.csv`) + [`rules/reports.md`](rules/reports.md)                                                                             |
| `requests-assignment-contract.md`     | OpenAPI (responsáveis) + [`rules/assignment.md`](rules/assignment.md)                                                                                  |
| `requests-internal-query-contract.md` | OpenAPI (`/requests/{protocol}/internal`) + [`rules/pending-items.md`](rules/pending-items.md) + [`rbac.md`](rbac.md)                                  |
| `solicitations-api-requests-0_4.md`   | OpenAPI (fluxo do solicitante) + [`rules/requests-lifecycle.md`](rules/requests-lifecycle.md) + [`rules/public-tracking.md`](rules/public-tracking.md) |
| `users-api-metrics-0_1.md`            | OpenAPI (`/users/metrics`) + [`rules/users-and-profiles.md`](rules/users-and-profiles.md)                                                              |
| `users-api-profile-0_1.md`            | OpenAPI (`/users/me`, `/users/{id}`) + [`rules/users-and-profiles.md`](rules/users-and-profiles.md)                                                    |

## Documentos que continuam

- `GLOSSARY.md` — vocabulário de domínio.
- `docs/adr/` — decisões difíceis de reverter.
- `docs/rules/` — regras de negócio.
- `docs/rbac.md`, `docs/custom-roles.md` — semântica de acesso (o contrato do
  fio está na OpenAPI).
- `docs/database/` — persistência e migrations.
- `docs/agents/`, `docs/ci.md`, `docs/type-inference.md` — operação do repo.
- `docs/issues/` — histórico de specs de issues.

## Pendências

Documentos de trabalho ainda não versionados (`docs/125-*`,
`docs/mapeamento-*`, `docs/plan-internal-observations-v2.md`,
`docs/issues/rf22/*`) não foram removidos por esta limpeza: eles pertencem a
issues em andamento. Quando forem concluídos, o mesmo critério se aplica —
regra para `docs/rules/`, formato para a OpenAPI, histórico para o Git.
