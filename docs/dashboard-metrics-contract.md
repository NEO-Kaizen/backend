# Contrato de API — Dashboard Gerencial

Endpoint somente de leitura para orientar Gestores e Administradores com dados
agregados das solicitações cadastradas no MAAT.

## GET /reports/dashboard

Exige sessão válida e perfil `Gestor` ou `Administrador`.

### Filtros opcionais

- `from`: data inicial de abertura, no formato `AAAA-MM-DD`;
- `to`: data final de abertura, no formato `AAAA-MM-DD`, inclusiva;
- `situation`: recorte operacional `open`, `closed`, `overdue` ou `unassigned`;
- `statusId`: identificador do status;
- `categoryId`: identificador da categoria;
- `priorityId`: identificador da prioridade ou `unassigned` para solicitações
  ainda não priorizadas.

Quando os dois filtros são enviados, `from` não pode ser posterior a `to`.
As datas são interpretadas no fuso `America/Sao_Paulo`. Sem filtros, o endpoint
considera todas as solicitações.

Exemplo:

```http
GET /reports/dashboard?from=2026-07-01&to=2026-09-30&situation=overdue&categoryId=1&priorityId=4
```

### Definições

- `open`: status com `closes_request = false`;
- `closed`: status com `closes_request = true`;
- `overdue`: solicitação aberta com `desired_deadline` anterior ao dia atual;
- `unassigned`: solicitação aberta sem `professional_id`;
- todos os agregados respeitam a mesma combinação de filtros.

### Resposta 200

Exemplo ilustrativo:

```json
{
  "filters": {
    "from": "2026-07-01",
    "to": "2026-09-30",
    "situation": null,
    "statusId": null,
    "categoryId": null,
    "priorityId": null
  },
  "filterOptions": {
    "statuses": [{ "id": 1, "name": "Solicitação enviada" }],
    "categories": [{ "id": 1, "name": "Automação" }],
    "priorities": [{ "id": 1, "label": "Baixa" }]
  },
  "summary": {
    "total": 20,
    "open": 18,
    "closed": 2,
    "overdue": 0,
    "unassigned": 5
  },
  "byStatus": [
    {
      "id": 1,
      "name": "Solicitação enviada",
      "count": 1,
      "tone": "info",
      "closesRequest": false
    }
  ],
  "byPriority": [{ "id": null, "label": "Não priorizada", "count": 14 }],
  "byCategory": [{ "id": 1, "name": "Automação", "count": 3 }],
  "openedOverTime": [{ "period": "2026-07", "count": 8 }]
}
```

### Erros

| Código | Situação                                    |
| ------ | ------------------------------------------- |
| 400    | Filtro inválido ou intervalo invertido      |
| 401    | Sessão ausente ou inválida                  |
| 403    | Perfil diferente de Gestor ou Administrador |
