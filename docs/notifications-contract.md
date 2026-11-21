# Contrato HTTP — Notificações (RF20)

Issues: #157 e #159. Issue pai: #156.

## Escopo desta entrega

A plataforma de Notificações in-app, a mudança de Status feita pelo analista no
`PATCH /requests/:protocol/status` ou pelo veredito da Triagem e a resposta de
Pendência. As Notificações são entregues por SSE em até 5 segundos.

Os demais Eventos de Pendência (criação, reabertura e validação), Mapeamento e
Designação entram nas issues filhas do RF20 e reutilizam a mesma seam de
emissão.

## Modelo

- **Notificação**: projeção por destinatário criada na mesma transação do
  evento de negócio. O banco é a fonte de verdade.
- **Evento**: união discriminada `NotificationEvent`, validada por Zod na
  emissão. A v1 tem `status_changed`, `pending_item_responded` e
  `pending_item_responded_unassigned`.
- **Payload**: Allowlist do Evento. Para `status_changed`, contém somente
  `type`, `protocol`, `title` e `newStatus`; para os Eventos de Pendência, os
  campos da seção própria — nunca mensagem técnica, scores, notas internas ou
  campos de triagem.
- **Canal**: `NotificationChannel`. O canal in-app grava a Notificação na
  transação; o canal de e-mail do RF31 entra como outra implementação.
- **Idempotência**: `notifications.dedup_key` é única. A chave é
  `evento:destinatário`; repetir a mesma emissão não duplica a linha.
- **Audiência**: o ator nunca recebe Notificação da própria ação; o
  destinatário de cada Evento segue a matriz da seção correspondente.

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

## Regras do Evento `pending_item_responded`

- Emitido no `PATCH /requests/:protocol/pending-items/:pendingItemId` quando o
  item transita `requested → responded`, na mesma transação da resposta, do
  dominó de Status e da auditoria.
- `eventKey`: `request.pending_responded:<audit_id>` — cada resposta é um Evento
  distinto; reabrir e responder de novo gera nova Notificação.
- Uma Notificação por item respondido e por destinatário. O upload isolado de
  anexo (`POST .../attachments`) não emite: o Evento é a confirmação da
  resposta, e o anexo aparece no detalhe da solicitação apontada.
- Com `requests.professional_id` definido, o destinatário é o usuário do
  Responsável (`details_professional.user_id`), independentemente do estado
  atual da conta: a designação é a fonte de verdade; desativação e
  remanejamento pertencem ao fluxo de atribuição.
- Sem Responsável designado, os destinatários são os usuários ativos com perfil
  `administrador` (conta e perfil ativos), com o aviso explícito no payload.
- O ator nunca recebe. A autoexclusão tem precedência sobre o critério de
  contagem: a resposta do solicitante gera exatamente uma Notificação ao
  Responsável quando ele não é o ator; quando o próprio Responsável responde,
  nenhuma Notificação é emitida. Sem sessão, a identidade pública é associada
  ao `requests.requester_user_id` (quando houver) ou, sem vínculo, à conta cujo
  e-mail coincide com a identidade verificada, para a exclusão.
- Se a transação falhar, nem a resposta, nem o Status, nem a Notificação são
  gravados.
- Após o commit, a publicação ocorre no mesmo `EventEmitter` do Evento de
  Status.

## Payload dos Eventos de Pendência

| Evento                              | Campos obrigatórios                                                   |
| ----------------------------------- | --------------------------------------------------------------------- |
| `pending_item_responded`            | `type`, `protocol`, `title`                                           |
| `pending_item_responded_unassigned` | `type`, `protocol`, `title`, `notice` (`"Sem responsável designado"`) |

Nenhum outro campo entra no Payload, em especial scores, notas internas,
campos de triagem, riscos, próximos passos ou a identidade do solicitante.

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
      "id": "f0000000-0000-4000-8000-000000000005",
      "type": "pending_item_responded_unassigned",
      "payload": {
        "type": "pending_item_responded_unassigned",
        "protocol": "MAAT-2R7Q-4M1C",
        "title": "Analisar inadimplência por região",
        "notice": "Sem responsável designado"
      },
      "readAt": null,
      "createdAt": "2026-11-19T16:42:00.000Z"
    },
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

- Notificações de criação, reabertura e validação de Pendência, Mapeamento e
  Designação (demais issues filhas do RF20).
- Canal de e-mail (RF31).
- WebSocket e outbox durável.
- Poda e retenção automática.
- Auditoria de leitura.
