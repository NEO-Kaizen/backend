import type { Knex } from "knex";
import { emitNotification, type CommittedNotification } from "./emitNotification.ts";

/** Ação do ciclo de Pendência que gera Notificação ao solicitante. */
export type PendingItemNotificationAction = "created" | "reopened" | "validated";

const EVENT_KEY_PREFIXES: Record<PendingItemNotificationAction, string> = {
  created: "pending_item.create",
  reopened: "pending_item.reopen",
  validated: "pending_item.validate",
};

export interface PendingItemNotificationInput {
  action: PendingItemNotificationAction;
  /** `audit_id` da primeira transição da ação; compõe a `eventKey`. */
  auditId: string;
  requestId: string;
  protocol: string;
  title: string;
  actorUserId: number;
  requesterUserId: number | null;
}

/**
 * Emite o Evento do ciclo de Pendência para o solicitante autenticado.
 *
 * A granularidade é a ação, não o item: uma criação notifica uma vez por lote
 * e uma revisão notifica uma vez por tipo de decisão (`reopen`/`validate`),
 * mesmo que a chamada decida vários itens. O emissor remove o ator da
 * audiência e solicitante anônimo não tem canal in-app na v1.
 */
export async function emitPendingItemNotification(
  trx: Knex.Transaction,
  input: PendingItemNotificationInput,
): Promise<CommittedNotification[]> {
  if (input.requesterUserId === null) return [];

  const base = {
    eventKey: `${EVENT_KEY_PREFIXES[input.action]}:${input.auditId}`,
    requestId: input.requestId,
    actorUserId: input.actorUserId,
    recipientUserIds: [input.requesterUserId],
  };
  const payload = { protocol: input.protocol, title: input.title };

  switch (input.action) {
    case "created":
      return emitNotification(trx, {
        ...base,
        type: "pending_item_created",
        payload: { type: "pending_item_created", ...payload },
      });
    case "reopened":
      return emitNotification(trx, {
        ...base,
        type: "pending_item_reopened",
        payload: { type: "pending_item_reopened", ...payload },
      });
    case "validated":
      return emitNotification(trx, {
        ...base,
        type: "pending_item_validated",
        payload: { type: "pending_item_validated", ...payload },
      });
  }
}
