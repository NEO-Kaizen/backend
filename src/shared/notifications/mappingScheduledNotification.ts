import type { Knex } from "knex";
import { emitNotification, type CommittedNotification } from "./emitNotification.ts";
import type { MappingScheduledNotificationPayload } from "./notificationEvents.ts";

export interface MappingScheduledNotificationInput extends Omit<
  MappingScheduledNotificationPayload,
  "type"
> {
  /** `audit_id` do `mapping.complete`; junto do prefixo forma a `eventKey`. */
  auditId: string;
  requestId: string;
  actorUserId: number;
  /** Solicitante autenticado (`requests.requester_user_id`). */
  requesterUserId: number | null;
  /**
   * Designado de custódia da solicitação (`requests.mapping_professional_id`)
   * — a audiência declarada na matriz #156.
   */
  requestMappingAssigneeUserId: number | null;
}

/**
 * Emite o Evento "Agendamento do Mapeamento" (issue #160).
 *
 * Audiência: o solicitante autenticado e o Responsável do Mapeamento da
 * solicitação — a matriz #156 declara `requests.mapping_professional_id`;
 * sem ele, não há destinatário designado. O ator é removido pelo
 * emissor, e dedup garante uma Notificação por destinatário.
 *
 * A decisão de *quando* notificar (conclusão do Mapeamento para o Status
 * `Mapeamento agendado`) pertence ao service do Mapeamento — rascunho não
 * emite; conclusão para outros Status também não — o Evento é o Agendamento.
 */
export async function emitMappingScheduledNotification(
  trx: Knex.Transaction,
  input: MappingScheduledNotificationInput,
): Promise<CommittedNotification[]> {
  const recipientUserIds = [input.requesterUserId, input.requestMappingAssigneeUserId].filter(
    (userId): userId is number => userId !== null,
  );

  if (recipientUserIds.length === 0) return [];

  return emitNotification(trx, {
    type: "mapping_scheduled",
    eventKey: `mapping.complete:${input.auditId}`,
    requestId: input.requestId,
    actorUserId: input.actorUserId,
    recipientUserIds,
    payload: {
      type: "mapping_scheduled",
      protocol: input.protocol,
      title: input.title,
      scheduledAt: input.scheduledAt,
    },
  });
}
