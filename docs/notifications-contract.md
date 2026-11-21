# Contrato HTTP — Notificações (RF20)

Issues: #157, #158. Issue pai: #156.

## Escopo desta entrega

A plataforma de Notificações in-app e os primeiros Eventos ponta a ponta:

- a mudança de Status feita pelo analista no `PATCH /requests/:protocol/status`
  ou pelo veredito da Triagem;
- a criação, a reabertura e a validação de uma Pendência.

Todos geram uma Notificação para o solicitante autenticado, entregue por SSE em
até 5 segundos. Eventos de Mapeamento, Designação e a resposta de Pendência
entram nas demais issues filhas do RF20 e reutilizam a mesma seam de emissão.

## Modelo

- **Notificação**: projeção por destinatário criada na mesma transação do
  evento de negócio. O banco é a fonte de verdade.
- **Evento**: união discriminada `NotificationEvent`, validada por Zod na
  emissão. Tipos atuais: `status_changed`, `pending_item_created`,
  `pending_item_reopened` e `pending_item_validated`.
- **Payload**: Allowlist do Evento. Para `status_changed`, contém somente
  `type`, `protocol`, `title` e `newStatus`; para os Eventos de Pendência,
  somente `type`, `protocol` e `title` — nunca mensagem técnica, scores, notas
  internas ou campos de triagem.
- **Canal**: `NotificationChannel`. O canal in-app grava a Notificação na
  transação; o canal de e-mail do RF31 entra como outra implementação.
- **Idempotência**: `notifications.dedup_key` é única. A chave é
  `evento:destinatário`; repetir a mesma emissão não duplica a linha.
- **Audiência**: o ator nunca recebe Notificação da própria ação. Nesta
  entrega, o destinatário é o `requests.requester_user_id`.

## Regras do Evento `status_changed`

- Emitido no `PATCH /requests/:protocol/status` e no veredito da Triagem, na
  mesma transação da mudança de Status e da auditoria.
- `eventKey`: `request.status_change:<audit_id>` no PATCH e
  `request.triage:<audit_id>` no veredito — transições distintas do mesmo
  Status não se deduplicam entre si.
- Só é Evento quando o Status muda de fato: re-triagem concluída no mesmo
  Status não notifica.
- Só notifica quando o Status de destino é público (`is_public = true`) e não
  restrito (`is_restricted = false`).
- Transições para Status interno ou restrito não geram Notificação.
- Solicitação sem `requester_user_id` (solicitante anônimo) não gera
  Notificação in-app na v1.
- Se a transação falhar, nem o Status nem a Notificação são gravados.
- Após o commit, a publicação ocorre no `EventEmitter` tipado com
  `{ userId, notificationIds }`.

## Regras dos Eventos de Pendência

- `pending_item_created` é emitido pelo `POST /requests/:protocol/pending-items`,
  uma vez por lote, na mesma transação da criação dos itens e da auditoria.
- `pending_item_reopened` é emitido pelo `PATCH /requests/:protocol/pending-items/review`
  quando ao menos um item é reaberto, uma vez por chamada (não por item).
- `pending_item_validated` é emitido pela mesma revisão quando ao menos um item
  é validado, uma vez por chamada (não por item).
- Uma mesma revisão pode gerar as duas Notificações quando decide reabrir e
  validar itens distintos; cada tipo é uma ação.
- A revisão parcial (D-P23) é uma ação por chamada: decidir outros itens depois
  gera nova Notificação; itens omitidos não notificam.
- O destinatário é o `requests.requester_user_id`. Solicitação sem solicitante
  autenticado não gera Notificação in-app na v1.
- O ator não recebe Notificação da própria ação; o emissor o remove da
  audiência.
- `eventKey`: `pending_item.create:<audit_id>`, `pending_item.reopen:<audit_id>`
  ou `pending_item.validate:<audit_id>`, usando o `audit_id` da primeira
  transição daquele tipo na chamada. Reenvio idempotente não gera nova
  Notificação.
- Os dominós de Status disparados pela criação e pela reabertura **não** geram
  Evento `status_changed`; o Evento dominante é o da Pendência.
- Se a transação falhar, nem a alteração de negócio nem a Notificação são
  gravadas.

## Autenticação

Todos os endpoints exigem o cookie de sessão `session_id` (`authMiddleware`).
O destinatário é sempre o usuário autenticado; nenhum endpoint aceita id de
destinatário no payload.

## `GET /notifications`

Lista as Notificações do usuário autenticado, da mais recente para a mais
antiga, com estado de leitura.

### Query

| Parâmetro | Tipo    | Obrigatório | Regra                                  |
| --------- | ------- | ----------- | -------------------------------------- |
| `cursor`  | string  | Não         | Cursor opaco devolvido em `nextCursor` |
| `limit`   | integer | Não         | 1 a 50; padrão 20                      |

### Resposta `200`

```json
{
  "items": [
    {
      "id": "f0000000-0000-4000-8000-000000000001",
      "type": "status_changed",
      "payload": {
        "type": "status_changed",
        "protocol": "MAAT-8K3P-9X2M",
        "title": "Automatizar conciliação bancária",
        "newStatus": "Aguardando mapeamento"
      },
      "readAt": null,
      "createdAt": "2026-11-18T12:15:00.000Z"
    },
    {
      "id": "f0000000-0000-4000-8000-000000000004",
      "type": "pending_item_created",
      "payload": {
        "type": "pending_item_created",
        "protocol": "MAAT-2R7Q-4M1C",
        "title": "Analisar inadimplência por região"
      },
      "readAt": null,
      "createdAt": "2026-11-19T10:05:00.000Z"
    }
  ],
  "nextCursor": null
}
```

`nextCursor` é `null` na última página. O cursor é opaco: o cliente não deve
interpretar seu conteúdo.

### Erros

- `400` — cursor ou `limit` inválido.
- `401` — sessão ausente, inválida ou revogada.

## `GET /notifications/unread-count`

Retorna o contador de Notificações não lidas do usuário autenticado.

```json
{ "unreadCount": 2 }
```

## `PATCH /notifications/:notificationId/read`

Marca uma Notificação do usuário autenticado como lida. É idempotente: repetir
a chamada devolve o instante original de leitura.

```json
{
  "id": "f0000000-0000-4000-8000-000000000001",
  "readAt": "2026-11-18T12:30:00.000Z"
}
```

- `404` quando a Notificação não existe ou pertence a outro usuário (a
  resposta é a mesma para não revelar a existência).

## `PATCH /notifications/read-all`

Marca em massa todas as Notificações não lidas do usuário autenticado.

```json
{ "markedRead": 2 }
```

## `GET /notifications/stream` (SSE)

Entrega as Notificações em tempo real via Server-Sent Events, autenticado pelo
cookie de sessão.

### Formato

```text
retry: 3000
: connected

id: f0000000-0000-4000-8000-000000000001
event: notification
data: {"id":"f0000000-0000-4000-8000-000000000001","type":"status_changed","payload":{"type":"status_changed","protocol":"MAAT-8K3P-9X2M","title":"Automatizar conciliação bancária","newStatus":"Aguardando mapeamento"},"readAt":null,"createdAt":"2026-11-18T12:15:00.000Z"}

: keep-alive
```

- `event: notification` — o `data` é o mesmo item da lista.
- `id` — id da Notificação; o cliente o envia de volta como `Last-Event-ID`.
- Comentários `: keep-alive` a cada 25 segundos mantêm a conexão viva.

### Reconexão

Ao reconectar, o servidor reenvia as Notificações criadas depois da âncora, em
ordem cronológica. A âncora é enviada no header `Last-Event-ID` ou, quando o
cliente não pode definir headers (ex.: `EventSource` do navegador), na query
`lastEventId`. A âncora precisa pertencer ao usuário; caso contrário, nada é
reenviado. O cliente também deduplica por `id`.

Eventos ao vivo são enfileirados durante o replay e liberados depois, para não
se perderem entre a consulta e a assinatura.

## Persistência

O schema e os índices estão em
[`docs/database/notifications-persistence.md`](database/notifications-persistence.md).

## Fora de escopo nesta entrega

- Notificação de Pendência respondida (issue #159), Mapeamento e Designação.
- Canal de e-mail (RF31).
- WebSocket e outbox durável.
- Poda e retenção automática.
- Auditoria de leitura.
