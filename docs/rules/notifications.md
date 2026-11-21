# Notificações

Plataforma de notificações in-app com entrega em tempo real por SSE. O banco é
a fonte de verdade; o stream é apenas transporte. A meta de entrega é **até 5
segundos** após o commit.

## Modelo

- **Notificação** — projeção por destinatário, criada na **mesma transação** do
  evento de negócio.
- **Evento** — união discriminada `NotificationEvent` validada por Zod na
  emissão. A v1 tem apenas `status_changed`.
- **Payload** — allowlist do evento (schema `.strict()`). Nunca carrega
  mensagem técnica, scores, notas internas ou campos de triagem.
- **Canal** — `NotificationChannel`. O canal in-app grava na transação; o
  e-mail (RF31) será outra implementação.
- **Idempotência** — `notifications.dedup_key` é única no formato
  `evento:destinatário`; repetir a emissão não duplica a linha.
- **Audiência** — o ator nunca recebe notificação da própria ação. Na v1 o
  destinatário é `requests.requester_user_id`.

## Evento `status_changed`

- Emitido no `PATCH /requests/:protocol/status`, na mesma transação da mudança
  de Status e da auditoria.
- Só notifica quando o destino é público (`is_public = true`) e não restrito
  (`is_restricted = false`).
- Transições para Status interno ou restrito não geram notificação.
- Solicitação sem `requester_user_id` (solicitante anônimo) não gera
  notificação in-app na v1.
- Se a transação falhar, nem o Status nem a notificação são gravados.
- Após o commit, o aviso é publicado no `EventEmitter` tipado com
  `{ userId, notificationIds }`.

Payload permitido:

```json
{
  "type": "status_changed",
  "protocol": "MAAT-8K3P-9X2M",
  "title": "Automatizar conciliação bancária",
  "newStatus": "Aguardando mapeamento"
}
```

## Autenticação

Todas as rotas exigem o cookie `session_id`. O destinatário é sempre o usuário
autenticado; nenhum endpoint aceita id de destinatário no payload.

## Leitura

- `GET /notifications` — mais recente primeiro, cursor opaco (`nextCursor`),
  `limit` 1..50 (default 20).
- `GET /notifications/unread-count` — contador de não lidas.
- `PATCH /notifications/{id}/read` — idempotente; devolve o instante original
  de leitura. Notificação de outro usuário → `404` (mesma resposta para não
  revelar existência).
- `PATCH /notifications/read-all` — marca todas e devolve `{ markedRead }`.

## Stream SSE (`GET /notifications/stream`)

- Autenticado pelo cookie.
- Formato: `retry: 3000`, comentário `: connected`, eventos
  `event: notification` com o mesmo item da lista em `data`, `id` da
  notificação, `: keep-alive` a cada 25 s.
- Reconexão: a âncora vem de `Last-Event-ID` ou da query `lastEventId`; o
  servidor reenvia notificações posteriores à âncora, em ordem cronológica. A
  âncora precisa pertencer ao usuário; caso contrário nada é reenviado.
- Eventos ao vivo são enfileirados durante o replay para não se perderem entre
  a consulta e a assinatura. O cliente também deduplica por `id`.

## Fora de escopo da v1

- Notificações de Pendência, Mapeamento e Designação (issues filhas do RF20).
- Canal de e-mail (RF31).
- WebSocket, outbox durável, poda/retenção automática e auditoria de leitura.

## Persistência

Schema e índices em
[`docs/database/notifications-persistence.md`](../database/notifications-persistence.md).
