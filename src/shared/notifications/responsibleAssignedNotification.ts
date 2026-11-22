import type { Knex } from "knex";
import { emitNotification, type CommittedNotification } from "./emitNotification.ts";
import type { ResponsibleAssignedNotificationPayload } from "./notificationEvents.ts";

export interface ResponsibleAssignedNotificationInput extends Omit<
  ResponsibleAssignedNotificationPayload,
  "type"
> {
  /** Usuário designado — o único destinatário. */
  recipientUserId: number;
  /** `audit_id` da designação; junto do prefixo forma a `eventKey`. */
  auditId: string;
  requestId: string;
  /** Ator da designação (o Administrador); não recebe Notificação própria. */
  actorUserId: number;
}

/**
 * Emite o Evento "Designação de responsável" na matriz de audiência do RF20.
 *
 * Destinatário: o analista designado. O ator — o Administrador que designou
 * — é removido pelo emissor, então a designação nunca notifica o próprio
 * administrador.
 */
export async function emitResponsibleAssignedNotification(
  trx: Knex.Transaction,
  input: ResponsibleAssignedNotificationInput,
): Promise<CommittedNotification[]> {
  return emitNotification(trx, {
    type: "responsible_assigned",
    eventKey: `request.assigned:${input.auditId}`,
    requestId: input.requestId,
    actorUserId: input.actorUserId,
    recipientUserIds: [input.recipientUserId],
    payload: {
      type: "responsible_assigned",
      protocol: input.protocol,
      title: input.title,
      category: input.category,
      status: input.status,
    },
  });
}
