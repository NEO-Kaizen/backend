# Notificações

Plataforma de notificações in-app com entrega em tempo real por SSE. O banco é a
fonte de verdade; o stream é apenas transporte. A meta de entrega é de até 5
segundos após o commit.

## Modelo

- **Notificação** — projeção por destinatário, criada na mesma transação do
  evento de negócio.
- **Evento** — união discriminada validada na emissão; a v1 tem apenas
  `status_changed`.
- **Payload** — allowlist do evento. Nunca carrega mensagem técnica, scores,
  notas internas ou campos de triagem.
- **Canal** — o canal in-app grava na transação; e-mail será outra implementação.
- **Idempotência** — a chave é `evento:destinatário`; repetir a emissão não
  duplica a linha.
- **Audiência** — o ator nunca recebe notificação da própria ação. Na v1 o
  destinatário é o solicitante vinculado à solicitação.

## Evento `status_changed`

- Emitido na troca direta de status, na mesma transação da mudança e da
  auditoria.
- Só notifica quando o destino é público e não restrito.
- Transições para Status interno ou restrito não geram notificação.
- Solicitação sem solicitante autenticado não gera notificação in-app na v1.
- Se a transação falhar, nem o Status nem a notificação são gravados.
- Após o commit, a Notificação é publicada no emissor tipado.

> Triagem e mapeamento não emitem notificação, mesmo quando o destino é público.

## Leitura

- A listagem é da mais recente para a mais antiga.
- Marcar como lida é idempotente e devolve o instante original.
- Notificação de outro usuário responde como inexistente, sem revelar
  existência.
- Marcar em massa atinge apenas as notificações do usuário autenticado.

## Stream SSE

- O destinatário é sempre o usuário autenticado; nenhuma rota aceita destinatário
  no payload.
- A reconexão reenvia notificações posteriores à âncora, em ordem cronológica; a
  âncora precisa pertencer ao usuário.
- Eventos ao vivo são enfileirados durante o replay para não se perderem entre a
  consulta e a assinatura.
- O cliente deduplica por id.

## Fora de escopo da v1

- Notificações de pendência, mapeamento e designação.
- Canal de e-mail.
- WebSocket, outbox durável, poda/retenção automática e auditoria de leitura.

## Persistência

Ver
[`docs/database/notifications-persistence.md`](../database/notifications-persistence.md).
