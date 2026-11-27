# Notificações

Plataforma de notificações in-app com entrega em tempo real por SSE. O banco é a
fonte de verdade; o stream é apenas transporte. A meta de entrega é de até 5
segundos após o commit.

## Modelo

- **Notificação** — projeção por destinatário, criada na mesma transação do
  evento de negócio.
- **Evento** — união discriminada validada na emissão. A v1 cobre mudança de
  Status, ciclo de Pendência, Agendamento do Mapeamento e Designação de
  Responsável.
- **Payload** — allowlist do evento. Nunca carrega mensagem técnica, scores,
  notas internas ou campos de triagem.
- **Canal** — o canal in-app grava na transação; e-mail será outra implementação.
- **Idempotência** — a chave é `evento:destinatário`; repetir a emissão não
  duplica a linha.
- **Audiência** — o ator nunca recebe notificação da própria ação.

## Eventos e audiência

| Evento                                                                      | Destinatário                                                                             | Payload                                                    |
| --------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------- | ---------------------------------------------------------- |
| `status_changed`                                                            | solicitante autenticado                                                                  | tipo, protocolo, título, novo Status público               |
| `pending_item_created` / `pending_item_reopened` / `pending_item_validated` | solicitante autenticado                                                                  | tipo, protocolo, título                                    |
| `pending_item_responded`                                                    | Responsável da solicitação                                                               | tipo, protocolo, título                                    |
| `pending_item_responded_unassigned`                                         | Administradores ativos                                                                   | tipo, protocolo, título, aviso "sem responsável designado" |
| `mapping_scheduled`                                                         | solicitante autenticado + Responsável do Mapeamento (`requests.mapping_professional_id`) | tipo, protocolo, título, data/hora do Agendamento          |
| `responsible_assigned`                                                      | analista designado                                                                       | tipo, protocolo, título, categoria, Status atual           |

### `status_changed`

- Emitido na troca direta de status ou no veredito da Triagem, na mesma transação
  da mudança e da auditoria.
- Só notifica quando o destino é público e não restrito.
- Transições para Status interno ou restrito não geram notificação.
- Solicitação sem solicitante autenticado não gera notificação in-app na v1.

### Ciclo de Pendência

- Criação, reabertura e validação notificam o solicitante autenticado.
- Resposta notifica o Responsável; sem Responsável, notifica os Administradores
  ativos com aviso explícito.
- Dominós de Status que acompanham a Pendência não geram Evento próprio.

### `mapping_scheduled`

- Emitido na conclusão do Mapeamento para `Mapeamento agendado` (Status 6).
- Rascunho não emite; reagendamento é nova conclusão, com nova `eventKey` e nova
  data/hora no Payload.
- A audiência usa o Responsável do Mapeamento da solicitação; o designado do
  esforço de Mapeamento é fallback documentado quando não há esse vínculo.
- Se a transação falhar, nem o Agendamento nem a Notificação são gravados.

### `responsible_assigned`

- Emitido na Designação nas rotas interna e legada, respeitando a exclusividade
  triagem ↔ mapeamento.
- Sem troca de designado não há Notificação duplicada; na troca de papel do
  mesmo analista a exclusividade apenas move o vínculo, sem novo Evento.
- O Status no Payload é o pós-RN-010 quando a Designação avança a solicitação.

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

- Canal de e-mail (RF31).
- WebSocket, outbox durável, poda/retenção automática e auditoria de leitura.

## Persistência e contrato

Ver
[`docs/database/notifications-persistence.md`](../database/notifications-persistence.md).
O contrato HTTP é a especificação OpenAPI em `src/docs/`, servida em
`GET /api-docs` em desenvolvimento.
