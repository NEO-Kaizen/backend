import type { Knex } from "knex";
import { emitNotification, type CommittedNotification } from "./emitNotification.ts";
import type { NotificationEvent } from "./notificationEvents.ts";

/** Ação do ciclo de Pendência que gera Notificação ao solicitante. */
export type PendingItemNotificationAction = "created" | "reopened" | "validated";

interface PendingItemPointer {
  protocol: string;
  title: string;
}

type PendingItemEventBase = Omit<NotificationEvent, "type" | "payload">;

/**
 * Um único mapa mantém a `eventKey` e a variante do Payload na mesma fonte.
 * O `build` devolve o Evento tipado que o emissor valida antes de gravar.
 */
const NOTIFICATION_BY_ACTION = {
  created: {
    eventKeyPrefix: "pending_item.create",
    build: (base: PendingItemEventBase, pointer: PendingItemPointer) => ({
      ...base,
      type: "pending_item_created" as const,
      payload: { type: "pending_item_created" as const, ...pointer },
    }),
  },
  reopened: {
    eventKeyPrefix: "pending_item.reopen",
    build: (base: PendingItemEventBase, pointer: PendingItemPointer) => ({
      ...base,
      type: "pending_item_reopened" as const,
      payload: { type: "pending_item_reopened" as const, ...pointer },
    }),
  },
  validated: {
    eventKeyPrefix: "pending_item.validate",
    build: (base: PendingItemEventBase, pointer: PendingItemPointer) => ({
      ...base,
      type: "pending_item_validated" as const,
      payload: { type: "pending_item_validated" as const, ...pointer },
    }),
  },
} satisfies Record<
  PendingItemNotificationAction,
  {
    eventKeyPrefix: string;
    build: (base: PendingItemEventBase, pointer: PendingItemPointer) => NotificationEvent;
  }
>;

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

  const notification = NOTIFICATION_BY_ACTION[input.action];

  return emitNotification(
    trx,
    notification.build(
      {
        eventKey: `${notification.eventKeyPrefix}:${input.auditId}`,
        requestId: input.requestId,
        actorUserId: input.actorUserId,
        recipientUserIds: [input.requesterUserId],
      },
      { protocol: input.protocol, title: input.title },
    ),
  );
}
