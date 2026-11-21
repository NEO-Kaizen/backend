# Contrato Backend x Frontend - RF13

## Objetivo

Este documento define como o frontend consulta o tempo por Status das solicitações,
como identifica Status de pausa e como apresenta os eventos de alteração de Status.
O cálculo RF13 não implementa regras de SLA.

## Base comum

- Autenticação: cookie HTTP-only `session_id`.
- Datas: ISO 8601 UTC, por exemplo `2026-11-20T14:22:45.736Z`.
- Durações: milissegundos inteiros (`number`) em campos terminados em `Milliseconds`.
- Não converter milissegundos no backend; o frontend pode formatar horas, dias ou textos.
- Erros usam o envelope:

```json
{
  "status": "error",
  "statusCode": 404,
  "message": "Protocolo não encontrado"
}
```

---

## 1. Consultar tempo por Status

### Rota

```http
GET /audit-logs/{protocol}/status-times
```

Exemplo:

```http
GET /audit-logs/MAAT-8K3P-9X2M/status-times
Cookie: session_id=<jwt>
```

### Permissões

- `Administrador`: qualquer solicitação.
- `Gestor`: qualquer solicitação.
- `Analista`: somente solicitações em que é responsável da triagem ou designado do mapeamento.
- `Solicitante`: não possui acesso a esta rota.

### Response 200

```json
{
  "protocol": "MAAT-8K3P-9X2M",
  "calculatedAt": "2026-11-20T14:22:45.736Z",
  "intervals": [
    {
      "status": "Em triagem",
      "enteredAt": "2026-11-20T10:00:00.000Z",
      "exitedAt": "2026-11-20T11:00:00.000Z",
      "activeMilliseconds": 3600000,
      "pausedMilliseconds": 0,
      "isPaused": false
    },
    {
      "status": "Pendente de informações",
      "enteredAt": "2026-11-20T11:00:00.000Z",
      "exitedAt": null,
      "activeMilliseconds": 0,
      "pausedMilliseconds": 10800000,
      "isPaused": true
    }
  ],
  "totalsByStatus": [
    {
      "status": "Em triagem",
      "activeMilliseconds": 3600000,
      "pausedMilliseconds": 0,
      "isPaused": false
    },
    {
      "status": "Pendente de informações",
      "activeMilliseconds": 0,
      "pausedMilliseconds": 10800000,
      "isPaused": true
    }
  ],
  "totalActiveMilliseconds": 3600000,
  "totalPausedMilliseconds": 10800000
}
```

### Campos

| Campo                     | Tipo               | Significado                                            |
| ------------------------- | ------------------ | ------------------------------------------------------ |
| `protocol`                | `string`           | Protocolo público da solicitação.                      |
| `calculatedAt`            | `string` ISO       | Momento usado para fechar o intervalo do Status atual. |
| `intervals`               | `StatusInterval[]` | Entradas e saídas históricas em cada Status.           |
| `totalsByStatus`          | `StatusTotal[]`    | Soma consolidada por nome de Status.                   |
| `totalActiveMilliseconds` | `number`           | Soma de todos os períodos ativos.                      |
| `totalPausedMilliseconds` | `number`           | Soma de todos os períodos pausados.                    |

Cada item de `intervals`:

| Campo                | Tipo             | Significado                                                  |
| -------------------- | ---------------- | ------------------------------------------------------------ |
| `status`             | `string`         | Nome do Status.                                              |
| `enteredAt`          | `string` ISO     | Entrada no Status.                                           |
| `exitedAt`           | `string \| null` | Saída do Status; `null` significa que este é o Status atual. |
| `activeMilliseconds` | `number`         | Tempo ativo dentro deste intervalo.                          |
| `pausedMilliseconds` | `number`         | Tempo pausado dentro deste intervalo.                        |
| `isPaused`           | `boolean`        | Indica se o Status configurado é período de pausa.           |

Cada item de `totalsByStatus`:

| Campo                | Tipo      | Significado                                    |
| -------------------- | --------- | ---------------------------------------------- |
| `status`             | `string`  | Nome agregado.                                 |
| `activeMilliseconds` | `number`  | Soma ativa do Status em todos os intervalos.   |
| `pausedMilliseconds` | `number`  | Soma pausada do Status em todos os intervalos. |
| `isPaused`           | `boolean` | Indica se o Status agrega períodos de pausa.   |

### Respostas de erro

| Status | Situação                                                                            |
| ------ | ----------------------------------------------------------------------------------- |
| `401`  | Sem sessão ou sessão inválida.                                                      |
| `403`  | Perfil sem custódia; também usado por Analista para mascarar protocolo inexistente. |
| `404`  | Protocolo inexistente para Administrador ou Gestor.                                 |

### Uso no frontend

- Use `intervals` para timeline, entrada/saída e detalhamento.
- Use `totalsByStatus` para gráfico ou tabela consolidada por Status.
- Use os totais gerais para cartões de tempo ativo e pausado.
- Formate intervalos fechados com `exitedAt - enteredAt`.
- Para `exitedAt === null`, use `calculatedAt - enteredAt`.
- Não some os intervalos manualmente se `totalsByStatus` já estiver disponível.
- Não aplicar regras de SLA com base nesta resposta sem uma implementação de RF10.

---

## 2. Configurar quais Status entram em pausa

### Consultar configuração

```http
GET /portal-config
```

Cada item da resposta em `statuses` contém:

```json
{
  "id": 4,
  "name": "Pendente de informações",
  "isCore": true,
  "isPublic": true,
  "isTerminal": false,
  "isPaused": true,
  "triageMode": "free",
  "mappingMode": "free",
  "isRestricted": false,
  "tone": "warning",
  "isActive": true
}
```

### Atualizar Status

```http
PATCH /portal-config/statuses
Cookie: session_id=<jwt de Administrador>
Content-Type: application/json
```

Body:

```json
{
  "statuses": [
    {
      "id": 4,
      "name": "Pendente de informações",
      "isCore": true,
      "isPublic": true,
      "isTerminal": false,
      "isPaused": true,
      "triageMode": "free",
      "mappingMode": "free",
      "isRestricted": false,
      "tone": "warning",
      "isActive": true
    }
  ]
}
```

`isPaused`:

- Opcional no contrato TypeScript atual;
- Ausente na atualização: o backend preserva o valor existente no banco;
- `true`: o Status é considerado período pausado;
- `false`: o Status conta como tempo ativo;
- Status de núcleo não podem ter `isPaused` alterado por esta rota.
- A classificação histórica usa o `status_id` snapshotado; renomear um Status não reclassifica períodos anteriores.

---

## 3. Consultar a linha do tempo de auditoria

### Rota

```http
GET /audit-logs/{protocol}
```

Permissões são iguais às da consulta de tempos.

### Response 200

```json
[
  {
    "audit_id": 17,
    "entity_type": "request",
    "entity_id": "MAAT-8K3P-9X2M",
    "action_type": "request.status_change",
    "actor": {
      "kind": "user",
      "userId": 102,
      "displayName": "Administrador Teste"
    },
    "previous_value": "Em triagem",
    "new_value": "Pendente de informações",
    "note": "Aguardando documento complementar",
    "last_technical_message": null,
    "ip_address": "127.0.0.1",
    "change_origin": "admin",
    "occurred_at": "2026-11-20T14:22:45.736Z"
  }
]
```

### Ações relevantes

| `action_type`                   | Origem                              |
| ------------------------------- | ----------------------------------- |
| `request.status_change`         | alteração normal de Status          |
| `request.override_status_admin` | bypass administrativo               |
| `request.triage`                | conclusão ou reavaliação da triagem |
| `request.access_denied`         | tentativa recusada                  |

No frontend:

- `actor.kind === "system"` representa ação automática;
- `previous_value` e `new_value` são os nomes dos Status em transições simples;
- `occurred_at` é o instante da transição;
- `change_origin` indica `admin`, `internal`, `system`, `requester` ou outra origem cadastrada;
- `action_type` permite identificar o tipo da operação sem inferir pelo texto.

---

## 4. Alterações que podem gerar auditoria

Estas operações podem produzir eventos relacionados ao ciclo de vida da solicitação:

| Operação                      | Rota                                            |
| ----------------------------- | ----------------------------------------------- |
| Alterar Status manualmente    | `PATCH /requests/{protocol}/status`             |
| Concluir/reavaliar triagem    | `POST /requests/{protocol}/triage`              |
| Concluir ou salvar mapeamento | `PUT /queue/requests/{protocol}/mapping`        |
| Criar ou responder pendência  | `POST/PATCH /requests/{protocol}/pending-items` |

O frontend não precisa enviar operador ou data:

- operador vem da sessão;
- data vem do banco em `occurred_at`;
- Status anterior e novo são registrados pelo backend;
- alteração e auditoria são feitas na mesma transação.

Tentativas negadas podem produzir `request.access_denied`, mas não alteram o Status.

---

## 5. Regras de apresentação

O frontend deve tratar os dados assim:

1. `activeMilliseconds > 0`: período ativo.
2. `pausedMilliseconds > 0`: período pausado.
3. `exitedAt === null`: Status atual.
4. `isPaused === true`: tempo pertence à pausa.
5. `intervals` pode conter múltiplas entradas no mesmo Status; `totalsByStatus` já consolida.
6. Não assumir que 1 dia tem exatamente 24 horas se existir regra futura de SLA; RF13 mede tempo cronológico.
7. Não interpretar `totalPausedMilliseconds` como SLA até a implementação das políticas RF10.

## 6. Compatibilidade e versionamento

- Novos campos são aditivos: `isPaused`, `totalsByStatus`.
- `intervals` e os totais gerais permanecem válidos sem SLA.
- Mudança de Status da solicitação só deve consumir novo cálculo após o refresh da rota.
- O frontend não deve manter seu próprio mapa permanente de duração por Status; os dados devem ser recalculados pelo backend a partir da auditoria.
